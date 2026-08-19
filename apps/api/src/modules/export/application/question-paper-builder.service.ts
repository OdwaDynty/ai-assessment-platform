// apps/api/src/modules/export/application/question-paper-builder.service.ts
//
// Builds a Word (.docx) question paper document from an assessment's
// fully-configured, generated content. Student-facing: shows questions,
// marks, and MCQ options, but never reveals correct answers or memoranda.
// Uses the docx npm package to construct the document server-side.

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

// The full assessment shape this builder needs, matching what
// AssessmentsService.findOneForUser already returns.
type AssessmentWithQuestions = Assessment & {
  questions: Question[];
};

@Injectable()
export class QuestionPaperBuilderService {
  build(assessment: AssessmentWithQuestions): Document {
    const sortedQuestions = [...assessment.questions].sort(
      (a, b) => a.orderIndex - b.orderIndex,
    );

    return new Document({
      sections: [
        {
          properties: {
            page: {
              size: { width: 12240, height: 15840 }, // US Letter, per skill guidance
            },
          },
          children: [
            ...this.buildCoverPage(assessment),
            new Paragraph({ children: [new PageBreak()] }),
            ...this.buildInstructions(),
            ...this.buildQuestions(sortedQuestions),
          ],
        },
      ],
    });
  }

  private buildCoverPage(assessment: AssessmentWithQuestions): Paragraph[] {
    return [
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
          new TextRun({ text: 'Duration: ', bold: true }),
          new TextRun(`${assessment.totalDurationMinutes ?? 0} minutes`),
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

  private buildInstructions(): Paragraph[] {
    return [
      new Paragraph({
        text: 'Instructions',
        heading: HeadingLevel.HEADING_1,
      }),
      new Paragraph({
        text: 'Answer ALL questions. Write clearly and legibly. Show all working where applicable.',
        spacing: { after: 400 },
      }),
    ];
  }

  private buildQuestions(questions: Question[]): Paragraph[] {
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

      // MCQ questions: render the options as A-D choices, WITHOUT
      // indicating which one is correct -- this is the student paper.
      if (Array.isArray(question.optionsData)) {
        const options = question.optionsData as Array<{
          label: string;
          text: string;
        }>;
        options.forEach((option) => {
          paragraphs.push(
            new Paragraph({
              text: `${option.label}. ${option.text}`,
              indent: { left: 400 },
            }),
          );
        });
      }

      // True/False: give the student a blank line to write True or False,
      // rather than revealing optionsData.correctAnswer.
      if (
        !Array.isArray(question.optionsData) &&
        question.optionsData &&
        typeof question.optionsData === 'object' &&
        'correctAnswer' in question.optionsData
      ) {
        paragraphs.push(
          new Paragraph({ text: 'Answer: _________________', spacing: { after: 100 } }),
        );
      }
    });

    return paragraphs;
  }
}
