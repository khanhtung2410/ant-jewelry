import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/features/auth/session';
import { prisma } from '@/features/shared/db/prisma';
import { canManageProducts } from '@/features/shared/lib/permissions';
import {
  MAX_PRODUCT_IMAGE_SIZE,
  detectProductImageType,
} from '@/features/products/lib/product-image-validation';
import {
  enqueueProductImageDeletions,
  getProductRevalidationPaths,
} from '@/features/products/server/product-image-cleanup';
import {
  ObjectStorageConfigurationError,
  uploadProductImage,
} from '@/features/products/server/object-storage';

type ValidatedFile = {
  bytes: Uint8Array;
  type: NonNullable<ReturnType<typeof detectProductImageType>>;
};

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

function revalidateProductPages(): void {
  for (const [path, type] of getProductRevalidationPaths()) {
    if (type) {
      revalidatePath(path, type);
    } else {
      revalidatePath(path);
    }
  }
}

export async function POST(
  request: Request,
  context: RouteContext<'/api/admin/products/[productId]/images'>,
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
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, images: { select: { sortOrder: true, isFront: true } } },
  });
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

  const largestSortOrder = product.images.reduce(
    (largest, image) => Math.max(largest, image.sortOrder),
    0,
  );
  const hasFrontImage = product.images.some((image) => image.isFront);
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

    if (error instanceof ObjectStorageConfigurationError) {
      return jsonError('Image object storage is not configured on this server.', 503);
    }
    return jsonError('Image object storage upload failed. Please retry.', 502);
  }

  let images;
  try {
    images = await prisma.$transaction(
      uploaded.map((image, index) =>
        prisma.productImage.create({
          data: {
            productId: product.id,
            storageKey: image.storageKey,
            url: image.url,
            alt: `${product.name} - image ${largestSortOrder + index + 1}`,
            isFront: !hasFrontImage && index === 0,
            isHover: false,
            sortOrder: largestSortOrder + index + 1,
          },
          select: {
            id: true,
            url: true,
            alt: true,
            isFront: true,
            isHover: true,
            sortOrder: true,
            productColorId: true,
          },
        }),
      ),
    );
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

  revalidateProductPages();
  return Response.json({ images }, { status: 201 });
}
