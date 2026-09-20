import type { FastifyInstance } from 'fastify';
import { getArtworkBySlugOrId } from '../db/queries.js';
import { idOrSlugParamSchema } from '../schemas/common.schema.js';

const SITE_URL = 'https://biblianaarte.narniano.com';
const SITE_NAME = 'Bíblia na Arte';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Tira markdown básico (negrito/itálico) da descrição pra virar um
 *  resumo de texto puro, e corta num tamanho razoável pra og:description
 *  (WhatsApp/Facebook truncam em ~200 caracteres de qualquer forma). */
function plainTextSummary(markdown: string, maxLength = 200): string {
  const plain = markdown
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\n+/g, ' ')
    .trim();
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength).trimEnd()}…`;
}

/** Rota só pra crawlers de preview de link (WhatsApp, Facebook, Telegram,
 *  Twitter/X etc.) — nginx proxeia `/obra/:id` pra cá quando o User-Agent
 *  bate com um bot conhecido (ver web/nginx.conf). Esses bots não rodam
 *  JS, então o `<SEO>` do React (que só atualiza as meta tags depois de
 *  montar) nunca chega a rodar pra eles: sempre viam as tags genéricas
 *  fixas do index.html (achado real 2026-09-19, o Rilson compartilhou um
 *  link de obra no WhatsApp e apareceu preview genérico do site inteiro).
 *  Navegador de verdade nunca bate aqui — só recebe HTML mínimo com
 *  redirect, nunca a SPA de verdade. */
export async function shareRoutes(app: FastifyInstance) {
  app.get('/share/obra/:id', async (request, reply) => {
    const parsed = idOrSlugParamSchema.safeParse(request.params);
    const artwork = parsed.success ? await getArtworkBySlugOrId(parsed.data.id) : undefined;
    // Preview sempre aponta pra URL canônica (slug, quando a obra tiver
    // um) — mesmo se o link compartilhado ainda for o UUID antigo, o bot
    // de preview vê o padrão novo, não o que o usuário digitou.
    const targetUrl = artwork ? `${SITE_URL}/obra/${artwork.slug ?? artwork.id}` : `${SITE_URL}/`;

    const title = artwork
      ? `${artwork.title} — ${artwork.artistOrDirector} | ${SITE_NAME}`
      : `${SITE_NAME} — A Bíblia através da Arte e Cultura`;
    const description = artwork
      ? plainTextSummary(artwork.description)
      : 'Explore as profundas conexões entre a Bíblia e as artes visuais.';
    const image = artwork?.imageUrl
      ? `${SITE_URL}${artwork.imageUrl}`
      : `${SITE_URL}/hero-banner.jpg`;

    const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${escapeHtml(image)}">
<meta property="og:url" content="${escapeHtml(targetUrl)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${escapeHtml(image)}">
<meta http-equiv="refresh" content="0; url=${escapeHtml(targetUrl)}">
<link rel="canonical" href="${escapeHtml(targetUrl)}">
</head>
<body>
<p>Redirecionando para <a href="${escapeHtml(targetUrl)}">${escapeHtml(title)}</a>…</p>
</body>
</html>`;

    reply.header('Cache-Control', 'public, max-age=600, stale-while-revalidate=120');
    return reply.type('text/html; charset=utf-8').send(html);
  });
}
