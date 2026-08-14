// apps/api/src/modules/generation/generation.module.ts
//
// Registers the Generation feature module: the endpoint that kicks off
// AI question generation, the BullMQ queue/processor that does the
// actual work per question-type batch, and the services in between.
// Imports KnowledgeBaseModule to reuse RetrievalService (Phase 6) for
// grounding generated questions in the assessment's source documents.

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { GenerationController } from './presentation/generation.controller';
import { GenerationService } from './application/generation.service';
import { QuestionGenerationService } from './application/question-generation.service';
import { QuestionGenerationProcessor } from './processors/question-generation.processor';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'question-generation',
    }),
    KnowledgeBaseModule,
  ],
  controllers: [GenerationController],
  providers: [GenerationService, QuestionGenerationService, QuestionGenerationProcessor],
})
export class GenerationModule {}