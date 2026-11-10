import { BlogRow } from './blog-row';
import { renderMarkdown } from '@/lib/markdown';
import { formatPublishedDate } from '@/lib/format-date';
import type { BlogPost } from '@/types/domain';

interface BlogDetailProps {
  post: BlogPost;
  otherPosts: BlogPost[];
}

export function BlogDetail({ post, otherPosts }: BlogDetailProps) {
  return (
    <article>
      <header className="mx-auto max-w-3xl text-center">
        <h1 className="font-heading text-2xl leading-tight tracking-[0.08em] sm:text-3xl">
          {post.title}
        </h1>
        <p className="mt-4 text-sm text-muted">Published {formatPublishedDate(post.publishedAt)}</p>
      </header>

      <div className="mx-auto mt-10 max-w-3xl">{renderMarkdown(post.body)}</div>

      {otherPosts.length > 0 ? (
        <section aria-labelledby="other-blogs-heading" className="mt-16 border-t border-line pt-12">
          <h2
            id="other-blogs-heading"
            className="mb-8 text-center font-heading text-xl tracking-[0.08em] sm:text-2xl"
          >
            OTHER BLOGS
          </h2>
          <div className="space-y-8 sm:space-y-10">
            {otherPosts.map((otherPost) => (
              <BlogRow key={otherPost.blog_id} post={otherPost} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
