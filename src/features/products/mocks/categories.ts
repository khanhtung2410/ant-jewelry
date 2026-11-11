import type { Category } from '@/features/shared/domain/domain';

/**
 * ProductType and Category are one concept: each category record is keyed by
 * the ProductType value used on products and by the category filter.
 */
export const categories: Category[] = [
  {
    category_id: 'cat-wedding-ring',
    type: 'WEDDING RING',
    name: 'Wedding Ring',
    slug: 'wedding-ring',
    sortOrder: 1,
    status: 'VISIBLE',
  },
  {
    category_id: 'cat-engagement-ring',
    type: 'ENGAGEMENT RING',
    name: 'Engagement Ring',
    slug: 'engagement-ring',
    sortOrder: 2,
    status: 'VISIBLE',
  },
  {
    category_id: 'cat-necklace',
    type: 'NECKLACE',
    name: 'Necklace',
    slug: 'necklace',
    sortOrder: 3,
    status: 'VISIBLE',
  },
  {
    category_id: 'cat-other-jewelry',
    type: 'OTHER JEWELRY',
    name: 'Other Jewelry',
    slug: 'other-jewelry',
    sortOrder: 4,
    status: 'VISIBLE',
  },
];
