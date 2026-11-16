/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from 'bcryptjs';
import postgres from '@prisma/orm-postgres/runtime';
import { contractFromJson } from '@prisma/orm-postgres/static';
import contractJson from '../src/prisma/contract.json' with { type: 'json' };
import type { Contract } from '../src/prisma/contract';
import { categories } from '../src/features/products/mocks/categories';
import { blogPosts } from '../src/features/blog/mocks/blog-posts';
import { heroSlides } from '../src/features/layout/mocks/hero-slides';
import { products } from '../src/features/products/mocks/products';
import { settings } from '../src/features/layout/mocks/settings';

const contract = contractFromJson<Contract>(contractJson as Contract);
const prisma = postgres({ contract, url: process.env.DATABASE_URL });

function getSharedImages(product: (typeof products)[number]) {
  const colorImageIds = new Set(
    product.colors.flatMap((color) => (color.images ?? []).map((image) => image.imageId)),
  );
  return product.images.filter((image) => !colorImageIds.has(image.imageId));
}

async function findBySlug(model: any, slug: string) {
  return model.where({ slug }).first();
}

async function upsertBySlug(model: any, slug: string, data: Record<string, unknown>) {
  const existing = await findBySlug(model, slug);
  if (existing) {
    return model.where({ id: existing.id }).update(data);
  }
  return model.create({ slug, ...data });
}

async function main() {
  for (const category of categories) {
    await upsertBySlug(prisma.orm.public.Category as any, category.slug, {
      name: category.name,
      type: category.type,
      sortOrder: category.sortOrder,
      status: category.status,
    });
  }

  const allCategories = await (prisma.orm.public.Category as any).all();
  const categoryByType = new Map(allCategories.map((category: any) => [category.type, category]));

  for (const product of products) {
    const category = categoryByType.get(product.type);
    if (!category) {
      throw new Error(`Missing category for product type: ${product.type}`);
    }

    const seededProduct = await upsertBySlug(prisma.orm.public.Product as any, product.slug, {
      categoryId: category.id,
      name: product.name,
      brand: product.brand,
      description: product.description,
      details: product.details,
      price: product.price,
      status: product.status,
    });

    const existingImages = await (prisma.orm.public.ProductImage as any)
      .where({ productId: seededProduct.id })
      .all();
    for (const img of existingImages) {
      await (prisma.orm.public.ProductImage as any).where({ id: img.id }).delete();
    }
    const existingColors = await (prisma.orm.public.ProductColor as any)
      .where({ productId: seededProduct.id })
      .all();
    for (const color of existingColors) {
      await (prisma.orm.public.ProductColor as any).where({ id: color.id }).delete();
    }

    const colorIdBySourceId = new Map<string, string>();
    for (const color of product.colors) {
      const createdColor = await (prisma.orm.public.ProductColor as any).create({
        productId: seededProduct.id,
        name: color.name,
        hex: color.hex,
      });
      colorIdBySourceId.set(color.colorId, createdColor.id);
    }

    const sharedImages = getSharedImages(product).map((image) => ({
      productId: seededProduct.id,
      productColorId: null,
      url: image.url,
      alt: image.alt,
      isFront: image.isFront,
      sortOrder: image.sortOrder,
      isHover: false,
    }));

    const colorImages = product.colors.flatMap((color) => {
      const createdColorId = colorIdBySourceId.get(color.colorId);
      if (!createdColorId || !color.images?.length) return [];
      return color.images.map((image) => ({
        productId: seededProduct.id,
        productColorId: createdColorId,
        url: image.url,
        alt: image.alt,
        isFront: image.isFront,
        sortOrder: image.sortOrder,
        isHover: false,
      }));
    });

    for (const image of [...sharedImages, ...colorImages]) {
      await (prisma.orm.public.ProductImage as any).create(image);
    }
  }

  for (const post of blogPosts) {
    const seededPost = await upsertBySlug(prisma.orm.public.BlogPost as any, post.slug, {
      title: post.title,
      summary: post.summary,
      body: post.body,
      coverImageUrl: post.coverImageUrl,
      publishedAt: new Date(post.publishedAt),
      status: post.status,
    });

    const imageMatches = [...post.body.matchAll(/!\[(.*?)\]\((.*?)\)/g)].map((match) => ({
      alt: match[1] || post.title,
      url: match[2],
    }));
    const uniqueImages = Array.from(
      new Map(
        [post.coverImageUrl, ...imageMatches.map((image) => image.url)]
          .filter(Boolean)
          .map((url) => {
            const match = imageMatches.find((image) => image.url === url);
            return [url, { url, alt: match?.alt || post.title }];
          }),
      ).values(),
    );

    const existingBlogImages = await (prisma.orm.public.BlogImage as any)
      .where({ blogPostId: seededPost.id })
      .all();
    for (const image of existingBlogImages) {
      await (prisma.orm.public.BlogImage as any).where({ id: image.id }).delete();
    }
    for (let index = 0; index < uniqueImages.length; index += 1) {
      const image = uniqueImages[index];
      await (prisma.orm.public.BlogImage as any).create({
        blogPostId: seededPost.id,
        url: image.url,
        alt: image.alt,
        sortOrder: index + 1,
      });
    }
  }

  for (const [index, slide] of heroSlides.entries()) {
    const existingSlides = await (prisma.orm.public.HeroSlide as any)
      .where({ imageUrl: slide.imageUrl })
      .orderBy((s: any) => s.createdAt.asc())
      .all();
    const data = {
      imageUrl: slide.imageUrl,
      alt: slide.alt,
      title: slide.title,
      subtitle: slide.subtitle,
      linkUrl: slide.linkUrl,
      sortOrder: slide.sortOrder ?? index + 1,
      status: slide.status,
    };
    if (existingSlides[0]) {
      await (prisma.orm.public.HeroSlide as any).where({ id: existingSlides[0].id }).update(data);
      for (const extra of existingSlides.slice(1)) {
        await (prisma.orm.public.HeroSlide as any).where({ id: extra.id }).delete();
      }
    } else {
      await (prisma.orm.public.HeroSlide as any).create(data);
    }
  }

  const existingSettings = await (prisma.orm.public.Setting as any)
    .orderBy((s: any) => s.createdAt.asc())
    .all();
  const settingData = {
    siteName: settings.siteName,
    phone: settings.phone,
    facebookUrl: settings.facebookUrl,
    instagramUrl: settings.instagramUrl,
    address: settings.address,
    email: settings.email,
  };
  if (existingSettings[0]) {
    await (prisma.orm.public.Setting as any).where({ id: existingSettings[0].id }).update(settingData);
    for (const extra of existingSettings.slice(1)) {
      await (prisma.orm.public.Setting as any).where({ id: extra.id }).delete();
    }
  } else {
    await (prisma.orm.public.Setting as any).create(settingData);
  }

  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const editorPasswordHash = await bcrypt.hash('Editor@123', 10);

  for (const user of [
    { email: 'admin@antjewelry.local', name: 'Admin', passwordHash: adminPasswordHash, role: 'ADMIN' },
    { email: 'editor@antjewelry.local', name: 'Editor', passwordHash: editorPasswordHash, role: 'EDITOR' },
  ]) {
    const existing = await (prisma.orm.public.User as any).where({ email: user.email }).first();
    const data = { name: user.name, passwordHash: user.passwordHash, role: user.role, locked: false };
    if (existing) {
      await (prisma.orm.public.User as any).where({ id: existing.id }).update(data);
    } else {
      await (prisma.orm.public.User as any).create({ email: user.email, ...data });
    }
  }
}

main()
  .then(async () => {
    await (prisma as any).close?.();
  })
  .catch(async (error) => {
    console.error(error);
    try {
      await (prisma as any).close?.();
    } catch {}
    process.exit(1);
  });
