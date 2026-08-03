import { z } from 'zod';

export const DOCUMENT_TYPES = [
  'STUDY_GUIDE',
  'TEXTBOOK',
  'MODULE_GUIDE',
  'OTHER',
] as const;

export const uploadDocumentSchema = z.object({
  documentType: z.enum(DOCUMENT_TYPES),
});

export type UploadDocumentFormValues = z.infer<typeof uploadDocumentSchema>;

export interface DocumentRecord {
  id: string;
  ownerId: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  storagePath: string;
  documentType: (typeof DOCUMENT_TYPES)[number];
  status: 'PENDING' | 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';
  createdAt: string;
  updatedAt: string;
}