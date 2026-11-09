import type { Category } from '@/types/domain';

export const categories: Category[] = [
  {
    category_id: 'cat-wedding-bands',
    name: 'Wedding Bands',
    slug: 'wedding-bands',
    sortOrder: 1,
    status: 'VISIBLE',
  },
  {
    category_id: 'cat-engagement',
    name: 'Engagement',
    slug: 'engagement',
    sortOrder: 2,
    status: 'VISIBLE',
  },
  {
    category_id: 'cat-everyday',
    name: 'Everyday',
    slug: 'everyday',
    sortOrder: 3,
    status: 'VISIBLE',
  },
  {
    category_id: 'cat-ready-to-ship',
    name: 'Ready to Ship',
    slug: 'ready-to-ship',
    sortOrder: 4,
    status: 'VISIBLE',
  },
];
