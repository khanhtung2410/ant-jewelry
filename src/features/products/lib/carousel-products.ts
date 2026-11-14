/**
 * Number of products each Home carousel section loads. The limit is applied in
 * the database so a growing category cannot slowly turn the Home page into a
 * full table scan.
 */
export const CAROUSEL_PRODUCT_LIMIT = 10;
