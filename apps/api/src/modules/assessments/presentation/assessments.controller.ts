// apps/api/src/modules/assessments/presentation/assessments.controller.ts
//
// Exposes Assessment wizard endpoints. Follows the same auth pattern as
// DocumentsController and KnowledgeBaseController: SupabaseAuthGuard +
// @CurrentUser() decorator + ZodValidationPipe for request validation.

import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { AssessmentsService } from '../application/assessments.service';
import {
  createAssessmentSchema,
  type CreateAssessmentDto,
} from './dto/create-assessment.dto';
import type { User } from '../../../../generated/prisma/client';
import {
  updateBasicsSchema,
  type UpdateBasicsDto,
} from './dto/update-basics.dto';

import {
  updateQuestionTypesSchema,
  type UpdateQuestionTypesDto,
} from './dto/update-question-types.dto';

import {
  updateRigorSchema,
  type UpdateRigorDto,
} from './dto/update-rigor.dto';

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

  // PATCH /assessments/:id/basics — Step 2: update title, module, NQF
  // level, assessment type, duration, total marks, and learning outcomes.
  @Patch(':id/basics')
  updateBasics(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(updateBasicsSchema)) dto: UpdateBasicsDto,
  ) {
    return this.assessmentsService.updateBasics(id, user.id, dto);
  }

// PATCH /assessments/:id/question-types — Step 3: configure question
  // types, counts, and marks per question.
  @Patch(':id/question-types')
  updateQuestionTypes(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(updateQuestionTypesSchema))
    dto: UpdateQuestionTypesDto,
  ) {
    return this.assessmentsService.updateQuestionTypes(id, user.id, dto);
  }

  // PATCH /assessments/:id/rigor — Step 4: set Bloom's Taxonomy and
  // difficulty distribution targets.
  @Patch(':id/rigor')
  updateRigor(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(updateRigorSchema)) dto: UpdateRigorDto,
  ) {
    return this.assessmentsService.updateRigor(id, user.id, dto);
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
