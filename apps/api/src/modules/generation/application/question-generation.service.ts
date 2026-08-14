// apps/api/src/modules/generation/application/question-generation.service.ts
//
// STUB for slice 1: verifies the queueing/status-tracking pipeline works
// end-to-end before we add the real OpenAI generation logic. This will
// be replaced with actual retrieval + prompt + AI call + parsing in the
// next slice.

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { GenerateQuestionsJobData } from './generation.service';

@Injectable()
export class QuestionGenerationService {
  private readonly logger = new Logger(QuestionGenerationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateBatch(data: GenerateQuestionsJobData): Promise<void> {
    const { assessmentId, questionTypeConfigId } = data;

    await this.prisma.assessmentQuestionTypeConfig.update({
      where: { id: questionTypeConfigId },
      data: { generationStatus: 'GENERATING' },
    });

    this.logger.log(
      `[STUB] Would generate questions for config ${questionTypeConfigId} on assessment ${assessmentId}`,
    );

    // TODO next slice: retrieval + prompt + OpenAI call + parse + persist
    // real Question rows here, replacing this stub.

    await this.prisma.assessmentQuestionTypeConfig.update({
      where: { id: questionTypeConfigId },
      data: { generationStatus: 'GENERATED' },
    });

    await this.checkAndFinalizeAssessmentStatus(assessmentId);
  }

  /**
   * After each batch completes (success or failure), checks whether ALL
   * of the assessment's question-type batches are done, and if so,
   * rolls that up into the assessment's overall status: GENERATED if
   * every batch succeeded, FAILED if any batch ultimately failed.
   */
  private async checkAndFinalizeAssessmentStatus(assessmentId: string): Promise<void> {
    const configs = await this.prisma.assessmentQuestionTypeConfig.findMany({
      where: { assessmentId },
      select: { generationStatus: true },
    });

    const stillRunning = configs.some(
      (c) => c.generationStatus === 'PENDING' || c.generationStatus === 'GENERATING',
    );
    if (stillRunning) return;

    const anyFailed = configs.some((c) => c.generationStatus === 'FAILED');
    await this.prisma.assessment.update({
      where: { id: assessmentId },
      data: { status: anyFailed ? 'FAILED' : 'GENERATED' },
    });
  }
}
