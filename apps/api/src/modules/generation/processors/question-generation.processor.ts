// apps/api/src/modules/generation/processors/question-generation.processor.ts
//
// BullMQ worker: consumes one job per question-type batch and delegates
// to QuestionGenerationService. Catches errors so a failed batch marks
// itself FAILED with a message rather than crashing the whole worker or
// leaving the config stuck in GENERATING forever.

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { QuestionGenerationService } from '../application/question-generation.service';
import { PrismaService } from '../../../prisma/prisma.service';
import type { GenerateQuestionsJobData } from '../application/generation.service';

@Processor('question-generation')
export class QuestionGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(QuestionGenerationProcessor.name);

  constructor(
    private readonly questionGenerationService: QuestionGenerationService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<GenerateQuestionsJobData>): Promise<void> {
    this.logger.log(
      `Processing generation job ${job.id} for config ${job.data.questionTypeConfigId}`,
    );

    try {
      await this.questionGenerationService.generateBatch(job.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Generation failed for config ${job.data.questionTypeConfigId}: ${message}`,
      );

      // Mark this specific batch as failed, with the error message, so
      // the educator can see exactly what went wrong and potentially
      // retry just this question type rather than the whole assessment.
      await this.prisma.assessmentQuestionTypeConfig.update({
        where: { id: job.data.questionTypeConfigId },
        data: { generationStatus: 'FAILED', generationError: message },
      });

      // Still need to check whether this was the last batch to finish,
      // so the assessment-level status doesn't get stuck on GENERATING.
      const configs = await this.prisma.assessmentQuestionTypeConfig.findMany({
        where: { assessmentId: job.data.assessmentId },
        select: { generationStatus: true },
      });
      const stillRunning = configs.some(
        (c) => c.generationStatus === 'PENDING' || c.generationStatus === 'GENERATING',
      );
      if (!stillRunning) {
        await this.prisma.assessment.update({
          where: { id: job.data.assessmentId },
          data: { status: 'FAILED' },
        });
      }
    }
  }
}
