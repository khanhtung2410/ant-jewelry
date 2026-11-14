'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { visibilityStatus } from '@/constants/statuses';
import { getAdminSession } from '@/features/auth/session';
import { prisma } from '@/features/shared/db/prisma';
import {
  formatZodIssues,
  formState,
  readFormBoolean,
  readFormString,
  type FieldErrors,
  type FormState,
} from '@/features/shared/lib/form-validation';
import { canManageCategories } from '@/features/shared/lib/permissions';
import { moveIdInOrder, type MoveDirection } from '@/features/shared/lib/reorder';
import { savedCategoriesRedirect } from '../lib/admin-category-list';
import { categoryFormSchema } from '../lib/category-form-schema';

export type CategoryFormValues = {
  categoryId?: string;
  name: string;
  slug: string;
  type: string;
  visible: boolean;
};

export type CategoryFormState = FormState<CategoryFormValues>;

export type DeleteCategoryState = {
  message: string | null;
};

function readCategoryFormValues(formData: FormData): CategoryFormValues {
  return {
    categoryId: readFormString(formData, 'categoryId') || undefined,
    name: readFormString(formData, 'name'),
    slug: readFormString(formData, 'slug'),
    type: readFormString(formData, 'type'),
    visible: readFormBoolean(formData, 'visible'),
  };
}

function stateWithErrors(
  values: CategoryFormValues,
  fieldErrors: FieldErrors,
  message: string | null = null,
): CategoryFormState {
  return formState(values, fieldErrors, message);
}

function revalidateCategoryPages() {
  // Product storefront queries filter by category visibility, so hiding or
  // deleting a category must also invalidate the cached product results.
  revalidateTag('products', 'max');
  revalidatePath('/admin/categories');
  // Categories are read by the public layout (navigation/menu) as well as the
  // home page, so the layout scope is required to refresh the shared cache entry.
  revalidatePath('/', 'layout');
}

export async function saveCategory(
  _previousState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const values = readCategoryFormValues(formData);
  const session = await getAdminSession();
  if (!session || !canManageCategories(session.role)) {
    return stateWithErrors(values, {
      form: ['You do not have permission to manage categories.'],
    });
  }

  const categoryId = values.categoryId ?? '';
  const parsed = categoryFormSchema.safeParse(values);
  if (!parsed.success) {
    return formState(values, formatZodIssues(parsed.error.issues));
  }

  const existingSlug = await prisma.category.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true },
  });
  if (existingSlug && existingSlug.id !== categoryId) {
    return stateWithErrors(values, { slug: ['This slug is already in use.'] });
  }

  const existingType = await prisma.category.findFirst({
    where: {
      type: parsed.data.type,
      ...(categoryId ? { id: { not: categoryId } } : {}),
    },
    select: { name: true },
  });
  if (existingType) {
    return stateWithErrors(values, {
      type: [`The “${parsed.data.type}” product type already belongs to ${existingType.name}.`],
    });
  }

  const existingCategory = categoryId
    ? await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } })
    : null;
  if (categoryId && !existingCategory) {
    return stateWithErrors(values, { form: ['This category no longer exists.'] });
  }

  const data = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    type: parsed.data.type,
    status: parsed.data.visible ? visibilityStatus.VISIBLE : visibilityStatus.HIDDEN,
  };

  try {
    if (categoryId) {
      await prisma.category.update({ where: { id: categoryId }, data });
    } else {
      const lastCategory = await prisma.category.aggregate({ _max: { sortOrder: true } });
      await prisma.category.create({
        data: {
          ...data,
          sortOrder: (lastCategory._max.sortOrder ?? 0) + 1,
        },
      });
    }

    revalidateCategoryPages();
    redirect(savedCategoriesRedirect(readFormString(formData, 'returnTo')));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return stateWithErrors(values, { slug: ['This slug is already in use.'] });
    }
    throw error;
  }
}

export async function deleteCategory(
  _previousState: DeleteCategoryState,
  formData: FormData,
): Promise<DeleteCategoryState> {
  const session = await getAdminSession();
  if (!session || !canManageCategories(session.role)) {
    return { message: 'You do not have permission to delete categories.' };
  }

  const categoryId = readFormString(formData, 'categoryId');
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: {
      id: true,
      name: true,
      _count: { select: { products: true } },
    },
  });

  if (!category) {
    return { message: 'This category no longer exists.' };
  }

  if (category._count.products > 0) {
    return {
      message: `Cannot delete “${category.name}” because ${category._count.products} ${
        category._count.products === 1 ? 'product is' : 'products are'
      } still assigned to it. Move or delete those products first.`,
    };
  }

  try {
    await prisma.category.delete({ where: { id: category.id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return {
        message: `Cannot delete “${category.name}” because products are still assigned to it.`,
      };
    }
    throw error;
  }

  revalidateCategoryPages();
  redirect(savedCategoriesRedirect(readFormString(formData, 'returnTo')));
}

export async function moveCategory(
  categoryId: string,
  direction: MoveDirection,
  _formData: FormData,
) {
  void _formData;
  const session = await getAdminSession();
  if (!session || !canManageCategories(session.role)) {
    throw new Error('You do not have permission to reorder categories.');
  }

  if (direction !== 'up' && direction !== 'down') {
    throw new Error('Invalid move direction.');
  }

  const categories = await prisma.category.findMany({
    select: { id: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
  const currentIds = categories.map((category) => category.id);
  const nextIds = moveIdInOrder(currentIds, categoryId, direction);

  if (nextIds.some((id, index) => id !== currentIds[index])) {
    await prisma.$transaction(
      nextIds.map((id, index) =>
        prisma.category.update({ where: { id }, data: { sortOrder: index + 1 } }),
      ),
    );
    revalidateCategoryPages();
  }

  redirect('/admin/categories');
}
