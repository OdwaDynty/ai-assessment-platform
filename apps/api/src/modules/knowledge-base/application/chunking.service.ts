import { Injectable } from '@nestjs/common';

const CHUNK_SIZE_CHARS = 4000;
const CHUNK_OVERLAP_CHARS = 600;

@Injectable()
export class ChunkingService {
  chunkText(text: string): string[] {
    const trimmed = text.trim();
    if (trimmed.length === 0) return [];

    const chunks: string[] = [];
    let start = 0;

    while (start < trimmed.length) {
      const end = Math.min(start + CHUNK_SIZE_CHARS, trimmed.length);
      const chunk = trimmed.slice(start, end).trim();

      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      if (end === trimmed.length) break;
      start = end - CHUNK_OVERLAP_CHARS;
    }

    return chunks;
  }
}
