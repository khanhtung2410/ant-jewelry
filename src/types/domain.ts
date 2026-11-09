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

export type ProductStatus = 'VISIBLE' | 'HIDDEN';
export type CategoryStatus = 'VISIBLE' | 'HIDDEN';
export type BlogPostStatus = 'DRAFT' | 'PUBLISHED';
export type HeroSlideStatus = 'VISIBLE' | 'HIDDEN';

export type ProductType = 'RING' | 'NECKLACE' | 'BRACELET' | 'EARRING';

export type Role = 'ADMIN' | 'EDITOR';

export interface ProductColor {
  colorId: string;
  name: string;
  hex: string;
}

export interface ProductImage {
  imageId: string;
  url: string;
  alt: string;
  isFront: boolean;
  sortOrder: number;
}

export type ProductDetails = Record<string, string>;

export interface Product {
  product_id: string;
  categoryId: string;
  name: string;
  slug: string;
  brand: string;
  type: ProductType;
  description: string;
  details: ProductDetails;
  colors: ProductColor[];
  images: ProductImage[];
  price: VndPrice;
  status: ProductStatus;
}

export interface Category {
  category_id: string;
  name: string;
  slug: string;
  sortOrder: number;
  status: CategoryStatus;
}

export interface BlogPost {
  blog_id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  coverImageUrl: string;
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
