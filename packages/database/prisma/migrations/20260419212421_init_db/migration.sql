-- EnableExtension (must run before any vector column is created)
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "embedding" vector(1536);

-- CreateTable
CREATE TABLE "Merchant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[],
    "categoryHint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_name_key" ON "Merchant"("name");

-- CreateIndex (HNSW — must come after the embedding column exists)
CREATE INDEX "transactions_embedding_hnsw" ON "Transaction" USING hnsw (embedding vector_cosine_ops);
