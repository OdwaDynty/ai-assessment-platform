import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DocumentProcessingService } from './application/document-processing.service';
import { ChunkingService } from './application/chunking.service';
import { EmbeddingService } from './application/embedding.service';
import { DocProcessorClientService } from './infrastructure/doc-processor-client.service';
import { DocumentProcessingProcessor } from './processors/document-processing.processor';
import { SupabaseStorageService } from '../documents/infrastructure/supabase-storage.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'document-processing',
    }),
  ],
  providers: [
    DocumentProcessingService,
    ChunkingService,
    EmbeddingService,
    DocProcessorClientService,
    DocumentProcessingProcessor,
    SupabaseStorageService,
  ],
  exports: [BullModule],
})
export class KnowledgeBaseModule {}
