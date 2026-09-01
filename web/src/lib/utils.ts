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
