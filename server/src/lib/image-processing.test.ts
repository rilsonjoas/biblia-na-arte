import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { promoteSubmissionImage, generateSocialImage } from './image-processing.js';

/** Gera um JPEG de teste com dimensões exatas, sem depender de arquivo
 *  fixture — o conteúdo visual não importa pros testes de proporção. */
async function makeTestImage(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 120, g: 80, b: 40 } },
  })
    .jpeg()
    .toBuffer();
}

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

describe('generateSocialImage', () => {
  it('devolve a imagem sem alteração de dimensões quando já está dentro do limite do Instagram', async () => {
    // 4:3 (1.33) está dentro da faixa aceita (4:5 a 1.91:1).
    const input = await makeTestImage(800, 600);
    const output = await generateSocialImage(input);
    const meta = await sharp(output).metadata();

    expect(meta.width).toBe(800);
    expect(meta.height).toBe(600);
  });

  it('adiciona moldura (aumenta a altura) numa imagem panorâmica demais', async () => {
    // Achado real 2026-09-26: pintura 800x335 (2.39:1) rejeitada pelo
    // Instagram — este teste reproduz exatamente essa proporção.
    const input = await makeTestImage(800, 335);
    const output = await generateSocialImage(input);
    const meta = await sharp(output).metadata();

    expect(meta.width).toBe(800);
    expect(meta.height).toBeGreaterThan(335);
    const ratio = meta.width! / meta.height!;
    expect(ratio).toBeLessThanOrEqual(1.91);
  });

  it('adiciona moldura (aumenta a largura) numa imagem vertical demais', async () => {
    // 2:5 (0.4) é mais estreito que o limite retrato (4:5 = 0.8).
    const input = await makeTestImage(400, 1000);
    const output = await generateSocialImage(input);
    const meta = await sharp(output).metadata();

    expect(meta.height).toBe(1000);
    expect(meta.width).toBeGreaterThan(400);
    const ratio = meta.width! / meta.height!;
    expect(ratio).toBeGreaterThanOrEqual(4 / 5);
  });

  it('preserva a obra inteira sem cortar — não usa fit "cover"', async () => {
    const input = await makeTestImage(800, 335);
    const output = await generateSocialImage(input);
    const meta = await sharp(output).metadata();

    // A imagem original inteira (335px de altura) precisa caber dentro
    // do novo canvas, não ser cortada pra preencher o quadro.
    expect(meta.height).toBeGreaterThanOrEqual(335);
  });
});
