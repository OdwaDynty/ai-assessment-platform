import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { DocumentsService } from '../application/documents.service';
import {
  createDocumentSchema,
  type CreateDocumentDto,
} from './dto/create-document.dto';
import type { User } from '../../../../generated/prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';

@Controller('documents')
@UseGuards(SupabaseAuthGuard)
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    @InjectQueue('document-processing') private readonly processingQueue: Queue,
  ) {}

  @Post()
  create(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(createDocumentSchema)) dto: CreateDocumentDto,
  ) {
    return this.documentsService.createPendingDocument(user.id, dto);
  }

  @Post(':id/confirm')
  confirm(@Param('id') id: string, @CurrentUser() user: User) {
    return this.documentsService.confirmUpload(id, user.id);
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.documentsService.findAllForUser(user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.documentsService.deleteDocument(id, user.id);
  }

  @Post(':id/process')
  async triggerProcessing(@Param('id') id: string) {
    await this.processingQueue.add('process-document', { documentId: id });
    return { message: 'Processing job queued', documentId: id };
  }
}
