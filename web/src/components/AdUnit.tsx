import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

interface AdUnitProps {
  slot: string;
  className?: string;
}

// Um único slot de anúncio, colocado com cuidado numa quebra de conteúdo
// natural (nunca dentro do texto da descrição/citação) — a experiência
// contemplativa do site vem antes do anúncio. Cada <ins> só pode ser
// "empurrado" pro adsbygoogle uma vez; o useRef evita duplicar o push
// em re-render (comum em StrictMode/HMR).
export function AdUnit({ slot, className }: AdUnitProps) {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // adsbygoogle.js pode não ter carregado ainda (ex: bloqueador de
      // anúncios) — falha silenciosa, não deve quebrar a página.
    }
  }, []);

  return (
    <div className={className} aria-hidden="true">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-5482566824255473"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
