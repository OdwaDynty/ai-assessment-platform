import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { DocumentProcessingService } from '../application/document-processing.service';

export interface ProcessDocumentJobData {
  documentId: string;
}

@Processor('document-processing')
export class DocumentProcessingProcessor extends WorkerHost {
  private readonly logger = new Logger(DocumentProcessingProcessor.name);

  constructor(private readonly documentProcessingService: DocumentProcessingService) {
    super();
  }

  async process(job: Job<ProcessDocumentJobData>): Promise<void> {
    this.logger.log(`Processing job ${job.id} for document ${job.data.documentId}`);
    await this.documentProcessingService.processDocument(job.data.documentId);
  }
}
