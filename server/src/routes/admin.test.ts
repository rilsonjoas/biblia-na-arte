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
  findUserById: vi.fn(),
  listUsers: vi.fn(),
  createUser: vi.fn(),
  deleteUser: vi.fn(),
  countAdmins: vi.fn(),
  listSubmissions: vi.fn(),
  getSubmissionById: vi.fn(),
  updateSubmission: vi.fn(),
  approveSubmission: vi.fn(),
  rejectSubmission: vi.fn(),
  deleteSubmission: vi.fn(),
  findBibleBookSlugByName: vi.fn(),
}));

vi.mock('../lib/auth.js', () => ({
  verifyPassword: vi.fn(),
  hashPassword: vi.fn().mockReturnValue('hash-fake:qualquer'),
}));

vi.mock('../lib/image-processing.js', () => ({
  promoteSubmissionImage: vi.fn().mockResolvedValue('diego-velazquez-cristo-na-cruz.webp'),
  processSubmissionImage: vi.fn(),
  InvalidImageError: class InvalidImageError extends Error {},
  generateSocialImage: vi.fn(),
  // `error-handler.ts` faz `instanceof SocialImageUpstreamError` — mockar
  // sem essa classe real faz QUALQUER erro tratado pelo handler (mesmo
  // sem relação com imagem, ex. 401 de autenticação) virar 500, porque o
  // `instanceof` quebra contra `undefined`. Achado real 2026-09-26.
  SocialImageUpstreamError: class SocialImageUpstreamError extends Error {},
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

    // authenticate/requireAdmin revalidam contra o banco a cada
    // requisição (achado real 2026-09-06, ver jwt-auth.ts) — sem isso
    // todo teste protegido devolveria 401 "usuário não existe mais".
    vi.mocked(queries.findUserById).mockImplementation(async (id: string) => {
      if (id === ADMIN_USER.id) return ADMIN_USER;
      if (id === REVISOR_USER.id) return REVISOR_USER;
      return undefined;
    });
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

  it('DELETE /admin/submissions/:id funciona pra revisor quando ainda não foi aprovada', async () => {
    const submissionId = '66666666-6666-6666-6666-666666666666';
    vi.mocked(queries.getSubmissionById).mockResolvedValueOnce({
      id: submissionId,
      status: 'pendente',
      imagePath: './uploads/pending-submissions-test/nao-existe.webp',
      approvedArtworkId: null,
    } as never);
    vi.mocked(queries.deleteSubmission).mockResolvedValueOnce({
      pendingImagePath: './uploads/pending-submissions-test/nao-existe.webp',
      approvedImageUrl: null,
    });

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/admin/submissions/${submissionId}`,
      headers: { authorization: `Bearer ${revisorToken}` },
    });

    expect(res.statusCode).toBe(204);
  });

  it('DELETE /admin/submissions/:id de uma já aprovada exige admin — revisor recebe 403', async () => {
    const submissionId = '77777777-7777-7777-7777-777777777777';
    vi.mocked(queries.getSubmissionById).mockResolvedValueOnce({
      id: submissionId,
      status: 'aprovado',
      approvedArtworkId: '88888888-8888-8888-8888-888888888888',
    } as never);

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/admin/submissions/${submissionId}`,
      headers: { authorization: `Bearer ${revisorToken}` },
    });

    expect(res.statusCode).toBe(403);
  });

  it('DELETE /admin/submissions/:id de uma já aprovada funciona pra admin', async () => {
    const submissionId = '99999999-9999-9999-9999-999999999999';
    vi.mocked(queries.getSubmissionById).mockResolvedValueOnce({
      id: submissionId,
      status: 'aprovado',
      approvedArtworkId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    } as never);
    vi.mocked(queries.deleteSubmission).mockResolvedValueOnce({
      pendingImagePath: null,
      approvedImageUrl: 'http://localhost:3000/api/v1/uploads/artista-titulo.webp',
    });

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/admin/submissions/${submissionId}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });

    expect(res.statusCode).toBe(204);
  });
});

describe('gestão de usuários do painel', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let adminToken: string;
  let revisorToken: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    adminToken = app.jwt.sign({ sub: ADMIN_USER.id, email: ADMIN_USER.email, role: 'admin' });
    revisorToken = app.jwt.sign({ sub: REVISOR_USER.id, email: REVISOR_USER.email, role: 'revisor' });
    vi.mocked(queries.findUserById).mockImplementation(async (id: string) => {
      if (id === ADMIN_USER.id) return ADMIN_USER;
      if (id === REVISOR_USER.id) return REVISOR_USER;
      return undefined;
    });
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('GET /admin/users exige papel admin — revisor recebe 403', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/users',
      headers: { authorization: `Bearer ${revisorToken}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it('GET /admin/users lista usuários pra admin', async () => {
    vi.mocked(queries.listUsers).mockResolvedValueOnce([
      { id: ADMIN_USER.id, email: ADMIN_USER.email, role: 'admin', createdAt: new Date() },
    ]);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/users',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(1);
  });

  it('POST /admin/users rejeita senha curta (min 12)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/users',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { email: 'novo@example.com', password: 'curta', role: 'revisor' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /admin/users recusa e-mail já existente com 409', async () => {
    vi.mocked(queries.findUserByEmail).mockResolvedValueOnce(ADMIN_USER);
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/users',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { email: ADMIN_USER.email, password: 'senha-bem-grande-123', role: 'revisor' },
    });
    expect(res.statusCode).toBe(409);
  });

  it('POST /admin/users cria usuário novo', async () => {
    vi.mocked(queries.findUserByEmail).mockResolvedValueOnce(undefined);
    vi.mocked(queries.createUser).mockResolvedValueOnce({
      id: '33333333-cccc-3333-cccc-333333333333',
      email: 'novo-revisor@example.com',
      role: 'revisor',
      createdAt: new Date(),
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/users',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { email: 'novo-revisor@example.com', password: 'senha-bem-grande-123', role: 'revisor' },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json().email).toBe('novo-revisor@example.com');
  });

  it('DELETE /admin/users/:id recusa apagar a própria conta logada', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/admin/users/${ADMIN_USER.id}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(400);
  });

  it('DELETE /admin/users/:id recusa apagar o único admin restante', async () => {
    // mockImplementation completo (não mockResolvedValueOnce): a
    // própria requireAdmin já chama findUserById(ADMIN_USER.id) pra
    // validar quem está pedindo, ANTES do handler chamar de novo pra
    // buscar o alvo — um "Once" seria consumido pela chamada errada.
    const otherAdminId = '44444444-dddd-4444-dddd-444444444444';
    vi.mocked(queries.findUserById).mockImplementation(async (id: string) => {
      if (id === ADMIN_USER.id) return ADMIN_USER;
      if (id === otherAdminId) {
        return { id: otherAdminId, email: 'outro-admin@example.com', role: 'admin', passwordHash: 'x', createdAt: new Date() };
      }
      return undefined;
    });
    vi.mocked(queries.countAdmins).mockResolvedValueOnce(1);

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/admin/users/${otherAdminId}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });

    expect(res.statusCode).toBe(400);
  });

  it('DELETE /admin/users/:id apaga um revisor normalmente', async () => {
    const revisorId = '55555555-eeee-5555-eeee-555555555555';
    vi.mocked(queries.findUserById).mockImplementation(async (id: string) => {
      if (id === ADMIN_USER.id) return ADMIN_USER;
      if (id === revisorId) {
        return { id: revisorId, email: 'revisor-qualquer@example.com', role: 'revisor', passwordHash: 'x', createdAt: new Date() };
      }
      return undefined;
    });

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/admin/users/${revisorId}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });

    expect(res.statusCode).toBe(204);
  });
});
