/** Regras puras do redirecionamento de slug (ADR 007), sem banco: o reseed as usa
 *  pra decidir se o mapa `slug-redirects.json` é válido e se algum slug de obra
 *  ativa sumiu sem que ninguém tenha decidido isso. */

/** Quantos saltos (arestas) uma cadeia A→B→C… pode ter antes de ser recusada. */
export const MAX_REDIRECT_HOPS = 5;

export type RedirectProblemCode =
  | 'vazio'
  | 'autorredirecionamento'
  | 'ciclo'
  | 'cadeia-longa'
  | 'destino-fora-do-export'
  | 'slug-vivo-sombreado'
  | 'destino-removido'
  | 'removido-ainda-no-export'
  | 'formato-invalido';

export interface RedirectProblem {
  code: RedirectProblemCode;
  slug: string;
  detail: string;
}

/** Achata cadeias (A→B, B→C vira A→C) pra que a resolução em tempo de execução
 *  precise de um salto só. Recusa vazio, autorredirecionamento, ciclo e cadeia
 *  longa demais; essas entradas ficam de fora de `flat` e viram `problems`. */
export function flattenRedirects(raw: Readonly<Record<string, string>>): {
  flat: Record<string, string>;
  problems: RedirectProblem[];
} {
  const flat: Record<string, string> = {};
  const problems: RedirectProblem[] = [];
  const has = (slug: string) => Object.prototype.hasOwnProperty.call(raw, slug);

  for (const [from, to] of Object.entries(raw)) {
    if (!from || !to) {
      problems.push({ code: 'vazio', slug: from, detail: `origem "${from}" → destino "${to}"` });
      continue;
    }
    if (from === to) {
      problems.push({ code: 'autorredirecionamento', slug: from, detail: `${from} → ${to}` });
      continue;
    }

    const path = [from];
    let current = to;
    let hops = 1;
    let failed = false;

    while (has(current)) {
      if (path.includes(current)) {
        problems.push({ code: 'ciclo', slug: from, detail: [...path, current].join(' → ') });
        failed = true;
        break;
      }
      path.push(current);
      const next = raw[current];
      if (!next) {
        failed = true; // a entrada intermediária já é reportada como 'vazio' no próprio turno
        break;
      }
      current = next;
      hops += 1;
      if (hops > MAX_REDIRECT_HOPS) {
        problems.push({ code: 'cadeia-longa', slug: from, detail: `${[...path, current].join(' → ')} (${hops} saltos, máximo ${MAX_REDIRECT_HOPS})` });
        failed = true;
        break;
      }
    }

    if (!failed) flat[from] = current;
  }

  return { flat, problems };
}

/** Confere o mapa já achatado contra o que está no export. Reporta TODOS os
 *  problemas, não só o primeiro, pra quem revisa corrigir de uma vez. */
export function validateRedirects(
  flat: Readonly<Record<string, string>>,
  ctx: { exportSlugs: ReadonlySet<string>; removedSlugs: ReadonlySet<string> },
): RedirectProblem[] {
  const problems: RedirectProblem[] = [];

  for (const [from, to] of Object.entries(flat)) {
    if (ctx.exportSlugs.has(from)) {
      problems.push({ code: 'slug-vivo-sombreado', slug: from, detail: `${from} ainda é uma obra no export; redirecionar esconderia ela` });
    }
    if (!ctx.exportSlugs.has(to)) {
      problems.push({ code: 'destino-fora-do-export', slug: from, detail: `${from} → ${to}: o destino não existe no export` });
    }
    if (ctx.removedSlugs.has(to)) {
      problems.push({ code: 'destino-removido', slug: from, detail: `${from} → ${to}: o destino foi declarado removido` });
    }
  }

  for (const removed of ctx.removedSlugs) {
    if (ctx.exportSlugs.has(removed)) {
      problems.push({ code: 'removido-ainda-no-export', slug: removed, detail: `${removed} está em removed-slugs.json mas continua no export` });
    }
  }

  return problems;
}

/** Slugs de obras ATIVAS no banco que não estão no export e que ninguém
 *  explicou (nem redirecionamento, nem remoção declarada). Obra inativa não
 *  entra: não tem URL pública, apagá-la não quebra nada. */
export function findUnexplainedRemovals(args: {
  activeDbSlugs: readonly string[];
  exportSlugs: ReadonlySet<string>;
  redirectSources: ReadonlySet<string>;
  removedSlugs: ReadonlySet<string>;
}): string[] {
  const unexplained = new Set<string>();
  for (const slug of args.activeDbSlugs) {
    if (args.exportSlugs.has(slug)) continue;
    if (args.redirectSources.has(slug)) continue;
    if (args.removedSlugs.has(slug)) continue;
    unexplained.add(slug);
  }
  return [...unexplained].sort();
}

export function formatProblems(problems: readonly RedirectProblem[]): string {
  return problems.map((p) => `  ${p.code.padEnd(24)} ${p.slug || '(vazio)'}  ${p.detail}`).join('\n');
}

/** Lê o JSON já parseado de `slug-redirects.json` (`{ "antigo": "novo" }`) e de
 *  `removed-slugs.json` (`["slug", ...]`). Arquivo ausente chega como `undefined`
 *  e vale como vazio. Qualquer coisa fora do formato vira `formato-invalido` em
 *  vez de ser lida pela metade: o reseed prefere parar a gravar com dado torto. */
export function parseRedirectConfig(
  rawRedirects: unknown,
  rawRemoved: unknown,
): { redirects: Record<string, string>; removed: string[]; problems: RedirectProblem[] } {
  const redirects: Record<string, string> = {};
  const removed: string[] = [];
  const problems: RedirectProblem[] = [];

  if (rawRedirects !== undefined) {
    if (typeof rawRedirects !== 'object' || rawRedirects === null || Array.isArray(rawRedirects)) {
      problems.push({ code: 'formato-invalido', slug: 'slug-redirects.json', detail: 'esperado um objeto { "slug-antigo": "slug-novo" }' });
    } else {
      for (const [from, to] of Object.entries(rawRedirects)) {
        if (typeof to === 'string') redirects[from] = to;
        else problems.push({ code: 'formato-invalido', slug: from, detail: `o destino de "${from}" precisa ser texto` });
      }
    }
  }

  if (rawRemoved !== undefined) {
    if (!Array.isArray(rawRemoved)) {
      problems.push({ code: 'formato-invalido', slug: 'removed-slugs.json', detail: 'esperada uma lista ["slug", ...]' });
    } else {
      for (const item of rawRemoved) {
        if (typeof item !== 'string' || item === '') {
          problems.push({ code: 'formato-invalido', slug: String(item), detail: 'item de removed-slugs.json precisa ser texto não vazio' });
        } else if (!removed.includes(item)) {
          removed.push(item);
        }
      }
    }
  }

  return { redirects, removed, problems };
}
