import { useRef, useState } from 'react';
import { Check, Download, ImageDown } from 'lucide-react';
import { ArtworkShareCard } from '@/components/ArtworkShareCard';
import type { Artwork } from '@/types';

interface DownloadStoryButtonProps {
  artwork: Artwork;
  label?: string;
  className?: string;
}

/** Exportar Story do Instagram (roadmap Fase 5) — mesmo padrão do
 *  QuoteGenerator do Gerador C.S. Lewis: `html2canvas` sobre um card
 *  fora da tela, baixado como PNG. Self-contained (ref + handler +
 *  card escondido, tudo aqui dentro) pra não inchar `ArtworkDetail.tsx`
 *  com mais estado — mesmo espírito do `CopyImageButton`. */
export function DownloadStoryButton({ artwork, label = 'Baixar Story', className }: DownloadStoryButtonProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleDownload() {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, { scale: 1, useCORS: true });
      const filename = `biblia-na-arte-${artwork.id}.png`;

      // Achado 2026-08-23 (Rilson testando no celular): <a download> num
      // data: URL vira "arquivo" no Android/iOS — some pra Arquivos/
      // Downloads, não pra galeria de fotos, porque tecnicamente é isso
      // mesmo que é (download de arquivo). Web Share API com o PNG como
      // File dá a folha de compartilhamento nativa, que inclui "Salvar
      // na Galeria/Fotos" como opção real — usa quando o navegador
      // suporta compartilhar arquivo (majoritariamente mobile); desktop
      // sem suporte cai no <a download> de sempre, que já é o correto lá.
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      const file = blob ? new File([blob], filename, { type: 'image/png' }) : null;

      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${artwork.title} — Bíblia na Arte`,
        });
      } else {
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }

      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch (error) {
      // AbortError acontece quando a pessoa fecha a folha de
      // compartilhamento sem escolher nada — não é falha de verdade.
      if (error instanceof Error && error.name === 'AbortError') return;
      console.warn('[DownloadStory] falha ao gerar a imagem:', error);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <button onClick={handleDownload} disabled={downloading} aria-label={label} className={className}>
        {done ? (
          <>
            <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
            <span className="hidden sm:inline">Baixado!</span>
          </>
        ) : downloading ? (
          <>
            <ImageDown className="w-3 h-3 animate-pulse" />
            <span className="hidden sm:inline">Gerando...</span>
          </>
        ) : (
          <>
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">{label}</span>
          </>
        )}
      </button>
      <ArtworkShareCard ref={cardRef} artwork={artwork} />
    </>
  );
}
