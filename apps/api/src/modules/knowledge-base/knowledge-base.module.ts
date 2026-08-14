// apps/api/src/modules/knowledge-base/knowledge-base.module.ts
//
// Adds the new presentation layer (controller) and RetrievalService to the module.
// Everything else (BullMQ queue registration, existing providers) stays unchanged.

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DocumentProcessingService } from './application/document-processing.service';
import { ChunkingService } from './application/chunking.service';
import { EmbeddingService } from './application/embedding.service';
import { RetrievalService } from './application/retrieval.service'; // NEW
import { DocProcessorClientService } from './infrastructure/doc-processor-client.service';
import { DocumentProcessingProcessor } from './processors/document-processing.processor';
import { KnowledgeBaseController } from './presentation/knowledge-base.controller'; // NEW
import { SupabaseStorageService } from '../documents/infrastructure/supabase-storage.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'document-processing',
    }),
  ],
  controllers: [KnowledgeBaseController], // NEW — registers the /knowledge-base/search route
  providers: [
    DocumentProcessingService,
    ChunkingService,
    EmbeddingService,
    RetrievalService, // NEW
    DocProcessorClientService,
    DocumentProcessingProcessor,
    SupabaseStorageService,
  ],
  // RetrievalService is exported so other modules (e.g. GenerationModule
  // in Phase 8) can reuse Phase 6's semantic search without duplicating it.
  exports: [BullModule, RetrievalService],
})
export class KnowledgeBaseModule {}