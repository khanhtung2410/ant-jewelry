'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
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
    ? await prisma.heroSlide.findUnique({ where: { id: heroSlideId }, select: { id: true } })
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
    status: parsed.data.visible ? ('VISIBLE' as const) : ('HIDDEN' as const),
  };

  if (heroSlideId) {
    await prisma.heroSlide.update({ where: { id: heroSlideId }, data });
  } else {
    const lastSlide = await prisma.heroSlide.aggregate({ _max: { sortOrder: true } });
    await prisma.heroSlide.create({
      data: {
        ...data,
        sortOrder: (lastSlide._max.sortOrder ?? 0) + 1,
      },
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

  const slide = await prisma.heroSlide.findUnique({
    where: { id: heroSlideId },
    select: { id: true },
  });
  if (!slide) {
    throw new Error('Hero slide not found.');
  }

  await prisma.heroSlide.delete({ where: { id: slide.id } });
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

  const slides = await prisma.heroSlide.findMany({
    select: { id: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  const currentIds = slides.map((slide) => slide.id);
  const nextIds = moveIdInOrder(currentIds, heroSlideId, direction);

  if (nextIds.some((id, index) => id !== currentIds[index])) {
    await prisma.$transaction(
      nextIds.map((id, index) =>
        prisma.heroSlide.update({ where: { id }, data: { sortOrder: index + 1 } }),
      ),
    );
    revalidateHeroSlidePages();
  }

  redirect('/admin/hero-slides');
}
