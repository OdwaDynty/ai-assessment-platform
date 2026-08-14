// apps/api/src/modules/generation/application/question-generation.service.ts
//
// Generates one batch of questions (all questions for a single
// AssessmentQuestionTypeConfig) via OpenAI, grounded in retrieved
// source-document chunks from Phase 6's RetrievalService, then persists
// the results as Question rows linked to their targeted learning outcomes.

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../../../prisma/prisma.service';
import { RetrievalService } from '../../knowledge-base/application/retrieval.service';
import { allocateByDistribution } from './blooms-allocation.util';
import {
  buildGenerationPrompt,
  type PerQuestionTarget,
  type RetrievedContextChunk,
} from './prompt-builder.util';
import type { GenerateQuestionsJobData } from './generation.service';
import type { BloomsLevel, DifficultyLevel } from '../../../../generated/prisma/client';

const GENERATION_MODEL = 'gpt-4o';

// Shape we expect back from OpenAI for a single generated question,
// before we've validated/mapped it into our own types.
interface RawGeneratedQuestion {
  questionText: string;
  bloomsLevel: string;
  difficulty: string;
  learningOutcomeCodes: string[];
  optionsData: unknown;
  memorandum: string;
}

@Injectable()
export class QuestionGenerationService {
  private readonly logger = new Logger(QuestionGenerationService.name);
  private readonly openai: OpenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly retrieval: RetrievalService,
    private readonly configService: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async generateBatch(data: GenerateQuestionsJobData): Promise<void> {
    const { assessmentId, questionTypeConfigId } = data;

    await this.prisma.assessmentQuestionTypeConfig.update({
      where: { id: questionTypeConfigId },
      data: { generationStatus: 'GENERATING' },
    });

    // Fetch everything this batch needs: the config itself, the parent
    // assessment (for basics + rigor distributions + owner), its source
    // documents, and its learning outcomes.
    const config = await this.prisma.assessmentQuestionTypeConfig.findUniqueOrThrow({
      where: { id: questionTypeConfigId },
      include: {
        assessment: {
          include: {
            sourceDocuments: { include: { document: true } },
            learningOutcomes: true,
          },
        },
      },
    });

    const assessment = config.assessment;

    // Step 1: Retrieve grounding context. RetrievalService.search() takes
    // a single optional documentId, so for assessments with multiple
    // source documents we call it once per document and merge results,
    // sorted by similarity, keeping the most relevant overall. The query
    // combines all learning outcome descriptions, since that's what the
    // generated questions need to be grounded against.
    const queryText = assessment.learningOutcomes
      .map((lo) => lo.description)
      .join(' ');

    const perDocumentLimit = Math.max(3, config.questionCount);
    const allChunks = await Promise.all(
      assessment.sourceDocuments.map((link) =>
        this.retrieval.search(
          assessment.ownerId,
          queryText,
          perDocumentLimit,
          link.documentId,
        ),
      ),
    );

    const mergedChunks = allChunks
      .flat()
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, Math.max(5, config.questionCount * 2));

    const contextChunks: RetrievedContextChunk[] = mergedChunks.map((chunk) => {
      const sourceDoc = assessment.sourceDocuments.find(
        (link) => link.documentId === chunk.documentId,
      );
      return {
        content: chunk.content,
        documentFileName: sourceDoc?.document.fileName ?? 'Unknown source',
      };
    });

    // Step 2: Allocate Bloom's level and difficulty targets for each
    // individual question in this batch, from the assessment-wide
    // percentage distributions set in Step 4. The two dimensions are
    // independent axes (not a joint distribution), so we allocate each
    // separately then pair by index -- shuffling difficulty first avoids
    // every question ending up with a suspiciously tidy correlation
    // between Bloom's level and difficulty (e.g. all REMEMBER = EASY).
    const bloomsAllocation = allocateByDistribution(
      assessment.bloomsDistribution as Record<string, number>,
      config.questionCount,
    );
    const difficultyAllocation = shuffle(
      allocateByDistribution(
        assessment.difficultyDistribution as Record<string, number>,
        config.questionCount,
      ),
    );

    const perQuestionTargets: PerQuestionTarget[] = bloomsAllocation.map(
      (bloomsLevel, i) => ({
        bloomsLevel,
        difficulty: difficultyAllocation[i],
      }),
    );

    // Step 3: Build the prompt and call OpenAI, requesting structured
    // JSON output for the whole batch in a single call.
    const prompt = buildGenerationPrompt({
      questionType: config.questionType,
      questionCount: config.questionCount,
      marksPerQuestion: config.marksPerQuestion,
      perQuestionTargets,
      learningOutcomes: assessment.learningOutcomes.map((lo) => ({
        code: lo.code,
        description: lo.description,
      })),
      contextChunks,
      moduleName: assessment.moduleName ?? 'Unknown module',
      nqfLevel: assessment.nqfLevel ?? 'LEVEL_7',
    });

    this.logger.log(
      `Calling OpenAI for ${config.questionCount} ${config.questionType} question(s), config ${questionTypeConfigId}`,
    );

    const completion = await this.openai.chat.completions.create({
      model: GENERATION_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      throw new Error('OpenAI returned an empty response');
    }

    // Step 4: Parse and validate the response shape before persisting
    // anything -- a malformed response should fail this batch cleanly
    // rather than partially writing garbage to the database.
    let parsed: { questions: RawGeneratedQuestion[] };
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      throw new Error('OpenAI response was not valid JSON');
    }

    if (!Array.isArray(parsed.questions) || parsed.questions.length !== config.questionCount) {
      throw new Error(
        `Expected ${config.questionCount} questions, got ${parsed.questions?.length ?? 0}`,
      );
    }

    const validBloomsLevels = new Set([
      'REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE',
    ]);
    const validDifficultyLevels = new Set(['EASY', 'MEDIUM', 'HARD']);
    const validOutcomeCodes = new Set(assessment.learningOutcomes.map((lo) => lo.code));

    for (const q of parsed.questions) {
      if (!q.questionText || typeof q.questionText !== 'string') {
        throw new Error('A generated question is missing questionText');
      }
      if (!validBloomsLevels.has(q.bloomsLevel)) {
        throw new Error(`Invalid bloomsLevel in generated question: ${q.bloomsLevel}`);
      }
      if (!validDifficultyLevels.has(q.difficulty)) {
        throw new Error(`Invalid difficulty in generated question: ${q.difficulty}`);
      }
      if (
        !Array.isArray(q.learningOutcomeCodes) ||
        q.learningOutcomeCodes.length === 0 ||
        !q.learningOutcomeCodes.every((code) => validOutcomeCodes.has(code))
      ) {
        throw new Error(
          `A generated question has invalid learningOutcomeCodes: ${JSON.stringify(q.learningOutcomeCodes)}`,
        );
      }
      if (!q.memorandum || typeof q.memorandum !== 'string') {
        throw new Error('A generated question is missing a memorandum');
      }
    }

    // Step 5: Persist. Map learning outcome codes back to their real
    // database IDs, then create each Question plus its
    // QuestionLearningOutcome links in a single transaction.
    const outcomeCodeToId = new Map(
      assessment.learningOutcomes.map((lo) => [lo.code, lo.id]),
    );

    await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < parsed.questions.length; i++) {
        const q = parsed.questions[i];
        const question = await tx.question.create({
          data: {
            assessmentId,
            questionTypeConfigId,
            questionText: q.questionText,
            marks: config.marksPerQuestion,
            bloomsLevel: q.bloomsLevel as BloomsLevel,
            difficulty: q.difficulty as DifficultyLevel,
            optionsData: q.optionsData ?? undefined,
            memorandum: q.memorandum,
            orderIndex: i,
          },
        });

        await tx.questionLearningOutcome.createMany({
          data: q.learningOutcomeCodes.map((code) => ({
            questionId: question.id,
            learningOutcomeId: outcomeCodeToId.get(code)!,
          })),
        });
      }
    });

    await this.prisma.assessmentQuestionTypeConfig.update({
      where: { id: questionTypeConfigId },
      data: { generationStatus: 'GENERATED' },
    });

    this.logger.log(
      `Successfully generated ${parsed.questions.length} question(s) for config ${questionTypeConfigId}`,
    );

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

// Simple Fisher-Yates shuffle, used to decorrelate the Bloom's and
// difficulty allocations so pairing them by index doesn't produce an
// artificial pattern (e.g. always pairing the first N Bloom's entries
// with the first N difficulty entries in the same original order).
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
