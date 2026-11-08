declare const vndPriceBrand: unique symbol;

export type VndPrice = number & {
  readonly [vndPriceBrand]: "VND";
};

export function createVndPrice(amount: number): VndPrice {
  if (!Number.isInteger(amount)) {
    throw new RangeError("VND price must be an integer.");
  }

  return amount as VndPrice;
}

export type ProductStatus = "VISIBLE" | "HIDDEN";
export type CategoryStatus = "VISIBLE" | "HIDDEN";
export type BlogPostStatus = "DRAFT" | "PUBLISHED";

export interface Product {
  product_id: string;
  name: string;
  slug: string;
  price: VndPrice;
  status: ProductStatus;
}

export interface Category {
  category_id: string;
  name: string;
  slug: string;
  status: CategoryStatus;
}

export interface BlogPost {
  blog_id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  status: BlogPostStatus;
}
