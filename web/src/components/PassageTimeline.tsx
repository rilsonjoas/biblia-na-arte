import { Link } from 'react-router';
import { parseYear } from '@/lib/api-data';
import { artworkHref } from '@/lib/utils';
import type { Artwork } from '@/types';

interface PassageTimelineProps {
  artworks: Artwork[];
}

/** "A mesma cena através dos séculos" (roadmap Fase 5, ideia de produto) —
 *  transforma as "versões duplicadas" achadas na varredura de slugs
 *  (2026-08-22) em feature: quando uma passagem tem 2+ obras com ano
 *  identificável, mostra uma linha do tempo em vez de só grade. Retorna
 *  `null` quando não há pelo menos 2 anos distintos parseáveis — uma
 *  linha do tempo com 1 ponto (ou todos no mesmo ano) não conta história
 *  nenhuma, é melhor deixar só a grade normal fazer o trabalho. */
export function PassageTimeline({ artworks }: PassageTimelineProps) {
  const dated = artworks
    .map((artwork) => ({ artwork, year: parseYear(artwork.year) }))
    .filter((item): item is { artwork: Artwork; year: number } => item.year !== null)
    .sort((a, b) => a.year - b.year);

  const distinctYears = new Set(dated.map((item) => item.year));
  const first = dated[0];
  const last = dated[dated.length - 1];
  // distinctYears.size >= 2 já garante dated.length >= 2, mas o
  // noUncheckedIndexedAccess do tsconfig não consegue provar isso sozinho
  // — checagem explícita em vez de non-null assertion.
  if (distinctYears.size < 2 || !first || !last) return null;

  return (
    <div className="mb-10">
      <p className="text-center text-sm text-muted-foreground mb-6">
        Esta cena através dos séculos — {first.year} a {last.year}
      </p>
      <div className="relative">
        {/* A linha em si — fica atrás dos pontos, atravessando toda a largura */}
        <div className="absolute left-0 right-0 top-[52px] h-px bg-border" aria-hidden="true" />

        <div className="flex gap-8 overflow-x-auto pb-4 px-2 snap-x snap-mandatory">
          {dated.map(({ artwork, year }) => (
            <Link
              key={artwork.id}
              to={artworkHref(artwork)}
              className="group flex shrink-0 snap-start flex-col items-center gap-2 w-28"
            >
              <span className="numeral-classico text-xs text-muted-foreground">{year}</span>
              <span className="relative z-10 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
              <div className="w-24 h-24 rounded-lg overflow-hidden border border-border/60 shadow-card bg-muted">
                {artwork.imageUrl && (
                  <img
                    src={artwork.imageUrl}
                    alt={artwork.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                )}
              </div>
              <span className="text-xs text-center text-muted-foreground line-clamp-2 leading-tight">
                {artwork.artistOrDirector}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
