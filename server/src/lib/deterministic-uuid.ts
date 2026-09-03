import { createHash } from 'node:crypto';

/** Namespace fixo (gerado uma vez, 2026-09-03) pro UUID v5 das obras —
 *  NUNCA mudar este valor: trocar o namespace muda TODOS os IDs gerados,
 *  o mesmo problema que este arquivo existe pra resolver. */
const ARTWORK_NAMESPACE = '0aeebdc7-75d6-429b-aff8-bd1276122e24';

/** UUID v5 (RFC 4122) — determinístico: o mesmo `name` sempre gera o
 *  mesmo UUID, dado o mesmo `namespace`. Implementado à mão (SHA-1 +
 *  bits de versão/variante) em vez de depender do pacote `uuid` — é um
 *  algoritmo pequeno e estável, verificado contra o vetor de teste
 *  oficial do RFC 4122 (namespace DNS + "www.widgets.com" →
 *  21f7f8de-8051-5b89-8680-0195ef798b6a) antes de usar em produção. */
export function uuidV5(name: string, namespace: string): string {
  const namespaceBytes = Buffer.from(namespace.replace(/-/g, ''), 'hex');
  const nameBytes = Buffer.from(name, 'utf8');
  const hash = createHash('sha1').update(Buffer.concat([namespaceBytes, nameBytes])).digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x50; // versão 5
  bytes[8] = (bytes[8]! & 0x3f) | 0x80; // variante RFC 4122
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** ID estável de uma obra, derivado do `slug` do export do vault (achado
 *  do Rilson, 2026-09-03, ROADMAP "ID de obra muda a cada reseed"):
 *  antes, `import-seed-data.ts` deixava o Postgres sortear
 *  (`defaultRandom()`) um UUID novo em CADA seed, pra TODAS as obras,
 *  não só as novas — porque o seed faz TRUNCATE + reimport do zero.
 *  Consequência dupla: link `/obra/:id` quebrava a cada
 *  curadoria+reseed, e o pool da "Pintura do Dia" (que ordena por
 *  `artworks.id` pra ter posição estável) reembaralhava mesmo sem a
 *  leitura do dia mudar. Determinístico a partir do slug resolve os
 *  dois: mesma obra (mesmo slug) sempre recebe o mesmo ID, mesmo depois
 *  de truncar e reimportar. Só muda se o PRÓPRIO slug mudar (ex.:
 *  renomear artista/título na curadoria) — aceitável, é o mesmo
 *  trade-off de qualquer sistema baseado em slug. */
export function artworkIdFromSlug(slug: string): string {
  return uuidV5(slug, ARTWORK_NAMESPACE);
}
