// apps/web/src/features/assessments/schemas/assessment.schema.ts
//
// Shared constants, Zod schemas, and TypeScript types for the Assessment
// Configuration wizard. Mirrors the backend's Prisma enums exactly, and
// follows the same pattern as features/documents/schemas/document.schema.ts:
// plain const arrays for enum-like values, Zod schemas per wizard step,
// and interfaces describing API response shapes.

import { z } from 'zod';

// ── Enum constants (must match backend Prisma enums exactly) ──────────

export const NQF_LEVELS = [
  'LEVEL_5',
  'LEVEL_6',
  'LEVEL_7',
  'LEVEL_8',
  'LEVEL_9',
  'LEVEL_10',
] as const;

export const ASSESSMENT_TYPES = ['TEST', 'EXAM', 'ASSIGNMENT', 'QUIZ'] as const;

export const QUESTION_TYPES = [
  'MCQ',
  'SHORT_ANSWER',
  'ESSAY',
  'TRUE_FALSE',
  'SCENARIO_BASED',
] as const;

// Human-readable labels for question types, since SCENARIO_BASED and
// SHORT_ANSWER read awkwardly if just .replace('_', ' ')'d like the
// document type labels are.
export const QUESTION_TYPE_LABELS: Record<(typeof QUESTION_TYPES)[number], string> = {
  MCQ: 'Multiple Choice',
  SHORT_ANSWER: 'Short Answer',
  ESSAY: 'Essay',
  TRUE_FALSE: 'True/False',
  SCENARIO_BASED: 'Scenario-Based',
};

export const BLOOMS_LEVELS = [
  'REMEMBER',
  'UNDERSTAND',
  'APPLY',
  'ANALYZE',
  'EVALUATE',
  'CREATE',
] as const;

export const DIFFICULTY_LEVELS = ['EASY', 'MEDIUM', 'HARD'] as const;

// ── Step 1: Source Document Selection ──────────────────────────────────

export const createAssessmentSchema = z.object({
  documentIds: z.array(z.string()).min(1, 'Select at least one document'),
});

export type CreateAssessmentFormValues = z.infer<typeof createAssessmentSchema>;

// ── Step 2: Basics + Learning Outcomes ─────────────────────────────────

export const learningOutcomeInputSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  description: z.string().min(1, 'Description is required'),
});

export const updateBasicsSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  moduleName: z.string().min(1, 'Module name is required'),
  nqfLevel: z.enum(NQF_LEVELS),
  assessmentType: z.enum(ASSESSMENT_TYPES),
  totalDurationMinutes: z.number().int().min(1),
  totalMarks: z.number().int().min(1),
  learningOutcomes: z.array(learningOutcomeInputSchema).min(1),
});

export type UpdateBasicsFormValues = z.infer<typeof updateBasicsSchema>;

// ── Step 3: Question Types ─────────────────────────────────────────────

export const questionTypeConfigInputSchema = z.object({
  questionType: z.enum(QUESTION_TYPES),
  questionCount: z.number().int().min(1),
  marksPerQuestion: z.number().int().min(1),
});

export const updateQuestionTypesSchema = z.object({
  questionTypes: z.array(questionTypeConfigInputSchema).min(1),
});

export type UpdateQuestionTypesFormValues = z.infer<typeof updateQuestionTypesSchema>;

// ── Step 4: Rigor (Bloom's + Difficulty) ───────────────────────────────

export const updateRigorSchema = z.object({
  bloomsDistribution: z.object({
    REMEMBER: z.number().int().min(0).max(100),
    UNDERSTAND: z.number().int().min(0).max(100),
    APPLY: z.number().int().min(0).max(100),
    ANALYZE: z.number().int().min(0).max(100),
    EVALUATE: z.number().int().min(0).max(100),
    CREATE: z.number().int().min(0).max(100),
  }),
  difficultyDistribution: z.object({
    EASY: z.number().int().min(0).max(100),
    MEDIUM: z.number().int().min(0).max(100),
    HARD: z.number().int().min(0).max(100),
  }),
});

export type UpdateRigorFormValues = z.infer<typeof updateRigorSchema>;

// ── API response shapes ─────────────────────────────────────────────────

export interface AssessmentRecord {
  id: string;
  ownerId: string;
  title: string | null;
  moduleName: string | null;
  nqfLevel: (typeof NQF_LEVELS)[number] | null;
  assessmentType: (typeof ASSESSMENT_TYPES)[number] | null;
  totalDurationMinutes: number | null;
  totalMarks: number | null;
  bloomsDistribution: Record<string, number> | null;
  difficultyDistribution: Record<string, number> | null;
  status: 'DRAFT' | 'GENERATING' | 'GENERATED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentDocumentLink {
  id: string;
  assessmentId: string;
  documentId: string;
  createdAt: string;
  document: {
    id: string;
    fileName: string;
    documentType: string;
    status: string;
  };
}

export interface QuestionTypeConfigRecord {
  id: string;
  assessmentId: string;
  questionType: (typeof QUESTION_TYPES)[number];
  questionCount: number;
  marksPerQuestion: number;
}

export interface LearningOutcomeRecord {
  id: string;
  assessmentId: string;
  code: string;
  description: string;
  orderIndex: number;
}

// Full assessment with all relations, as returned by GET /assessments/:id
export interface AssessmentDetail extends AssessmentRecord {
  sourceDocuments: AssessmentDocumentLink[];
  questionTypeConfigs: QuestionTypeConfigRecord[];
  learningOutcomes: LearningOutcomeRecord[];
}