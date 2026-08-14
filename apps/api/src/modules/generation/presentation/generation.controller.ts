// apps/api/src/modules/generation/presentation/generation.controller.ts
//
// Exposes the generation trigger endpoint. Follows the same auth
// pattern as every other controller in this project.

import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { GenerationService } from '../application/generation.service';
import type { User } from '../../../../generated/prisma/client';

@Controller('assessments')
@UseGuards(SupabaseAuthGuard)
export class GenerationController {
  constructor(private readonly generationService: GenerationService) {}

  // POST /assessments/:id/generate — kicks off async AI question
  // generation for a fully-configured assessment. Returns immediately;
  // progress is tracked via the assessment's status field and each
  // question type config's generationStatus (poll GET /assessments/:id).
  @Post(':id/generate')
  async generate(@Param('id') id: string, @CurrentUser() user: User) {
    await this.generationService.startGeneration(id, user.id);
    return { message: 'Generation started' };
  }
}
