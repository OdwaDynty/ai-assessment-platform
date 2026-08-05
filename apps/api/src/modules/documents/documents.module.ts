import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DocumentsController } from './presentation/documents.controller';
import { DocumentsService } from './application/documents.service';
import { SupabaseStorageService } from './infrastructure/supabase-storage.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'document-processing',
    }),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, SupabaseStorageService],
})
export class DocumentsModule {}
