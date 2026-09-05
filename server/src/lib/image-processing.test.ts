import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { promoteSubmissionImage } from './image-processing.js';

const PENDING_DIR = './uploads/image-processing-test-pending';
const APPROVED_DIR = './uploads/image-processing-test-approved';

describe('promoteSubmissionImage', () => {
  beforeEach(async () => {
    await mkdir(PENDING_DIR, { recursive: true });
  });

  afterEach(async () => {
    await rm(PENDING_DIR, { recursive: true, force: true });
    await rm(APPROVED_DIR, { recursive: true, force: true });
  });

  it('gera nomes diferentes pra duas submissões com o mesmo artista+título', async () => {
    // Achado real 2026-09-05: sem o sufixo do id da submissão, as duas
    // gerariam o mesmo slug e a segunda `rename()` sobrescreveria o
    // arquivo da primeira em silêncio — a obra antiga passaria a
    // apontar pra imagem da nova, sem erro nenhum avisando disso.
    const pathA = path.join(PENDING_DIR, 'a.webp');
    const pathB = path.join(PENDING_DIR, 'b.webp');
    await writeFile(pathA, 'conteúdo-a');
    await writeFile(pathB, 'conteúdo-b');

    const filenameA = await promoteSubmissionImage(
      pathA,
      APPROVED_DIR,
      'Autor Desconhecido',
      'Sem Título',
      '11111111-1111-1111-1111-111111111111',
    );
    const filenameB = await promoteSubmissionImage(
      pathB,
      APPROVED_DIR,
      'Autor Desconhecido',
      'Sem Título',
      '22222222-2222-2222-2222-222222222222',
    );

    expect(filenameA).not.toBe(filenameB);

    const contentA = await import('node:fs/promises').then((fs) =>
      fs.readFile(path.join(APPROVED_DIR, filenameA), 'utf-8'),
    );
    const contentB = await import('node:fs/promises').then((fs) =>
      fs.readFile(path.join(APPROVED_DIR, filenameB), 'utf-8'),
    );
    expect(contentA).toBe('conteúdo-a');
    expect(contentB).toBe('conteúdo-b');
  });

  it('mantém o nome legível (slug artista-título) com o sufixo no final', async () => {
    const pendingPath = path.join(PENDING_DIR, 'c.webp');
    await writeFile(pendingPath, 'x');

    const filename = await promoteSubmissionImage(
      pendingPath,
      APPROVED_DIR,
      'Rembrandt',
      'A Volta do Filho Pródigo',
      '33333333-3333-3333-3333-333333333333',
    );

    expect(filename).toMatch(/^rembrandt-a-volta-do-filho-prodigo-33333333\.webp$/);
  });
});
