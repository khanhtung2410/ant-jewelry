import Image from 'next/image';
import Link from 'next/link';
import type { BlogPost } from '@/features/shared/domain/domain';
import { ActionButton } from '@/features/layout/components/action-button';

interface BlogRowProps {
  post: BlogPost;
  className?: string;
}

export function BlogRow({ post, className = '' }: BlogRowProps) {
  return (
    <article
      className={`group grid gap-4 pb-6 sm:grid-cols-[320px_minmax(0,1fr)] sm:gap-6 ${className}`}
    >
      <Link
        href={`/blog/${post.slug}`}
        className="relative aspect-[4/3] overflow-hidden bg-product-image focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-line sm:aspect-square"
      >
        <Image
          src={post.coverImageUrl}
          alt={post.title}
          fill
          sizes="(max-width: 640px) 100vw, 320px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </Link>

      <div className="relative flex min-w-0 flex-col pb-10 sm:justify-center">
        <h3 className="font-heading text-lg leading-snug">
          <Link
            href={`/blog/${post.slug}`}
            className="transition-colors hover:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-line"
          >
            {post.title}
          </Link>
        </h3>

        <p className="mt-4 text-sm leading-6 text-muted">{post.summary}</p>

        <ActionButton
          href={`/blog/${post.slug}`}
          ariaLabel={`Read more about ${post.title}`}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 text-sm"
        >
          LEARN MORE
        </ActionButton>
      </div>
    </article>
  );
}
