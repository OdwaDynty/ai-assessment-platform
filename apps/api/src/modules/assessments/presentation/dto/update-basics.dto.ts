// apps/api/src/modules/assessments/presentation/dto/update-basics.dto.ts
//
// Zod schema for Step 2 of the Assessment Configuration wizard: Assessment
// Basics + Learning Outcomes. Sent as a single PATCH payload representing
// the complete current state of this step (not incremental updates).

import { z } from 'zod';

// The six SA higher-ed NQF levels this platform targets, matching the
// NqfLevel enum in schema.prisma.
const nqfLevelEnum = z.enum([
  'LEVEL_5',
  'LEVEL_6',
  'LEVEL_7',
  'LEVEL_8',
  'LEVEL_9',
  'LEVEL_10',
]);

// Matches the AssessmentType enum in schema.prisma.
const assessmentTypeEnum = z.enum(['TEST', 'EXAM', 'ASSIGNMENT', 'QUIZ']);

// A single learning outcome entry as submitted by the educator. `code` is
// a short human-readable label (e.g. "LO1") the educator assigns; order in
// the array determines orderIndex, so no explicit index field is needed here.
const learningOutcomeInputSchema = z.object({
  code: z.string().min(1, 'Learning outcome code cannot be empty').max(20),
  description: z
    .string()
    .min(1, 'Learning outcome description cannot be empty')
    .max(1000),
});

export const updateBasicsSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(200),
  moduleName: z.string().min(1, 'Module name cannot be empty').max(200),
  nqfLevel: nqfLevelEnum,
  assessmentType: assessmentTypeEnum,
  totalDurationMinutes: z
    .number()
    .int()
    .min(1, 'Duration must be at least 1 minute'),
  totalMarks: z.number().int().min(1, 'Total marks must be at least 1'),

  // At least one learning outcome is required — an assessment without any
  // stated outcomes has nothing for questions to be constructively aligned
  // against, which undermines the platform's academic-rigor value prop.
  learningOutcomes: z
    .array(learningOutcomeInputSchema)
    .min(1, 'At least one learning outcome is required'),
});

export type UpdateBasicsDto = z.infer<typeof updateBasicsSchema>;