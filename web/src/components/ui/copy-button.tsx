import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export function CopyButton({ text, label = 'Copiar', className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      onClick={handleCopy}
      variant="outline"
      size="sm"
      className={className}
      aria-label={copied ? `${label} — copiado` : label}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" /> Copiado!
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" /> {label}
        </>
      )}
    </Button>
  );
}

// O clipboard só aceita PNG de forma confiável — imagens vêm em WebP,
// então reencodamos via canvas antes de escrever.
async function fetchAsPngBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponível');
  ctx.drawImage(bitmap, 0, 0);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Falha ao converter pra PNG'))), 'image/png');
  });
}

interface CopyImageButtonProps {
  url: string;
  label?: string;
  className?: string;
}

export function CopyImageButton({ url, label = 'Copiar imagem', className }: CopyImageButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    try {
      // A Promise entra no ClipboardItem ainda dentro do gesto do usuário
      // (exigência do Safari); o download/reencode rodam em paralelo.
      const png = fetchAsPngBlob(url);
      void navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.warn('Cópia de imagem não suportada neste navegador:', error);
    }
  };

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? `${label} — copiada` : label}
      className={className}
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-green-600 dark:text-green-400" /> Imagem copiada!
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" /> {label}
        </>
      )}
    </button>
  );
}
