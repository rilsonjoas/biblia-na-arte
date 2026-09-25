import { ArrowRight, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useVerseOfTheDay } from '@/hooks/use-verse';
import { lecionarioHomeUrl } from '@/lib/versiculo';

function formatDate(responseDate: string): string {
  const [year, month, day] = responseDate.split('-').map(Number);
  if (!year || !month || !day) return responseDate;
  // Meio-dia local de propósito — 'T00:00:00' num fuso americano podia
  // vazar pro dia anterior no toLocaleDateString.
  return new Date(year, month - 1, day, 12).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** "Versículo do Dia" — mesma fonte do home do Scriptorium Divinum:
 *  rota /api/versiculo-do-dia do Lecionário (leituras RCL, ARC),
 *  chamada sem `?date` (o endpoint resolve "hoje" em São Paulo). Este
 *  componente tem os tokens de design do Bíblia na Arte, como o
 *  PinturaDoDia — não é uma cópia do de lá. Falha silenciosa (null):
 *  é vitrine da home, não devia quebrar a página nem mostrar erro. */
export function VersiculoDoDia() {
  const { data: versiculo, isLoading, isError } = useVerseOfTheDay();

  if (isError || (!isLoading && !versiculo)) return null;

  return (
    <section className="py-20 bg-background border-t border-border/40">
      <div className="container mx-auto px-4 sm:px-6 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4 text-xs shadow-golden">
            <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
            Versículo do Dia
          </Badge>

          {isLoading ? (
            <div className="space-y-3 py-4 max-w-2xl mx-auto">
              <Skeleton className="h-4 w-36 mx-auto" />
              <Skeleton className="h-5 w-5/6 mx-auto" />
              <Skeleton className="h-5 w-4/5 mx-auto" />
              <Skeleton className="h-4 w-28 mx-auto mt-2" />
            </div>
          ) : versiculo ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 mb-4">
                {formatDate(versiculo.date)}
              </p>
              <blockquote className="text-foreground/80 leading-relaxed mb-6 text-base sm:text-lg max-w-3xl mx-auto">
                {versiculo.verse.text}
              </blockquote>
              <div className="inline-flex items-center gap-2 mb-4">
                <Badge
                  variant="outline"
                  className="text-xs font-normal border-accent/40 bg-accent/5 text-foreground/80"
                >
                  {versiculo.verse.reference} • ARC
                </Badge>
              </div>
              <div>
                <Button
                  asChild
                  variant="link"
                  className="px-0 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  <a
                    href={lecionarioHomeUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ler hoje no Lecionário
                    <ArrowRight className="w-4 h-4 ml-1 inline-block" />
                  </a>
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}