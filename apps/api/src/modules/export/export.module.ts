// apps/api/src/modules/export/export.module.ts
//
// Registers the Export feature module. Imports AssessmentsModule to
// reuse its ownership-checked data-fetching service rather than
// duplicating that logic here.

import { Module } from '@nestjs/common';
import { ExportController } from './presentation/export.controller';
import { QuestionPaperBuilderService } from './application/question-paper-builder.service';
import { AssessmentsModule } from '../assessments/assessments.module';

@Module({
  imports: [AssessmentsModule],
  controllers: [ExportController],
  providers: [QuestionPaperBuilderService],
})
export class ExportModule {}
