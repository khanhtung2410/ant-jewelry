-- Products now link to a category by id only; the category owns the product type.
ALTER TABLE "Product" DROP COLUMN "type";