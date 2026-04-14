-- CreateTable
CREATE TABLE "BookAsset" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "data" BYTEA NOT NULL,

    CONSTRAINT "BookAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookAsset_bookId_idx" ON "BookAsset"("bookId");

-- CreateIndex
CREATE UNIQUE INDEX "BookAsset_bookId_path_key" ON "BookAsset"("bookId", "path");

-- AddForeignKey
ALTER TABLE "BookAsset" ADD CONSTRAINT "BookAsset_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
