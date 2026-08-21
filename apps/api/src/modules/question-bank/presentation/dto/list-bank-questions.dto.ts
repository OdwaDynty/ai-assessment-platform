// apps/api/src/modules/question-bank/presentation/dto/list-bank-questions.dto.ts
//
// Zod schema for filtering the question bank list. All filters
// optional -- an empty query returns everything the user has saved.
// Uses a query-string-friendly shape since this backs a GET request.

import { z } from 'zod';

export const listBankQuestionsSchema = z.object({
  questionType: z
    .enum(['MCQ', 'SHORT_ANSWER', 'ESSAY', 'TRUE_FALSE', 'SCENARIO_BASED'])
    .optional(),
  bloomsLevel: z
    .enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'])
    .optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
});

export type ListBankQuestionsDto = z.infer<typeof listBankQuestionsSchema>;