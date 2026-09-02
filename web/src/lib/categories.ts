import { Music, Film, Palette, type LucideIcon } from 'lucide-react';

export interface CategoryMeta {
  slug: 'painting' | 'music' | 'film';
  name: string;
  description: string;
  icon: LucideIcon;
  // Achado 2026-09-02 (Rilson viu "Músicas"/"Filmes" como opção comum no
  // dropdown de Categoria em Filtros Avançados, sem nenhum indício de que
  // estão vazias — "isso não devia ficar como promessa?"). `/arte` já é
  // honesto (mostra "✦ Em breve" com contagem real), mas o dropdown de
  // busca não tinha esse contexto. `hasContent` é a fonte única de
  // verdade pra decidir onde cada categoria pode aparecer como opção
  // selecionável de verdade — vira `true` no dia em que a 1ª música ou
  // filme entrar no catálogo.
  hasContent: boolean;
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
    hasContent: true,
  },
  {
    slug: 'music',
    name: 'Músicas',
    description:
      'Em breve, você poderá ouvir aqui como a fé cristã encontrou sua voz mais sublime — dos hinos gregorianos aos grandes oratórios clássicos da música sacra.',
    icon: Music,
    hasContent: false,
  },
  {
    slug: 'film',
    name: 'Filmes',
    description:
      'Em breve, vamos explorar como o cinema moderno e clássico trouxe as narrativas bíblicas para as telas, criando experiências visuais impactantes.',
    icon: Film,
    hasContent: false,
  },
];

export function getCategoryMeta(slug: string | undefined): CategoryMeta | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
