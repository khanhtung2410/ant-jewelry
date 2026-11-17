-- CreateTable
CREATE TABLE "ProductImageBlob" (
    "storageKey" TEXT NOT NULL PRIMARY KEY,
    "bytes" BLOB NOT NULL,
    "contentType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
