import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { categories } from '../src/features/products/mocks/categories';
import { blogPosts } from '../src/features/blog/mocks/blog-posts';
import { heroSlides } from '../src/features/layout/mocks/hero-slides';
import { products } from '../src/features/products/mocks/products';
import { settings } from '../src/features/layout/mocks/settings';

const prisma = new PrismaClient();

function getSharedImages(product: (typeof products)[number]) {
  const colorImageIds = new Set(
    product.colors.flatMap((color) => (color.images ?? []).map((image) => image.imageId)),
  );

  return product.images.filter((image) => !colorImageIds.has(image.imageId));
}

async function main() {
  if (!process.env.DATABASE_URL?.startsWith('file:')) {
    throw new Error(
      'The demo seed only supports local SQLite; it refuses to run against other databases.',
    );
  }

  const now = new Date();

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        type: category.type,
        sortOrder: category.sortOrder,
        status: category.status,
      },
      create: {
        name: category.name,
        slug: category.slug,
        type: category.type,
        sortOrder: category.sortOrder,
        status: category.status,
      },
    });
  }

  const categoryByType = new Map(
    (await prisma.category.findMany()).map((category) => [category.type, category]),
  );

  for (const product of products) {
    const category = categoryByType.get(product.type);
    if (!category) {
      throw new Error(`Missing category for product type: ${product.type}`);
    }

    const seededProduct = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        categoryId: category.id,
        name: product.name,
        brand: product.brand,
        type: product.type,
        description: product.description,
        details: product.details,
        price: product.price,
        status: product.status,
      },
      create: {
        categoryId: category.id,
        name: product.name,
        slug: product.slug,
        brand: product.brand,
        type: product.type,
        description: product.description,
        details: product.details,
        price: product.price,
        status: product.status,
      },
      select: { id: true },
    });

    await prisma.productImage.deleteMany({ where: { productId: seededProduct.id } });
    await prisma.productColor.deleteMany({ where: { productId: seededProduct.id } });

    const colorIdBySourceId = new Map<string, string>();

    for (const color of product.colors) {
      const createdColor = await prisma.productColor.create({
        data: {
          productId: seededProduct.id,
          name: color.name,
          hex: color.hex,
        },
        select: { id: true },
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
    }));

    const colorImages = product.colors.flatMap((color) => {
      const createdColorId = colorIdBySourceId.get(color.colorId);
      if (!createdColorId || !color.images?.length) {
        return [];
      }

      return color.images.map((image) => ({
        productId: seededProduct.id,
        productColorId: createdColorId,
        url: image.url,
        alt: image.alt,
        isFront: image.isFront,
        sortOrder: image.sortOrder,
      }));
    });

    const imagesToCreate = [...sharedImages, ...colorImages];
    if (imagesToCreate.length > 0) {
      await prisma.productImage.createMany({ data: imagesToCreate });
    }
  }

  for (const post of blogPosts) {
    const seededPost = await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: {
        title: post.title,
        summary: post.summary,
        body: post.body,
        coverImageUrl: post.coverImageUrl,
        publishedAt: new Date(post.publishedAt),
        status: post.status,
      },
      create: {
        title: post.title,
        slug: post.slug,
        summary: post.summary,
        body: post.body,
        coverImageUrl: post.coverImageUrl,
        publishedAt: new Date(post.publishedAt),
        status: post.status,
      },
      select: { id: true },
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

    await prisma.blogImage.deleteMany({ where: { blogPostId: seededPost.id } });
    if (uniqueImages.length > 0) {
      await prisma.blogImage.createMany({
        data: uniqueImages.map((image, index) => ({
          blogPostId: seededPost.id,
          url: image.url,
          alt: image.alt,
          sortOrder: index + 1,
        })),
      });
    }
  }

  for (const [index, slide] of heroSlides.entries()) {
    const existingSlides = await prisma.heroSlide.findMany({
      where: { imageUrl: slide.imageUrl },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

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
      await prisma.heroSlide.update({ where: { id: existingSlides[0].id }, data });

      if (existingSlides.length > 1) {
        await prisma.heroSlide.deleteMany({
          where: { id: { in: existingSlides.slice(1).map((item) => item.id) } },
        });
      }
    } else {
      await prisma.heroSlide.create({ data });
    }
  }

  const existingSettings = await prisma.setting.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  const settingData = {
    siteName: settings.siteName,
    phone: settings.phone,
    facebookUrl: settings.facebookUrl,
    instagramUrl: settings.instagramUrl,
    address: settings.address,
    email: settings.email,
  };

  if (existingSettings[0]) {
    await prisma.setting.update({ where: { id: existingSettings[0].id }, data: settingData });
    if (existingSettings.length > 1) {
      await prisma.setting.deleteMany({
        where: { id: { in: existingSettings.slice(1).map((item) => item.id) } },
      });
    }
  } else {
    await prisma.setting.create({ data: settingData });
  }

  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const editorPasswordHash = await bcrypt.hash('Editor@123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@antjewelry.local' },
    update: {
      name: 'Admin',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      locked: false,
    },
    create: {
      email: 'admin@antjewelry.local',
      name: 'Admin',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      locked: false,
    },
  });

  await prisma.user.upsert({
    where: { email: 'editor@antjewelry.local' },
    update: {
      name: 'Editor',
      passwordHash: editorPasswordHash,
      role: 'EDITOR',
      locked: false,
    },
    create: {
      email: 'editor@antjewelry.local',
      name: 'Editor',
      passwordHash: editorPasswordHash,
      role: 'EDITOR',
      locked: false,
    },
  });

  void now;
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
