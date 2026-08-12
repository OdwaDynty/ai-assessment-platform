// apps/api/src/modules/assessments/presentation/dto/update-question-types.dto.ts
//
// Zod schema for Step 3 of the Assessment Configuration wizard: question
// type breakdown. Sent as a single PATCH payload representing the complete
// current state of this step (not incremental updates), same pattern as
// Step 2's learning outcomes.

import { z } from 'zod';

// Matches the QuestionType enum in schema.prisma, including the
// SCENARIO_BASED type for applied-reasoning questions.
const questionTypeEnum = z.enum([
  'MCQ',
  'SHORT_ANSWER',
  'ESSAY',
  'TRUE_FALSE',
  'SCENARIO_BASED',
]);

const questionTypeConfigInputSchema = z.object({
  questionType: questionTypeEnum,
  questionCount: z
    .number()
    .int()
    .min(1, 'Question count must be at least 1'),
  marksPerQuestion: z
    .number()
    .int()
    .min(1, 'Marks per question must be at least 1'),
});

export const updateQuestionTypesSchema = z.object({
  // At least one question type must be configured — an assessment with
  // zero question types has no structure for Phase 8 to generate against.
  // The unique constraint on (assessmentId, questionType) in the schema
  // means the same type can't be submitted twice; we also guard against
  // that here at the validation layer for a clearer error message.
  questionTypes: z
    .array(questionTypeConfigInputSchema)
    .min(1, 'At least one question type must be configured')
    .refine(
      (types) =>
        new Set(types.map((t) => t.questionType)).size === types.length,
      { message: 'Each question type can only be configured once' },
    ),
});

export type UpdateQuestionTypesDto = z.infer<typeof updateQuestionTypesSchema>;