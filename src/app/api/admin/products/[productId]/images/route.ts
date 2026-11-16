/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAdminSession } from '@/features/auth/session';
import { prisma } from '@/features/shared/db/prisma';
import { canManageProducts } from '@/features/shared/lib/permissions';
import {
  MAX_PRODUCT_IMAGE_SIZE,
  MAX_PRODUCT_IMAGES_PER_UPLOAD,
  detectProductImageType,
} from '@/features/products/lib/product-image-validation';
import { enqueueProductImageDeletions } from '@/features/products/server/product-image-cleanup';
import { uploadProductImage } from '@/features/products/server/product-image-storage';
import { revalidateProductPages } from '@/features/products/server/product-revalidation';

type ValidatedFile = {
  bytes: Uint8Array;
  type: NonNullable<ReturnType<typeof detectProductImageType>>;
};

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ productId: string }> },
): Promise<Response> {
  const session = await getAdminSession();
  if (!session || !canManageProducts(session.role)) {
    return jsonError('You do not have permission to upload product images.', 403);
  }

  const origin = request.headers.get('origin');
  if (!origin) {
    return jsonError('Request origin is required.', 403);
  }
  try {
    if (new URL(origin).origin !== new URL(request.url).origin) {
      return jsonError('Cross-origin uploads are not allowed.', 403);
    }
  } catch {
    return jsonError('Invalid request origin.', 403);
  }

  const { productId } = await context.params;
  const product = await (prisma.orm.public.Product as any)
    .where({ id: productId })
    .include('images')
    .first();
  if (!product) {
    return jsonError('Product not found.', 404);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError('Expected a multipart form upload.', 400);
  }

  const fileEntries = formData.getAll('files');
  if (fileEntries.length === 0 || fileEntries.some((entry) => !(entry instanceof File))) {
    return jsonError('Select one or more valid image files.', 400);
  }
  if (fileEntries.length > MAX_PRODUCT_IMAGES_PER_UPLOAD) {
    return jsonError(`Upload at most ${MAX_PRODUCT_IMAGES_PER_UPLOAD} images at a time.`, 400);
  }

  const files = fileEntries.filter((entry): entry is File => entry instanceof File);
  const validatedFiles: ValidatedFile[] = [];
  for (const file of files) {
    if (file.size === 0 || file.size > MAX_PRODUCT_IMAGE_SIZE) {
      return jsonError('Each image must be greater than 0 bytes and no larger than 5 MB.', 413);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.length === 0 || bytes.length > MAX_PRODUCT_IMAGE_SIZE) {
      return jsonError('Each image must be greater than 0 bytes and no larger than 5 MB.', 413);
    }
    const type = detectProductImageType(bytes);
    if (!type) {
      return jsonError('Only genuine JPEG, PNG, and WebP image files are supported.', 415);
    }
    validatedFiles.push({ bytes, type });
  }

  const productImages = (product.images ?? []) as Array<{ sortOrder: number; isFront: boolean }>;
  const largestSortOrder = productImages.reduce(
    (largest, image) => Math.max(largest, image.sortOrder),
    0,
  );
  const hasFrontImage = productImages.some((image) => image.isFront);
  const uploaded: { storageKey: string; url: string; type: ValidatedFile['type'] }[] = [];

  try {
    for (const file of validatedFiles) {
      const stored = await uploadProductImage(product.id, file.bytes, file.type);
      uploaded.push({ ...stored, type: file.type });
    }
  } catch (error) {
    if (uploaded.length > 0) {
      try {
        await enqueueProductImageDeletions(uploaded.map((image) => image.storageKey));
      } catch (cleanupError) {
        throw new AggregateError(
          [error, cleanupError],
          'Image upload failed and uploaded objects could not all be cleaned up.',
        );
      }
    }

    return jsonError('Image upload failed. Please retry.', 500);
  }

  let images;
  try {
    images = [];
    for (let index = 0; index < uploaded.length; index += 1) {
      const image = uploaded[index];
      const created = await (prisma.orm.public.ProductImage as any).create({
        productId: product.id,
        storageKey: image.storageKey,
        url: image.url,
        alt: `${product.name} - image ${largestSortOrder + index + 1}`,
        isFront: !hasFrontImage && index === 0,
        isHover: false,
        sortOrder: largestSortOrder + index + 1,
      });
      images.push({
        id: created.id,
        url: created.url,
        alt: created.alt,
        isFront: created.isFront,
        isHover: created.isHover,
        sortOrder: created.sortOrder,
        productColorId: created.productColorId ?? null,
      });
    }
  } catch (error) {
    try {
      await enqueueProductImageDeletions(uploaded.map((image) => image.storageKey));
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        'Image metadata could not be saved and uploaded objects could not all be cleaned up.',
      );
    }
    return jsonError('Image metadata could not be saved. Please retry.', 500);
  }

  revalidateProductPages({ immediate: true });
  return Response.json({ images }, { status: 201 });
}
