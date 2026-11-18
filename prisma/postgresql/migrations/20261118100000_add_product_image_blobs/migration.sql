-- CreateTable
CREATE TABLE "ProductImageBlob" (
    "storageKey" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "contentType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImageBlob_pkey" PRIMARY KEY ("storageKey")
);
