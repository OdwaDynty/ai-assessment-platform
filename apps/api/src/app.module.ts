import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { validateEnv } from './config/env.validation';
import { parseRedisUrl } from './config/redis.config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { KnowledgeBaseModule } from './modules/knowledge-base/knowledge-base.module';
import { AssessmentsModule } from './modules/assessments/assessments.module';
import { GenerationModule } from './modules/generation/generation.module';
import { ExportModule } from './modules/export/export.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: '.env',
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: parseRedisUrl(configService.get<string>('REDIS_URL')!),
      }),
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    DocumentsModule,
    KnowledgeBaseModule,
    AssessmentsModule,
    GenerationModule,
    ExportModule
  ],
})
export class AppModule {}
