import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SupabaseStorageService } from '../infrastructure/supabase-storage.service';
import type { Document } from '../../../../generated/prisma/client';
import type { CreateDocumentDto } from '../presentation/dto/create-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: SupabaseStorageService,
  ) {}

  async createPendingDocument(
    ownerId: string,
    dto: CreateDocumentDto,
  ): Promise<{ document: Document; signedUrl: string; token: string }> {
    const document = await this.prisma.document.create({
      data: {
        ownerId,
        fileName: dto.fileName,
        fileType: dto.fileType,
        fileSizeBytes: dto.fileSizeBytes,
        documentType: dto.documentType,
        status: 'PENDING',
        storagePath: '',
      },
    });

    const storagePath = `${ownerId}/${document.id}/${dto.fileName}`;

    const { signedUrl, token } =
      await this.storage.createSignedUploadUrl(storagePath);

    const updated = await this.prisma.document.update({
      where: { id: document.id },
      data: { storagePath },
    });

    return { document: updated, signedUrl, token };
  }

  async confirmUpload(documentId: string, userId: string): Promise<Document> {
    const document = await this.getOwnedDocument(documentId, userId);

    const exists = await this.storage.fileExists(document.storagePath);

    return this.prisma.document.update({
      where: { id: document.id },
      data: { status: exists ? 'UPLOADED' : 'FAILED' },
    });
  }

  async findAllForUser(userId: string): Promise<Document[]> {
    return this.prisma.document.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteDocument(documentId: string, userId: string): Promise<void> {
    const document = await this.getOwnedDocument(documentId, userId);

    if (document.storagePath) {
      await this.storage.deleteFile(document.storagePath);
    }

    await this.prisma.document.delete({ where: { id: document.id } });
  }

  private async getOwnedDocument(
    documentId: string,
    userId: string,
  ): Promise<Document> {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.ownerId !== userId) {
      throw new ForbiddenException('You do not own this document');
    }

    return document;
  }
}
