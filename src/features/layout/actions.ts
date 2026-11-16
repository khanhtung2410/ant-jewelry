'use server';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { revalidatePath } from 'next/cache';
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
import { canManageHeroSlides } from '@/features/shared/lib/permissions';
import { moveIdInOrder, type MoveDirection } from '@/features/shared/lib/reorder';
import { savedHeroSlidesRedirect } from './lib/admin-hero-list';
import { heroSlideFormSchema } from './lib/hero-slide-form-schema';

export type HeroSlideFormValues = {
  heroSlideId?: string;
  imageUrl: string;
  alt: string;
  title: string;
  subtitle: string;
  linkUrl: string;
  visible: boolean;
};

export type HeroSlideFormState = FormState<HeroSlideFormValues>;

function readHeroSlideFormValues(formData: FormData): HeroSlideFormValues {
  return {
    heroSlideId: readFormString(formData, 'heroSlideId') || undefined,
    imageUrl: readFormString(formData, 'imageUrl'),
    alt: readFormString(formData, 'alt'),
    title: readFormString(formData, 'title'),
    subtitle: readFormString(formData, 'subtitle'),
    linkUrl: readFormString(formData, 'linkUrl'),
    visible: readFormBoolean(formData, 'visible'),
  };
}

function stateWithErrors(
  values: HeroSlideFormValues,
  fieldErrors: FieldErrors,
  message: string | null = null,
): HeroSlideFormState {
  return formState(values, fieldErrors, message);
}

function revalidateHeroSlidePages() {
  revalidatePath('/admin/hero-slides');
  revalidatePath('/', 'page');
}

export async function saveHeroSlide(
  _previousState: HeroSlideFormState,
  formData: FormData,
): Promise<HeroSlideFormState> {
  const values = readHeroSlideFormValues(formData);
  const session = await getAdminSession();
  if (!session || !canManageHeroSlides(session.role)) {
    return stateWithErrors(values, {
      form: ['You do not have permission to manage hero slides.'],
    });
  }

  const parsed = heroSlideFormSchema.safeParse(values);
  if (!parsed.success) {
    return formState(values, formatZodIssues(parsed.error.issues));
  }

  const heroSlideId = values.heroSlideId ?? '';
  const existingSlide = heroSlideId
    ? await (prisma.orm.public.HeroSlide as any).where({ id: heroSlideId }).first()
    : null;
  if (heroSlideId && !existingSlide) {
    return stateWithErrors(values, { form: ['This hero slide no longer exists.'] });
  }

  const data = {
    imageUrl: parsed.data.imageUrl,
    alt: parsed.data.alt,
    title: parsed.data.title,
    subtitle: parsed.data.subtitle,
    linkUrl: parsed.data.linkUrl,
    status: parsed.data.visible ? visibilityStatus.VISIBLE : visibilityStatus.HIDDEN,
  };

  if (heroSlideId) {
    await (prisma.orm.public.HeroSlide as any).where({ id: heroSlideId }).update(data);
  } else {
    const lastSlide = await (prisma.orm.public.HeroSlide as any)
      .orderBy((s: any) => s.sortOrder.desc())
      .first();
    await (prisma.orm.public.HeroSlide as any).create({
      ...data,
      sortOrder: (lastSlide?.sortOrder ?? 0) + 1,
    });
  }

  revalidateHeroSlidePages();
  redirect(savedHeroSlidesRedirect(readFormString(formData, 'returnTo')));
}

export async function deleteHeroSlide(heroSlideId: string, _formData: FormData) {
  void _formData;
  const session = await getAdminSession();
  if (!session || !canManageHeroSlides(session.role)) {
    throw new Error('You do not have permission to delete hero slides.');
  }

  const slide = await (prisma.orm.public.HeroSlide as any).where({ id: heroSlideId }).first();
  if (!slide) {
    throw new Error('Hero slide not found.');
  }

  await (prisma.orm.public.HeroSlide as any).where({ id: slide.id }).delete();
  revalidateHeroSlidePages();
  redirect(savedHeroSlidesRedirect('/admin/hero-slides'));
}

export async function moveHeroSlide(
  heroSlideId: string,
  direction: MoveDirection,
  _formData: FormData,
) {
  void _formData;
  const session = await getAdminSession();
  if (!session || !canManageHeroSlides(session.role)) {
    throw new Error('You do not have permission to reorder hero slides.');
  }

  if (direction !== 'up' && direction !== 'down') {
    throw new Error('Invalid move direction.');
  }

  const slides = await (prisma.orm.public.HeroSlide as any)
    .orderBy([(s: any) => s.sortOrder.asc(), (s: any) => s.createdAt.asc()])
    .all();
  const currentIds = slides.map((slide: any) => slide.id);
  const nextIds = moveIdInOrder(currentIds, heroSlideId, direction);

  if (nextIds.some((id, index) => id !== currentIds[index])) {
    await prisma.transaction(async (tx: any) => {
      for (let index = 0; index < nextIds.length; index += 1) {
        await tx.orm.public.HeroSlide.where({ id: nextIds[index] }).update({
          sortOrder: index + 1,
        });
      }
    });
    revalidateHeroSlidePages();
  }

  redirect('/admin/hero-slides');
}
