// apps/api/src/modules/question-bank/presentation/question-bank.controller.ts
//
// Exposes question bank endpoints. Follows the same auth pattern as
// every other controller in this project.

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { QuestionBankService } from '../application/question-bank.service';
import { saveToBankSchema, type SaveToBankDto } from './dto/save-to-bank.dto';
import {
  listBankQuestionsSchema,
  type ListBankQuestionsDto,
} from './dto/list-bank-questions.dto';
import type { User } from '../../../../generated/prisma/client';

@Controller('bank-questions')
@UseGuards(SupabaseAuthGuard)
export class QuestionBankController {
  constructor(private readonly questionBankService: QuestionBankService) {}

  // POST /bank-questions — save an existing assessment question into
  // the bank as a standalone copy.
  @Post()
  save(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(saveToBankSchema)) dto: SaveToBankDto,
  ) {
    return this.questionBankService.saveFromAssessmentQuestion(user.id, dto);
  }

  // GET /bank-questions — list the user's saved bank questions,
  // optionally filtered by questionType/bloomsLevel/difficulty query params.
  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query(new ZodValidationPipe(listBankQuestionsSchema)) filters: ListBankQuestionsDto,
  ) {
    return this.questionBankService.findAllForUser(user.id, filters);
  }

  // DELETE /bank-questions/:id — remove a bank question.
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.questionBankService.deleteBankQuestion(id, user.id);
  }
}
