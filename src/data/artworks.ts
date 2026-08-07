import { Artwork } from '@/types';

// Fallback estático — usado apenas quando a fonte primária de dados
// (Supabase até a Fase 4.3, depois o backend no VPS) está indisponível.
//
// Ficou vazio a partir de 2026-08-07: o array antigo se perdeu (o arquivo
// não existia mais no repo, quebrando o build) e o projeto Supabase de
// set/2025 foi desativado, então não há mais dado real pra reconstituir
// aqui. Este stub existe só pra destravar a compilação — quando o data
// layer for redesenhado pro backend do VPS (Fase B/C do plano de deploy),
// vale decidir se esse fallback estático ainda faz sentido ou se pode ser
// removido de vez.
export const artworks: Artwork[] = [];
