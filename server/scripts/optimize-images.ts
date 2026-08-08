#!/usr/bin/env tsx
/**
 * Otimizador de imagens usando Sharp:
 * Processa as imagens em web/public/images/, gerando versões WebP
 * otimizadas para carregamento ultra-rápido no navegador.
 *
 * Uso: pnpm --filter server exec tsx scripts/optimize-images.ts
 */
import { readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const IMAGES_DIR = path.resolve(import.meta.dirname, '../../web/public/images');

async function optimizeImages() {
  if (!existsSync(IMAGES_DIR)) {
    console.error(`Diretório de imagens não encontrado: ${IMAGES_DIR}`);
    return;
  }

  const files = readdirSync(IMAGES_DIR).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return ['.jpg', '.jpeg', '.png'].includes(ext);
  });

  console.log(`▶ Iniciando otimização de ${files.length} imagens...`);

  let totalOriginalBytes = 0;
  let totalOptimizedBytes = 0;
  let convertedCount = 0;

  for (const file of files) {
    const filePath = path.join(IMAGES_DIR, file);
    const originalSize = statSync(filePath).size;
    totalOriginalBytes += originalSize;

    const baseName = file.replace(/\.[^/.]+$/, '');
    const webpPath = path.join(IMAGES_DIR, `${baseName}.webp`);

    try {
      // Cria versão WebP com max-width 1600px e qualidade 82 (fidelidade para arte)
      await sharp(filePath)
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toFile(webpPath);

      const newSize = statSync(webpPath).size;
      totalOptimizedBytes += newSize;
      convertedCount++;

      if (convertedCount % 50 === 0 || convertedCount === files.length) {
        console.log(`⏳ ${convertedCount}/${files.length} imagens convertidas para WebP`);
      }
    } catch (err) {
      console.warn(`⚠️  Falha ao otimizar ${file}:`, (err as Error).message);
    }
  }

  const origMB = (totalOriginalBytes / 1024 / 1024).toFixed(1);
  const optMB = (totalOptimizedBytes / 1024 / 1024).toFixed(1);
  const savedPercent = totalOriginalBytes
    ? (((totalOriginalBytes - totalOptimizedBytes) / totalOriginalBytes) * 100).toFixed(0)
    : '0';

  console.log(`\n🎉 Concluído com sucesso!`);
  console.log(`📊 Original: ${origMB} MB ➜ WebP Otimizado: ${optMB} MB (Economia de ~${savedPercent}%)`);
}

optimizeImages().catch((err) => {
  console.error('Erro na otimização:', err);
  process.exit(1);
});
