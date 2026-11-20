import { getAdminSession } from '@/features/auth/session';
import { prisma } from '@/features/shared/db/prisma';
import { canManageProducts } from '@/features/shared/lib/permissions';
import {
  MAX_PRODUCT_IMAGE_SIZE,
  detectProductImageType,
} from '@/features/products/lib/product-image-validation';
import { enqueueProductImageDeletions } from '@/features/products/server/product-image-cleanup';
import {
  InvalidProductImageError,
  uploadProductImage,
} from '@/features/products/server/product-image-storage';
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

  // One file per request keeps the multipart body below the Vercel Function
  // limit; the admin UI loops over the selected files.
  const fileEntries = formData.getAll('files');
  if (fileEntries.length !== 1 || !(fileEntries[0] instanceof File)) {
    return jsonError('Upload exactly one image per request.', 400);
  }

  const files = [fileEntries[0] as File];
  const validatedFiles: ValidatedFile[] = [];
  for (const file of files) {
    if (file.size === 0 || file.size > MAX_PRODUCT_IMAGE_SIZE) {
      return jsonError('Each image must be greater than 0 bytes and no larger than 4 MB.', 413);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.length === 0 || bytes.length > MAX_PRODUCT_IMAGE_SIZE) {
      return jsonError('Each image must be greater than 0 bytes and no larger than 4 MB.', 413);
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
      const stored = await uploadProductImage(product.id, file.bytes);
      uploaded.push({ ...stored, type: file.type });
    }
  } catch (error) {
    if (error instanceof InvalidProductImageError) {
      return jsonError('The image file is corrupt or unsupported.', 415);
    }
    // A single-file request cannot leave a partially uploaded object behind;
    // the metadata-error branch below handles cleanup after a successful write.
    // Residual risk (deferred): a hard crash between the blob write here and
    // the metadata transaction below can still orphan a blob. A periodic
    // sweeper is tracked outside this fix; the error path is covered by tests.
    console.error('Product image upload failed:', error);
    return jsonError('Image upload failed. Please retry.', 500);
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
    console.error('Product image metadata could not be saved:', error);
    try {
      await enqueueProductImageDeletions(uploaded.map((image) => image.storageKey));
    } catch (cleanupError) {
      // Keep the original metadata error as the response; cleanup retries later.
      console.error(
        'Could not queue product images for cleanup after a metadata error:',
        cleanupError,
      );
    }
    return jsonError('Image metadata could not be saved. Please retry.', 500);
  }

  // A Route Handler cannot use updateTag, so expire the products tag
  // immediately: the next /p/<slug> visit must show the uploaded images.
  revalidateProductPages({ immediate: true });
  return Response.json({ images }, { status: 201 });
}
