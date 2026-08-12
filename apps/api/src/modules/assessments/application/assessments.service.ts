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
