'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/features/auth/session';
import { prisma } from '@/features/shared/db/prisma';
import { canManageProducts } from '@/features/shared/lib/permissions';
import {
  parseProductDetails,
  productFormSchema,
  type ProductFormInput,
} from './lib/product-form-schema';

export type ProductFormValues = ProductFormInput & {
  productId?: string;
  colors: { id: string; name: string; hex: string }[];
};

export type ProductFormState = {
  values: ProductFormValues;
  fieldErrors: Record<string, string[]>;
  message: string | null;
};

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
    productId: String(formData.get('productId') ?? '') || undefined,
    name: String(formData.get('name') ?? ''),
    slug: String(formData.get('slug') ?? ''),
    categoryId: String(formData.get('categoryId') ?? ''),
    type: String(formData.get('type') ?? ''),
    brand: String(formData.get('brand') ?? ''),
    price: String(formData.get('price') ?? ''),
    description: String(formData.get('description') ?? ''),
    details: String(formData.get('details') ?? ''),
    colors,
    published: formData.get('published') === 'on',
  };
}

function stateWithErrors(
  values: ProductFormValues,
  fieldErrors: Record<string, string[]>,
  message: string | null = null,
): ProductFormState {
  return { values, fieldErrors, message };
}

function formErrors(
  values: ProductFormValues,
  issues: { path: PropertyKey[]; message: string }[],
): ProductFormState {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of issues) {
    const field = issue.path.map(String).join('.') || 'form';
    fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message];
  }

  return stateWithErrors(values, fieldErrors);
}

function revalidateProductPages() {
  revalidatePath('/admin/products');
  revalidatePath('/', 'page');
  revalidatePath('/c/[slug]', 'page');
  revalidatePath('/p/[slug]', 'page');
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
    return formErrors(values, parsed.error.issues);
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
    status: parsed.data.published ? ('VISIBLE' as const) : ('HIDDEN' as const),
  };

  try {
    const savedProduct = await prisma.$transaction(async (transaction) => {
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

      await transaction.productColor.deleteMany({
        where: {
          productId: product.id,
          ...(retainedColorIds.length > 0 ? { id: { notIn: retainedColorIds } } : {}),
        },
      });

      return product;
    });
    revalidateProductPages();
    redirect(`/admin/products?edit=${encodeURIComponent(savedProduct.id)}&saved=1`);
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
    data: { status: product.status === 'VISIBLE' ? 'HIDDEN' : 'VISIBLE' },
  });

  revalidateProductPages();
}
