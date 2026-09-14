import { useToast } from "@/components/ui/use-toast";
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buildPixBrCode, PIX_CONFIG } from '@/lib/pix';

// Doação via Pix estático (BR Code EMV do Bacen), gerado localmente sem
// intermediário — mesmo padrão já validado no Lecionário
// (lecionario-web/src/components/apoiar/PixDonationCard.tsx). Sem valor
// fixado: quem doa escolhe quanto.
export function PixDonationCard() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const brCode = buildPixBrCode(PIX_CONFIG);

  const handleCopyKey = async () => {
    await navigator.clipboard.writeText(brCode);
    setCopied(true);
    if (typeof window !== "undefined" && "vibrate" in navigator) { try { navigator.vibrate(50); } catch { /* vibração é opcional */ } }
    toast({ title: "Código Pix copiado!", description: "Chave pronta para colar no app do seu banco.", duration: 3000 });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-lg p-4 w-fit mx-auto shadow-md border border-accent/10">
        {/* QR estático EMV (BR Code do Bacen), sem valor fixado */}
        <QRCodeSVG value={brCode} size={180} level="M" />
      </div>
      <p className="text-center text-xs text-muted-foreground -mt-2">
        Escaneie com o app do seu banco — ou copie o código abaixo
      </p>

      <div className="space-y-3 max-w-xl mx-auto">
        <div className="flex items-center gap-2 bg-muted/40 border border-border rounded-md px-3 py-2">
          <code className="text-xs break-all flex-1 text-foreground/70 select-all">{brCode}</code>
        </div>
        <Button
          onClick={handleCopyKey}
          className="w-full gap-2"
          aria-label={copied ? 'Código Pix copiado' : 'Copiar código Pix'}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" /> Copiado!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" /> Copiar código Pix (copia e cola)
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
