import React from 'react';
import type { Artwork } from '@/types';

interface ArtworkShareCardProps {
  artwork: Artwork;
}

function formatReference(artwork: Artwork): string | null {
  const ref = artwork.references[0];
  if (!ref) return null;
  return `${ref.book} ${ref.chapter}${ref.verses ? `:${ref.verses}` : ''}`;
}

/**
 * Card fora da tela, só existe pra ser capturado pelo html2canvas —
 * mesmo padrão do ShareCard do Gerador C.S. Lewis (achado 2026-08-22:
 * "sinergia direta com @artecristadiaria", roadmap Fase 5). Formato
 * 1080x1920 (Story do Instagram, 9:16) — diferente do 1080x1080 do
 * Gerador, que é card quadrado de feed.
 *
 * Design fixo, independe do tema claro/escuro do usuário: fundo
 * branco-quente (compartilha bem sobre qualquer fundo/tema), moldura
 * dupla dourada em torno da obra (mesma "receita" do Gerador — a obra
 * inteira dentro da moldura, sem recorte, mesmo princípio do
 * `.gallery-frame` do site). Só CSS que o html2canvas rasteriza bem:
 * bordas e sombras simples, nada de `color-mix()`/filtro SVG (por isso
 * não reusa `.gallery-frame` direto, que usa color-mix na CSS real) nem
 * classes utilitárias de outro projeto (`.divider-ornament` do Gerador
 * não existe aqui — divisor refeito com estilo inline).
 */
export const ArtworkShareCard = React.forwardRef<HTMLDivElement, ArtworkShareCardProps>(
  function ArtworkShareCard({ artwork }, ref) {
    const reference = formatReference(artwork);

    return (
      <div
        ref={ref}
        aria-hidden="true"
        className="fixed left-[-9999px] top-0 flex h-[1920px] w-[1080px] flex-col items-center overflow-hidden font-sans"
        style={{ backgroundColor: '#fffefb' }}
      >
        {/* Eyebrow da marca — logo discreta à esquerda do nome (achado
            2026-08-23, testando a imagem real: faltava identidade visual
            no Story). Mesmo arquivo do header (logo-header-light.png,
            já é um selo com fundo próprio, não precisa de fundo
            transparente pra combinar com o card claro).

            Achado 2026-08-24 (reportado 2x pelo Rilson): logo e texto
            saíam desalinhados no PNG rasterizado pelo html2canvas, mesmo
            com `items-center` no flex — a lib calcula a caixa do texto
            pelo `line-height` do navegador (não pela altura visual da
            fonte), então o texto "flutuava" alguns pixels acima/abaixo
            do centro real da logo. Fix: altura fixa e igual nos dois
            filhos (`h-8`) + `object-contain` na imagem + `leading-none`
            no texto (remove a folga de line-height que description
            desalinhava) + `flex items-center` no próprio `<p>` (centra
            o texto dentro da própria caixa de altura fixa). */}
        <div className="mt-16 flex items-center gap-3">
          <img
            src="/logo-header-light.png"
            alt=""
            className="h-8 w-8 shrink-0 rounded-full object-contain"
            crossOrigin="anonymous"
          />
          <p
            className="flex h-8 items-center text-[26px] font-bold uppercase leading-none tracking-[0.35em]"
            style={{ color: '#b49a60' }}
          >
            Bíblia na Arte
          </p>
        </div>

        {/* Moldura dupla — mesma receita do ShareCard do Gerador */}
        <div
          className="mt-14 flex items-center justify-center shadow-xl"
          style={{
            width: '920px',
            height: '1100px',
            border: '2px solid rgba(122, 78, 45, 0.75)',
            padding: '14px',
          }}
        >
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ border: '1px solid rgba(180, 154, 96, 0.65)' }}
          >
            {artwork.imageUrl && (
              <div
                className="h-full w-full"
                style={{
                  backgroundImage: `url(${artwork.imageUrl})`,
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              />
            )}
          </div>
        </div>

        <div className="mt-12 flex w-full max-w-[880px] flex-col items-center px-8 text-center">
          <h1
            className="font-display text-[54px] font-bold leading-[1.15]"
            style={{ color: '#4b2e39' }}
          >
            {artwork.title}
          </h1>

          <div className="mt-6 flex items-center justify-center gap-3">
            <span style={{ width: '88px', height: '1px', backgroundColor: 'rgba(122, 78, 45, 0.4)' }} />
            <span className="text-lg" style={{ color: '#b49a60' }}>
              ✦
            </span>
            <span style={{ width: '88px', height: '1px', backgroundColor: 'rgba(122, 78, 45, 0.4)' }} />
          </div>

          <p
            className="mt-6 text-[28px] font-bold uppercase tracking-[0.25em]"
            style={{ color: '#7a4e2d' }}
          >
            {artwork.artistOrDirector}
            {artwork.year && ` · ${artwork.year}`}
          </p>

          {reference && (
            <p className="signature-italic mt-4 text-[32px]" style={{ color: '#5d4037' }}>
              {reference}
            </p>
          )}
        </div>

        <p
          className="mt-auto mb-16 text-[22px] font-semibold tracking-wide"
          style={{ color: 'rgba(122, 78, 45, 0.7)' }}
        >
          biblianaarte.narniano.com
        </p>
      </div>
    );
  },
);
