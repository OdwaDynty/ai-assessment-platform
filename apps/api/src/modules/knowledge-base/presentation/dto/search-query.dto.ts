// apps/api/src/modules/knowledge-base/presentation/dto/search-query.dto.ts
//
// Zod schema + inferred TypeScript type for the semantic search request body.
// Mirrors the pattern already established in documents/presentation/dto/create-document.dto.ts
// so validation is consistent across the codebase.

import { z } from 'zod';

// Defines the shape and validation rules for POST /knowledge-base/search request bodies.
export const searchQuerySchema = z.object({
  // The natural-language question/topic to search for. Required, non-empty,
  // capped at a reasonable length to avoid abuse (huge strings = huge OpenAI embedding cost).
  query: z.string().min(1, 'Query cannot be empty').max(2000, 'Query is too long'),

  // Optional: restrict the search to a single document (e.g. "search only within this study guide").
  // If omitted, search runs across ALL documents owned by the requesting user.
  documentId: z.string().uuid('documentId must be a valid UUID').optional(),

  // Optional: how many top matching chunks to return. Defaults to 5 if not provided.
  // Capped at 20 to keep OpenAI context usage and query cost predictable downstream in Phase 8.
  limit: z.number().int().min(1).max(20).optional().default(5),
});

// TypeScript type inferred directly from the schema above — stays in sync automatically
// if the schema changes, so we never have two sources of truth for this shape.
export type SearchQueryDto = z.infer<typeof searchQuerySchema>;