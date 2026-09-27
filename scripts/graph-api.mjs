/**
 * Camada fina sobre a Graph API da Meta, isolada do script que publica.
 *
 * O motivo de existir separado: a decisão de "isso é transitório ou é erro
 * permanente?" é a parte que já errou quatro vezes em produção e não tinha
 * nenhum teste. Cada regra aqui veio de um incidente real:
 *
 *   2026-09-07, 09-11  sessão invalidada (`code 190`) — **nunca** entra em
 *                     retry: retentar token morto só gasta 20s pra falhar
 *                     do mesmo jeito, e mascara o motivo real.
 *   2026-09-17/18     Threads "Media Not Found" (`error_subcode 4279009`),
 *                     que a Meta marca `is_transient: false` mas que some
 *                     esperando — está na lista de retrentativa por isso.
 *   2026-09-18, 27/09  o mesmo 4279009, de novo, dois dias seguidos.
 *
 * Extrair para módulo próprio é o que torna testável: `fetch`, `sleep` e
 * `log` são injetados, então o teste exercita retry e espera sem rede e sem
 * esperar 5s de verdade. O script que publica só orquestra.
 */

/** Códigos que a Meta usa para "tenta de novo depois", sem `is_transient`. */
const TRANSIENT_ERROR_CODE = 2;

/**
 * "Media Not Found" no `threads_publish`: o container respondeu FINISHED
 * mas a mídia ainda não terminou de processar. A Meta diz que não é
 * transitório; na prática sumiu esperando, em 18/09 e 27/09.
 */
const MEDIA_NOT_FOUND_SUBCODE = 4279009;

/** Erro definitivo que nunca deve ser retentado (token morto/revogado). */
const FATAL_ERROR_CODE = 190;

/**
 * Decide se vale retentar.
 *
 * `is_transient: true` e `code: 2` são a Meta dizendo "retry later". O
 * subcode 4279009 e o 5xx entram por conta própria. O 190 mata na hora —
 * é o único caso em que sabemos que retentar não adianta.
 */
export function isGraphErrorTransient(body, status) {
  const error = body?.error;
  if (error?.code === FATAL_ERROR_CODE) return false;
  if (error?.is_transient === true) return true;
  if (error?.code === TRANSIENT_ERROR_CODE) return true;
  if (error?.error_subcode === MEDIA_NOT_FOUND_SUBCODE) return true;
  if (typeof status === 'number' && status >= 500) return true;
  return false;
}

/**
 * POST na Graph API com retry só para erro transitório.
 *
 * Erro permanente aborta na primeira, sem gastar tentativa. Estouradas as
 * tentativas, lança — quem chama decide se isso derruba o processo.
 */
export async function graphPost(base, path, params, options = {}) {
  const {
    fetchImpl = fetch,
    sleepImpl = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    log = () => {},
    maxAttempts = 5,
    retryDelayMs = 5000,
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    const res = await fetchImpl(url, { method: 'POST' });
    const body = await res.json();

    if (res.ok) return body;

    if (!isGraphErrorTransient(body, res.status)) {
      throw new Error(`Graph API ${path} falhou (${res.status}): ${JSON.stringify(body)}`);
    }

    lastError = body;
    if (attempt < maxAttempts) {
      log(`⏳ erro transitório (${res.status}) — tentativa ${attempt}/${maxAttempts}, aguardando ${retryDelayMs / 1000}s...`);
      await sleepImpl(retryDelayMs);
    }
  }

  throw new Error(
    `Graph API ${path} falhou definitivamente após ${maxAttempts} tentativas: ${JSON.stringify(lastError)}`,
  );
}

/**
 * Espera o container de mídia ficar pronto.
 *
 * Rede de segurança, não bloqueio duro: se não confirmar FINISHED em todas
 * as tentativas, segue para publicar mesmo assim — a maioria das imagens
 * processa quase instantaneamente, e travar aqui seria pior que o erro que
 * se quer evitar.
 */
export async function waitForContainerReady(base, creationId, token, statusField, options = {}) {
  const {
    fetchImpl = fetch,
    sleepImpl = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    attempts = 5,
    delayMs = 2000,
  } = options;

  for (let i = 0; i < attempts; i++) {
    const url = new URL(`${base}/${creationId}`);
    url.searchParams.set('fields', statusField);
    url.searchParams.set('access_token', token);
    const res = await fetchImpl(url);
    const body = await res.json();
    const status = body?.[statusField];

    if (status === 'FINISHED') return true;
    if (status === 'ERROR') {
      throw new Error(`Container de mídia falhou: ${JSON.stringify(body)}`);
    }
    await sleepImpl(delayMs);
  }
  return false;
}

/**
 * Lê `PLATFORMS` do ambiente. Vazio ou sem nome conhecido é erro, porque
 * publicar em plataforma nenhuma e sair com 0 é pior que falhar: o job
 * ficaria verde sem ter postado.
 */
export function parsePlatforms(raw, known = ['instagram', 'facebook', 'threads']) {
  const requested = (raw ?? 'instagram,facebook,threads')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  return new Set(requested.filter((p) => known.includes(p)));
}
