-- AlterTable: add AI-specific fields to Transaction
-- narration  — immutable raw bank narration from Mono; never user-edited.
--              Used as the source text for pgvector embeddings and as the
--              narration sent to the classification LLM. Null for manual transactions.
-- bankCategory — raw Mono category enum (e.g. "food_and_drinks") stored at sync
--                time and passed to the classification LLM as a hint signal.
--                Previously this was only used during token scoring then discarded.
--                Null for manual transactions.
ALTER TABLE "Transaction" ADD COLUMN "narration"     TEXT;
ALTER TABLE "Transaction" ADD COLUMN "bankCategory"  TEXT;

-- CreateTable: stores user category corrections for AI classification few-shot RAG.
-- When a user changes a Mono transaction's AI-assigned category, the raw narration
-- and corrected category slug are embedded and stored here. At the next classification
-- call the top-k most similar past corrections are retrieved via cosine search and
-- injected as few-shot examples into the prompt so the model learns from the user's
-- own correction history without any fine-tuning.
CREATE TABLE "classification_corrections" (
    "id"            TEXT        NOT NULL,
    "narration"     TEXT        NOT NULL,
    "correctedSlug" TEXT        NOT NULL,
    "embedding"     vector(1536),
    "userId"        TEXT        NOT NULL,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classification_corrections_pkey" PRIMARY KEY ("id")
);

-- ForeignKey: cascade-delete corrections when the owning user is deleted
ALTER TABLE "classification_corrections"
    ADD CONSTRAINT "classification_corrections_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES "User"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- Index: userId lookup (filtering corrections to the current user before cosine search)
CREATE INDEX "classification_corrections_userId_idx"
    ON "classification_corrections"("userId");

-- CreateIndex (HNSW — must come after the embedding column exists)
-- Uses vector_cosine_ops: measures angle between vectors, captures semantic
-- similarity regardless of text length — correct for text embeddings.
-- HNSW chosen over IVFFlat: no training phase, handles continuous inserts
-- without degrading search quality.
CREATE INDEX "classification_corrections_embedding_hnsw"
    ON "classification_corrections"
    USING hnsw (embedding vector_cosine_ops);
