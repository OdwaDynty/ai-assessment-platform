// apps/api/src/modules/question-bank/application/question-bank.service.ts
//
// Handles saving assessment questions into the bank and listing/filtering
// a user's saved bank questions.

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { BankQuestion } from '../../../../generated/prisma/client';
import type { SaveToBankDto } from '../presentation/dto/save-to-bank.dto';
import type { ListBankQuestionsDto } from '../presentation/dto/list-bank-questions.dto';

@Injectable()
export class QuestionBankService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Copies an existing assessment question into the user's question
   * bank as a standalone BankQuestion row. Ownership of the SOURCE
   * question is checked via its parent assessment, same pattern used
   * throughout AssessmentsService -- a user can only save questions
   * from assessments they own.
   */
   async saveFromAssessmentQuestion(
    userId: string,
    dto: SaveToBankDto,
  ): Promise<BankQuestion> {
    const question = await this.prisma.question.findUnique({
      where: { id: dto.questionId },
      include: {
        assessment: { select: { ownerId: true, title: true } },
        questionTypeConfig: { select: { questionType: true } },
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }
    if (question.assessment.ownerId !== userId) {
      throw new ForbiddenException('You do not own this question');
    }

    return this.prisma.bankQuestion.create({
      data: {
        ownerId: userId,
        questionText: question.questionText,
        marks: question.marks,
        questionType: question.questionTypeConfig.questionType,
        bloomsLevel: question.bloomsLevel,
        difficulty: question.difficulty,
        optionsData: question.optionsData ?? undefined,
        memorandum: question.memorandum,
        source: 'SAVED_FROM_ASSESSMENT',
        sourceAssessmentTitle: question.assessment.title,
      },
    });
  }

  /**
   * Lists the user's bank questions, optionally filtered by question
   * type, Bloom's level, and/or difficulty. Most recently saved first.
   */
  async findAllForUser(
    userId: string,
    filters: ListBankQuestionsDto,
  ): Promise<BankQuestion[]> {
    return this.prisma.bankQuestion.findMany({
      where: {
        ownerId: userId,
        ...(filters.questionType && { questionType: filters.questionType }),
        ...(filters.bloomsLevel && { bloomsLevel: filters.bloomsLevel }),
        ...(filters.difficulty && { difficulty: filters.difficulty }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Deletes a single bank question. Ownership checked directly, since
   * BankQuestion stores ownerId itself (unlike Question, which only
   * has ownership via its parent assessment).
   */
  async deleteBankQuestion(bankQuestionId: string, userId: string): Promise<void> {
    const bankQuestion = await this.prisma.bankQuestion.findUnique({
      where: { id: bankQuestionId },
    });

    if (!bankQuestion) {
      throw new NotFoundException('Bank question not found');
    }
    if (bankQuestion.ownerId !== userId) {
      throw new ForbiddenException('You do not own this bank question');
    }

    await this.prisma.bankQuestion.delete({ where: { id: bankQuestionId } });
  }
}