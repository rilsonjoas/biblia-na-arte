/**
 * Regras puras da renovação dos tokens da Meta (Instagram e Threads), separadas do script interativo
 * (`renew-token.mjs`) para serem testadas sem rede.
 *
 * Por que existe: os scripts antigos (`renew-ig-token.mjs`, `renew-threads-token.mjs`) liam o app secret de
 * `/tmp/opencode/.stats-secrets`, que não existe mais, e não funcionavam. O token long-lived (60 dias) se
 * renova com o próprio token (endpoint de refresh), sem app secret, desde que ainda não tenha vencido e
 * tenha pelo menos 24 h de vida. O app secret só é preciso para trocar um token short-lived por um long-lived.
 */

export const PLATAFORMAS = {
  threads: {
    secret: 'THREADS_ACCESS_TOKEN',
    base: 'https://graph.threads.net',
    versao: 'v1.0',
    refresh: 'th_refresh_token',
    troca: 'th_exchange_token',
  },
  instagram: {
    secret: 'INSTAGRAM_ACCESS_TOKEN',
    base: 'https://graph.instagram.com',
    versao: 'v21.0',
    refresh: 'ig_refresh_token',
    troca: 'ig_exchange_token',
  },
};

function plataforma(nome) {
  const p = PLATAFORMAS[nome];
  if (!p) throw new Error(`plataforma desconhecida: ${nome} (use threads ou instagram)`);
  return p;
}

function comQuery(url, params) {
  const u = new URL(url);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return u.toString();
}

/** Renova um token long-lived ainda válido. Só precisa do token. */
export function urlRenovar(nome, token) {
  const p = plataforma(nome);
  return comQuery(`${p.base}/refresh_access_token`, { grant_type: p.refresh, access_token: token });
}

/** Troca um token short-lived por um long-lived. Precisa do app secret. */
export function urlTrocar(nome, tokenCurto, appSecret) {
  const p = plataforma(nome);
  return comQuery(`${p.base}/access_token`, {
    grant_type: p.troca,
    client_secret: appSecret,
    access_token: tokenCurto,
  });
}

/** Confirma de quem é o token (id e username). */
export function urlMe(nome, token) {
  const p = plataforma(nome);
  return `${p.base}/${p.versao}/me?fields=id,username&access_token=${token}`;
}

/**
 * Interpreta a resposta de refresh/troca. `dias` arredonda para baixo: nunca promete mais do que tem.
 * O motivo de falha nunca contém o token.
 */
export function lerRenovacao(corpo) {
  if (corpo?.error) {
    const e = corpo.error;
    return { ok: false, motivo: `erro ${e.code ?? '?'}${e.error_subcode ? `/${e.error_subcode}` : ''}: ${e.message ?? 'sem mensagem'}` };
  }
  if (typeof corpo?.access_token !== 'string' || corpo.access_token === '') {
    return { ok: false, motivo: 'a resposta não trouxe access_token' };
  }
  if (typeof corpo.expires_in !== 'number') {
    return { ok: false, motivo: 'a resposta não trouxe expires_in' };
  }
  return { ok: true, token: corpo.access_token, dias: Math.floor(corpo.expires_in / 86400) };
}
