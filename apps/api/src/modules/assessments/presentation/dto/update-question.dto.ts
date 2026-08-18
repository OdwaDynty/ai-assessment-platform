// apps/api/src/modules/assessments/presentation/dto/update-question.dto.ts
//
// Zod schema for manually editing a generated question (Phase 9/10).
// All fields optional since an educator might only want to fix one
// piece without resubmitting everything.

import { z } from 'zod';

// A single MCQ option as edited by the educator. isCorrect is a plain
// boolean per option; the schema-level refine below ensures exactly
// one option is marked correct, so we can never end up with zero or
// multiple correct answers from a structured edit.
const mcqOptionSchema = z.object({
  label: z.string().min(1),
  text: z.string().min(1, 'Option text cannot be empty'),
  isCorrect: z.boolean(),
});

const mcqOptionsSchema = z
  .array(mcqOptionSchema)
  .length(4, 'MCQ questions must have exactly 4 options')
  .refine(
    (options) => options.filter((o) => o.isCorrect).length === 1,
    { message: 'Exactly one option must be marked as correct' },
  );

export const updateQuestionSchema = z.object({
  questionText: z.string().min(1, 'Question text cannot be empty').optional(),
  memorandum: z.string().min(1, 'Memorandum cannot be empty').optional(),
  marks: z.number().int().min(1, 'Marks must be at least 1').optional(),
  // Phase 10: MCQ options are now editable via this structured shape
  // (validated to have exactly 4 options and exactly one correct one),
  // rather than accepting arbitrary JSON. True/False and other types
  // don't send this field.
  optionsData: mcqOptionsSchema.optional(),
});

export type UpdateQuestionDto = z.infer<typeof updateQuestionSchema>;
