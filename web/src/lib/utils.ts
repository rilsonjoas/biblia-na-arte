import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// "Páginas de Artista Ricas" (roadmap, aprovada 2026-08-23) — o nome do
// artista em `artwork.artistOrDirector` não vem com slug pronto (a API
// não teve que mudar de formato pra isso), então o link pra
// `/artista/:slug` precisa calcular o mesmo slug que o servidor gerou.
// ATENÇÃO: espelha `slugify()` de server/src/lib/vault-parse.ts caractere
// por caractere — qualquer mudança lá precisa vir aqui junto, senão o
// link do card aponta pra um slug que não bate com o da tabela `artists`.
export function slugifyArtistName(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

// Pedido do Rilson 2026-09-01 (feedback de amigos vendo o site): "1 Pedro",
// "2 Samuel" etc. têm contraste visual ruim entre o algarismo arábico e a
// letra maiúscula colada nele (ex.: "1 Pedro" — o "1" quase lê como um "l"
// minúsculo ao lado do "P"). Numeral romano resolve só na exibição, sem
// tocar no nome canônico usado como chave de matching de referências do
// vault (`resolveBibleBook()` em server/src/db/seed-data/bible-books.ts) —
// é puramente cosmético, aplicado no frontend em cima do dado que já vem
// da API.
const ARABIC_TO_ROMAN_BOOK_PREFIX: Record<string, string> = { '1': 'I', '2': 'II', '3': 'III' };

// Comparação de texto ignorando acento/caixa — usada pelo filtro por nome
// de /biblia (pedido do Rilson 2026-09-01: "acessível pra quem tem
// dificuldade" — ninguém deveria precisar digitar "ê" certo pra achar
// "Êxodo"). Mesma receita de normalização usada em resolveBibleBook() no
// backend (server/src/db/seed-data/bible-books.ts), reimplementada aqui
// porque é frontend puro, sem acesso a esse módulo do server.
export function normalizeForSearch(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function toRomanBookName(name: string): string {
  const match = /^([123]) (.+)$/.exec(name);
  if (!match) return name;
  const [, digit, rest] = match;
  if (!digit || !rest) return name;
  return `${ARABIC_TO_ROMAN_BOOK_PREFIX[digit]} ${rest}`;
}

// Numeral romano genérico (achado 2026-09-02: filtro "Período" precisava
// rotular séculos — o acervo vai do IV ao XXI, faixa pequena o bastante
// pra um algoritmo simples em vez de biblioteca). Sem suporte a números
// >3999 nem <=0 (não são casos reais pra século).
const ROMAN_NUMERALS: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

export function toRomanNumeral(value: number): string {
  if (!Number.isInteger(value) || value <= 0) return String(value);
  let remaining = value;
  let result = '';
  for (const [amount, numeral] of ROMAN_NUMERALS) {
    while (remaining >= amount) {
      result += numeral;
      remaining -= amount;
    }
  }
  return result;
}

// Tira marcação markdown pra sobrar texto puro — usado em resumos curtos
// (card, line-clamp) onde renderizar markdown de verdade (react-markdown,
// ver components/ui/markdown.tsx) não faz sentido: um <p> com clamp corta
// no meio de elementos em bloco. Achado real 2026-08-16: sem isso, cards
// mostravam literalmente "**Édouard Manet**" com os asteriscos.
export function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '') // headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/\*([^*]+)\*/g, '$1') // italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/^>\s?/gm, '') // blockquote
    .replace(/^[-*]\s+/gm, '') // listas
    .trim()
}
