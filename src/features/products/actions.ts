'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { visibilityStatus } from '@/constants/statuses';
import { getAdminSession } from '@/features/auth/session';
import { prisma } from '@/features/shared/db/prisma';
import {
  formatZodIssues,
  formState,
  readFormString,
  type FieldErrors,
  type FormState,
} from '@/features/shared/lib/form-validation';
import { canManageProducts } from '@/features/shared/lib/permissions';
import {
  getProductRevalidationPaths,
  processPendingProductImageDeletions,
} from './server/product-image-cleanup';
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
    type: readFormString(formData, 'type'),
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

  const category = await prisma.category.findUnique({
    where: { id: parsed.data.categoryId },
    select: { id: true, type: true },
  });
  if (!category || category.type !== parsed.data.type) {
    return stateWithErrors(values, {
      categoryId: ['Choose a valid category and its matching product type.'],
    });
  }

  const existingSlug = await prisma.product.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true },
  });
  if (existingSlug && existingSlug.id !== productId) {
    return stateWithErrors(values, { slug: ['This slug is already in use.'] });
  }

  const existingProduct = productId
    ? await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true },
      })
    : null;
  if (productId && !existingProduct) {
    return stateWithErrors(values, { form: ['This product no longer exists.'] });
  }

  const data = {
    categoryId: category.id,
    name: parsed.data.name,
    slug: parsed.data.slug,
    type: parsed.data.type,
    brand: parsed.data.brand,
    price: parsed.data.price,
    description: parsed.data.description,
    details: parseProductDetails(parsed.data.details),
    status: parsed.data.published ? visibilityStatus.VISIBLE : visibilityStatus.HIDDEN,
  };

  try {
    await prisma.$transaction(async (transaction) => {
      const product = productId
        ? await transaction.product.update({ where: { id: productId }, data })
        : await transaction.product.create({ data });
      const retainedColorIds: string[] = [];

      for (const color of parsed.data.colors) {
        if (color.id) {
          const existingColor = await transaction.productColor.findFirst({
            where: { id: color.id, productId: product.id },
            select: { id: true },
          });
          if (!existingColor) {
            throw new InvalidProductColorError();
          }
          await transaction.productColor.update({
            where: { id: color.id },
            data: { name: color.name, hex: color.hex },
          });
          retainedColorIds.push(color.id);
        } else {
          const createdColor = await transaction.productColor.create({
            data: { productId: product.id, name: color.name, hex: color.hex },
            select: { id: true },
          });
          retainedColorIds.push(createdColor.id);
        }
      }

      const removedColorIds = await transaction.productColor.findMany({
        where: {
          productId: product.id,
          ...(retainedColorIds.length > 0 ? { id: { notIn: retainedColorIds } } : {}),
        },
        select: { id: true },
      });
      if (removedColorIds.length > 0) {
        const colorImages = await transaction.productImage.findMany({
          where: {
            productId: product.id,
            productColorId: { in: removedColorIds.map((color) => color.id) },
            storageKey: { not: null },
          },
          select: { storageKey: true },
        });
        for (const image of colorImages) {
          if (image.storageKey) {
            await transaction.pendingImageDeletion.upsert({
              where: { storageKey: image.storageKey },
              create: { storageKey: image.storageKey },
              update: {},
            });
          }
        }
      }

      await transaction.productColor.deleteMany({
        where: {
          productId: product.id,
          ...(retainedColorIds.length > 0 ? { id: { notIn: retainedColorIds } } : {}),
        },
      });

      return product;
    });
    await processPendingProductImageDeletions();
    revalidateProductPages();
    redirect(savedProductsRedirect(String(formData.get('returnTo') ?? '')));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
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

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, status: true },
  });
  if (!product) {
    throw new Error('Product not found.');
  }

  await prisma.product.update({
    where: { id: product.id },
    data: {
      status:
        product.status === visibilityStatus.VISIBLE
          ? visibilityStatus.HIDDEN
          : visibilityStatus.VISIBLE,
    },
  });

  revalidateProductPages();
}

function revalidateProductPages() {
  for (const [path, type] of getProductRevalidationPaths()) {
    if (type) {
      revalidatePath(path, type);
    } else {
      revalidatePath(path);
    }
  }
}

export async function setProductImageHover(
  productId: string,
  imageId: string,
  _formData: FormData,
) {
  void _formData;
  await requireProductManager();

  await prisma.$transaction(async (transaction) => {
    const image = await transaction.productImage.findFirst({
      where: { id: imageId, productId },
      select: { id: true, isFront: true, productColorId: true },
    });
    if (!image) {
      throw new Error('Product image not found.');
    }
    if (image.isFront || image.productColorId) {
      throw new Error('Choose a shared image that is not the cover image for the hover image.');
    }

    await transaction.productImage.updateMany({
      where: { productId },
      data: { isHover: false },
    });
    await transaction.productImage.update({
      where: { id: image.id },
      data: { isHover: true },
    });
  });

  revalidateProductPages();
}

export async function setProductImageFront(
  productId: string,
  imageId: string,
  _formData: FormData,
) {
  void _formData;
  await requireProductManager();

  await prisma.$transaction(async (transaction) => {
    const image = await transaction.productImage.findFirst({
      where: { id: imageId, productId },
      select: { id: true, productColorId: true },
    });
    if (!image) {
      throw new Error('Product image not found.');
    }
    if (image.productColorId) {
      throw new Error('Only shared product images can be used as the cover image.');
    }

    await transaction.productImage.updateMany({
      where: { productId },
      data: { isFront: false },
    });
    await transaction.productImage.update({
      where: { id: image.id },
      data: { isHover: false },
    });
    await transaction.productImage.update({
      where: { id: image.id },
      data: { isFront: true },
    });
  });

  revalidateProductPages();
}

export async function assignProductImageColor(
  productId: string,
  imageId: string,
  formData: FormData,
) {
  await requireProductManager();

  const colorId = String(formData.get('productColorId') ?? '') || null;
  if (colorId) {
    const color = await prisma.productColor.findFirst({
      where: { id: colorId, productId },
      select: { id: true },
    });
    if (!color) {
      throw new Error('Selected color does not belong to this product.');
    }
  }

  const image = await prisma.productImage.updateMany({
    where: { id: imageId, productId },
    data: { productColorId: colorId, ...(colorId ? { isFront: false, isHover: false } : {}) },
  });
  if (image.count !== 1) {
    throw new Error('Product image not found.');
  }

  revalidateProductPages();
}

export async function moveProductImage(
  productId: string,
  imageId: string,
  direction: 'up' | 'down',
  _formData: FormData,
) {
  void _formData;
  await requireProductManager();

  await prisma.$transaction(async (transaction) => {
    const images = await transaction.productImage.findMany({
      where: { productId },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      select: { id: true, sortOrder: true },
    });
    const index = images.findIndex((image) => image.id === imageId);
    const neighborIndex = direction === 'up' ? index - 1 : index + 1;
    if (index < 0) {
      throw new Error('Product image not found.');
    }
    if (neighborIndex < 0 || neighborIndex >= images.length) {
      return;
    }

    const image = images[index];
    const neighbor = images[neighborIndex];
    await transaction.productImage.update({
      where: { id: image.id },
      data: { sortOrder: -1 },
    });
    await transaction.productImage.update({
      where: { id: neighbor.id },
      data: { sortOrder: image.sortOrder },
    });
    await transaction.productImage.update({
      where: { id: image.id },
      data: { sortOrder: neighbor.sortOrder },
    });
  });

  revalidateProductPages();
}

export async function deleteProductImage(productId: string, imageId: string, _formData: FormData) {
  void _formData;
  await requireProductManager();
  const image = await prisma.productImage.findFirst({
    where: { id: imageId, productId },
    select: { id: true, storageKey: true, isFront: true },
  });
  if (!image) {
    throw new Error('Product image not found.');
  }

  await prisma.$transaction(async (transaction) => {
    if (image.storageKey) {
      await transaction.pendingImageDeletion.upsert({
        where: { storageKey: image.storageKey },
        create: { storageKey: image.storageKey },
        update: {},
      });
    }
    await transaction.productImage.delete({ where: { id: image.id } });
    if (image.isFront) {
      const nextImage = await transaction.productImage.findFirst({
        where: { productId, productColorId: null },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        select: { id: true },
      });
      if (nextImage) {
        await transaction.productImage.update({
          where: { id: nextImage.id },
          data: { isFront: true, isHover: false },
        });
      }
    }
  });

  revalidateProductPages();
  await processPendingProductImageDeletions();
}

export async function deleteProduct(productId: string, _formData: FormData) {
  void _formData;
  await requireProductManager();
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, images: { select: { storageKey: true } } },
  });
  if (!product) {
    throw new Error('Product not found.');
  }

  await prisma.$transaction(async (transaction) => {
    for (const image of product.images) {
      if (image.storageKey) {
        await transaction.pendingImageDeletion.upsert({
          where: { storageKey: image.storageKey },
          create: { storageKey: image.storageKey },
          update: {},
        });
      }
    }
    await transaction.product.delete({ where: { id: product.id } });
  });

  revalidateProductPages();
  await processPendingProductImageDeletions();
  redirect('/admin/products?deleted=1');
}

async function requireProductManager() {
  const session = await getAdminSession();
  if (!session || !canManageProducts(session.role)) {
    throw new Error('You do not have permission to manage product images.');
  }
}
