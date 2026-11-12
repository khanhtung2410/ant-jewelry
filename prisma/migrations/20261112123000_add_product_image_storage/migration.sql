-- AlterTable
ALTER TABLE "ProductImage" ADD COLUMN "storageKey" TEXT;
ALTER TABLE "ProductImage" ADD COLUMN "isHover" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PendingImageDeletion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storageKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductImage_storageKey_key" ON "ProductImage"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "PendingImageDeletion_storageKey_key" ON "PendingImageDeletion"("storageKey");
