import { BlogRow } from './blog-row';
import { renderMarkdown } from '@/features/shared/lib/markdown';
import { formatPublishedDate } from '@/features/shared/lib/format-date';
import type { BlogPost } from '@/features/shared/domain/domain';
import { ActionButton } from '@/features/layout/components/action-button';

interface BlogDetailProps {
  post: BlogPost;
  otherPosts: BlogPost[];
}

export const BLOG_COVER_WIDTH = 1200;
export const BLOG_COVER_HEIGHT = 630;

export function BlogDetail({ post, otherPosts }: BlogDetailProps) {
  // The Figma detail layout shows one related post in the OTHER BLOGS block.
  const otherPost = otherPosts[0];

  return (
    <article>
      <header className="mx-auto max-w-3xl text-center !border-b-0">
        <h1 className="font-heading text-2xl leading-tight tracking-[0.08em] sm:text-3xl">
          {post.title}
        </h1>
        <p className="mt-4 text-sm text-muted">Published {formatPublishedDate(post.publishedAt)}</p>
      </header>

      {post.coverImageUrl ? (
        <div className="relative mx-auto mt-8 aspect-[1200/630] max-w-3xl overflow-hidden rounded-sm">
          {/* eslint-disable-next-line @next/next/no-img-element -- blog content image */}
          <img
            src={post.coverImageUrl}
            alt={post.title}
            width={BLOG_COVER_WIDTH}
            height={BLOG_COVER_HEIGHT}
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
        </div>
      ) : null}

      <div className="mx-auto mt-10 max-w-3xl">{renderMarkdown(post.body)}</div>

      {otherPost ? (
        // Added max-w-7xl to match the width of your homepage sections
        <section aria-labelledby="other-blogs-heading" className="mx-auto mt-16 max-w-7xl pt-12">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 pt-8">
            <h2
              id="other-blogs-heading"
              className="font-heading text-xl tracking-[0.08em] sm:text-2xl"
            >
              OTHER BLOGS
            </h2>
            <ActionButton href="/blog" className="text-sm">
              SEE MORE
            </ActionButton>
          </div>

          <div className="space-y-8 sm:space-y-10">
            <BlogRow key={otherPost.blog_id} post={otherPost} headingLevel={3} />
          </div>
        </section>
      ) : null}
    </article>
  );
}
