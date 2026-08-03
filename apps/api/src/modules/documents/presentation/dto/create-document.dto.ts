import { z } from 'zod';

export const createDocumentSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.literal('application/pdf'),
  fileSizeBytes: z
    .number()
    .int()
    .positive()
    .max(50 * 1024 * 1024, 'File exceeds 50MB limit'),
  documentType: z.enum(['STUDY_GUIDE', 'TEXTBOOK', 'MODULE_GUIDE', 'OTHER']),
});

export type CreateDocumentDto = z.infer<typeof createDocumentSchema>;
