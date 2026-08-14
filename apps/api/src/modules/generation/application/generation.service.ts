// apps/api/src/modules/generation/application/generation.service.ts
//
// Orchestrates the generation trigger: validates the assessment is
// fully configured, resets status fields, and enqueues one BullMQ job
// per question-type batch. The actual AI generation work happens in
// QuestionGenerationProcessor, not here -- this service only handles
// the "kick things off" responsibility.

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';

// Job payload for each question-type batch. The processor looks up
// everything else it needs (assessment details, source documents,
// learning outcomes) from the database using these two IDs.
export interface GenerateQuestionsJobData {
  assessmentId: string;
  questionTypeConfigId: string;
}

@Injectable()
export class GenerationService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('question-generation')
    private readonly generationQueue: Queue<GenerateQuestionsJobData>,
  ) {}

  /**
   * Kicks off generation for an assessment. Validates the assessment is
   * fully configured (all 4 wizard steps completed), then enqueues one
   * job per question-type batch so each type generates independently
   * and can fail/retry without affecting the others.
   */
  async startGeneration(assessmentId: string, userId: string): Promise<void> {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        questionTypeConfigs: true,
        learningOutcomes: true,
        sourceDocuments: true,
      },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }
    if (assessment.ownerId !== userId) {
      throw new ForbiddenException('You do not own this assessment');
    }

    // Validate every wizard step has actually been completed -- generation
    // needs basics (title/marks), at least one source document, at least
    // one learning outcome, at least one question type, and both rigor
    // distributions set. Any gap here would mean the AI has nothing
    // meaningful to work with for that piece.
    const missing: string[] = [];
    if (!assessment.title || !assessment.totalMarks) missing.push('basics (Step 2)');
    if (assessment.sourceDocuments.length === 0) missing.push('source documents (Step 1)');
    if (assessment.learningOutcomes.length === 0) missing.push('learning outcomes (Step 2)');
    if (assessment.questionTypeConfigs.length === 0) missing.push('question types (Step 3)');
    if (!assessment.bloomsDistribution || !assessment.difficultyDistribution) {
      missing.push('rigor distribution (Step 4)');
    }

    if (missing.length > 0) {
      throw new BadRequestException(
        `Assessment is missing required configuration: ${missing.join(', ')}`,
      );
    }

    // Reset state for a fresh generation run (also covers regeneration
    // of a previously FAILED or GENERATED assessment): clear any
    // existing questions, reset every config's status to PENDING, and
    // flip the assessment to GENERATING.
    await this.prisma.$transaction(async (tx) => {
      await tx.question.deleteMany({ where: { assessmentId } });
      await tx.assessmentQuestionTypeConfig.updateMany({
        where: { assessmentId },
        data: { generationStatus: 'PENDING', generationError: null },
      });
      await tx.assessment.update({
        where: { id: assessmentId },
        data: { status: 'GENERATING' },
      });
    });

    // Enqueue one job per question-type config.
    for (const config of assessment.questionTypeConfigs) {
      await this.generationQueue.add('generate-questions', {
        assessmentId,
        questionTypeConfigId: config.id,
      });
    }
  }
}
