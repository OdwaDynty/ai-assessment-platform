// apps/api/src/modules/question-bank/presentation/dto/save-to-bank.dto.ts
//
// Zod schema for saving an existing assessment question into the
// educator's personal question bank. Takes the source question's ID
// only -- all content is copied server-side, since BankQuestion is a
// standalone copy (Option A), not a live reference.

import { z } from 'zod';

export const saveToBankSchema = z.object({
  questionId: z.string().uuid('questionId must be a valid UUID'),
});

export type SaveToBankDto = z.infer<typeof saveToBankSchema>;