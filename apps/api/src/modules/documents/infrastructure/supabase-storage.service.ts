import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

const BUCKET_NAME = 'documents';

@Injectable()
export class SupabaseStorageService {
  private readonly client: ReturnType<typeof createClient>;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    this.client = createClient(supabaseUrl!, serviceRoleKey!);
  }

  async createSignedUploadUrl(
    storagePath: string,
  ): Promise<{ signedUrl: string; token: string }> {
    const { data, error } = await this.client.storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(storagePath);

    if (error || !data) {
      throw new InternalServerErrorException(
        `Failed to create signed upload URL: ${error?.message}`,
      );
    }

    return { signedUrl: data.signedUrl, token: data.token };
  }

  async fileExists(storagePath: string): Promise<boolean> {
    const lastSlashIndex = storagePath.lastIndexOf('/');
    const folder = storagePath.substring(0, lastSlashIndex);
    const fileName = storagePath.substring(lastSlashIndex + 1);

    const { data, error } = await this.client.storage
      .from(BUCKET_NAME)
      .list(folder, { search: fileName });

    if (error) {
      return false;
    }

    return data.some((file) => file.name === fileName);
  }

  async deleteFile(storagePath: string): Promise<void> {
    const { error } = await this.client.storage
      .from(BUCKET_NAME)
      .remove([storagePath]);

    if (error) {
      throw new InternalServerErrorException(
        `Failed to delete file: ${error.message}`,
      );
    }
  }
}
