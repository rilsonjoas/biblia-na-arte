/** Auditoria do que está NO AR contra o vault (feita depois de cada lote e de cada deploy).
 *
 *  Por que existe (21/11/2026): conferindo a API de produção contra o vault, 6 obras de autores vivos ou
 *  mortos depois de 1955 estavam ativas sem cobertura em nenhuma lista (uma por causa de uma vírgula no
 *  título do `data-fixes.sql`). Este módulo é puro: recebe o que a API devolveu e o que o vault diz, e
 *  devolve achados. O script `scripts/audit-live.ts` faz a leitura de rede e de disco. */
import { slugify } from './vault-parse.js';

export interface LiveArtwork {
  slug: string;
  title: string;
  artistOrDirector: string;
  description: string;
  year?: string | null;
  licenseType?: string | null;
}

export interface VaultNote {
  file: string;
  /** Slug congelado em `slug:`; senão o derivado de autor + título. */
  slug: string;
  /** `direitos: excluir` / `publicar: não`; texto do motivo, ou undefined. */
  exclusionReason?: string | undefined;
}

export interface AuditFinding {
  severity: 'erro' | 'aviso';
  rule: string;
  slug: string;
  message: string;
}

const VAULT_SPEAK = /\[!|Disponível em:|Acesso em:|não aberta|pendência|nesta sessão|nota anterior|\bvault\b/i;

/** "1907-1990" -> {birth, death}; "n. 1953"/"b. 1949"/"1949-" -> vivo (sem morte). Sem datas -> undefined. */
export function parseLifeSpan(raw: string | undefined): { birth?: number | undefined; death?: number | undefined } | undefined {
  if (!raw) return undefined;
  const years = [...raw.matchAll(/\b(1[0-9]{3}|20[0-9]{2})\b/g)].map((m) => Number(m[1]));
  const [first] = years;
  if (first === undefined) return undefined;
  if (years.length === 1) {
    const alive = /(?:^|\s)(?:n\.|nasc|b\.|born)/i.test(raw) || /[-–]\s*$/.test(raw.trim());
    return alive ? { birth: first } : { death: first };
  }
  return { birth: Math.min(...years), death: Math.max(...years) };
}

export function auditLive(input: {
  live: LiveArtwork[];
  exportSlugs: ReadonlySet<string>;
  notes: VaultNote[];
  /** artista (nome da nota de autor) -> texto de "Período de vida:". */
  lifeSpans: ReadonlyMap<string, string | undefined>;
}): AuditFinding[] {
  const out: AuditFinding[] = [];
  const add = (severity: 'erro' | 'aviso', rule: string, slug: string, message: string) => out.push({ severity, rule, slug, message });

  const markedBySlug = new Map<string, VaultNote>();
  for (const n of input.notes) if (n.exclusionReason) markedBySlug.set(n.slug, n);

  for (const a of input.live) {
    if (!input.exportSlugs.has(a.slug)) add('erro', 'fora-do-export', a.slug, 'ativa no site e ausente do vault-export.json (o reseed deveria tê-la tirado)');

    const base = a.slug.replace(/-(?:\d{1,4})$/, '');
    const marked = markedBySlug.get(a.slug) ?? markedBySlug.get(base);
    if (marked) add('erro', 'marcada-no-vault', a.slug, `a nota "${marked.file}" está marcada (${marked.exclusionReason}) e a obra continua ativa`);

    // Direitos: só vale checar obra que se declara domínio público.
    if ((a.licenseType ?? 'public-domain') === 'public-domain') {
      const span = input.lifeSpans.get(a.artistOrDirector);
      if (span === undefined && !input.lifeSpans.has(a.artistOrDirector)) {
        add('aviso', 'autor-sem-nota', a.slug, `sem nota de autor "${a.artistOrDirector}": não dá para conferir as datas de vida`);
      } else {
        const life = parseLifeSpan(span);
        if (!life) {
          const y = Number(/\d{4}/.exec(a.year ?? '')?.[0]);
          if (y >= 1900) add('aviso', 'autor-sem-datas', a.slug, `autor sem "Período de vida" e obra de ${y}: confirmar que o autor morreu antes de 1956`);
        } else if (life.death === undefined) {
          add('erro', 'autor-vivo', a.slug, `${a.artistOrDirector} (nascido em ${life.birth}) está sem data de morte: obra sob direitos autorais?`);
        } else if (life.death > 1955) {
          add('erro', 'pos-1955', a.slug, `${a.artistOrDirector} morreu em ${life.death} (depois de 1955): obra provavelmente sob direitos autorais`);
        }
      }
    }

    if (VAULT_SPEAK.test(a.description)) add('erro', 'linguagem-de-trabalho', a.slug, 'a descrição no site tem linguagem de trabalho do vault');
    if (a.year && !/\d/.test(a.year) && /confirm|pendente|a definir/i.test(a.year)) add('erro', 'ano-de-processo', a.slug, `ano exibido: "${a.year}"`);
  }
  return out;
}

/** Slug que uma nota tem (ou teria) no site, para cruzar com a API. */
export function noteSlug(frozen: string | undefined, artist: string, title: string): string {
  return frozen && frozen.trim() !== '' ? frozen.trim() : slugify(`${artist}-${title}`);
}
