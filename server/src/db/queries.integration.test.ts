import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import path from 'node:path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createSubmission, approveSubmission, deleteSubmission, getSubmissionById } from './queries.js';
import { getArtworkById } from './queries.js';
import { createUser, findUserById, deleteUser, countAdmins } from './queries.js';

const MIGRATIONS_DIR = path.join(import.meta.dirname, 'migrations');

/** Cobre um caminho que api.integration.test.ts não cobre: aprovar e
 *  depois apagar uma submissão, contra Postgres real — só um banco de
 *  verdade valida a constraint de FK entre submissions.approved_artwork_id
 *  e artworks.id. Achado real 2026-09-05: a primeira versão de
 *  deleteSubmission apagava a obra antes da submissão que referencia
 *  ela e violava essa FK — um teste com mocks (admin.test.ts) não pega
 *  esse tipo de erro, porque a query inteira é simulada. */
describe('deleteSubmission — integração (Postgres real de teste)', () => {
  let admin: postgres.Sql;

  let reviewerId: string;

  beforeAll(async () => {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL não definida nos testes de integração');
    admin = postgres(url, { max: 1 });
    await migrate(drizzle(admin), { migrationsFolder: MIGRATIONS_DIR });

    // reviewed_by tem FK pra users — precisa de uma linha de verdade,
    // não só um UUID qualquer (achado ao rodar este mesmo teste: bati
    // na constraint na hora, exatamente o tipo de erro que só um banco
    // real acusa).
    const [reviewer] = await admin`
      INSERT INTO users (email, password_hash, role)
      VALUES ('reviewer-teste-integracao@example.com', 'hash-qualquer', 'admin')
      RETURNING id
    `;
    if (!reviewer) throw new Error('Falha ao criar usuário de teste');
    reviewerId = reviewer.id;
  });

  afterAll(async () => {
    await admin`DELETE FROM users WHERE id = ${reviewerId}`;
    await admin.end();
  });

  it('apaga uma submissão já aprovada, e a obra publicada junto, sem violar FK', async () => {
    const submission = await createSubmission({
      submitterName: 'Teste de integração',
      submitterEmail: 'teste@example.com',
      rightsConfirmed: true,
      title: 'Obra de teste — deleteSubmission',
      imagePath: '/tmp/nao-existe-de-verdade.webp',
    });

    const { artworkId } = await approveSubmission(
      submission.id,
      reviewerId,
      'https://api-biblianaarte.narniano.com/api/v1/uploads/teste-integracao.webp',
      null,
    );

    expect(await getArtworkById(artworkId)).toBeDefined();

    const result = await deleteSubmission(submission.id);
    expect(result).toBeDefined();
    expect(result?.approvedImageUrl).toContain('teste-integracao.webp');

    expect(await getSubmissionById(submission.id)).toBeUndefined();
    expect(await getArtworkById(artworkId)).toBeUndefined();
  });

  it('apaga uma submissão pendente (nunca aprovada) sem tocar em artworks', async () => {
    const submission = await createSubmission({
      submitterName: 'Teste de integração 2',
      submitterEmail: 'teste@example.com',
      rightsConfirmed: true,
      title: 'Submissão pendente — deleteSubmission',
      imagePath: '/tmp/pendente-nao-existe.webp',
    });

    const result = await deleteSubmission(submission.id);
    expect(result).toEqual({
      pendingImagePath: '/tmp/pendente-nao-existe.webp',
      approvedImageUrl: null,
    });
    expect(await getSubmissionById(submission.id)).toBeUndefined();
  });
});

/** Achado real 2026-09-06: authenticate/requireAdmin (jwt-auth.ts)
 *  passaram a revalidar contra o banco a cada requisição — sem isso,
 *  apagar um usuário não revogava nada de verdade enquanto o token
 *  antigo não expirasse (até 7 dias). Este teste prova a parte de
 *  dados que sustenta esse fix: depois de deleteUser, findUserById
 *  (a mesma função que o preHandler chama) não acha mais o usuário —
 *  contra Postgres real, não mock. */
describe('createUser/deleteUser — integração (Postgres real de teste)', () => {
  let admin: postgres.Sql;

  beforeAll(async () => {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL não definida nos testes de integração');
    admin = postgres(url, { max: 1 });
    await migrate(drizzle(admin), { migrationsFolder: MIGRATIONS_DIR });
  });

  afterAll(async () => {
    await admin.end();
  });

  it('usuário apagado some de verdade — findUserById não acha mais', async () => {
    const user = await createUser('integracao-delete@example.com', 'hash-qualquer', 'revisor');
    expect(await findUserById(user.id)).toBeDefined();

    await deleteUser(user.id);

    expect(await findUserById(user.id)).toBeUndefined();
  });

  it('countAdmins conta só quem tem role admin', async () => {
    const before = await countAdmins();
    const admin1 = await createUser('integracao-admin1@example.com', 'hash-qualquer', 'admin');
    const revisor = await createUser('integracao-revisor1@example.com', 'hash-qualquer', 'revisor');

    expect(await countAdmins()).toBe(before + 1);

    await deleteUser(admin1.id);
    await deleteUser(revisor.id);
    expect(await countAdmins()).toBe(before);
  });
});
