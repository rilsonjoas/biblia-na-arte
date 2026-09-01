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

  // Achado 2026-09-01: só tem 1 uso no site (ao lado de "Sobre esta Obra"),
  // e o `variant="outline"` (retângulo com borda) competia visualmente com
  // o heading de display ao lado — lia como botão de ação genérico de UI,
  // não como o gesto discreto de "utilidade" que é copiar a descrição.
  // Trocado por `ghost` + tipografia pequena/muted, mesmo registro já usado
  // no link "Ler capítulo completo →" dos cards de referência bíblica.
  return (
    <Button
      onClick={handleCopy}
      variant="ghost"
      size="sm"
      // Achado 2026-09-01 (Rilson, hover ilegível): no tema escuro
      // --accent (fundo de hover do ghost) e --primary (nosso texto)
      // são quase a mesma cor — dourado sobre dourado, ilegível.
      // hover:bg-primary/10 sobrepõe o bg-accent padrão do ghost com algo
      // que não compete com o texto dourado.
      className={`h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary ${className ?? ''}`}
      aria-label={copied ? `${label} — copiado` : label}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5" /> Copiado!
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" /> {label}
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
          <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
          <span className="hidden sm:inline">Imagem copiada!</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          <span className="hidden sm:inline">{label}</span>
        </>
      )}
    </button>
  );
}
