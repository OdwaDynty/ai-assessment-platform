// apps/api/src/modules/assessments/application/assessments.service.ts
//
// Handles all Assessment lifecycle operations for the configuration wizard:
// creating drafts, updating each wizard step, and fetching for review.
// This file currently implements Step 1 only (create draft + link source
// documents) — later steps (basics, question types, rigor, learning
// outcomes) will be added as additional methods as we build out the wizard.

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { Assessment } from '../../../../generated/prisma/client';
import type { CreateAssessmentDto } from '../presentation/dto/create-assessment.dto';
import type { UpdateBasicsDto } from '../presentation/dto/update-basics.dto';
import type { UpdateQuestionTypesDto } from '../presentation/dto/update-question-types.dto';
import type { UpdateRigorDto } from '../presentation/dto/update-rigor.dto';
import type { UpdateQuestionDto } from '../presentation/dto/update-question.dto';
import type { Question } from '../../../../generated/prisma/client';
import type { ReorderQuestionDto } from '../presentation/dto/reorder-question.dto';

@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Step 1: Creates a new DRAFT assessment and links it to the selected
   * source documents. Every document ID must belong to the requesting
   * user — otherwise a user could attach someone else's document to
   * their own assessment, which would be a data-isolation violation.
   */
  async createDraft(
    ownerId: string,
    dto: CreateAssessmentDto,
  ): Promise<Assessment> {
    // Verify every requested document actually exists AND belongs to
    // this user. We fetch all matching owned documents in one query,
    // then compare counts — if any requested ID is missing from the
    // result, either it doesn't exist or it belongs to someone else.
    const ownedDocuments = await this.prisma.document.findMany({
      where: {
        id: { in: dto.documentIds },
        ownerId,
      },
      select: { id: true },
    });

    if (ownedDocuments.length !== dto.documentIds.length) {
      throw new ForbiddenException(
        'One or more selected documents were not found or are not owned by you',
      );
    }

    // Create the draft Assessment and its AssessmentDocument links in a
    // single transaction, so we never end up with a half-created draft
    // (e.g. the Assessment row exists but document links failed).
    const assessment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.assessment.create({
        data: {
          ownerId,
          status: 'DRAFT',
        },
      });

      await tx.assessmentDocument.createMany({
        data: dto.documentIds.map((documentId) => ({
          assessmentId: created.id,
          documentId,
        })),
      });

      return created;
    });

    return assessment;
  }

  /**
   * Step 2: Updates an assessment's basics (title, module, NQF level,
   * type, duration, marks) and replaces its full set of learning outcomes.
   *
   * Learning outcomes are fully replaced (delete + recreate) rather than
   * incrementally patched, since this PATCH represents "here is the
   * complete current state of Step 2" — this keeps the wizard simple to
   * revisit/edit without needing separate add/remove/reorder endpoints,
   * and avoids ever ending up with stale outcome rows from a previous edit.
   */
  async updateBasics(
    assessmentId: string,
    userId: string,
    dto: UpdateBasicsDto,
  ): Promise<Assessment> {
    // Ownership check — reuses the same fetch-then-compare pattern as
    // findOneForUser, but we only need the ownerId here, not the full
    // relations, so we query directly rather than calling that method.
    const existing = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { ownerId: true },
    });

    if (!existing) {
      throw new NotFoundException('Assessment not found');
    }
    if (existing.ownerId !== userId) {
      throw new ForbiddenException('You do not own this assessment');
    }

    // Update basics and replace learning outcomes in a single transaction,
    // so we never end up with the basics saved but outcomes only half
    // replaced (or vice versa) if something fails partway through.
    const updated = await this.prisma.$transaction(async (tx) => {
      const assessment = await tx.assessment.update({
        where: { id: assessmentId },
        data: {
          title: dto.title,
          moduleName: dto.moduleName,
          nqfLevel: dto.nqfLevel,
          assessmentType: dto.assessmentType,
          totalDurationMinutes: dto.totalDurationMinutes,
          totalMarks: dto.totalMarks,
        },
      });

      // Delete all existing learning outcomes for this assessment, then
      // recreate them from the submitted array. orderIndex is derived
      // from array position, so the frontend never needs to manage it.
      await tx.learningOutcome.deleteMany({
        where: { assessmentId },
      });

      await tx.learningOutcome.createMany({
        data: dto.learningOutcomes.map((outcome, index) => ({
          assessmentId,
          code: outcome.code,
          description: outcome.description,
          orderIndex: index,
        })),
      });

      return assessment;
    });

    return updated;
  }

/**
   * Step 3: Replaces the assessment's full set of question type
   * configurations (which types, how many of each, marks per question).
   *
   * Like updateBasics' learning outcomes handling, this is a full
   * delete + recreate based on the submitted array, since the PATCH
   * represents the complete current state of Step 3.
   *
   * Also computes a soft warning (not a hard error) if the configured
   * marks don't add up to the assessment's totalMarks from Step 2 — the
   * educator may still be iterating, so we inform rather than block.
   */
  async updateQuestionTypes(
    assessmentId: string,
    userId: string,
    dto: UpdateQuestionTypesDto,
  ): Promise<{ assessment: Assessment; marksWarning: string | null }> {
    const existing = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { ownerId: true, totalMarks: true },
    });

    if (!existing) {
      throw new NotFoundException('Assessment not found');
    }
    if (existing.ownerId !== userId) {
      throw new ForbiddenException('You do not own this assessment');
    }

    const assessment = await this.prisma.$transaction(async (tx) => {
      await tx.assessmentQuestionTypeConfig.deleteMany({
        where: { assessmentId },
      });

      await tx.assessmentQuestionTypeConfig.createMany({
        data: dto.questionTypes.map((qt) => ({
          assessmentId,
          questionType: qt.questionType,
          questionCount: qt.questionCount,
          marksPerQuestion: qt.marksPerQuestion,
        })),
      });

      return tx.assessment.findUniqueOrThrow({ where: { id: assessmentId } });
    });

    // Soft validation: check whether configured marks reconcile with
    // totalMarks set back in Step 2. Only meaningful if totalMarks was
    // actually set (it's nullable until Step 2 is completed).
    let marksWarning: string | null = null;
    if (existing.totalMarks !== null) {
      const configuredMarks = dto.questionTypes.reduce(
        (sum, qt) => sum + qt.questionCount * qt.marksPerQuestion,
        0,
      );
      if (configuredMarks !== existing.totalMarks) {
        marksWarning = `Configured question marks (${configuredMarks}) do not match the assessment's total marks (${existing.totalMarks}).`;
      }
    }

    return { assessment, marksWarning };
  }

  /**
   * Step 4: Updates the assessment's academic rigor targets — Bloom's
   * Taxonomy distribution and difficulty distribution. Both are stored
   * as JSONB percentage maps (validated to sum to 100 at the DTO layer),
   * since they're always read/written as a complete unit.
   *
   * Unlike Step 3's question types, there's nothing to delete/recreate
   * here — these are simple scalar Json fields on the Assessment row
   * itself, so this is a straightforward update.
   */
  async updateRigor(
    assessmentId: string,
    userId: string,
    dto: UpdateRigorDto,
  ): Promise<Assessment> {
    const existing = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { ownerId: true },
    });

    if (!existing) {
      throw new NotFoundException('Assessment not found');
    }
    if (existing.ownerId !== userId) {
      throw new ForbiddenException('You do not own this assessment');
    }

    return this.prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        bloomsDistribution: dto.bloomsDistribution,
        difficultyDistribution: dto.difficultyDistribution,
      },
    });
  }

  /**
   * Phase 9: manually edits a single generated question's text, marks,
   * and/or memorandum. Ownership is checked via the question's parent
   * assessment, since Question doesn't store ownerId directly.
   */
  async updateQuestion(
    questionId: string,
    userId: string,
    dto: UpdateQuestionDto,
  ): Promise<Question> {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: { assessment: { select: { ownerId: true } } },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }
    if (question.assessment.ownerId !== userId) {
      throw new ForbiddenException('You do not own this question');
    }

    return this.prisma.question.update({
      where: { id: questionId },
      data: {
        ...(dto.questionText !== undefined && { questionText: dto.questionText }),
        ...(dto.memorandum !== undefined && { memorandum: dto.memorandum }),
        ...(dto.marks !== undefined && { marks: dto.marks }),
      },
    });
  }

  /**
   * Phase 10: deletes a single generated question. Ownership checked
   * via the question's parent assessment, same pattern as updateQuestion.
   */
  async deleteQuestion(questionId: string, userId: string): Promise<void> {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: { assessment: { select: { ownerId: true } } },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }
    if (question.assessment.ownerId !== userId) {
      throw new ForbiddenException('You do not own this question');
    }

    await this.prisma.question.delete({ where: { id: questionId } });
  }

  /**
   * Phase 10: moves a question up or down one position within its
   * assessment's question list, by swapping orderIndex with the
   * adjacent question in that direction. No-op (returns silently) if
   * the question is already at the top/bottom, since there's nothing
   * to swap with.
   */
  async reorderQuestion(
    questionId: string,
    userId: string,
    dto: ReorderQuestionDto,
  ): Promise<void> {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: { assessment: { select: { ownerId: true } } },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }
    if (question.assessment.ownerId !== userId) {
      throw new ForbiddenException('You do not own this question');
    }

    // Find the adjacent question in the requested direction, scoped to
    // the same assessment. "up" means the question with the next-lower
    // orderIndex; "down" means the next-higher one.
    const neighbor = await this.prisma.question.findFirst({
      where: {
        assessmentId: question.assessmentId,
        orderIndex:
          dto.direction === 'up'
            ? { lt: question.orderIndex }
            : { gt: question.orderIndex },
      },
      orderBy: {
        orderIndex: dto.direction === 'up' ? 'desc' : 'asc',
      },
    });

    // Already at the top/bottom -- nothing to swap with, so this is a
    // silent no-op rather than an error (the UI just won't move it).
    if (!neighbor) return;

    // Swap orderIndex values in a transaction so we never end up with
    // two questions sharing the same orderIndex if something fails
    // partway through.
    await this.prisma.$transaction([
      this.prisma.question.update({
        where: { id: question.id },
        data: { orderIndex: neighbor.orderIndex },
      }),
      this.prisma.question.update({
        where: { id: neighbor.id },
        data: { orderIndex: question.orderIndex },
      }),
    ]);
  }

  /**
   * Fetches a single assessment the user owns, including its linked
   * source documents, question type configs, and learning outcomes.
   * Used by the wizard's later steps and the final review screen.
   */
  async findOneForUser(id: string, userId: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
      include: {
        sourceDocuments: { include: { document: true } },
        questionTypeConfigs: true,
        learningOutcomes: { orderBy: { orderIndex: 'asc' } },
        // Phase 8: include generated questions (once they exist) along
        // with which learning outcome(s) each one targets, so the
        // review screen can display everything without a separate call.
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            learningOutcomeLinks: {
              include: { learningOutcome: true },
            },
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }
    if (assessment.ownerId !== userId) {
      throw new ForbiddenException('You do not own this assessment');
    }

    return assessment;
  }

  /**
   * Lists all assessments (drafts and otherwise) belonging to the user,
   * most recent first. Useful for a "My Assessments" / resume-draft screen.
   */
  async findAllForUser(userId: string): Promise<Assessment[]> {
    return this.prisma.assessment.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
