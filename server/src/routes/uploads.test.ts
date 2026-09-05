import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

vi.mock('../config.js', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 3000,
    HOST: '0.0.0.0',
    DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
    CORS_ORIGIN: ['http://localhost:8080'],
    JWT_SECRET: 'test-secret-with-at-least-32-characters',
    SUBMISSION_UPLOADS_DIR: './uploads/pending-submissions-test',
    APPROVED_SUBMISSION_UPLOADS_DIR: './uploads/approved-submissions-test',
    PUBLIC_API_URL: 'http://localhost:3000',
  },
  isProduction: false,
}));

vi.mock('../db/queries.js', () => ({}));

import { buildApp } from '../app.js';

describe('GET /api/v1/uploads/:filename', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('rejeita tentativa de path traversal com 404, sem tentar ler o arquivo', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/uploads/..%2F..%2F..%2Fetc%2Fpasswd' });
    expect(res.statusCode).toBe(404);
  });

  it('devolve 404 pra arquivo inexistente', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/uploads/nao-existe.webp' });
    expect(res.statusCode).toBe(404);
  });
});
