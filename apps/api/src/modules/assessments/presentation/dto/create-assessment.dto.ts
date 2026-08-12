// apps/api/src/modules/assessments/presentation/dto/create-assessment.dto.ts
//
// Zod schema for Step 1 of the Assessment Configuration wizard: source
// document selection. Creates a new DRAFT assessment linked to one or
// more of the educator's own READY documents.

import { z } from 'zod';

export const createAssessmentSchema = z.object({
  // At least one source document must be selected — an assessment can't
  // be grounded in nothing, since the whole point is RAG-based generation
  // from real uploaded material.
  documentIds: z
    .array(z.string().uuid('Each documentId must be a valid UUID'))
    .min(1, 'At least one source document must be selected'),
});

export type CreateAssessmentDto = z.infer<typeof createAssessmentSchema>;
