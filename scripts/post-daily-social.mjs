#!/usr/bin/env node
/**
 * Publica a "Pintura do Dia" (GET /artworks/daily, já sincronizada com o
 * Lecionário — ver ROADMAP "Pintura do Dia ligada à leitura litúrgica")
 * no Instagram (@artecristadiaria), na Página do Facebook "Arte Cristã
 * Diária" e no Threads. Ver ROADMAP "Publicação automática — Arte
 * Cristã Diária" pra todo o histórico da configuração de cada
 * plataforma.
 *
 * Script standalone, sem dependência de pacote (só `fetch` nativo do
 * Node 20+) — não faz parte do workspace pnpm de propósito, roda
 * isolado no workflow do GitHub Actions sem precisar instalar nada.
 *
 * Variáveis de ambiente esperadas (secrets do GitHub Actions):
 *   INSTAGRAM_ACCESS_TOKEN     — token de usuário de longa duração (60
 *                                dias, precisa renovar — ver ROADMAP)
 *   INSTAGRAM_ACCOUNT_ID       — ID da conta Instagram Business
 *   FACEBOOK_PAGE_ACCESS_TOKEN — token de Página (não expira como o do
 *                                Instagram, derivado de um token de
 *                                usuário de longa duração)
 *   FACEBOOK_PAGE_ID           — ID da Página do Facebook
 *   THREADS_ACCESS_TOKEN       — token de usuário de longa duração
 *   THREADS_USER_ID            — ID da conta Threads (confirmado contra
 *                                a própria API, não só a tela do painel
 *                                — mesma lição do Instagram)
 *
 * PLATFORMS (opcional, não-secret): lista separada por vírgula de quais
 * plataformas publicar nessa execução — "instagram,facebook,threads"
 * (padrão, todas) ou um subconjunto, ex. "threads" sozinho pra testar
 * uma plataforma nova sem duplicar post nas outras que já publicaram
 * a obra do dia.
 *
 * Cada plataforma publica de forma independente — falha numa não
 * bloqueia as outras, mas o script termina com erro (exit 1) se
 * QUALQUER uma selecionada falhar, pra nunca mascarar falha real.
 *
 * Uso: node scripts/post-daily-social.mjs
 *      PLATFORMS=threads node scripts/post-daily-social.mjs
 */

const API_BASE = 'https://api-biblianaarte.narniano.com/api/v1';
const WEB_BASE = 'https://biblianaarte.narniano.com';
const IG_GRAPH_BASE = 'https://graph.instagram.com/v21.0';
const FB_GRAPH_BASE = 'https://graph.facebook.com/v21.0';
const THREADS_GRAPH_BASE = 'https://graph.threads.net/v1.0';

// Instagram e Facebook cortam em 2200 caracteres — usamos o mesmo teto
// pras duas (mesma voz, mesma legenda, sem motivo real pra divergir).
// Threads é bem mais curto (500 caracteres, link incluso, sem
// encurtamento automático de URL) — legenda própria, mais enxuta.
const MAX_DESCRIPTION_CHARS = 700;
const MAX_QUOTE_CHARS = 250;
const THREADS_MAX_CHARS = 500;

const PLATFORMS = new Set(
  (process.env.PLATFORMS ?? 'instagram,facebook,threads').split(',').map((p) => p.trim()),
);

const IG_TOKEN = PLATFORMS.has('instagram') ? requireEnv('INSTAGRAM_ACCESS_TOKEN') : null;
const IG_ACCOUNT_ID = PLATFORMS.has('instagram') ? requireEnv('INSTAGRAM_ACCOUNT_ID') : null;
const FB_PAGE_TOKEN = PLATFORMS.has('facebook') ? requireEnv('FACEBOOK_PAGE_ACCESS_TOKEN') : null;
const FB_PAGE_ID = PLATFORMS.has('facebook') ? requireEnv('FACEBOOK_PAGE_ID') : null;
const THREADS_TOKEN = PLATFORMS.has('threads') ? requireEnv('THREADS_ACCESS_TOKEN') : null;
const THREADS_USER_ID = PLATFORMS.has('threads') ? requireEnv('THREADS_USER_ID') : null;

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
 *  redes renderiza. */
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

function bareQuote(ref) {
  return capitalizeFirstLetter(ref.passageText.trim().replace(/^["“]|["”]$/g, ''));
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
    lines.push('');
    lines.push(`"${truncateAtSentence(bareQuote(ref), MAX_QUOTE_CHARS)}"`);
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

/** Threads corta em 500 caracteres (link incluso, sem encurtar URL) —
 *  pedido do Rilson (2026-09-04): pra Threads especificamente, ir no
 *  essencial — título, autor, só a CITAÇÃO da referência (livro/
 *  capítulo/verso, não o texto do versículo) e o link. Sem a descrição
 *  longa, sem o texto da passagem, sem os múltiplos hashtags do
 *  Instagram — o risco de estourar 500 caracteres em algum título maior
 *  fica muito menor assim. */
function buildThreadsCaption(artwork) {
  const ref = pickReference(artwork.references ?? []);
  const lines = [];

  lines.push(`${artwork.title}${artwork.year ? ` (${artwork.year})` : ''} — ${artwork.artistOrDirector}`);
  if (ref) {
    lines.push(formatReference(ref));
  }

  lines.push('');
  lines.push(`${WEB_BASE}/obra/${artwork.id}`);

  const caption = lines.join('\n');
  // Rede de segurança: se mesmo assim passar de 500 (título muito
  // longo, por exemplo), corta o texto inteiro no limite.
  return caption.length <= THREADS_MAX_CHARS ? caption : truncateAtSentence(caption, THREADS_MAX_CHARS);
}

async function graphPost(base, path, params) {
  // Retry só pra erro TRANSITÓRIO (Threads volta `500 {"code":2,
  // "is_transient":true}` e Instagram/Facebook às vezes `400` com
  // `is_transient`... "Failed to decrypt" no IG é token morto [190],
  // NUNCA entra nesse retry). Meta documenta esses transient como
  // "retry later" — a página volta 3s depois. 5 tentativas, 5s de
  // espera entre elas; erro permanente (190/400/código 4xx) aborta
  // direto sem gastar tentativa.
  const MAX_ATTEMPTS = 5;
  const RETRY_DELAY_MS = 5000     // 5 garfadas de 5s = 20s de tolerância,
  ;                                // bem abaixo do timeout do job (20min)
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    const res = await fetch(url, { method: 'POST' });
    const body = await res.json();

    const isTransient =
      body?.error?.is_transient === true ||
      body?.error?.code === 2 ||
      (typeof res.status === 'number' && res.status >= 500);

    if (res.ok) return body;
    if (!isTransient) {
      throw new Error(`Graph API ${path} falhou (${res.status}): ${JSON.stringify(body)}`);
    }
    lastError = body;
    if (attempt < MAX_ATTEMPTS) {
      console.log(`⏳ erro transitório (${res.status}) — tentativa ${attempt}/${MAX_ATTEMPTS}, aguardando ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
  throw new Error(`Graph API ${path} falhou definitivamente após ${MAX_ATTEMPTS} tentativas: ${JSON.stringify(lastError)}`);
}

/** Container de mídia (imagem) não costuma demorar pra ficar pronto,
 *  mas checar `status`/`status_code` antes de publicar evita o erro
 *  esporádico de "mídia ainda não pronta" — poll curto, não bloqueia
 *  por muito tempo se algo estiver genuinamente errado. Instagram e
 *  Threads usam nomes de campo ligeiramente diferentes pro status. */
async function waitForContainerReady(base, creationId, token, statusField) {
  const attempts = 5;
  const delayMs = 2000;
  for (let i = 0; i < attempts; i++) {
    const url = new URL(`${base}/${creationId}`);
    url.searchParams.set('fields', statusField);
    url.searchParams.set('access_token', token);
    const res = await fetch(url);
    const body = await res.json();
    const status = body[statusField];
    if (status === 'FINISHED') return;
    if (status === 'ERROR') {
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
  await waitForContainerReady(IG_GRAPH_BASE, container.id, IG_TOKEN, 'status_code');

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

async function publishToThreads(imageUrl, caption) {
  console.log('▶ [Threads] Criando container de mídia...');
  const container = await graphPost(THREADS_GRAPH_BASE, `/${THREADS_USER_ID}/threads`, {
    media_type: 'IMAGE',
    image_url: imageUrl,
    text: caption,
    access_token: THREADS_TOKEN,
  });

  console.log('▶ [Threads] Aguardando processamento...');
  await waitForContainerReady(THREADS_GRAPH_BASE, container.id, THREADS_TOKEN, 'status');

  console.log('▶ [Threads] Publicando...');
  const published = await graphPost(THREADS_GRAPH_BASE, `/${THREADS_USER_ID}/threads_publish`, {
    creation_id: container.id,
    access_token: THREADS_TOKEN,
  });

  return published.id;
}

async function main() {
  console.log(`▶ Plataformas selecionadas: ${[...PLATFORMS].join(', ')}`);
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
  // Instagram e Facebook rejeitam imagem fora da proporção 4:5–1.91:1
  // (achado em produção, 2026-09-26: pintura panorâmica de 2.39:1
  // derrubou o post do dia enquanto o Threads, mais tolerante, publicou
  // normal). A API gera essa versão sob demanda — devolve a original sem
  // alteração quando já está dentro do limite, senão adiciona moldura.
  // Threads continua na imagem original (nunca teve esse problema).
  const socialImageUrl = `${API_BASE}/artworks/${artwork.id}/social-image`;
  const caption = buildCaption(artwork);
  console.log('▶ Legenda (Instagram/Facebook) montada:\n' + caption);

  const jobs = [];
  if (PLATFORMS.has('instagram')) jobs.push(['Instagram', publishToInstagram(socialImageUrl, caption)]);
  if (PLATFORMS.has('facebook')) jobs.push(['Facebook', publishToFacebook(socialImageUrl, caption)]);
  if (PLATFORMS.has('threads')) {
    const threadsCaption = buildThreadsCaption(artwork);
    console.log('▶ Legenda (Threads) montada:\n' + threadsCaption);
    jobs.push(['Threads', publishToThreads(imageUrl, threadsCaption)]);
  }

  if (jobs.length === 0) {
    throw new Error(`PLATFORMS="${[...PLATFORMS].join(',')}" não bateu com nenhuma plataforma conhecida.`);
  }

  // Publica em todas de forma independente — uma falhar não impede as
  // outras de sair. Erros de cada uma ficam registrados no resultado, e
  // o script só decide se falha como um todo no final.
  const results = await Promise.allSettled(jobs.map(([, promise]) => promise));

  let hadFailure = false;
  results.forEach((result, i) => {
    const [name] = jobs[i];
    if (result.status === 'fulfilled') {
      console.log(`✅ ${name} publicado! ID do post: ${result.value}`);
    } else {
      console.error(`❌ ${name} falhou:`, result.reason.message);
      hadFailure = true;
    }
  });

  if (hadFailure) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Falha inesperada:', error.message);
  process.exit(1);
});
