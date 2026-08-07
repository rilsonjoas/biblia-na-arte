import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Artwork } from '@/types';
import { Palette, Music, Film, Trash2 } from 'lucide-react';

interface DeleteArtworkDialogProps {
  artwork: Artwork | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (artwork: Artwork) => void;
  isDeleting?: boolean;
}

export default function DeleteArtworkDialog({ 
  artwork, 
  isOpen, 
  onClose, 
  onConfirm,
  isDeleting = false 
}: DeleteArtworkDialogProps) {
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'painting':
        return <Palette className="w-4 h-4" />;
      case 'music':
        return <Music className="w-4 h-4" />;
      case 'film':
        return <Film className="w-4 h-4" />;
      default:
        return <Palette className="w-4 h-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'painting':
        return 'Pintura';
      case 'music':
        return 'Música';
      case 'film':
        return 'Filme';
      default:
        return 'Arte';
    }
  };

  if (!artwork) return null;

  const handleConfirm = () => {
    onConfirm(artwork);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            <span>Confirmar Exclusão</span>
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. A obra será permanentemente removida do banco de dados.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Preview da obra que será excluída */}
        <div className="py-4">
          <div className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg bg-muted/20">
            <div className="w-full sm:w-32 h-24">
              <AspectRatio ratio={4/3}>
                {artwork.embedUrl ? (
                  <div className="w-full h-full bg-primary/10 rounded flex items-center justify-center">
                    <Music className="w-6 h-6 text-primary" />
                  </div>
                ) : artwork.imageUrl ? (
                  <img
                    src={artwork.imageUrl}
                    alt={artwork.title}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-full bg-muted rounded flex items-center justify-center">
                    {getCategoryIcon(artwork.category)}
                  </div>
                )}
              </AspectRatio>
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="flex items-center space-x-1 w-fit">
                  {getCategoryIcon(artwork.category)}
                  <span>{getCategoryLabel(artwork.category)}</span>
                </Badge>
              </div>
              
              <h3 className="font-semibold text-lg leading-tight">{artwork.title}</h3>
              
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Artista:</strong> {artwork.artistOrDirector}</p>
                {artwork.year && <p><strong>Ano:</strong> {artwork.year}</p>}
                {artwork.mediumOrGenre && <p><strong>Técnica:</strong> {artwork.mediumOrGenre}</p>}
                {artwork.references.length > 0 && (
                  <p><strong>Referências:</strong> {artwork.references.length} referência(s) bíblica(s)</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive font-medium">
              ⚠️ Atenção: Esta obra será removida permanentemente
            </p>
            <p className="text-xs text-destructive/80 mt-1">
              Todas as informações, referências bíblicas e associações desta obra serão perdidas.
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Obra
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}