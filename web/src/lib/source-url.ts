/**
 * `sourceUrl` é um campo de curadoria, não um campo de URL validado: quem
 * escreve é a nota no vault, e o texto "Domínio Público" é uma resposta
 * legítima para "fonte oficial?" numa obra sem procedência confirmada.
 *
 * O problema é o consumidor. `ArtworkDetail.tsx` usava o valor direto como
 * `href`, e o navegador resolve texto que não começa com esquema como
 * caminho relativo à página atual — o badge "Saiba mais" virava link pra
 * `/obra/Domínio Público (...)`, que não existe. Em 2026-09-27 a auditoria
 * achou 8 das 1090 obras assim: 6 com texto no lugar de URL e 2 com uma
 * URL boa envolvida em aspas simples, que quebravam do mesmo jeito.
 *
 * A regra aqui é: devolve a URL só quando for de fato uma URL, e limpa
 * aspas que venuesham de surround. Dado ruim no banco não deve virar
 * link quebrado visível, mesmo que reapareça na próxima curadoria.
 */

/** Remove aspas simples ou duplas que envolvem o valor, com ou sem espaço. */
function stripWrappingQuotes(value: string): string {
  const trimmed = value.trim();
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  if (trimmed.length >= 2 && (first === '"' || first === "'") && first === last) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

/**
 * Devolve o `sourceUrl` pronto para `href`, ou `null` se não for uma URL.
 *
 * Aceita `http://` e `https://`. Rejeita esquema relativo e `javascript:`,
 * porque o valor vem de curadoria manual e o badge abre em nova aba.
 */
export function safeSourceUrl(sourceUrl: string | null | undefined): string | null {
  if (!sourceUrl) return null;
  const cleaned = stripWrappingQuotes(sourceUrl);
  if (!/^https?:\/\/\S+$/i.test(cleaned)) return null;
  return cleaned;
}

/** `true` quando há uma URL de fonte oficial que pode virar link. */
export function hasSourceUrlLink(sourceUrl: string | null | undefined): boolean {
  return safeSourceUrl(sourceUrl) !== null;
}
