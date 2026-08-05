-- pgvector extension already enabled in an earlier migration, but safe to confirm
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "document_chunks" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "chunk_index" INTEGER NOT NULL,
    "page_number" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "document_chunks"
  ADD CONSTRAINT "document_chunks_document_id_fkey"
  FOREIGN KEY ("document_id") REFERENCES "documents"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Index for fast similarity search (cosine distance)
CREATE INDEX document_chunks_embedding_idx
  ON "document_chunks"
  USING hnsw (embedding vector_cosine_ops);

-- Index for fetching all chunks of a document quickly
CREATE INDEX document_chunks_document_id_idx ON "document_chunks"("document_id");