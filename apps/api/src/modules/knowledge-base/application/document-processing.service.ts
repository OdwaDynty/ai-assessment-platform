import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { SupabaseStorageService } from '../../documents/infrastructure/supabase-storage.service';
import { DocProcessorClientService } from '../infrastructure/doc-processor-client.service';
import { ChunkingService } from './chunking.service';
import { EmbeddingService } from './embedding.service';

@Injectable()
export class DocumentProcessingService {
  private readonly logger = new Logger(DocumentProcessingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: SupabaseStorageService,
    private readonly docProcessorClient: DocProcessorClientService,
    private readonly chunking: ChunkingService,
    private readonly embedding: EmbeddingService,
  ) {}

  async processDocument(documentId: string): Promise<void> {
    this.logger.log(`Starting processing for document ${documentId}`);

    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      this.logger.error(`Document ${documentId} not found`);
      return;
    }

    await this.prisma.document.update({
      where: { id: documentId },
      data: { status: 'PROCESSING', processingError: null },
    });

    try {
      const fileBuffer = await this.storage.downloadFile(document.storagePath);

      const extraction = await this.docProcessorClient.extractText(
        fileBuffer,
        document.fileName,
      );

      this.logger.log(
        `Extracted ${extraction.characterCount} characters (OCR used: ${extraction.ocrUsed})`,
      );

      const chunks = this.chunking.chunkText(extraction.text);

      if (chunks.length === 0) {
        throw new Error('No text content extracted from document');
      }

      const embeddings = await this.embedding.embedBatch(chunks);

      await this.prisma.$executeRaw`DELETE FROM document_chunks WHERE document_id = ${documentId}`;

      for (let i = 0; i < chunks.length; i++) {
        const vectorLiteral = `[${embeddings[i].join(',')}]`;

        await this.prisma.$executeRaw`
          INSERT INTO document_chunks (id, document_id, content, embedding, chunk_index, created_at)
          VALUES (${randomUUID()}, ${documentId}, ${chunks[i]}, ${vectorLiteral}::vector, ${i}, now())
        `;
      }

      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: 'READY' },
      });

      this.logger.log(
        `Document ${documentId} processed successfully: ${chunks.length} chunks created`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Processing failed for document ${documentId}: ${message}`);

      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: 'FAILED', processingError: message },
      });
    }
  }
}
