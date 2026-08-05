import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const BATCH_SIZE = 20;

@Injectable()
export class EmbeddingService {
  private readonly client: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);

      const response = await this.client.embeddings.create({
        model: EMBEDDING_MODEL,
        input: batch,
      });

      for (const item of response.data) {
        results.push(item.embedding);
      }
    }

    return results;
  }
}