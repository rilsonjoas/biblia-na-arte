import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';

const APPROVED_DIR = './uploads/approved-submissions-test';

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
    await mkdir(APPROVED_DIR, { recursive: true });
    await writeFile(path.join(APPROVED_DIR, 'existe.webp'), 'conteúdo-fake');
  });

  afterAll(async () => {
    if (app) await app.close();
    await rm(APPROVED_DIR, { recursive: true, force: true });
  });

  it('rejeita tentativa de path traversal com 404, sem tentar ler o arquivo', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/uploads/..%2F..%2F..%2Fetc%2Fpasswd' });
    expect(res.statusCode).toBe(404);
  });

  it('devolve 404 pra arquivo inexistente', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/uploads/nao-existe.webp' });
    expect(res.statusCode).toBe(404);
  });

  it('serve arquivo existente com Cross-Origin-Resource-Policy: cross-origin', async () => {
    // Achado real 2026-09-05: o helmet aplica same-origin por padrão,
    // que bloqueia o <img> do site (subdomínio diferente da API) de
    // carregar essa imagem — passava no curl (que ignora CORP) e só
    // quebrava no navegador de verdade.
    const res = await app.inject({ method: 'GET', url: '/api/v1/uploads/existe.webp' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
    expect(res.headers['content-type']).toBe('image/webp');
  });
});
