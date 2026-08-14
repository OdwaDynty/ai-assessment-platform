// apps/api/src/modules/generation/application/prompt-builder.util.ts
//
// Constructs the prompt sent to OpenAI for generating a batch of
// questions of a single type. Keeps prompt construction separate from
// the service that calls the API, so the prompt itself is easy to
// read, review, and tune independently of the surrounding orchestration.

import type { QuestionType } from '../../../../generated/prisma/client';

export interface RetrievedContextChunk {
  content: string;
  documentFileName: string;
}

export interface LearningOutcomeContext {
  code: string;
  description: string;
}

export interface PerQuestionTarget {
  bloomsLevel: string;
  difficulty: string;
}

// Per-type formatting instructions -- tells the model exactly what
// structure to produce for optionsData, since this genuinely differs
// by question type (MCQ needs 4 labeled options with one correct;
// true/false needs a single boolean; the rest need no options at all).
const TYPE_INSTRUCTIONS: Record<QuestionType, string> = {
  MCQ: `This is a Multiple Choice Question. Provide exactly 4 options labeled A-D in "optionsData" as an array of objects: [{"label": "A", "text": "...", "isCorrect": true}, ...]. Exactly one option must have isCorrect: true. Only one option should be clearly correct -- avoid ambiguous distractors.`,
  TRUE_FALSE: `This is a True/False question. Set "optionsData" to {"correctAnswer": true} or {"correctAnswer": false}. The question statement itself goes in "questionText".`,
  SHORT_ANSWER: `This is a Short Answer question, expecting a brief written response (a few sentences). Set "optionsData" to null.`,
  ESSAY: `This is an Essay question, expecting an extended written response. Set "optionsData" to null.`,
  SCENARIO_BASED: `This is a Scenario-Based question. Construct a realistic, specific scenario grounded in the source material provided below, then pose a question requiring the student to apply, analyze, or evaluate concepts within that scenario. Set "optionsData" to null.`,
};

export function buildGenerationPrompt(params: {
  questionType: QuestionType;
  questionCount: number;
  marksPerQuestion: number;
  perQuestionTargets: PerQuestionTarget[];
  learningOutcomes: LearningOutcomeContext[];
  contextChunks: RetrievedContextChunk[];
  moduleName: string;
  nqfLevel: string;
}): string {
  const {
    questionType,
    questionCount,
    marksPerQuestion,
    perQuestionTargets,
    learningOutcomes,
    contextChunks,
    moduleName,
    nqfLevel,
  } = params;

  const contextSection = contextChunks
    .map(
      (chunk, i) =>
        `[Source ${i + 1}: ${chunk.documentFileName}]\n${chunk.content}`,
    )
    .join('\n\n');

  const outcomesSection = learningOutcomes
    .map((lo) => `${lo.code}: ${lo.description}`)
    .join('\n');

  const targetsSection = perQuestionTargets
    .map(
      (target, i) =>
        `Question ${i + 1}: Bloom's level = ${target.bloomsLevel}, Difficulty = ${target.difficulty}`,
    )
    .join('\n');

  return `You are an expert academic assessment writer creating questions for a South African higher-education module: "${moduleName}" (NQF Level ${nqfLevel.replace('_', ' ')}).

Your questions MUST be grounded in the source material provided below -- do not invent facts or concepts that aren't supported by this material.

SOURCE MATERIAL:
${contextSection}

LEARNING OUTCOMES this assessment targets:
${outcomesSection}

TASK: Generate exactly ${questionCount} ${questionType.replace('_', ' ')} question(s), each worth ${marksPerQuestion} marks.

${TYPE_INSTRUCTIONS[questionType]}

Each question must target ONE OR MORE of the learning outcomes listed above, and must be tagged with the specific Bloom's Taxonomy level and difficulty listed below for its position -- these targets are fixed and must be followed exactly:

${targetsSection}

For each question, also write a "memorandum": a clear, complete marking guide or model answer that a moderator could use to mark student responses fairly. For MCQ/True-False, briefly justify why the correct answer is correct. For Short Answer/Essay/Scenario-Based, provide a model answer or marking rubric with key points expected.

Respond with ONLY a JSON object in this exact shape, no other text:
{
  "questions": [
    {
      "questionText": "...",
      "bloomsLevel": "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE",
      "difficulty": "EASY" | "MEDIUM" | "HARD",
      "learningOutcomeCodes": ["LO1"],
      "optionsData": null or as specified above for this question type,
      "memorandum": "..."
    }
  ]
}

The "questions" array must contain exactly ${questionCount} items, in the same order as the target list above.`;
}
