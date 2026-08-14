// apps/api/src/modules/knowledge-base/application/retrieval.service.ts
//
// Handles semantic search: takes a natural-language query, embeds it using the same
// OpenAI model used for document chunks, then finds the most similar chunks stored
// in Postgres via pgvector's cosine distance operator (<=>).
//
// This is the final piece of the RAG "Retrieve Relevant Content" stage — Phase 8
// (Assessment Generation) will call this service to fetch grounding context before
// sending it to OpenAI's chat completion API.

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmbeddingService } from './embedding.service';

// Shape of a single search result returned to the caller.
// `similarity` is expressed as 1 - cosine_distance, so higher = more relevant
// (this is more intuitive to consume than raw distance, where lower = better).
export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  similarity: number;
}

// Shape of a single raw row as it comes back from Postgres (snake_case column
// names, plus the computed `distance` column from the <=> operator).
// Defined once here, at module scope, so we don't repeat a multi-line inline
// type on the $queryRaw call itself.
interface ChunkSearchRow {
  id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  distance: number;
}

@Injectable()
export class RetrievalService {
  private readonly logger = new Logger(RetrievalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embedding: EmbeddingService,
  ) {}

  /**
   * Searches document_chunks for the most semantically similar content to `query`,
   * scoped to documents owned by `userId` (and optionally further scoped to a
   * single `documentId`).
   *
   * @param userId      The requesting user's ID — enforces row-level ownership,
   *                     since Postgres RLS is bypassed here (we use the Prisma
   *                     service-role connection, same as the rest of the app).
   * @param query        The natural-language search text.
   * @param limit        Max number of chunks to return (already validated/defaulted by the DTO).
   * @param documentId   Optional — if provided, restricts the search to just this document.
   */
  async search(
    userId: string,
    query: string,
    limit: number,
    documentId?: string,
  ): Promise<RetrievedChunk[]> {
    this.logger.log(
      `Searching for "${query}" (userId=${userId}, documentId=${documentId ?? 'ALL'}, limit=${limit})`,
    );

    // Step 1: Embed the query string using the exact same model as the stored chunks
    // (text-embedding-3-small). Cosine similarity is only meaningful when comparing
    // vectors produced by the same embedding model.
    // embedBatch expects an array, so we wrap the single query and take the first result.
    const [queryEmbedding] = await this.embedding.embedBatch([query]);

    // Convert the embedding array into the pgvector literal string format,
    // e.g. "[0.123,0.456,...]" — same format used when inserting chunks in
    // DocumentProcessingService, so pgvector can cast it correctly.
    const vectorLiteral = `[${queryEmbedding.join(',')}]`;

    // Step 2: Run the similarity search via raw SQL, since Prisma's query builder
    // doesn't support pgvector's <=> (cosine distance) operator natively.
    //
    // Key details:
    // - We JOIN against `documents` and filter `d.owner_id = userId` to enforce
    //   that a user can only ever retrieve chunks from documents they own —
    //   this is our authorization boundary since we're using the service-role
    //   Prisma connection (which bypasses Postgres RLS).
    // - `dc.embedding <=> ${vectorLiteral}::vector` computes cosine DISTANCE
    //   (0 = identical, 2 = opposite) — smaller distance means more similar.
    // - We convert distance to similarity (1 - distance) further down, after
    //   getting the raw rows back.
    // - We branch into two separate queries (with vs without the documentId
    //   filter) rather than trying to conditionally splice SQL fragments —
    //   simpler to read, and every value stays parameterized (no injection risk).
    //
    // NOTE: we cast the result with `as ChunkSearchRow[]` instead of using an
    // inline generic on $queryRaw, since a multi-line type argument directly on
    // a tagged template call is fragile to reformat/copy-paste and caused a
    // parser error earlier. This is functionally identical and safer to edit.
    let rows: ChunkSearchRow[];

    if (documentId) {
      const result = await this.prisma.$queryRaw`
        SELECT
          dc.id,
          dc.document_id,
          dc.content,
          dc.chunk_index,
          dc.embedding <=> ${vectorLiteral}::vector AS distance
        FROM document_chunks dc
        INNER JOIN documents d ON d.id = dc.document_id
        WHERE d.owner_id = ${userId}
            AND dc.document_id = ${documentId}
        ORDER BY distance ASC
        LIMIT ${limit}
      `;
      rows = result as ChunkSearchRow[];
    } else {
      const result = await this.prisma.$queryRaw`
        SELECT
          dc.id,
          dc.document_id,
          dc.content,
          dc.chunk_index,
          dc.embedding <=> ${vectorLiteral}::vector AS distance
        FROM document_chunks dc
        INNER JOIN documents d ON d.id = dc.document_id
        WHERE d.owner_id = ${userId}
        ORDER BY distance ASC
        LIMIT ${limit}
      `;
      rows = result as ChunkSearchRow[];
    }

    this.logger.log(`Found ${rows.length} matching chunks`);

    // Step 3: Map raw SQL result rows (snake_case, as stored in Postgres) into
    // our camelCase API response shape, and convert distance -> similarity.
    return rows.map((row) => ({
      chunkId: row.id,
      documentId: row.document_id,
      content: row.content,
      chunkIndex: row.chunk_index,
      similarity: 1 - row.distance,
    }));
  }
}
