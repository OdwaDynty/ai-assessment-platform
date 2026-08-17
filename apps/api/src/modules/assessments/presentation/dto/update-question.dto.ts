// apps/api/src/modules/assessments/presentation/dto/update-question.dto.ts
//
// Zod schema for manually editing a generated question (Phase 9).
// All fields optional since an educator might only want to fix the
// question text, or only the memorandum, without resubmitting everything.

import { z } from 'zod';

export const updateQuestionSchema = z.object({
  questionText: z.string().min(1, 'Question text cannot be empty').optional(),
  memorandum: z.string().min(1, 'Memorandum cannot be empty').optional(),
  marks: z.number().int().min(1, 'Marks must be at least 1').optional(),
  // optionsData intentionally omitted from manual editing for now --
  // editing MCQ options/correct-answer safely needs its own dedicated
  // UI (to avoid ending up with zero or multiple correct answers via
  // free-text JSON editing), out of scope for this first editing slice.
});

export type UpdateQuestionDto = z.infer<typeof updateQuestionSchema>;