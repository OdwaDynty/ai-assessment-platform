import { Module } from '@nestjs/common';
import { DocumentsController } from './presentation/documents.controller';
import { DocumentsService } from './application/documents.service';
import { SupabaseStorageService } from './infrastructure/supabase-storage.service';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, SupabaseStorageService],
})
export class DocumentsModule {}
