// apps/api/src/modules/institutions/presentation/dto/create-institution.dto.ts

import { z } from 'zod';

export const createInstitutionSchema = z.object({
  name: z.string().min(1, 'Institution name is required'),
  domain: z.string().min(1).optional(),
});

export type CreateInstitutionDto = z.infer<typeof createInstitutionSchema>;