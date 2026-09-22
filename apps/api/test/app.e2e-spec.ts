import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

describe('AppModule (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health (GET) responde com o banco up (200 ou 503 se so o redis estiver down)', async () => {
    const response = await request(app.getHttpServer()).get('/health');
    expect([200, 503]).toContain(response.status);
    expect(response.body.info?.database?.status ?? response.body.error?.database?.status).toBe(
      'up',
    );
  });

  afterEach(async () => {
    await app.close();
  });
});
