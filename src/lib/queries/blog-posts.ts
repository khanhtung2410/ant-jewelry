import type { BlogPost } from '@/types/domain';
import { blogPosts } from '@/lib/mock/blog-posts';

/**
 * Returns published Blog posts, newest first. Drafts are excluded unless
 * `includeDrafts` is set explicitly for an admin screen.
 */
export function getBlogPosts(
  options: { includeDrafts?: boolean; limit?: number } = {},
): BlogPost[] {
  const result = blogPosts
    .filter((post) => options.includeDrafts || post.status === 'PUBLISHED')
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

  const limited = typeof options.limit === 'number' ? result.slice(0, options.limit) : result;

  return limited.map((post) => structuredClone(post));
}

export function getBlogPostBySlug(
  slug: string,
  options: { includeDrafts?: boolean } = {},
): BlogPost | null {
  const post = blogPosts.find(
    (item) => item.slug === slug && (options.includeDrafts || item.status === 'PUBLISHED'),
  );

  return post ? structuredClone(post) : null;
}
