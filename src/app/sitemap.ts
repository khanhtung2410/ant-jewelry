import type { MetadataRoute } from 'next';
import { getBlogPosts, getCategories, getProducts } from '@/features/shared/queries';
import { getSiteUrl } from '@/features/shared/lib/site-url';
import { isMissingTableError } from '@/features/shared/db/prisma';

const staticPaths = ['/blog', '/jewelry-care', '/privacy', '/ship', '/terms'];

async function getCollectionOrEmpty<T>(load: () => Promise<T[]>): Promise<T[]> {
  try {
    return await load();
  } catch (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw error;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products, posts] = await Promise.all([
    getCollectionOrEmpty(getCategories),
    getCollectionOrEmpty(getProducts),
    getCollectionOrEmpty(getBlogPosts),
  ]);
  const siteUrl = getSiteUrl();

  return [
    { url: siteUrl.toString(), changeFrequency: 'weekly', priority: 1 },
    ...staticPaths.map((path) => ({
      url: new URL(path, siteUrl).toString(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
    ...categories.map((category) => ({
      url: new URL(`/c/${category.slug}`, siteUrl).toString(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: new URL(`/p/${product.slug}`, siteUrl).toString(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...posts.map((post) => ({
      url: new URL(`/blog/${post.slug}`, siteUrl).toString(),
      lastModified: new Date(post.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
