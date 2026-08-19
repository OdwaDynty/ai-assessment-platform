// apps/api/src/modules/export/application/memorandum-builder.service.ts
//
// Builds a Word (.docx) memorandum / marking guide document from an
// assessment's generated content. Moderator-facing: shows every
// question alongside its correct answer and full marking guide, so
// this must never be distributed to students -- clearly labeled as
// such on the cover page.

import { Injectable } from '@nestjs/common';
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
} from 'docx';
import type {
  Assessment,
  Question,
} from '../../../../generated/prisma/client';

type AssessmentWithQuestions = Assessment & {
  questions: Question[];
};

@Injectable()
export class MemorandumBuilderService {
  build(assessment: AssessmentWithQuestions): Document {
    const sortedQuestions = [...assessment.questions].sort(
      (a, b) => a.orderIndex - b.orderIndex,
    );

    return new Document({
      sections: [
        {
          properties: {
            page: {
              size: { width: 12240, height: 15840 },
            },
          },
          children: [
            ...this.buildCoverPage(assessment),
            new Paragraph({ children: [new PageBreak()] }),
            ...this.buildMemoQuestions(sortedQuestions),
          ],
        },
      ],
    });
  }

  private buildCoverPage(assessment: AssessmentWithQuestions): Paragraph[] {
    return [
      new Paragraph({
        text: 'MEMORANDUM — FOR MODERATOR USE ONLY',
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        text: assessment.title ?? 'Untitled Assessment',
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        text: assessment.moduleName ?? '',
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'NQF Level: ', bold: true }),
          new TextRun(assessment.nqfLevel?.replace('_', ' ') ?? ''),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Assessment Type: ', bold: true }),
          new TextRun(assessment.assessmentType ?? ''),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Total Marks: ', bold: true }),
          new TextRun(`${assessment.totalMarks ?? 0}`),
        ],
      }),
    ];
  }

  private buildMemoQuestions(questions: Question[]): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    questions.forEach((question, index) => {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Question ${index + 1}`, bold: true }),
            new TextRun({ text: `  [${question.marks} marks]`, italics: true }),
          ],
          spacing: { before: 300, after: 100 },
        }),
        new Paragraph({
          text: question.questionText,
          spacing: { after: 150 },
        }),
      );

      // MCQ: show all options, with the correct one clearly marked.
      if (Array.isArray(question.optionsData)) {
        const options = question.optionsData as Array<{
          label: string;
          text: string;
          isCorrect: boolean;
        }>;
        options.forEach((option) => {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun(`${option.label}. ${option.text}`),
                ...(option.isCorrect
                  ? [new TextRun({ text: '  ✓ CORRECT', bold: true })]
                  : []),
              ],
              indent: { left: 400 },
            }),
          );
        });
      }

      // True/False: show the correct answer explicitly.
      if (
        !Array.isArray(question.optionsData) &&
        question.optionsData &&
        typeof question.optionsData === 'object' &&
        'correctAnswer' in question.optionsData
      ) {
        const correctAnswer = (question.optionsData as { correctAnswer: boolean })
          .correctAnswer;
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Correct answer: ', bold: true }),
              new TextRun(correctAnswer ? 'True' : 'False'),
            ],
            spacing: { after: 100 },
          }),
        );
      }

      // Every question gets its memorandum/marking guide, regardless
      // of type -- this is the whole point of this document.
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: 'Marking Guide:', bold: true, italics: true })],
          spacing: { before: 100 },
        }),
        new Paragraph({
          text: question.memorandum,
          spacing: { after: 300 },
        }),
      );
    });

    return paragraphs;
  }
}