'use server';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { visibilityStatus } from '@/constants/statuses';
import { getAdminSession } from '@/features/auth/session';
import {
  prisma,
  isUniqueConstraintError,
  isForeignKeyConstraintError,
} from '@/features/shared/db/prisma';
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
  revalidateTag('products', 'max');
  revalidatePath('/admin/categories');
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

  const existingSlug = await (prisma.orm.public.Category as any)
    .where({ slug: parsed.data.slug })
    .first();
  if (existingSlug && existingSlug.id !== categoryId) {
    return stateWithErrors(values, { slug: ['This slug is already in use.'] });
  }

  const categoriesWithType = await (prisma.orm.public.Category as any)
    .where({ type: parsed.data.type })
    .all();
  const existingType = categoriesWithType.find((c: any) => c.id !== categoryId);
  if (existingType) {
    return stateWithErrors(values, {
      type: [`The “${parsed.data.type}” product type already belongs to ${existingType.name}.`],
    });
  }

  const existingCategory = categoryId
    ? await (prisma.orm.public.Category as any).where({ id: categoryId }).first()
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
      await (prisma.orm.public.Category as any).where({ id: categoryId }).update(data);
    } else {
      const lastCategory = await (prisma.orm.public.Category as any)
        .orderBy((c: any) => c.sortOrder.desc())
        .first();
      await (prisma.orm.public.Category as any).create({
        ...data,
        sortOrder: (lastCategory?.sortOrder ?? 0) + 1,
      });
    }

    revalidateCategoryPages();
    redirect(savedCategoriesRedirect(readFormString(formData, 'returnTo')));
  } catch (error) {
    if (isUniqueConstraintError(error)) {
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
  const category = await (prisma.orm.public.Category as any).where({ id: categoryId }).first();

  if (!category) {
    return { message: 'This category no longer exists.' };
  }

  const products = await (prisma.orm.public.Product as any).where({ categoryId }).all();
  const productCount = products.length;
  if (productCount > 0) {
    return {
      message: `Cannot delete “${category.name}” because ${productCount} ${
        productCount === 1 ? 'product is' : 'products are'
      } still assigned to it. Move or delete those products first.`,
    };
  }

  try {
    await (prisma.orm.public.Category as any).where({ id: category.id }).delete();
  } catch (error) {
    if (isForeignKeyConstraintError(error)) {
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

  const categories = await (prisma.orm.public.Category as any)
    .orderBy([(c: any) => c.sortOrder.asc(), (c: any) => c.name.asc()])
    .all();
  const currentIds = categories.map((category: any) => category.id);
  const nextIds = moveIdInOrder(currentIds, categoryId, direction);

  if (nextIds.some((id, index) => id !== currentIds[index])) {
    await prisma.transaction(async (tx: any) => {
      for (let index = 0; index < nextIds.length; index += 1) {
        await tx.orm.public.Category.where({ id: nextIds[index] }).update({ sortOrder: index + 1 });
      }
    });
    revalidateCategoryPages();
  }

  redirect('/admin/categories');
}
