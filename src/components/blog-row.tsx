import Image from 'next/image';
import Link from 'next/link';
import type { BlogPost } from '@/types/domain';

interface BlogRowProps {
  post: BlogPost;
  className?: string;
}

function formatPublishedDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);

  return match ? `${match[3]}.${match[2]}.${match[1]}` : isoDate;
}

export function BlogRow({ post, className = '' }: BlogRowProps) {
  const publishedDate = formatPublishedDate(post.publishedAt);

  return (
    <article
      className={`group grid gap-4 border-b border-line pb-6 sm:grid-cols-[240px_minmax(0,1fr)] sm:gap-6 ${className}`}
    >
      <Link
        href={`/blog/${post.slug}`}
        className="relative aspect-[4/3] overflow-hidden bg-product-image focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-line sm:aspect-square"
      >
        <Image
          src={post.coverImageUrl}
          alt={post.title}
          fill
          sizes="(max-width: 640px) 100vw, 240px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </Link>

      <div className="min-w-0">
        <time
          dateTime={post.publishedAt}
          className="text-xs uppercase tracking-[0.12em] text-muted"
        >
          {publishedDate}
        </time>
        <h3 className="mt-2 font-heading text-lg leading-snug">
          <Link
            href={`/blog/${post.slug}`}
            className="transition-colors hover:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-line"
          >
            {post.title}
          </Link>
        </h3>
        <p className="mt-2 text-sm leading-6 text-muted">{post.summary}</p>
        <Link
          href={`/blog/${post.slug}`}
          className="mt-4 inline-flex font-heading text-xs uppercase tracking-[0.12em] underline underline-offset-4 transition-colors hover:text-muted"
        >
          READ MORE
        </Link>
      </div>
    </article>
  );
}
