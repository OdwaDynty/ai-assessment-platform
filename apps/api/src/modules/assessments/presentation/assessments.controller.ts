// apps/api/src/modules/assessments/presentation/assessments.controller.ts
//
// Exposes Assessment wizard endpoints. Follows the same auth pattern as
// DocumentsController and KnowledgeBaseController: SupabaseAuthGuard +
// @CurrentUser() decorator + ZodValidationPipe for request validation.

import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { AssessmentsService } from '../application/assessments.service';
import {
  createAssessmentSchema,
  type CreateAssessmentDto,
} from './dto/create-assessment.dto';
import type { User } from '../../../../generated/prisma/client';

@Controller('assessments')
@UseGuards(SupabaseAuthGuard)
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  // POST /assessments — Step 1: create a DRAFT assessment with selected
  // source documents.
  @Post()
  create(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(createAssessmentSchema)) dto: CreateAssessmentDto,
  ) {
    return this.assessmentsService.createDraft(user.id, dto);
  }

  // GET /assessments — list all of the user's assessments (drafts and
  // otherwise), most recent first.
  @Get()
  findAll(@CurrentUser() user: User) {
    return this.assessmentsService.findAllForUser(user.id);
  }

  // GET /assessments/:id — fetch a single assessment with its full
  // wizard state (documents, question types, learning outcomes).
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.assessmentsService.findOneForUser(id, user.id);
  }
}
