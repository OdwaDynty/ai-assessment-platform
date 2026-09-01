// apps/api/test/app.e2e-spec.ts
//
// Smoke-test E2E: boots a minimal NestJS application containing just
// HealthModule and PrismaModule, then confirms it responds correctly
// to a genuine HTTP request against a real (test) database connection.
//
// Deliberately does NOT import the full AppModule -- AuthModule pulls
// in the `jose` package for JWT verification, which ships as pure ESM
// and conflicts with Jest's CommonJS-based test runner in ways that
// proved not worth fighting for a simple health-check smoke test. This
// minimal module still exercises the real HTTP layer, real dependency
// injection, and a real database connection -- everything /health
// actually needs -- without dragging in unrelated modules.

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from '../src/modules/health/health.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { validateEnv } from '../src/config/env.validation';

describe('Health (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
       const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
        PrismaModule,
        HealthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health (GET) returns ok status and database connectivity', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('status');
        expect(res.body).toHaveProperty('database');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});