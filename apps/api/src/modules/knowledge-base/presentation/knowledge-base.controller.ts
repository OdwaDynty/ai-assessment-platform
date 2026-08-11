// apps/api/src/modules/knowledge-base/presentation/knowledge-base.controller.ts
//
// Exposes the semantic search endpoint. Follows the exact same auth pattern as
// DocumentsController: SupabaseAuthGuard + @CurrentUser() decorator + ZodValidationPipe.

import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { RetrievalService } from '../application/retrieval.service';
import {
  searchQuerySchema,
  type SearchQueryDto,
} from './dto/search-query.dto';
import type { User } from '../../../../generated/prisma/client';

@Controller('knowledge-base')
@UseGuards(SupabaseAuthGuard) // Every route in this controller requires a valid Supabase JWT.
export class KnowledgeBaseController {
  constructor(private readonly retrievalService: RetrievalService) {}

  // POST /knowledge-base/search
  // Body: { query: string, documentId?: string, limit?: number }
  //
  // Returns the top-k most semantically relevant chunks from the user's own
  // documents (or a single document, if documentId is provided).
  @Post('search')
  search(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(searchQuerySchema)) dto: SearchQueryDto,
  ) {
    return this.retrievalService.search(
      user.id,
      dto.query,
      dto.limit,
      dto.documentId,
    );
  }
}