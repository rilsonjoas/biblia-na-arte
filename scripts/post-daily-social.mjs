#!/usr/bin/env node
/**
 * Publica a "Pintura do Dia" (GET /artworks/daily, já sincronizada com o
 * Lecionário — ver ROADMAP "Pintura do Dia ligada à leitura litúrgica")
 * no Instagram (@artecristadiaria) e na Página do Facebook "Arte Cristã
 * Diária". Ver ROADMAP "Publicação automática — Arte Cristã Diária"
 * pra todo o histórico da configuração de cada plataforma.
 *
 * Script standalone, sem dependência de pacote (só `fetch` nativo do
 * Node 20+) — não faz parte do workspace pnpm de propósito, roda
 * isolado no workflow do GitHub Actions sem precisar instalar nada.
 *
 * Variáveis de ambiente esperadas (secrets do GitHub Actions):
 *   INSTAGRAM_ACCESS_TOKEN     — token de usuário de longa duração (60
 *                                dias, precisa renovar — ver ROADMAP)
 *   INSTAGRAM_ACCOUNT_ID       — ID da conta Instagram Business
 *                                (confirmado contra a própria API, não
 *                                o número mostrado na tela do wizard)
 *   FACEBOOK_PAGE_ACCESS_TOKEN — token de Página (derivado de um token
 *                                de usuário de longa duração — não tem
 *                                prazo de expiração como o do Instagram)
 *   FACEBOOK_PAGE_ID           — ID da Página do Facebook
 *
 * As duas plataformas publicam de forma independente — falha numa não
 * bloqueia a outra, mas o script termina com erro (exit 1) se QUALQUER
 * uma falhar, pra nunca mascarar uma falha real.
 *
 * Uso: node scripts/post-daily-social.mjs
 */

const API_BASE = 'https://api-biblianaarte.narniano.com/api/v1';
const WEB_BASE = 'https://biblianaarte.narniano.com';
const IG_GRAPH_BASE = 'https://graph.instagram.com/v21.0';
const FB_GRAPH_BASE = 'https://graph.facebook.com/v21.0';

// Instagram corta a legenda em 2200 caracteres (Facebook é bem mais
// generoso, mas usamos o mesmo teto pras duas — mesma voz, mesma
// legenda, sem motivo real pra divergir). Reservamos um teto pra
// descrição (a parte mais valiosa e mais variável em tamanho — mediana
// de ~880 caracteres, mas vai até 3600+) e um teto menor pra citação
// bíblica, deixando folga pra título/autor/local/link/hashtags.
const MAX_DESCRIPTION_CHARS = 700;
const MAX_QUOTE_CHARS = 250;

const IG_TOKEN = requireEnv('INSTAGRAM_ACCESS_TOKEN');
const IG_ACCOUNT_ID = requireEnv('INSTAGRAM_ACCOUNT_ID');
const FB_PAGE_TOKEN = requireEnv('FACEBOOK_PAGE_ACCESS_TOKEN');
const FB_PAGE_ID = requireEnv('FACEBOOK_PAGE_ID');

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
 *  aprofundamento histórico) e sem sintaxe de markdown, que nenhuma das
 *  duas redes renderiza. */
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

/** Alguns trechos de `passageText` são o MEIO de uma frase maior (ex.:
 *  "eis que a mão do Senhor...", de um versículo que na tradução ACF
 *  completa começa com "Eis") e vêm em minúscula na fonte. Como citação
 *  isolada na legenda, isso lê como erro de digitação — capitaliza a
 *  primeira letra visível (ignora aspas/parênteses na frente). */
function capitalizeFirstLetter(text) {
  const match = text.match(/[a-zà-ÿ]/i);
  if (!match) return text;
  const index = match.index;
  return text.slice(0, index) + text[index].toUpperCase() + text.slice(index + 1);
}

function buildCaption(artwork) {
  const ref = pickReference(artwork.references ?? []);
  const intro = extractDescriptionIntro(artwork.description);
  const lines = [];

  lines.push(`${artwork.title}${artwork.year ? ` (${artwork.year})` : ''}`);
  lines.push(artwork.artistOrDirector);

  if (intro) {
    lines.push('');
    lines.push(truncateAtSentence(intro, MAX_DESCRIPTION_CHARS));
  }

  if (ref?.passageText) {
    // passageText já vem com aspas próprias na origem — não duplicar.
    const bare = capitalizeFirstLetter(ref.passageText.trim().replace(/^["“]|["”]$/g, ''));
    lines.push('');
    lines.push(`"${truncateAtSentence(bare, MAX_QUOTE_CHARS)}"`);
    lines.push(`— ${formatReference(ref)}`);
  }

  if (artwork.location) {
    lines.push('');
    lines.push(artwork.location);
  }

  lines.push('');
  lines.push(`Veja a obra completa (contexto histórico, outras referências) em ${WEB_BASE}/obra/${artwork.id}`);
  lines.push('');
  lines.push('#BíbliaNaArte #ArteCristã #ArteSacra #Devocional');

  return lines.join('\n');
}

async function graphPost(base, path, params) {
  const url = new URL(`${base}${path}`);
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
    const url = new URL(`${IG_GRAPH_BASE}/${creationId}`);
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

async function publishToInstagram(imageUrl, caption) {
  console.log('▶ [Instagram] Criando container de mídia...');
  const container = await graphPost(IG_GRAPH_BASE, `/${IG_ACCOUNT_ID}/media`, {
    image_url: imageUrl,
    caption,
    access_token: IG_TOKEN,
  });

  console.log('▶ [Instagram] Aguardando processamento...');
  await waitForContainerReady(container.id);

  console.log('▶ [Instagram] Publicando...');
  const published = await graphPost(IG_GRAPH_BASE, `/${IG_ACCOUNT_ID}/media_publish`, {
    creation_id: container.id,
    access_token: IG_TOKEN,
  });

  return published.id;
}

async function publishToFacebook(imageUrl, caption) {
  console.log('▶ [Facebook] Publicando na Página...');
  const published = await graphPost(FB_GRAPH_BASE, `/${FB_PAGE_ID}/photos`, {
    url: imageUrl,
    caption,
    access_token: FB_PAGE_TOKEN,
  });

  return published.post_id ?? published.id;
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

  // Publica nas duas plataformas de forma independente — uma falhar não
  // impede a outra de sair. Erros de cada uma ficam registrados no
  // resultado, e o script só decide se falha como um todo no final.
  const results = await Promise.allSettled([
    publishToInstagram(imageUrl, caption),
    publishToFacebook(imageUrl, caption),
  ]);

  const [instagram, facebook] = results;
  let hadFailure = false;

  if (instagram.status === 'fulfilled') {
    console.log(`✅ Instagram publicado! ID do post: ${instagram.value}`);
  } else {
    console.error('❌ Instagram falhou:', instagram.reason.message);
    hadFailure = true;
  }

  if (facebook.status === 'fulfilled') {
    console.log(`✅ Facebook publicado! ID do post: ${facebook.value}`);
  } else {
    console.error('❌ Facebook falhou:', facebook.reason.message);
    hadFailure = true;
  }

  if (hadFailure) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Falha inesperada:', error.message);
  process.exit(1);
});
