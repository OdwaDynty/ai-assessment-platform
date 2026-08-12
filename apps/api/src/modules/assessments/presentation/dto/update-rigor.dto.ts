// apps/api/src/modules/assessments/presentation/dto/update-rigor.dto.ts
//
// Zod schema for Step 4 of the Assessment Configuration wizard: academic
// rigor via Bloom's Taxonomy and difficulty distribution. Both are simple
// percentage maps that must each sum to exactly 100.

import { z } from 'zod';

// The six levels of Bloom's Taxonomy, from lowest to highest cognitive
// demand. Every level must be present in the submitted distribution
// (even if set to 0), so the frontend always sends a complete map rather
// than a partial one that silently omits levels.
const bloomsLevels = [
  'REMEMBER',
  'UNDERSTAND',
  'APPLY',
  'ANALYZE',
  'EVALUATE',
  'CREATE',
] as const;

const difficultyLevels = ['EASY', 'MEDIUM', 'HARD'] as const;

// A percentage value: whole numbers 0-100 inclusive. Decimals aren't
// needed here — question-count-driven percentage splits work fine as
// integers, and it keeps the UI (e.g. sliders) simpler.
const percentageSchema = z.number().int().min(0).max(100);

const bloomsDistributionSchema = z
  .object({
    REMEMBER: percentageSchema,
    UNDERSTAND: percentageSchema,
    APPLY: percentageSchema,
    ANALYZE: percentageSchema,
    EVALUATE: percentageSchema,
    CREATE: percentageSchema,
  })
  .refine(
    (dist) => bloomsLevels.reduce((sum, level) => sum + dist[level], 0) === 100,
    { message: 'Bloom\'s Taxonomy distribution must sum to exactly 100' },
  );

const difficultyDistributionSchema = z
  .object({
    EASY: percentageSchema,
    MEDIUM: percentageSchema,
    HARD: percentageSchema,
  })
  .refine(
    (dist) =>
      difficultyLevels.reduce((sum, level) => sum + dist[level], 0) === 100,
    { message: 'Difficulty distribution must sum to exactly 100' },
  );

export const updateRigorSchema = z.object({
  bloomsDistribution: bloomsDistributionSchema,
  difficultyDistribution: difficultyDistributionSchema,
});

export type UpdateRigorDto = z.infer<typeof updateRigorSchema>;