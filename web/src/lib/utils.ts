import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
