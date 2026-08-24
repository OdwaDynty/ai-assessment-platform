// apps/web/src/features/question-bank/schemas/bank-question.schema.ts
//
// Types for the Question Bank feature, mirroring the backend's
// BankQuestion shape and filter options.

export interface BankQuestionRecord {
  id: string;
  ownerId: string;
  questionText: string;
  marks: number;
  questionType: 'MCQ' | 'SHORT_ANSWER' | 'ESSAY' | 'TRUE_FALSE' | 'SCENARIO_BASED';
  bloomsLevel: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  optionsData: unknown;
  memorandum: string;
  source: 'SAVED_FROM_ASSESSMENT' | 'MANUALLY_CREATED';
  sourceAssessmentTitle: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BankQuestionFilters {
  questionType?: string;
  bloomsLevel?: string;
  difficulty?: string;
}