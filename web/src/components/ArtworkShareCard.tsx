import React from 'react';
import type { Artwork } from '@/types';

interface ArtworkShareCardProps {
  artwork: Artwork;
}

/**
 * Card fora da tela, só existe pra ser capturado pelo html2canvas —
 * mesmo padrão do ShareCard do Gerador C.S. Lewis (achado 2026-08-22:
 * "sinergia direta com @artecristadiaria", roadmap Fase 5). Formato
 * 1080x1920 (Story do Instagram, 9:16) — diferente do 1080x1080 do
 * Gerador, que é card quadrado de feed.
 *
 * Design fixo, independe do tema claro/escuro do usuário: fundo com o
 * MESMO gradiente escuro "Biblioteca à noite" do modo escuro do Gerador
 * C.S. Lewis (`.dark .bg-narniano` em `gerador-cslewis/src/app/globals.css`
 * — couro quente com brasa dourada no topo, afundando no quase-preto),
 * pedido do Rilson 2026-09-26 (queria algo "inspirado no nosso modo
 * escuro"). Moldura dupla dourada em torno da obra (mesma "receita" do
 * Gerador — a obra inteira dentro da moldura, sem recorte, mesmo
 * princípio do `.gallery-frame` do site). Só CSS que o html2canvas
 * rasteriza bem: bordas e sombras simples, nada de `color-mix()`/filtro
 * SVG (por isso não reusa `.gallery-frame` direto, que usa color-mix na
 * CSS real) nem classes utilitárias de outro projeto (`.divider-ornament`
 * do Gerador não existe aqui — divisor refeito com estilo inline).
 */
export const ArtworkShareCard = React.forwardRef<HTMLDivElement, ArtworkShareCardProps>(
  function ArtworkShareCard({ artwork }, ref) {
    return (
      <div
        ref={ref}
        aria-hidden="true"
        className="fixed left-[-9999px] top-0 flex h-[1920px] w-[1080px] flex-col items-center overflow-hidden font-sans"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -8%, rgba(180, 154, 96, 0.16), transparent 62%), ' +
            'linear-gradient(180deg, #241611 0%, #150d08 55%, #0a0603 100%)',
        }}
      >
        {/* Logo e nome do site EMPILHADOS (2026-09-26, 3ª rodada — proposta
            do Rilson depois de 2 tentativas de deixar os dois na mesma
            linha, ambas com problema de alinhamento entre elementos
            diferentes — achado documentado no histórico do componente:
            flex+items-center, transform:translateY() e marginTop, todos
            com comportamento não-confiável no html2canvas pra alinhar
            uma IMAGEM com uma LINHA DE TEXTO lado a lado). Empilhado
            verticalmente, cada elemento só precisa se centralizar sozinho
            (`items-center` numa coluna) — não existe mais "alinhar A com
            B", só "centralizar A" e "centralizar B", que é trivial e
            sempre funcionou bem neste componente (mesma técnica do bloco
            de texto abaixo da moldura, nunca teve esse tipo de bug). */}
        <div className="mt-16 flex flex-col items-center">
          <img
            src="/logo-header-light.png"
            alt=""
            className="h-16 w-16 rounded-full object-contain shadow-md"
            crossOrigin="anonymous"
          />
          <p
            className="font-display mt-4 text-[46px] font-bold"
            style={{ color: '#F4EFE1' }}
          >
            Bíblia<span style={{ color: '#D6B26E', fontWeight: 400 }}> na Arte</span>
          </p>
        </div>

        {/* Moldura dupla — cores clareadas pra aparecer contra o fundo
            agora escuro (as originais, pensadas pro fundo branco antigo,
            praticamente desapareciam aqui). */}
        <div
          className="mt-14 flex items-center justify-center shadow-xl"
          style={{
            width: '920px',
            height: '1100px',
            border: '2px solid rgba(214, 178, 110, 0.85)',
            padding: '14px',
          }}
        >
          <div
            className="relative flex h-full w-full items-center justify-center overflow-hidden"
            style={{ border: '1px solid rgba(214, 178, 110, 0.5)' }}
          >
            {artwork.imageUrl && (
              <>
                {/* Fundo: a mesma pintura, em cover (preenche a moldura
                    inteira, cortada) — NÃO desfocada. Achado 2026-09-26:
                    (1) o Rilson não curte fundo borrado em geral, e (2) o
                    html2canvas não rasteriza `filter: blur()` de forma
                    confiável (mesmo motivo pelo qual este componente já
                    evita color-mix()/filtro SVG, ver comentário no topo do
                    arquivo) — então blur nem seria opção técnica segura
                    aqui. Em vez disso: a própria pintura cortada, com um
                    véu na cor da marca por cima, unificando tudo sem
                    esconder a arte. Resolve o problema real (moldura
                    quase quadrada + pintura em paisagem = faixas brancas
                    mortas em cima/embaixo com `contain` sozinho) sem as
                    duas coisas que o Rilson não quer. */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${artwork.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: 'rgba(74, 47, 27, 0.86)' }}
                />
                {/* Pintura inteira, sem corte, por cima do fundo colorido */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${artwork.imageUrl})`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
              </>
            )}
          </div>
        </div>

        <div className="mt-12 flex w-full max-w-[880px] flex-col items-center px-8 text-center">
          {/* Cores claras pro fundo escuro novo (2026-09-26) — auditado:
              #E8C97A vs a base mais escura do gradiente (#0a0603) dá
              12.56:1; #D6B26E dá 10.05:1; #B5A89E dá 8.71:1. Todas bem
              acima do mínimo AA (4.5:1). */}
          {/* Achado 2026-09-26: a linha divisória logo abaixo estava
              renderizando SOBRE o título (bem em cima da palavra "em"),
              não depois dele — mesma causa raiz já documentada pro
              logo/wordmark acima (`leading-[1.15]`, um multiplicador
              relativo, é medido pelo html2canvas de forma inconsistente
              pra calcular onde o próximo elemento com margin-top começa).
              Fix igual: `lineHeight` explícito em px. */}
          {/* Achado 2026-09-27 (Rilson: "Ué", o ano vinha grudado no
              autor — "Sigmundt Bergk · 1625" lia como se 1625 fosse do
              autor, não da obra). Ano junto do título, formato de legenda
              de museu ("Título (Ano)"), autor sozinho embaixo. */}
          <h1
            className="font-display text-[54px] font-bold"
            style={{ color: '#E8C97A', lineHeight: '62px' }}
          >
            {artwork.title}
            {artwork.year && (
              <span style={{ color: '#D6B26E', fontWeight: 400 }}> ({artwork.year})</span>
            )}
          </h1>

          {/* Redesenhado 2026-09-26 (Rilson: "elementos confusos" no
              divisor antigo — a estrela ficava mais baixa e menor que as
              linhas, lia como bagunça, não ornamento). Trocado por um
              único traço fino, sem estrela — separa sem competir. Autor/
              ano também trocou de caixa-alta+sans (voz emprestada do
              ShareCard do Gerador, que não é a voz deste site) pra
              itálico serifado — a mesma família do título, mais quieto,
              como uma legenda de museu. Versículo removido (Rilson:
              "informação demais" nesse formato). */}
          <p
            className="font-display mt-6 text-[32px] italic"
            style={{ color: '#D6B26E' }}
          >
            {artwork.artistOrDirector}
          </p>
        </div>

        <p
          className="mt-auto mb-16 text-[22px] font-semibold tracking-wide"
          style={{ color: 'rgba(180, 154, 96, 0.75)' }}
        >
          biblianaarte.narniano.com
        </p>
      </div>
    );
  },
);
