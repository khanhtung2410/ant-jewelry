import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/features/shared/db/prisma';
import type { HeroSlideFormState } from '@/features/layout/actions';

vi.mock('@/features/auth/session', () => ({
  getAdminSession: vi.fn(async () => ({
    userId: 'admin-1',
    email: 'admin@antjewelry.local',
    name: 'Admin',
    role: 'ADMIN',
    sessionVersion: 0,
    exp: 9_999_999_999,
  })),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

const { deleteHeroSlide, moveHeroSlide, saveHeroSlide } = await import('@/features/layout/actions');

const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

const emptyState: HeroSlideFormState = {
  values: {
    imageUrl: '',
    alt: '',
    title: '',
    subtitle: '',
    linkUrl: '',
    visible: true,
  },
  fieldErrors: {},
  message: null,
};

describe('hero slide actions with the real database (G13)', () => {
  let originalSortOrders: Map<string, number>;

  beforeAll(async () => {
    const all = await prisma.heroSlide.findMany({ select: { id: true, sortOrder: true } });
    originalSortOrders = new Map(all.map((slide) => [slide.id, slide.sortOrder]));
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await prisma.heroSlide.deleteMany({
      where: { imageUrl: { contains: `/g13/${suffix}/` } },
    });
    for (const [id, sortOrder] of originalSortOrders) {
      await prisma.heroSlide.update({ where: { id }, data: { sortOrder } });
    }
  });

  function formDataFor(imageUrl: string, visible = true): FormData {
    const formData = new FormData();
    formData.set('imageUrl', imageUrl);
    formData.set('alt', 'Hero alt');
    formData.set('title', 'Hero title');
    formData.set('subtitle', 'Hero subtitle');
    formData.set('linkUrl', '/c/other-jewelry');
    if (visible) formData.set('visible', 'on');
    return formData;
  }

  it('creates a slide with sortOrder equal to the current maximum plus one and revalidates', async () => {
    await prisma.heroSlide.create({
      data: {
        imageUrl: `/g13/${suffix}/max.webp`,
        alt: 'Max',
        title: 'Max',
        subtitle: '',
        linkUrl: '/c/wedding-ring',
        sortOrder: 950,
      },
    });

    const imageUrl = `/g13/${suffix}/created.webp`;
    await expect(saveHeroSlide(emptyState, formDataFor(imageUrl))).rejects.toThrow('NEXT_REDIRECT');

    const created = await prisma.heroSlide.findFirstOrThrow({ where: { imageUrl } });
    expect(created.sortOrder).toBe(951);
    expect(created.status).toBe('VISIBLE');
    expect(revalidatePath).toHaveBeenCalledWith('/admin/hero-slides');
    expect(revalidatePath).toHaveBeenCalledWith('/', 'page');
  });

  it('swaps sortOrder when a slide is moved up and down', async () => {
    const first = await prisma.heroSlide.create({
      data: {
        imageUrl: `/g13/${suffix}/first.webp`,
        alt: 'First',
        title: 'First',
        subtitle: '',
        linkUrl: '/c/wedding-ring',
        sortOrder: 960,
      },
      select: { id: true },
    });
    const second = await prisma.heroSlide.create({
      data: {
        imageUrl: `/g13/${suffix}/second.webp`,
        alt: 'Second',
        title: 'Second',
        subtitle: '',
        linkUrl: '/c/engagement-ring',
        sortOrder: 961,
      },
      select: { id: true },
    });
    await prisma.heroSlide.create({
      data: {
        imageUrl: `/g13/${suffix}/third.webp`,
        alt: 'Third',
        title: 'Third',
        subtitle: '',
        linkUrl: '/c/other-jewelry',
        sortOrder: 962,
      },
    });

    await expect(moveHeroSlide(second.id, 'up', new FormData())).rejects.toThrow('NEXT_REDIRECT');

    const afterUp = await prisma.heroSlide.findMany({
      where: { id: { in: [first.id, second.id] } },
      select: { id: true, sortOrder: true },
    });
    const upById = new Map(afterUp.map((slide) => [slide.id, slide.sortOrder]));
    expect(upById.get(second.id)).toBeLessThan(upById.get(first.id)!);

    vi.clearAllMocks();
    await expect(moveHeroSlide(second.id, 'down', new FormData())).rejects.toThrow('NEXT_REDIRECT');

    const afterDown = await prisma.heroSlide.findMany({
      where: { id: { in: [first.id, second.id] } },
      select: { id: true, sortOrder: true },
    });
    const downById = new Map(afterDown.map((slide) => [slide.id, slide.sortOrder]));
    expect(downById.get(first.id)).toBeLessThan(downById.get(second.id)!);
    expect(revalidatePath).toHaveBeenCalledWith('/admin/hero-slides');
  });

  it('deletes a slide and revalidates hero pages', async () => {
    const slide = await prisma.heroSlide.create({
      data: {
        imageUrl: `/g13/${suffix}/deleted.webp`,
        alt: 'Deleted',
        title: 'Deleted',
        subtitle: '',
        linkUrl: '/c/necklace',
        sortOrder: 970,
      },
      select: { id: true },
    });

    vi.clearAllMocks();
    await expect(deleteHeroSlide(slide.id, new FormData())).rejects.toThrow('NEXT_REDIRECT');

    expect(await prisma.heroSlide.findUnique({ where: { id: slide.id } })).toBeNull();
    expect(revalidatePath).toHaveBeenCalledWith('/', 'page');
  });
});
