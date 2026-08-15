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
  const urls: { loc: string; priority: string; changefreq: string }[] = [];

  // 1. Static Core Pages
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

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
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
  console.log(`✅ Sitemap gerado com ${urls.length} URLs em: ${OUTPUT_SITEMAP}`);
}

generateSitemap();
