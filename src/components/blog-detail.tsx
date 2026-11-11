import { BlogRow } from './blog-row';
import { renderMarkdown } from '@/lib/markdown';
import { formatPublishedDate } from '@/lib/format-date';
import type { BlogPost } from '@/types/domain';
import { ActionButton } from './action-button';

interface BlogDetailProps {
  post: BlogPost;
  otherPosts: BlogPost[];
}

export function BlogDetail({ post, otherPosts }: BlogDetailProps) {
  const limitedPosts = otherPosts.slice(0, 1);

  return (
    <article>
      <header className="mx-auto max-w-3xl text-center !border-b-0">
        <h1 className="font-heading text-2xl leading-tight tracking-[0.08em] sm:text-3xl">
          {post.title}
        </h1>
        <p className="mt-4 text-sm text-muted">Published {formatPublishedDate(post.publishedAt)}</p>
      </header>

      <div className="mx-auto mt-10 max-w-3xl">{renderMarkdown(post.body)}</div>

      {limitedPosts.length > 0 ? (
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
            {limitedPosts.map((otherPost) => (
              <BlogRow key={otherPost.blog_id} post={otherPost} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
