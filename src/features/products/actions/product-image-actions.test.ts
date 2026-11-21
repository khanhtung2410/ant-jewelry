import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/features/shared/db/prisma';

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

const {
  assignProductImageColor,
  moveProductImage,
  setProductImageFront,
  setProductImageHover,
  toggleProductVisibility,
} = await import('@/features/products/actions');

const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

describe('product image management actions with the real database (G10)', () => {
  let productId: string;
  let frontImageId: string;
  let secondImageId: string;
  let thirdImageId: string;
  let colorImageId: string;
  let colorId: string;
  let foreignColorId: string;
  let otherProductId: string;

  beforeAll(async () => {
    const category = await prisma.category.findFirstOrThrow();

    const product = await prisma.product.create({
      data: {
        name: 'Image action product',
        slug: `g10-product-${suffix}`,
        categoryId: category.id,
        brand: 'ANT',
        price: 1_000_000,
        description: 'Seeded for product image action tests',
        status: 'VISIBLE',
      },
      select: { id: true },
    });
    productId = product.id;

    const color = await prisma.productColor.create({
      data: { productId, name: 'Gold', hex: '#ffd700' },
      select: { id: true },
    });
    colorId = color.id;

    const other = await prisma.product.create({
      data: {
        name: 'Other image action product',
        slug: `g10-other-${suffix}`,
        categoryId: category.id,
        brand: 'ANT',
        price: 2_000_000,
        description: 'Seeded for the foreign color test',
      },
      select: { id: true },
    });
    otherProductId = other.id;

    const foreignColor = await prisma.productColor.create({
      data: { productId: other.id, name: 'Silver', hex: '#c0c0c0' },
      select: { id: true },
    });
    foreignColorId = foreignColor.id;

    const front = await prisma.productImage.create({
      data: {
        productId,
        url: `/g10/${suffix}/front.webp`,
        alt: 'Front',
        sortOrder: 1,
        isFront: true,
      },
      select: { id: true },
    });
    frontImageId = front.id;

    const second = await prisma.productImage.create({
      data: { productId, url: `/g10/${suffix}/second.webp`, alt: 'Second', sortOrder: 2 },
      select: { id: true },
    });
    secondImageId = second.id;

    const third = await prisma.productImage.create({
      data: { productId, url: `/g10/${suffix}/third.webp`, alt: 'Third', sortOrder: 3 },
      select: { id: true },
    });
    thirdImageId = third.id;

    const colorImage = await prisma.productImage.create({
      data: {
        productId,
        productColorId: colorId,
        url: `/g10/${suffix}/color.webp`,
        alt: 'Color',
        sortOrder: 4,
      },
      select: { id: true },
    });
    colorImageId = colorImage.id;
  });

  beforeEach(async () => {
    await prisma.productImage.updateMany({
      where: { productId },
      data: { isFront: false, isHover: false, productColorId: null },
    });
    await prisma.productImage.update({
      where: { id: frontImageId },
      data: { isFront: true, sortOrder: 1 },
    });
    await prisma.productImage.update({ where: { id: secondImageId }, data: { sortOrder: 2 } });
    await prisma.productImage.update({ where: { id: thirdImageId }, data: { sortOrder: 3 } });
    await prisma.productImage.update({
      where: { id: colorImageId },
      data: { productColorId: colorId, sortOrder: 4 },
    });
    await prisma.product.update({ where: { id: productId }, data: { status: 'VISIBLE' } });
  });

  afterAll(async () => {
    await prisma.product.deleteMany({ where: { id: { in: [productId, otherProductId] } } });
  });

  it('rejects the front image as the hover image', async () => {
    await expect(setProductImageHover(productId, frontImageId, new FormData())).rejects.toThrow(
      'Choose a shared image that is not the cover image for the hover image.',
    );

    const persisted = await prisma.productImage.findUniqueOrThrow({ where: { id: frontImageId } });
    expect(persisted.isHover).toBe(false);
  });

  it('rejects a color image as the hover image', async () => {
    await expect(setProductImageHover(productId, colorImageId, new FormData())).rejects.toThrow(
      'Choose a shared image that is not the cover image for the hover image.',
    );

    const persisted = await prisma.productImage.findUniqueOrThrow({ where: { id: colorImageId } });
    expect(persisted.isHover).toBe(false);
  });

  it('sets a shared image as the hover image and clears the previous one', async () => {
    await prisma.productImage.update({ where: { id: frontImageId }, data: { isFront: false } });
    await setProductImageHover(productId, secondImageId, new FormData());

    const images = await prisma.productImage.findMany({
      where: { productId },
      select: { id: true, isHover: true },
    });
    expect(images.filter((image) => image.isHover).map((image) => image.id)).toEqual([
      secondImageId,
    ]);
  });

  it('rejects a color image as the front image', async () => {
    await expect(setProductImageFront(productId, colorImageId, new FormData())).rejects.toThrow(
      'Only shared product images can be used as the cover image.',
    );

    const persisted = await prisma.productImage.findUniqueOrThrow({ where: { id: colorImageId } });
    expect(persisted.isFront).toBe(false);
  });

  it('sets a shared image as the front image and clears its hover flag', async () => {
    await prisma.productImage.update({ where: { id: frontImageId }, data: { isHover: true } });
    await setProductImageFront(productId, secondImageId, new FormData());

    const images = await prisma.productImage.findMany({
      where: { productId },
      select: { id: true, isFront: true, isHover: true },
    });
    expect(images.filter((image) => image.isFront).map((image) => image.id)).toEqual([
      secondImageId,
    ]);
    const second = images.find((image) => image.id === secondImageId);
    expect(second?.isHover).toBe(false);
  });

  it('rejects assigning a color that belongs to another product', async () => {
    const formData = new FormData();
    formData.set('productColorId', foreignColorId);

    await expect(assignProductImageColor(productId, secondImageId, formData)).rejects.toThrow(
      'Selected color does not belong to this product.',
    );

    const persisted = await prisma.productImage.findUniqueOrThrow({ where: { id: secondImageId } });
    expect(persisted.productColorId).toBeNull();
  });

  it('assigns a color of the product and clears front and hover flags', async () => {
    await prisma.productImage.update({ where: { id: secondImageId }, data: { isHover: true } });
    const formData = new FormData();
    formData.set('productColorId', colorId);

    await assignProductImageColor(productId, secondImageId, formData);

    const persisted = await prisma.productImage.findUniqueOrThrow({ where: { id: secondImageId } });
    expect(persisted.productColorId).toBe(colorId);
    expect(persisted.isFront).toBe(false);
    expect(persisted.isHover).toBe(false);
  });

  it('swaps sortOrder when moving an image up', async () => {
    await moveProductImage(productId, secondImageId, 'up', new FormData());

    const second = await prisma.productImage.findUniqueOrThrow({ where: { id: secondImageId } });
    const first = await prisma.productImage.findUniqueOrThrow({ where: { id: frontImageId } });
    expect(second.sortOrder).toBe(1);
    expect(first.sortOrder).toBe(2);
  });

  it('swaps sortOrder when moving an image down', async () => {
    await moveProductImage(productId, secondImageId, 'down', new FormData());

    const second = await prisma.productImage.findUniqueOrThrow({ where: { id: secondImageId } });
    const third = await prisma.productImage.findUniqueOrThrow({ where: { id: thirdImageId } });
    expect(second.sortOrder).toBe(3);
    expect(third.sortOrder).toBe(2);
  });

  it('keeps sortOrder unchanged on a boundary move', async () => {
    await moveProductImage(productId, frontImageId, 'up', new FormData());
    await moveProductImage(productId, colorImageId, 'down', new FormData());

    const images = await prisma.productImage.findMany({
      where: { id: { in: [frontImageId, secondImageId, thirdImageId, colorImageId] } },
      select: { id: true, sortOrder: true },
    });
    const orderById = new Map(images.map((image) => [image.id, image.sortOrder]));
    expect(orderById.get(frontImageId)).toBe(1);
    expect(orderById.get(secondImageId)).toBe(2);
    expect(orderById.get(thirdImageId)).toBe(3);
    expect(orderById.get(colorImageId)).toBe(4);
  });

  it('toggles product visibility from VISIBLE to HIDDEN and back', async () => {
    await toggleProductVisibility(productId, new FormData());

    const hidden = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    expect(hidden.status).toBe('HIDDEN');

    await toggleProductVisibility(productId, new FormData());

    const visible = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    expect(visible.status).toBe('VISIBLE');
  });

  it('exposes the chosen front image to the real product query consumer', async () => {
    await setProductImageFront(productId, thirdImageId, new FormData());

    const { getProductBySlug } = await import('@/features/products/queries/products');
    const queried = await getProductBySlug(`g10-product-${suffix}`);

    const front = queried?.images.find((image) => image.isFront);
    expect(front, 'query exposes exactly the front image set by the action').toBeTruthy();
    expect(front?.url).toBe(
      (await prisma.productImage.findUniqueOrThrow({ where: { id: thirdImageId } })).url,
    );
  });
});
