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

vi.mock('../db/queries.js', () => ({
  findUserByEmail: vi.fn(),
  listSubmissions: vi.fn(),
  getSubmissionById: vi.fn(),
  updateSubmission: vi.fn(),
  approveSubmission: vi.fn(),
  rejectSubmission: vi.fn(),
  findBibleBookSlugByName: vi.fn(),
}));

vi.mock('../lib/auth.js', () => ({
  verifyPassword: vi.fn(),
}));

vi.mock('../lib/image-processing.js', () => ({
  promoteSubmissionImage: vi.fn().mockResolvedValue('diego-velazquez-cristo-na-cruz.webp'),
}));

import { buildApp } from '../app.js';
import * as queries from '../db/queries.js';
import { verifyPassword } from '../lib/auth.js';

const ADMIN_USER = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'admin@example.com',
  passwordHash: 'hash-qualquer',
  role: 'admin' as const,
  createdAt: new Date(),
};

const REVISOR_USER = { ...ADMIN_USER, id: '22222222-2222-2222-2222-222222222222', role: 'revisor' as const };

describe('POST /api/v1/admin/login', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('devolve token válido pra credenciais corretas', async () => {
    vi.mocked(queries.findUserByEmail).mockResolvedValueOnce(ADMIN_USER);
    vi.mocked(verifyPassword).mockReturnValueOnce(true);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/login',
      payload: { email: 'admin@example.com', password: 'senha-certa' },
    });

    expect(res.statusCode).toBe(200);
    const json = res.json();
    expect(json.token).toBeTypeOf('string');
    expect(json.user.role).toBe('admin');
  });

  it('rejeita senha errada com 401, sem vazar se o e-mail existe', async () => {
    vi.mocked(queries.findUserByEmail).mockResolvedValueOnce(ADMIN_USER);
    vi.mocked(verifyPassword).mockReturnValueOnce(false);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/login',
      payload: { email: 'admin@example.com', password: 'senha-errada' },
    });

    expect(res.statusCode).toBe(401);
  });

  it('rejeita e-mail inexistente com a mesma mensagem de senha errada', async () => {
    vi.mocked(queries.findUserByEmail).mockResolvedValueOnce(undefined);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/login',
      payload: { email: 'ninguem@example.com', password: 'qualquer' },
    });

    expect(res.statusCode).toBe(401);
  });
});

describe('rotas protegidas de admin', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let adminToken: string;
  let revisorToken: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    adminToken = app.jwt.sign({ sub: ADMIN_USER.id, email: ADMIN_USER.email, role: 'admin' });
    revisorToken = app.jwt.sign({ sub: REVISOR_USER.id, email: REVISOR_USER.email, role: 'revisor' });
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('GET /admin/submissions exige autenticação', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/admin/submissions' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /admin/submissions funciona com token válido (revisor ou admin)', async () => {
    vi.mocked(queries.listSubmissions).mockResolvedValueOnce([]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/submissions',
      headers: { authorization: `Bearer ${revisorToken}` },
    });

    expect(res.statusCode).toBe(200);
  });

  it('POST /admin/submissions/:id/approve exige papel admin — revisor recebe 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/submissions/33333333-3333-3333-3333-333333333333/approve',
      headers: { authorization: `Bearer ${revisorToken}` },
    });

    expect(res.statusCode).toBe(403);
  });

  it('POST /admin/submissions/:id/approve funciona pra admin e devolve o id da obra criada', async () => {
    const submissionId = '33333333-3333-3333-3333-333333333333';
    vi.mocked(queries.getSubmissionById).mockResolvedValueOnce({
      id: submissionId,
      status: 'pendente',
      title: 'Cristo na Cruz',
      artistName: 'Diego Velázquez',
      imagePath: './uploads/pending-submissions-test/abc.webp',
      suggestedBook: 'João',
    } as never);
    vi.mocked(queries.findBibleBookSlugByName).mockResolvedValueOnce('joao');
    vi.mocked(queries.approveSubmission).mockResolvedValueOnce({
      submission: { id: submissionId, status: 'aprovado' } as never,
      artworkId: '44444444-4444-4444-4444-444444444444',
    });

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/submissions/${submissionId}/approve`,
      headers: { authorization: `Bearer ${adminToken}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().artworkId).toBe('44444444-4444-4444-4444-444444444444');
  });

  it('POST /admin/submissions/:id/reject funciona pra revisor (não exige admin)', async () => {
    const submissionId = '55555555-5555-5555-5555-555555555555';
    vi.mocked(queries.rejectSubmission).mockResolvedValueOnce({
      id: submissionId,
      status: 'rejeitado',
    } as never);

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/submissions/${submissionId}/reject`,
      headers: { authorization: `Bearer ${revisorToken}` },
      payload: { reason: 'Imagem com baixa resolução' },
    });

    expect(res.statusCode).toBe(200);
  });
});
