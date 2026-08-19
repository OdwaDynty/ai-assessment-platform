// apps/api/src/modules/export/presentation/export.controller.ts
//
// Exposes document export endpoints. Follows the same auth pattern as
// every other controller, reusing AssessmentsService for ownership-checked
// data fetching rather than duplicating that logic here.

import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { Packer } from 'docx';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AssessmentsService } from '../../assessments/application/assessments.service';
import { QuestionPaperBuilderService } from '../application/question-paper-builder.service';
import type { User } from '../../../../generated/prisma/client';

@Controller('assessments')
@UseGuards(SupabaseAuthGuard)
export class ExportController {
  constructor(
    private readonly assessmentsService: AssessmentsService,
    private readonly questionPaperBuilder: QuestionPaperBuilderService,
  ) {}

  // GET /assessments/:id/export/question-paper — downloads the
  // student-facing question paper as a .docx file.
  @Get(':id/export/question-paper')
  async exportQuestionPaper(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    const assessment = await this.assessmentsService.findOneForUser(id, user.id);
    const document = this.questionPaperBuilder.build(assessment);
    const buffer = await Packer.toBuffer(document);

    const fileName = `${(assessment.title ?? 'assessment').replace(/[^a-z0-9]/gi, '_')}_question_paper.docx`;

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });
    res.send(buffer);
  }
}