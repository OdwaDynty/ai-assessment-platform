// apps/api/src/modules/assessments/assessments.module.ts
//
// Registers the Assessments feature module. No BullMQ queue needed here
// (unlike KnowledgeBaseModule) since draft creation/updates are simple
// synchronous CRUD — async work only enters the picture in Phase 8 when
// actual AI generation kicks in.

import { Module } from '@nestjs/common';
import { AssessmentsController } from './presentation/assessments.controller';
import { AssessmentsService } from './application/assessments.service';

@Module({
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
})
export class AssessmentsModule {}
