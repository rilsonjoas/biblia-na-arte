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
      const link = document.createElement('a');
      link.download = `biblia-na-arte-${artwork.id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch (error) {
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
            <Check className="w-3 h-3 text-green-600 dark:text-green-400" /> Baixado!
          </>
        ) : downloading ? (
          <>
            <ImageDown className="w-3 h-3 animate-pulse" /> Gerando...
          </>
        ) : (
          <>
            <Download className="w-3 h-3" /> {label}
          </>
        )}
      </button>
      <ArtworkShareCard ref={cardRef} artwork={artwork} />
    </>
  );
}
