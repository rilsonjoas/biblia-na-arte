/** Verificador do contrato entre as notas de pintura do vault e o exportador do site.
 *
 *  Por que existe (21/11/2026): quase todos os problemas da passada de padronização vieram de o exportador
 *  e as regras do vault serem dois sistemas que ninguém conferia: cabeçalho de comentário clássico trocado
 *  por negrito (o bloco sumiria do site), lista de fontes em ABNT vazando para as descrições, `ano` com
 *  texto, `ano` retirado de nota cujo slug dependia dele, `autor:` que não é nota. Este módulo usa as MESMAS
 *  funções do exportador (`vault-parse.ts`), então não pode discordar dele. Puro: recebe conteúdo, devolve
 *  achados. O script `scripts/vault-lint.ts` faz a leitura de disco. */
import {
  deriveArtistFromFilename,
  extractDescription,
  extractFrontmatter,
  extractWikilink,
  frontmatterExclusionReason,
  isPollutedAuthor,
  parseTitleParts,
  slugify,
  titleFromFilename,
} from './vault-parse.js';

export type Severity = 'erro' | 'aviso';

export interface Finding {
  severity: Severity;
  file: string;
  rule: string;
  message: string;
}

export interface LintContext {
  /** Nomes (sem .md) das notas de `Autores/`. */
  authors: ReadonlySet<string>;
  /** Nomes (sem extensão) de todas as notas do vault, para conferir wikilinks. */
  notes: ReadonlySet<string>;
}

const WINDOWS_FORBIDDEN = /[<>:"|?*\\/]/;
/** Cabeçalhos `###` que o exportador sabe ler. `Na leitura de {Autor}` é o 5º, opcional. */
const ALLOWED_HEADINGS = [/^Descrição da Obra$/i, /^Contexto Bíblico$/i, /^Contexto Histórico$/i, /^Ver também$/i, /^Na leitura de\s+.+$/i];
/** Linguagem de trabalho do vault, que não deve chegar ao visitante do site. */
const VAULT_SPEAK_IN_DESCRIPTION = /pendência|n[ãa]o aberta|nota anterior|esta nota|desta nota|\bvault\b|nesta revisão|fonte_localizacao|frontmatter|nesta sessão|erro 40\d|\[!|Disponível em:|Acesso em:/i;

/** Slug que o exportador calcula quando a nota não tem `slug:` (antes do desempate por colisão). */
export function baseSlugOf(file: string, content: string): string {
  const fm = extractFrontmatter(content);
  let artist = fm?.autor ? extractWikilink(fm.autor) : '';
  if (!artist) artist = deriveArtistFromFilename(file);
  const title = parseTitleParts(titleFromFilename(file)).title;
  return slugify(`${artist}-${title}`);
}

export function lintNote(file: string, content: string, ctx: LintContext): Finding[] {
  const out: Finding[] = [];
  const add = (severity: Severity, rule: string, message: string) => out.push({ severity, file, rule, message });
  const name = file.replace(/\.md$/i, '');

  if (WINDOWS_FORBIDDEN.test(name) || /[. ]$/.test(name)) {
    add('erro', 'nome-de-arquivo', 'nome incompatível com o Windows (< > : " | ? * \\ / ou termina em ponto/espaço)');
  }

  const fm = extractFrontmatter(content);
  if (!fm) {
    add('erro', 'frontmatter', 'frontmatter ausente ou YAML inválido');
    return out;
  }

  const marked = frontmatterExclusionReason(fm);

  // autor:
  if (!fm.autor) {
    add('erro', 'autor', 'sem `autor:`');
  } else {
    const artist = extractWikilink(fm.autor);
    if (!/\[\[.+\]\]/.test(String(fm.autor))) add('erro', 'autor', '`autor:` não é wikilink ("[[Nome]]")');
    if (artist && isPollutedAuthor(artist, file)) add('erro', 'autor', '`autor:` é o título da nota, não o artista');
    else if (artist && !ctx.authors.has(artist)) add('aviso', 'autor', `não existe nota de autor "${artist}" em Autores/`);
  }

  // ano: texto sem dígito aparece no site como o ano da obra
  if (fm.ano !== undefined && fm.ano !== null && String(fm.ano).trim() !== '' && !/\d/.test(String(fm.ano))) {
    // "não confirmado" é linguagem de trabalho; "s/d" e "século XVII" são texto de catálogo aceitável.
    const processo = /confirm|pendente|a definir|verificar/i.test(String(fm.ano));
    add(
      processo ? 'erro' : 'aviso',
      'ano',
      `\`ano: ${JSON.stringify(fm.ano)}\` não tem dígitos e apareceria como o ano da obra${processo ? '; retire o campo (ano desconhecido = sem `ano:`)' : ''}`,
    );
  }

  // slug: o que não foi aceito pelo exportador
  if (fm.slug !== undefined && fm.slug !== null && fm.slug !== '' && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(fm.slug))) {
    add('erro', 'slug', `\`slug:\` inválido (${JSON.stringify(fm.slug)}): use minúsculas, dígitos e hífens`);
  }

  // O resto só importa para nota que vai ao site.
  if (marked) return out;

  const body = content.replace(/\r\n/g, '\n').replace(/^---\n[\s\S]*?\n---/, '');

  // cabeçalhos
  const headings = [...body.matchAll(/^###\s+(.+?)\s*$/gm)].map((m) => (m[1] ?? '').replace(/^📖\s*/, ''));
  for (const h of headings) {
    if (!ALLOWED_HEADINGS.some((re) => re.test(h))) add('aviso', 'cabeçalho', `cabeçalho \`### ${h}\` que o exportador não lê (o padrão é 4, mais \`### Na leitura de {Autor}\`)`);
  }
  for (const required of ['Descrição da Obra', 'Contexto Histórico']) {
    if (!headings.some((h) => h.toLowerCase() === required.toLowerCase())) add('erro', 'cabeçalho', `falta \`### ${required}\``);
  }
  if (/^\*\*Na leitura de\s+[^*\n]+\*\*\s*$/m.test(body)) {
    add('erro', 'comentário-clássico', '"**Na leitura de X**" em negrito: o exportador só lê `### Na leitura de X`, e o bloco sumiria do site');
  }

  // embeds com caminho
  if (/!\[\[[^\]|]*\/[^\]]*\]\]/.test(body)) add('aviso', 'embed', 'embed de imagem com caminho (`![[0 - Anexos/...]]`); use só o nome do arquivo');
  if (!/!\[\[[^\]]+\.(?:jpe?g|png|gif|webp|svg)/i.test(body)) add('erro', 'imagem', 'sem embed de imagem');

  // wikilinks (aviso: o vault tem links antigos para notas que nunca existiram)
  const missing = new Set<string>();
  for (const m of body.matchAll(/(?<!!)\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g)) {
    const target = (m[1] ?? '').trim();
    if (target && !ctx.notes.has(target)) missing.add(target);
  }
  if (missing.size > 0) add('aviso', 'wikilink', `link(s) para nota inexistente: ${[...missing].slice(0, 5).join(', ')}${missing.size > 5 ? '...' : ''}`);

  // descrição como o site vai ver
  const description = extractDescription(content);
  if (description.length < 250) add('erro', 'descrição', `descrição exportada com ${description.length} caracteres (mínimo 250)`);
  const leak = VAULT_SPEAK_IN_DESCRIPTION.exec(description);
  if (leak) add('erro', 'descrição', `a descrição que vai ao site ainda tem linguagem de trabalho ("${leak[0]}")`);

  return out;
}

/** Notas que o exportador desempata por colisão de slug: só uma delas fica com o endereço limpo; as demais
 *  ganham o ano (ou -2) e passam a depender de `ano:`. Sem `slug:` congelado, retirar ou mudar o `ano` muda a URL. */
export function lintSlugCollisions(entries: { file: string; content: string }[]): Finding[] {
  const groups = new Map<string, { file: string; frozen: boolean }[]>();
  for (const { file, content } of entries) {
    const fm = extractFrontmatter(content);
    if (!fm || frontmatterExclusionReason(fm)) continue;
    const base = baseSlugOf(file, content);
    const list = groups.get(base) ?? [];
    list.push({ file, frozen: typeof fm.slug === 'string' && fm.slug.trim() !== '' });
    groups.set(base, list);
  }
  const out: Finding[] = [];
  for (const [base, list] of groups) {
    if (list.length < 2) continue;
    const loose = list.filter((x) => !x.frozen);
    if (loose.length < 2) continue;
    for (const x of loose.slice(1)) {
      out.push({
        severity: 'aviso',
        file: x.file,
        rule: 'slug-colisão',
        message: `mesmo slug-base "${base}" de ${list.length} notas e sem \`slug:\` congelado: o endereço depende de \`ano:\`/ordem de leitura e muda se isso mudar`,
      });
    }
  }
  return out;
}
