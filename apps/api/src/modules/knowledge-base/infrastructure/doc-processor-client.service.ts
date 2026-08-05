import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ExtractionResult {
  text: string;
  pageCount: number;
  ocrUsed: boolean;
  characterCount: number;
}

@Injectable()
export class DocProcessorClientService {
  constructor(private readonly configService: ConfigService) {}

  async extractText(fileBuffer: Buffer, fileName: string): Promise<ExtractionResult> {
    const baseUrl = this.configService.get<string>('DOC_PROCESSOR_URL');

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(fileBuffer)], { type: 'application/pdf' });
    formData.append('file', blob, fileName);

    const response = await fetch(`${baseUrl}/extract`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new InternalServerErrorException(
        `Document extraction failed (${response.status}): ${errorBody}`,
      );
    }

    return response.json();
  }
}
