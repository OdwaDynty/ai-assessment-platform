import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { PrismaService } from '../../../prisma/prisma.service';
import type { User } from '../../../../generated/prisma/client';

export interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  [key: string]: unknown;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    this.jwks = createRemoteJWKSet(
      new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`),
    );
  }

  async verifyToken(token: string): Promise<SupabaseJwtPayload> {
    try {
      const { payload } = await jwtVerify(token, this.jwks);
      return payload as SupabaseJwtPayload;
    } catch (error) {
      this.logger.warn('JWT verification failed', error);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async getOrCreateUser(payload: SupabaseJwtPayload): Promise<User> {
    const existing = await this.prisma.user.findUnique({
      where: { supabaseId: payload.sub },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.user.create({
      data: {
        supabaseId: payload.sub,
        email: payload.email ?? '',
      },
    });
  }
}
