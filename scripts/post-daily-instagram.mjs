#!/usr/bin/env node
/**
 * Publica a "Pintura do Dia" (GET /artworks/daily, já sincronizada com o
 * Lecionário — ver ROADMAP "Pintura do Dia ligada à leitura litúrgica")
 * no Instagram (@artecristadiaria), via Instagram API with Instagram
 * Login (não usa Página do Facebook — fluxo mais novo da Meta,
 * configurado em 2026-09-03, ver ROADMAP "Publicação automática —
 * Arte Cristã Diária").
 *
 * Script standalone, sem dependência de pacote (só `fetch` nativo do
 * Node 20+) — não faz parte do workspace pnpm de propósito, roda
 * isolado no workflow do GitHub Actions sem precisar instalar nada.
 *
 * Variáveis de ambiente esperadas (secrets do GitHub Actions):
 *   INSTAGRAM_ACCESS_TOKEN — token de usuário de longa duração (60 dias)
 *   INSTAGRAM_ACCOUNT_ID   — ID da conta Instagram Business (confirmado
 *                            contra a própria API, não o número mostrado
 *                            na tela do wizard da Meta — os dois
 *                            divergiram na configuração inicial, ver
 *                            ROADMAP)
 *
 * Uso: node scripts/post-daily-instagram.mjs
 */

const API_BASE = 'https://api-biblianaarte.narniano.com/api/v1';
const WEB_BASE = 'https://biblianaarte.narniano.com';
const GRAPH_BASE = 'https://graph.instagram.com/v21.0';

// Instagram corta a legenda em 2200 caracteres. Reservamos um teto pra
// descrição (a parte mais valiosa e mais variável em tamanho — mediana
// de ~880 caracteres, mas vai até 3600+) e um teto menor pra citação
// bíblica, deixando folga pra título/autor/local/link/hashtags.
const MAX_DESCRIPTION_CHARS = 700;
const MAX_QUOTE_CHARS = 250;

const IG_TOKEN = requireEnv('INSTAGRAM_ACCESS_TOKEN');
const IG_ACCOUNT_ID = requireEnv('INSTAGRAM_ACCOUNT_ID');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`❌ Variável de ambiente obrigatória ausente: ${name}`);
    process.exit(1);
  }
  return value;
}

/** Corta um texto até o fim da última frase completa antes do limite —
 *  nunca corta uma frase no meio. Usado tanto pra citação bíblica
 *  (passagens de capítulo inteiro chegam a ~2200 caracteres) quanto
 *  pra descrição da obra (a intro chega a mais de 3000). */
function truncateAtSentence(text, maxChars) {
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars);
  const lastPeriod = cut.lastIndexOf('.');
  const safe = lastPeriod > maxChars * 0.4 ? cut.slice(0, lastPeriod + 1) : cut;
  return `${safe} (…)`;
}

/** A `description` da obra é markdown (tem "**negrito**" e um cabeçalho
 *  "### Contexto Histórico" mais pra frente) — pra legenda queremos só
 *  o parágrafo introdutório (a descrição real da obra em si, sem o
 *  aprofundamento histórico) e sem sintaxe de markdown, que o Instagram
 *  não renderiza. */
function extractDescriptionIntro(description) {
  if (!description) return null;
  const headerIndex = description.search(/\n#{2,3} /);
  const intro = headerIndex === -1 ? description : description.slice(0, headerIndex);
  return intro.replace(/\*\*/g, '').trim();
}

/** Entre as referências catalogadas da obra, prefere a de citação MAIS
 *  CURTA com texto real — dá uma citação mais "de legenda", não a
 *  passagem inteira de um capítulo só porque veio primeiro na lista. */
function pickReference(references) {
  const withText = references.filter((r) => r.passageText);
  if (withText.length === 0) return references[0] ?? null;
  return withText.reduce((shortest, r) =>
    r.passageText.length < shortest.passageText.length ? r : shortest,
  );
}

function formatReference(ref) {
  return ref.verses ? `${ref.book} ${ref.chapter}:${ref.verses}` : `${ref.book} ${ref.chapter}`;
}

function buildCaption(artwork) {
  const ref = pickReference(artwork.references ?? []);
  const intro = extractDescriptionIntro(artwork.description);
  const lines = [];

  lines.push(`🎨 ${artwork.title}${artwork.year ? ` (${artwork.year})` : ''}`);
  lines.push(`✍️ ${artwork.artistOrDirector}`);

  if (intro) {
    lines.push('');
    lines.push(truncateAtSentence(intro, MAX_DESCRIPTION_CHARS));
  }

  if (ref?.passageText) {
    // passageText já vem com aspas próprias na origem — não duplicar.
    const bare = ref.passageText.trim().replace(/^["“]|["”]$/g, '');
    lines.push('');
    lines.push(`"${truncateAtSentence(bare, MAX_QUOTE_CHARS)}"`);
    lines.push(`— ${formatReference(ref)}`);
  }

  if (artwork.location) {
    lines.push('');
    lines.push(`📍 ${artwork.location}`);
  }

  lines.push('');
  lines.push(`Veja a obra completa (contexto histórico, outras referências) em ${WEB_BASE}/obra/${artwork.id}`);
  lines.push('');
  lines.push('#BíbliaNaArte #ArteCristã #ArteSacra #Devocional');

  return lines.join('\n');
}

async function graphRequest(path, params) {
  const url = new URL(`${GRAPH_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const res = await fetch(url, { method: 'POST' });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`Graph API ${path} falhou (${res.status}): ${JSON.stringify(body)}`);
  }
  return body;
}

/** Container de mídia (imagem) não costuma demorar pra ficar pronto,
 *  mas checar `status_code` antes de publicar evita o erro esporádico
 *  de "mídia ainda não pronta" — poll curto, não bloqueia por muito
 *  tempo se algo estiver genuinamente errado. */
async function waitForContainerReady(creationId, { attempts = 5, delayMs = 2000 } = {}) {
  for (let i = 0; i < attempts; i++) {
    const url = new URL(`${GRAPH_BASE}/${creationId}`);
    url.searchParams.set('fields', 'status_code');
    url.searchParams.set('access_token', IG_TOKEN);
    const res = await fetch(url);
    const body = await res.json();
    if (body.status_code === 'FINISHED') return;
    if (body.status_code === 'ERROR') {
      throw new Error(`Container de mídia falhou: ${JSON.stringify(body)}`);
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  // Não travou em ERROR — segue tentando publicar mesmo sem confirmação
  // explícita de FINISHED (a maioria das imagens processa quase
  // instantaneamente; isso é rede de segurança, não bloqueio duro).
}

async function main() {
  console.log('▶ Buscando a Pintura do Dia...');
  const res = await fetch(`${API_BASE}/artworks/daily`);
  if (!res.ok) {
    throw new Error(`Falha ao buscar /artworks/daily: ${res.status}`);
  }
  const artwork = await res.json();
  console.log(`▶ Obra de hoje: "${artwork.title}" — ${artwork.artistOrDirector}`);

  if (!artwork.imageUrl) {
    throw new Error('Obra do dia não tem imagem — abortando (não publica sem imagem).');
  }

  const imageUrl = `${WEB_BASE}${artwork.imageUrl}`;
  const caption = buildCaption(artwork);
  console.log('▶ Legenda montada:\n' + caption);

  console.log('▶ Criando container de mídia no Instagram...');
  const container = await graphRequest(`/${IG_ACCOUNT_ID}/media`, {
    image_url: imageUrl,
    caption,
    access_token: IG_TOKEN,
  });

  console.log('▶ Aguardando processamento...');
  await waitForContainerReady(container.id);

  console.log('▶ Publicando...');
  const published = await graphRequest(`/${IG_ACCOUNT_ID}/media_publish`, {
    creation_id: container.id,
    access_token: IG_TOKEN,
  });

  console.log(`✅ Publicado! ID do post: ${published.id}`);
}

main().catch((error) => {
  console.error('❌ Falha ao publicar:', error.message);
  process.exit(1);
});
