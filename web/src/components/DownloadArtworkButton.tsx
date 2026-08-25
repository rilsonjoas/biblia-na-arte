import { useState } from 'react';
import { Check, Download } from 'lucide-react';

interface DownloadArtworkButtonProps {
  url: string;
  filename: string;
  label?: string;
  className?: string;
}

/** Baixar o arquivo ORIGINAL da obra (mesmo WebP servido no lightbox) —
 *  separado do `DownloadStoryButton` (achado 2026-08-24, roadmap
 *  "Honestidade de produto/UX"): antes só existia o download do render
 *  1080×1920 com moldura/logo/texto pro Story, então quem queria a obra
 *  limpa pra aula/sermão/impressão recebia a versão personalizada do
 *  Instagram sem pedir. Baixa via blob (não `<a href=url download>` puro
 *  — a imagem vem de outro domínio/CDN, e `download` cross-origin sem
 *  blob costuma só abrir a imagem numa aba nova em vez de salvar). */
export function DownloadArtworkButton({
  url,
  filename,
  label = 'Baixar obra',
  className,
}: DownloadArtworkButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(objectUrl);

      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch (error) {
      console.warn('[DownloadArtwork] falha ao baixar a imagem:', error);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button onClick={handleDownload} disabled={downloading} aria-label={label} className={className}>
      {done ? (
        <>
          <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
          <span className="hidden sm:inline">Baixado!</span>
        </>
      ) : (
        <>
          <Download className={`w-3 h-3 ${downloading ? 'animate-pulse' : ''}`} />
          <span className="hidden sm:inline">{downloading ? 'Baixando...' : label}</span>
        </>
      )}
    </button>
  );
}
