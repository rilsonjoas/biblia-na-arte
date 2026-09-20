import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Shuffle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRandomArtwork } from '@/lib/api-data';
import { artworkHref } from '@/lib/utils';

/** "Me surpreenda" — obra aleatória do acervo, no estilo do artigo
 *  aleatório da Wikipédia (roadmap Fase 5, ideia de menor esforço).
 *  `className`/`variant`/`size` repassados pra caber tanto no header
 *  desktop (ícone só) quanto no menu mobile (ícone + rótulo). */
export function SurpriseMeButton({
  className,
  variant = 'ghost',
  size = 'icon',
  showLabel = false,
}: {
  className?: string;
  variant?: 'ghost' | 'outline' | 'default';
  size?: 'icon' | 'default';
  showLabel?: boolean;
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    try {
      const artwork = await getRandomArtwork();
      navigate(artworkHref(artwork));
    } catch (error) {
      // Falha silenciosa com warn no console — mesmo padrão do
      // CopyImageButton pra ações secundárias que não bloqueiam o resto
      // da navegação.
      console.warn('[SurpriseMe] falha ao buscar obra aleatória:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={loading}
      aria-label="Me surpreenda — ver uma obra aleatória do acervo"
      title="Me surpreenda"
      className={className}
    >
      {loading ? (
        <RefreshCcw className="w-4 h-4 animate-spin" />
      ) : (
        <Shuffle className="w-4 h-4" />
      )}
      {showLabel && <span className="ml-2">Me surpreenda</span>}
    </Button>
  );
}
