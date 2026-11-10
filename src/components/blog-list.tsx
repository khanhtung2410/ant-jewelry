'use client';

import { useState } from 'react';
import type { BlogPost } from '@/types/domain';
import { BlogRow } from './blog-row';

const INITIAL_COUNT = 4;
const BATCH_SIZE = 4;

interface BlogListProps {
  posts: BlogPost[];
}

export function BlogList({ posts }: BlogListProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const visiblePosts = posts.slice(0, visibleCount);
  const canShowMore = visibleCount < posts.length;

  return (
    <div>
      <div className="space-y-8 sm:space-y-10">
        {visiblePosts.map((post) => (
          <BlogRow key={post.blog_id} post={post} />
        ))}
      </div>

      {canShowMore ? (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => Math.min(count + BATCH_SIZE, posts.length))}
            className="font-heading text-sm tracking-[0.12em] underline decoration-[var(--underline-color)] underline-offset-8 transition-colors hover:text-[var(--underline-color)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--control-outline)]"
          >
            SEE MORE
          </button>
        </div>
      ) : null}
    </div>
  );
}
