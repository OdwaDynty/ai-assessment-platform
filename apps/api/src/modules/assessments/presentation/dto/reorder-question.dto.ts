// apps/api/src/modules/assessments/presentation/dto/reorder-question.dto.ts
//
// Phase 10: Zod schema for moving a question up or down one position
// within its assessment's question list.

import { z } from 'zod';

export const reorderQuestionSchema = z.object({
  direction: z.enum(['up', 'down']),
});

export type ReorderQuestionDto = z.infer<typeof reorderQuestionSchema>;
