'use server';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { visibilityStatus } from '@/constants/statuses';
import { getAdminSession } from '@/features/auth/session';
import { prisma, isUniqueConstraintError } from '@/features/shared/db/prisma';
import {
  formatZodIssues,
  formState,
  readFormString,
  type FieldErrors,
  type FormState,
} from '@/features/shared/lib/form-validation';
import { canEditPrice, canManageProducts, hasPermission } from '@/features/shared/lib/permissions';
import { processPendingProductImageDeletions } from './server/product-image-cleanup';
import { revalidateProductPages } from './server/product-revalidation';
import {
  parseProductDetails,
  productFormSchema,
  type ProductFormInput,
} from './lib/product-form-schema';
import { savedProductsRedirect } from './lib/admin-product-list';

export type ProductFormValues = ProductFormInput & {
  productId?: string;
  colors: { id: string; name: string; hex: string }[];
};

export type ProductFormState = FormState<ProductFormValues>;

class InvalidProductColorError extends Error {}

function readFormValues(formData: FormData): ProductFormValues {
  const colorIds = formData.getAll('colorId').map(String);
  const colorNames = formData.getAll('colorName').map(String);
  const colorHexes = formData.getAll('colorHex').map(String);
  const rowCount = Math.max(colorIds.length, colorNames.length, colorHexes.length);
  const colors = Array.from({ length: rowCount }, (_, index) => ({
    id: colorIds[index] ?? '',
    name: colorNames[index] ?? '',
    hex: colorHexes[index] ?? '',
  })).filter((color) => color.id || color.name.trim() || color.hex.trim());

  return {
    productId: readFormString(formData, 'productId') || undefined,
    name: readFormString(formData, 'name'),
    slug: readFormString(formData, 'slug'),
    categoryId: readFormString(formData, 'categoryId'),
    brand: readFormString(formData, 'brand'),
    price: readFormString(formData, 'price'),
    description: readFormString(formData, 'description'),
    details: readFormString(formData, 'details'),
    colors,
    published: formData.get('published') === 'on',
  };
}

function stateWithErrors(
  values: ProductFormValues,
  fieldErrors: FieldErrors,
  message: string | null = null,
): ProductFormState {
  return formState(values, fieldErrors, message);
}

export async function saveProduct(
  _previousState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const values = readFormValues(formData);
  const session = await getAdminSession();
  if (!session || !canManageProducts(session.role)) {
    return stateWithErrors(values, { form: ['You do not have permission to manage products.'] });
  }

  const productId = String(formData.get('productId') ?? '');
  const parsed = productFormSchema.safeParse(values);
  if (!parsed.success) {
    return formState(values, formatZodIssues(parsed.error.issues));
  }

  const category = await (prisma.orm.public.Category as any)
    .where({ id: parsed.data.categoryId })
    .first();
  if (!category) {
    return stateWithErrors(values, { categoryId: ['Choose a valid category.'] });
  }

  const existingSlug = await (prisma.orm.public.Product as any)
    .where({ slug: parsed.data.slug })
    .first();
  if (existingSlug && existingSlug.id !== productId) {
    return stateWithErrors(values, { slug: ['This slug is already in use.'] });
  }

  const existingProduct = productId
    ? await (prisma.orm.public.Product as any).where({ id: productId }).first()
    : null;
  if (productId && !existingProduct) {
    return stateWithErrors(values, { form: ['This product no longer exists.'] });
  }

  if (!productId && !canEditPrice(session.role)) {
    return stateWithErrors(values, { form: ['Only an ADMIN can set a product price.'] });
  }

  const price =
    existingProduct && !canEditPrice(session.role) ? existingProduct.price : parsed.data.price;

  const data = {
    categoryId: category.id,
    name: parsed.data.name,
    slug: parsed.data.slug,
    brand: parsed.data.brand,
    price,
    description: parsed.data.description,
    details: parseProductDetails(parsed.data.details),
    status: parsed.data.published ? visibilityStatus.VISIBLE : visibilityStatus.HIDDEN,
  };

  try {
    await prisma.transaction(async (tx: any) => {
      const product = productId
        ? await tx.orm.public.Product.where({ id: productId }).update(data)
        : await tx.orm.public.Product.create(data);
      const retainedColorIds: string[] = [];

      for (const color of parsed.data.colors) {
        if (color.id) {
          const existingColor = await tx.orm.public.ProductColor.where({
            id: color.id,
            productId: product.id,
          }).first();
          if (!existingColor) {
            throw new InvalidProductColorError();
          }
          await tx.orm.public.ProductColor.where({ id: color.id }).update({
            name: color.name,
            hex: color.hex,
          });
          retainedColorIds.push(color.id);
        } else {
          const createdColor = await tx.orm.public.ProductColor.create({
            productId: product.id,
            name: color.name,
            hex: color.hex,
          });
          retainedColorIds.push(createdColor.id);
        }
      }

      const allColors = await tx.orm.public.ProductColor.where({ productId: product.id }).all();
      const removedColorIds = allColors
        .filter((c: any) => !retainedColorIds.includes(c.id))
        .map((c: any) => c.id);

      if (removedColorIds.length > 0) {
        const allImages = await tx.orm.public.ProductImage.where({ productId: product.id }).all();
        const colorImages = allImages.filter(
          (img: any) => removedColorIds.includes(img.productColorId) && img.storageKey,
        );
        for (const image of colorImages) {
          const existingDel = await tx.orm.public.PendingImageDeletion.where({
            storageKey: image.storageKey,
          }).first();
          if (!existingDel) {
            await tx.orm.public.PendingImageDeletion.create({ storageKey: image.storageKey });
          }
        }
        for (const id of removedColorIds) {
          await tx.orm.public.ProductColor.where({ id }).delete();
        }
      }

      return product;
    });
    await processPendingProductImageDeletions();
    revalidateProductPages({ immediate: true });
    updateTag('products');
    redirect(savedProductsRedirect(String(formData.get('returnTo') ?? '')));
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return stateWithErrors(values, { slug: ['This slug is already in use.'] });
    }
    if (error instanceof InvalidProductColorError) {
      return stateWithErrors(values, {
        colors: ['One or more colors no longer belong to this product. Reload and try again.'],
      });
    }
    throw error;
  }
}

export async function toggleProductVisibility(productId: string, _formData: FormData) {
  void _formData;
  const session = await getAdminSession();
  if (!session || !canManageProducts(session.role)) {
    throw new Error('You do not have permission to change product visibility.');
  }

  const product = await (prisma.orm.public.Product as any).where({ id: productId }).first();
  if (!product) {
    throw new Error('Product not found.');
  }

  await (prisma.orm.public.Product as any).where({ id: product.id }).update({
    status:
      product.status === visibilityStatus.VISIBLE
        ? visibilityStatus.HIDDEN
        : visibilityStatus.VISIBLE,
  });

  revalidateProductPages({ immediate: true });
}

export async function setProductImageHover(
  productId: string,
  imageId: string,
  _formData: FormData,
) {
  void _formData;
  await requireProductManager();

  await prisma.transaction(async (tx: any) => {
    const image = await tx.orm.public.ProductImage.where({ id: imageId, productId }).first();
    if (!image) {
      throw new Error('Product image not found.');
    }
    if (image.isFront || image.productColorId) {
      throw new Error('Choose a shared image that is not the cover image for the hover image.');
    }

    const images = await tx.orm.public.ProductImage.where({ productId }).all();
    for (const img of images) {
      if (img.isHover) {
        await tx.orm.public.ProductImage.where({ id: img.id }).update({ isHover: false });
      }
    }
    await tx.orm.public.ProductImage.where({ id: image.id }).update({ isHover: true });
  });

  revalidateProductPages({ immediate: true });
}

export async function setProductImageFront(
  productId: string,
  imageId: string,
  _formData: FormData,
) {
  void _formData;
  await requireProductManager();

  await prisma.transaction(async (tx: any) => {
    const image = await tx.orm.public.ProductImage.where({ id: imageId, productId }).first();
    if (!image) {
      throw new Error('Product image not found.');
    }
    if (image.productColorId) {
      throw new Error('Only shared product images can be used as the cover image.');
    }

    const images = await tx.orm.public.ProductImage.where({ productId }).all();
    for (const img of images) {
      if (img.isFront) {
        await tx.orm.public.ProductImage.where({ id: img.id }).update({ isFront: false });
      }
    }
    await tx.orm.public.ProductImage.where({ id: image.id }).update({
      isHover: false,
      isFront: true,
    });
  });

  revalidateProductPages({ immediate: true });
}

export async function assignProductImageColor(
  productId: string,
  imageId: string,
  formData: FormData,
) {
  await requireProductManager();

  const colorId = String(formData.get('productColorId') ?? '') || null;
  if (colorId) {
    const color = await (prisma.orm.public.ProductColor as any)
      .where({ id: colorId, productId })
      .first();
    if (!color) {
      throw new Error('Selected color does not belong to this product.');
    }
  }

  const image = await (prisma.orm.public.ProductImage as any)
    .where({ id: imageId, productId })
    .first();
  if (!image) {
    throw new Error('Product image not found.');
  }
  await (prisma.orm.public.ProductImage as any)
    .where({ id: imageId })
    .update({ productColorId: colorId, ...(colorId ? { isFront: false, isHover: false } : {}) });

  revalidateProductPages({ immediate: true });
}

export async function moveProductImage(
  productId: string,
  imageId: string,
  direction: 'up' | 'down',
  _formData: FormData,
) {
  void _formData;
  await requireProductManager();

  await prisma.transaction(async (tx: any) => {
    const images = await tx.orm.public.ProductImage.where({ productId })
      .orderBy([(i: any) => i.sortOrder.asc(), (i: any) => i.id.asc()])
      .all();
    const index = images.findIndex((image: any) => image.id === imageId);
    const neighborIndex = direction === 'up' ? index - 1 : index + 1;
    if (index < 0) {
      throw new Error('Product image not found.');
    }
    if (neighborIndex < 0 || neighborIndex >= images.length) {
      return;
    }

    const image = images[index];
    const neighbor = images[neighborIndex];
    await tx.orm.public.ProductImage.where({ id: image.id }).update({ sortOrder: -1 });
    await tx.orm.public.ProductImage.where({ id: neighbor.id }).update({
      sortOrder: image.sortOrder,
    });
    await tx.orm.public.ProductImage.where({ id: image.id }).update({
      sortOrder: neighbor.sortOrder,
    });
  });

  revalidateProductPages();
}

export async function deleteProductImage(productId: string, imageId: string, _formData: FormData) {
  void _formData;
  await requireProductManager();
  const image = await (prisma.orm.public.ProductImage as any)
    .where({ id: imageId, productId })
    .first();
  if (!image) {
    throw new Error('Product image not found.');
  }

  await prisma.transaction(async (tx: any) => {
    if (image.storageKey) {
      const existingDel = await tx.orm.public.PendingImageDeletion.where({
        storageKey: image.storageKey,
      }).first();
      if (!existingDel) {
        await tx.orm.public.PendingImageDeletion.create({ storageKey: image.storageKey });
      }
    }
    await tx.orm.public.ProductImage.where({ id: image.id }).delete();
    if (image.isFront) {
      const nextImages = await tx.orm.public.ProductImage.where({ productId })
        .orderBy([(i: any) => i.sortOrder.asc(), (i: any) => i.id.asc()])
        .all();
      const nextImage = nextImages.find((i: any) => i.productColorId == null);
      if (nextImage) {
        await tx.orm.public.ProductImage.where({ id: nextImage.id }).update({
          isFront: true,
          isHover: false,
        });
      }
    }
  });

  revalidateProductPages({ immediate: true });
  await processPendingProductImageDeletions();
}

export async function deleteProduct(productId: string, _formData: FormData) {
  void _formData;
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, 'products:delete')) {
    throw new Error('You do not have permission to delete products.');
  }
  const product = await (prisma.orm.public.Product as any)
    .where({ id: productId })
    .include('images')
    .first();
  if (!product) {
    throw new Error('Product not found.');
  }

  await prisma.transaction(async (tx: any) => {
    for (const image of product.images ?? []) {
      if (image.storageKey) {
        const existingDel = await tx.orm.public.PendingImageDeletion.where({
          storageKey: image.storageKey,
        }).first();
        if (!existingDel) {
          await tx.orm.public.PendingImageDeletion.create({ storageKey: image.storageKey });
        }
      }
    }
    await tx.orm.public.Product.where({ id: product.id }).delete();
  });

  revalidateProductPages({ immediate: true });
  await processPendingProductImageDeletions();
  redirect('/admin/products?deleted=1');
}

async function requireProductManager() {
  const session = await getAdminSession();
  if (!session || !canManageProducts(session.role)) {
    throw new Error('You do not have permission to manage product images.');
  }
}
