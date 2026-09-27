/**
 * Legendas do post diário — funções puras, sem efeito colateral.
 *
 * POR QUE ESTE ARQUIVO EXISTE (2026-09-27): as funções de legenda viviam
 * dentro de `post-daily-social.mjs`, que não dava pra importar em teste
 * por dois motivos cumulativos — `requireEnv()` roda no *module scope*
 * (não dentro de `main()`), então importar o arquivo sem as variáveis de
 * ambiente chamava `process.exit(1)`; e o `main()` é executado na
 * última linha, então importar publicava de verdade. Extrair deixa as
 * funções testáveis sem rede, sem token e sem risco de post acidental.
 *
 * A interface é deliberadamente pequena: só os dois builders são
 * exportados. `truncateAtSentence`, `pickReference`, `bareQuote` e cia.
 * são implementação — são testados pelo COMPORTAMENTO que produzem em
 * `buildCaption`/`buildThreadsCaption`, não exportados pra teste direto.
 * Exportar helper só pra testá-lo é como testar implementação e não
 * contrato, e trava a refatoração sem ganho.
 *
 * `webBase` chega por parâmetro (e não constante do módulo) pra duas
 * razões: o módulo não carrega configuração global, e o teste pode
 * afirmar a string exata sem depender do domínio real.
 */

/** `utm_campaign` é FIXO de propósito: cada disparo é uma obra diferente,
 *  e um campaign por obra daria uma linha nova por dia no relatório sem
 *  responder pergunta nenhuma. O eixo "qual obra converte" já está no
 *  path (`/obra/:id`) — segmenta-se por path, que é o lugar certo. O que
 *  o UTM responde é "o Instagram gera clique?", e pra isso a campaign
 *  precisa ser o nome do funil, não da peça.
 *
 *  `utm_medium=post` segue a convenção já usada no resto do cluster
 *  (mesma forma nos posts da a-bancada-evangelica); `message` no WhatsApp,
 *  `social` no Reddit. */
const UTM_CAMPAIGN = 'artecristadiaria';

// Instagram e Facebook cortam em 2200 caracteres — usamos o mesmo teto
// pras duas (mesma voz, mesma legenda, sem motivo real pra divergir).
// Threads é bem mais curto (500 caracteres, link incluso, sem
// encurtamento automático de URL) — legenda própria, mais enxuta.
const MAX_DESCRIPTION_CHARS = 700;
const MAX_QUOTE_CHARS = 250;
const THREADS_MAX_CHARS = 500;

function withUtm(artworkId, source, webBase) {
  return `${webBase}/obra/${artworkId}?utm_source=${source}&utm_medium=post&utm_campaign=${UTM_CAMPAIGN}`;
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

/** Legenda do Instagram (e do Facebook, quando ele voltar a ser
 *  disparado — mesma voz, mesmo teto de 2200, sem motivo pra divergir). */
export function buildCaption(artwork, { source = 'instagram', webBase }) {
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
  lines.push(`Veja a obra completa (contexto histórico, outras referências) em ${withUtm(artwork.id, source, webBase)}`);
  lines.push('');
  lines.push('#BíbliaNaArte #ArteCristã #ArteSacra #Devocional');

  return lines.join('\n');
}

/** Legenda do Threads: 500 caracteres, link incluso, sem encurtamento
 *  de URL — só o essencial (título, autor, a CITAÇÃO da referência e o
 *  link), sem descrição longa e sem os hashtags do Instagram.
 *
 *  O corte de segurança é por fronteira de frase e a última linha é
 *  uma URL nua — por isso o teste `buildThreadsCaption - título longo`
 *  em `social-caption.test.mjs` existe: ele trava o comportamento de
 *  "legenda dentro do teto" e de "link presente", que é o contrato real
 *  desta função. Sem ele, um título catalogado com 400+ caracteres
 *  publicaria um post sem link e o cron reportaria sucesso. */
export function buildThreadsCaption(artwork, { webBase }) {
  const ref = pickReference(artwork.references ?? []);
  const lines = [];

  lines.push(`${artwork.title}${artwork.year ? ` (${artwork.year})` : ''} — ${artwork.artistOrDirector}`);
  if (ref) {
    lines.push(formatReference(ref));
  }

  lines.push('');
  lines.push(withUtm(artwork.id, 'threads', webBase));

  const caption = lines.join('\n');
  // Rede de segurança: se mesmo assim passar de 500 (título muito
  // longo, por exemplo), corta o texto inteiro no limite.
  return caption.length <= THREADS_MAX_CHARS ? caption : truncateAtSentence(caption, THREADS_MAX_CHARS);
}
