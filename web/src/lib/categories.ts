import { Music, Film, Palette, type LucideIcon } from 'lucide-react';

export interface CategoryMeta {
  slug: 'painting' | 'music' | 'film';
  name: string;
  description: string;
  icon: LucideIcon;
}

/** Metadados de categoria — únicos, compartilhados entre `ArtCategories.tsx`
 *  (picker em `/arte`) e `Search.tsx` (que agora também atende
 *  `/arte/:category`, achado 2026-08-23: unificar código sem mudar URL,
 *  zero risco de SEO em cima das 2.115 páginas já indexadas). Antes cada
 *  página tinha sua própria cópia dessa lista. */
export const CATEGORIES: CategoryMeta[] = [
  {
    slug: 'painting',
    name: 'Pinturas',
    description:
      'Desde as obras renascentistas até os mestres barrocos, contemple como a arte visual interpretou as Sagradas Escrituras ao longo dos séculos.',
    icon: Palette,
  },
  {
    slug: 'music',
    name: 'Músicas',
    description:
      'Em breve, você poderá ouvir aqui como a fé cristã encontrou sua voz mais sublime — dos hinos gregorianos aos grandes oratórios clássicos da música sacra.',
    icon: Music,
  },
  {
    slug: 'film',
    name: 'Filmes',
    description:
      'Em breve, vamos explorar como o cinema moderno e clássico trouxe as narrativas bíblicas para as telas, criando experiências visuais impactantes.',
    icon: Film,
  },
];

export function getCategoryMeta(slug: string | undefined): CategoryMeta | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
