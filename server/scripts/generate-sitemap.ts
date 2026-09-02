#!/usr/bin/env tsx
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { bibleBooksSeed } from '../src/db/seed-data/bible-books.js';

const DOMAIN = process.env.SITE_DOMAIN ?? 'https://biblianaarte.narniano.com';
const OUTPUT_SITEMAP = path.resolve(import.meta.dirname, '../../web/public/sitemap.xml');
const VAULT_EXPORT_JSON = path.resolve(import.meta.dirname, 'vault-export.json');

interface ExportedArtwork {
  id?: string;
  slug?: string;
}

function generateSitemap() {
  const urls: { loc: string; priority: string; changefreq: string }[] = [];  // 1. Static Core Pages
  urls.push(
    { loc: `${DOMAIN}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${DOMAIN}/biblia`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${DOMAIN}/biblia?testament=old`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${DOMAIN}/biblia?testament=new`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${DOMAIN}/arte/painting`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${DOMAIN}/busca`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${DOMAIN}/sobre`, priority: '0.6', changefreq: 'monthly' },
    { loc: `${DOMAIN}/contribuir`, priority: '0.5', changefreq: 'monthly' },
  );

  // 2. All 66 Bible Books & their Chapters
  for (const book of bibleBooksSeed) {
    urls.push({
      loc: `${DOMAIN}/biblia/${book.slug}`,
      priority: '0.8',
      changefreq: 'weekly',
    });

    for (let ch = 1; ch <= book.chapters; ch++) {
      urls.push({
        loc: `${DOMAIN}/biblia/${book.slug}/${ch}`,
        priority: '0.7',
        changefreq: 'weekly',
      });

      // "Mapa de obras ↔ referências bíblicas" (/explorar, 2026-09-02):
      // hub de conexões da passagem (obras, temas, outros capítulos). Vai
      // junto de cada capítulo, espelhando /biblia 1:1 — o hub existe pra
      // qualquer capítulo (mesmo sem obras tem os "outros capítulos com
      // arte"), e essas URLs são a cauda longa de SEO ("pintura Bíblia
      // Gênesis 1"). Prioridade menor que a página canônica do capítulo.
      urls.push({
        loc: `${DOMAIN}/explorar/${book.slug}/${ch}`,
        priority: '0.5',
        changefreq: 'monthly',
      });
    }
  }

  // 3. Artworks from export JSON if present
  if (existsSync(VAULT_EXPORT_JSON)) {
    try {
      const data = JSON.parse(readFileSync(VAULT_EXPORT_JSON, 'utf-8')) as {
        artworks: ExportedArtwork[];
      };
      for (const art of data.artworks || []) {
        const idOrSlug = art.slug || art.id;
        if (idOrSlug) {
          urls.push({
            loc: `${DOMAIN}/obra/${idOrSlug}`,
            priority: '0.7',
            changefreq: 'monthly',
          });
        }
      }
    } catch {
      // ignore
    }
  }

  // 3b. Preserve URLs que JÁ estavam no sitemap mas não saem da geração
  // acima (ex.: /obra/:slug que sumiram do vault-export.json). Detalhe
  // importante pro deploy: o acervo tem 2.115+ URLs indexadas e um princípio
  // de nunca derrubar essas páginas (ver ROADMAP). Se o export ficar
  // desatualizado/parcial, regenerar não podia derrubar página nenhuma —
  // então fazemos UNIÃO com o sitemap atual, não substituição.
  // Uma URL que a geração produz de novo assume os valores novos (mais
  // corretos); as que não são mais produzidas mantêm o registro antigo.
  const existing: { loc: string; priority: string; changefreq: string }[] = [];
  if (existsSync(OUTPUT_SITEMAP)) {
    try {
      const xml = readFileSync(OUTPUT_SITEMAP, 'utf-8');
      const locRe = /<loc>([^<]+)<\/loc>/g;
      const freqRe = /<changefreq>([^<]+)<\/changefreq>/g;
      const priRe = /<priority>([^<]+)<\/priority>/g;
      const locs = [...xml.matchAll(locRe)].map((m) => m[1]);
      const freqs = [...xml.matchAll(freqRe)].map((m) => m[1]);
      const pris = [...xml.matchAll(priRe)].map((m) => m[1]);
      for (let i = 0; i < locs.length; i++) {
        const loc = locs[i];
        if (!loc) continue;
        existing.push({
          loc,
          priority: pris[i] ?? '0.5',
          changefreq: freqs[i] ?? 'weekly',
        });
      }
    } catch {
      // ignore
    }
  }

  const byLoc = new Map(urls.map((u) => [u.loc, u]));
  for (const prev of existing) {
    if (!byLoc.has(prev.loc)) {
      byLoc.set(prev.loc, prev);
    }
  }
  const merged = [...byLoc.values()];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${merged
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

  writeFileSync(OUTPUT_SITEMAP, xml.trim() + '\n', 'utf-8');
  console.log(`✅ Sitemap gerado com ${merged.length} URLs em: ${OUTPUT_SITEMAP}`);
}

generateSitemap();
