import type {
  BlogPostStatus,
  CategoryStatus,
  HeroSlideStatus,
  ProductStatus,
} from '@/constants/statuses';

export type { BlogPostStatus, CategoryStatus, HeroSlideStatus, ProductStatus };

declare const vndPriceBrand: unique symbol;

export type VndPrice = number & {
  readonly [vndPriceBrand]: 'VND';
};

export function createVndPrice(amount: number): VndPrice {
  if (!Number.isInteger(amount)) {
    throw new RangeError('VND price must be an integer.');
  }

  if (amount < 0) {
    throw new RangeError('VND price must not be negative.');
  }

  return amount as VndPrice;
}

export const PRODUCT_TYPES = [
  'WEDDING RING',
  'ENGAGEMENT RING',
  'NECKLACE',
  'OTHER JEWELRY',
] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number];

export type Role = 'ADMIN' | 'EDITOR';

export interface ProductColor {
  colorId: string;
  name: string;
  hex: string;
  /** Optional gallery for this colour; storefront pages fall back to `Product.images`. */
  images?: ProductImage[];
}

export interface ProductImage {
  imageId: string;
  url: string;
  alt: string;
  isFront: boolean;
  isHover?: boolean;
  sortOrder: number;
}

export type ProductDetails = Record<string, string>;

export interface Product {
  product_id: string;
  /** The category owns the product type; products link to it by id only. */
  categoryId: string;
  name: string;
  slug: string;
  brand: string;
  /** Derived from the linked category's `type`. */
  type: ProductType;
  description: string;
  details: ProductDetails;
  colors: ProductColor[];
  images: ProductImage[];
  price: VndPrice;
  status: ProductStatus;
}

/**
 * The subset of product fields needed to render a storefront product card.
 * Category listing pages use this shape so long fields such as `description`
 * and `details` are never selected from the database or sent to the client.
 */
export interface ProductCardData {
  product_id: string;
  name: string;
  slug: string;
  price: VndPrice;
  colors: ProductColor[];
  images: ProductImage[];
}

export interface Category {
  category_id: string;
  type: ProductType;
  name: string;
  slug: string;
  sortOrder: number;
  status: CategoryStatus;
}

export interface BlogPostImage {
  imageId: string;
  url: string;
  alt: string;
  sortOrder: number;
}

export interface BlogPost {
  blog_id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  coverImageUrl: string;
  images: BlogPostImage[];
  publishedAt: string;
  status: BlogPostStatus;
}

export interface HeroSlide {
  slide_id: string;
  imageUrl: string;
  alt: string;
  title: string;
  subtitle: string;
  linkUrl: string;
  sortOrder: number;
  status: HeroSlideStatus;
}

export interface Settings {
  siteName: string;
  phone: string;
  facebookUrl: string;
  instagramUrl: string;
  address: string;
  email: string;
}
