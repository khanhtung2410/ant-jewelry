'use client';

import { useState } from 'react';
import type { BlogPost } from '@/types/domain';
import { BlogRow } from './blog-row';
import { ActionButton } from './action-button';

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
          <ActionButton
            type="button"
            onClick={() => setVisibleCount((count) => Math.min(count + BATCH_SIZE, posts.length))}
          >
            SEE MORE
          </ActionButton>
        </div>
      ) : null}
    </div>
  );
}
