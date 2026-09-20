import { Link } from 'react-router';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDailyArtwork } from '@/hooks/use-artworks';
import { stripMarkdown, artworkHref } from '@/lib/utils';

/** "Pintura do Dia" (roadmap, pedido do Rilson 2026-08-23) — mesma obra
 *  pra todo mundo que visitar no mesmo dia (fuso de São Paulo, ver
 *  `todaySaoPaulo` em `lib/api-data.ts`), escolhida no server (GET
 *  /artworks/daily). Desde 2026-09-03 (ROADMAP "Pintura do Dia ligada à
 *  leitura litúrgica") a escolha é ancorada na leitura do dia do
 *  Lecionário quando a data está coberta — a MESMA obra que aparece lá,
 *  não mais um sorteio independente. Este componente continua próprio,
 *  não uma cópia do ArtSection.tsx de lá: usa os tokens de design daqui
 *  (text-display, gallery-frame, shadow-classical/golden) em vez dos do
 *  Lecionário.
 *
 *  Falha silenciosa (retorna null) se a busca der erro — é uma vitrine
 *  na home, não algo que deva quebrar a página ou mostrar um card de
 *  erro pra quem só quer ver "Obras em Destaque" logo abaixo. */
export function PinturaDoDia() {
  const { data: artwork, isLoading, isError } = useDailyArtwork();

  if (isError) return null;

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-4 text-sm shadow-golden">
              <CalendarDays className="w-4 h-4 mr-2" />
              Pintura do Dia
            </Badge>
            <h2 className="text-display text-2xl sm:text-3xl md:text-4xl font-bold">
              Uma obra pra contemplar hoje
            </h2>
          </div>

          {isLoading || !artwork ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center rounded-2xl overflow-hidden gradient-card shadow-classical p-6 md:p-8">
              <Skeleton className="w-full aspect-[4/3] rounded-xl" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ) : (
            <Link
              to={artworkHref(artwork)}
              className="group grid grid-cols-1 md:grid-cols-2 gap-8 items-center rounded-2xl overflow-hidden gradient-card shadow-classical hover:shadow-golden transition-all duration-300 [transition-timing-function:var(--ease-liturgico)] p-6 md:p-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="relative overflow-hidden rounded-xl bg-muted/40 gallery-frame">
                {artwork.imageUrl ? (
                  <img
                    src={artwork.imageUrl}
                    alt={artwork.title}
                    loading="lazy"
                    className="w-full aspect-[4/3] object-cover rounded-xl group-hover:scale-105 transition-transform duration-500 [transition-timing-function:var(--ease-vela)]"
                  />
                ) : (
                  <div className="w-full aspect-[4/3] rounded-xl" />
                )}
              </div>

              <div>
                {/* Sem font-mono aqui de propósito — mono é usado no resto
                    do projeto só pra números curtos (ano, kbd, erro 404),
                    numa data por extenso ficava destoando do resto da
                    tipografia (achado real 2026-08-23). Mesmo estilo de
                    "rótulo" usado em "Referências Bíblicas:" no ArtworkCard. */}
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 mb-2">
                  {new Date().toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <h3 className="text-display text-2xl md:text-3xl font-bold mb-2 group-hover:text-primary transition-colors leading-snug">
                  {artwork.title}
                </h3>
                <p className="text-foreground/90 font-medium mb-1">
                  {artwork.artistOrDirector}
                  {artwork.year && <span className="text-muted-foreground font-normal"> · {artwork.year}</span>}
                </p>

                {artwork.description && (
                  <p className="text-sm md:text-base text-muted-foreground line-clamp-3 mt-4 leading-relaxed">
                    {stripMarkdown(artwork.description)}
                  </p>
                )}

                {artwork.references.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {artwork.references.slice(0, 3).map((ref, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-[11px] font-normal border-accent/40 bg-accent/5 text-foreground/80"
                      >
                        {ref.book} {ref.chapter}
                        {ref.verses ? `:${ref.verses}` : ''}
                      </Badge>
                    ))}
                  </div>
                )}

                <Button
                  asChild
                  variant="link"
                  className="px-0 mt-4 text-primary group-hover:gap-2 transition-all"
                >
                  <span>
                    Ver mais sobre a obra
                    <ArrowRight className="w-4 h-4 ml-1 inline-block" />
                  </span>
                </Button>
              </div>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
