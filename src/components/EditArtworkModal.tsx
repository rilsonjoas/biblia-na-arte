import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Artwork, BibleReference } from '@/types';
import { 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Palette, 
  Music, 
  Film,
  ImageIcon,
  ExternalLink
} from 'lucide-react';

interface EditArtworkModalProps {
  artwork: Artwork | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedArtwork: Artwork) => void;
}

export default function EditArtworkModal({ 
  artwork, 
  isOpen, 
  onClose, 
  onSave 
}: EditArtworkModalProps) {
  const [formData, setFormData] = useState<Artwork>({
    id: '',
    title: '',
    artistOrDirector: '',
    year: '',
    category: 'painting',
    mediumOrGenre: '',
    imageUrl: null,
    embedUrl: null,
    description: '',
    references: [],
    sourceUrl: null,
    dimensionsOrDuration: null,
  });
  
  const [newReference, setNewReference] = useState({
    book: '',
    bookSlug: '',
    chapter: '',
    verses: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (artwork) {
      setFormData(artwork);
    }
  }, [artwork]);

  const handleInputChange = (field: keyof Artwork, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddReference = () => {
    if (newReference.book && newReference.chapter) {
      const chapter = parseInt(newReference.chapter);
      if (isNaN(chapter)) {
        toast({
          title: "Erro",
          description: "Capítulo deve ser um número válido.",
          variant: "destructive",
        });
        return;
      }

      const reference: BibleReference = {
        book: newReference.book,
        bookSlug: newReference.bookSlug || newReference.book.toLowerCase().replace(/\s+/g, '-'),
        chapter: chapter,
        verses: newReference.verses || undefined,
      };

      setFormData(prev => ({
        ...prev,
        references: [...prev.references, reference]
      }));

      setNewReference({ book: '', bookSlug: '', chapter: '', verses: '' });
    }
  };

  const handleRemoveReference = (index: number) => {
    setFormData(prev => ({
      ...prev,
      references: prev.references.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!formData.title || !formData.artistOrDirector) {
      toast({
        title: "Erro",
        description: "Título e artista são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      onSave(formData);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar a obra.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryIcon = () => {
    switch (formData.category) {
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

  if (!artwork) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-display text-2xl flex items-center space-x-2">
            {getCategoryIcon()}
            <span>Editar Obra: {artwork.title}</span>
          </DialogTitle>
          <DialogDescription>
            Edite as informações da obra de arte selecionada.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preview Section */}
          <div className="space-y-4">
            <Card className="gradient-card border-0">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center space-x-2">
                  <ImageIcon className="w-4 h-4" />
                  <span>Visualização</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <AspectRatio ratio={4/3}>
                  {formData.embedUrl ? (
                    <iframe
                      src={formData.embedUrl}
                      title={formData.title}
                      className="w-full h-full rounded-lg border"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : formData.imageUrl ? (
                    <img
                      src={formData.imageUrl}
                      alt={formData.title}
                      className="w-full h-full object-cover rounded-lg border"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center border">
                      {getCategoryIcon()}
                    </div>
                  )}
                </AspectRatio>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      {getCategoryIcon()}
                      <span className="capitalize">{formData.category}</span>
                    </Badge>
                    {formData.sourceUrl && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={formData.sourceUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg">{formData.title || "Título da obra"}</h3>
                  <p className="text-sm text-muted-foreground">{formData.artistOrDirector || "Artista"} • {formData.year || "Ano"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form Section */}
          <div className="space-y-4">
            {/* Informações Básicas */}
            <Card className="gradient-card border-0">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Título da obra"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="artist">Artista/Diretor *</Label>
                  <Input
                    id="artist"
                    value={formData.artistOrDirector}
                    onChange={(e) => handleInputChange('artistOrDirector', e.target.value)}
                    placeholder="Nome do artista ou diretor"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Ano</Label>
                    <Input
                      id="year"
                      value={formData.year}
                      onChange={(e) => handleInputChange('year', e.target.value)}
                      placeholder="1500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="painting">Pintura</SelectItem>
                        <SelectItem value="music">Música</SelectItem>
                        <SelectItem value="film">Filme</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medium">Técnica/Gênero</Label>
                  <Input
                    id="medium"
                    value={formData.mediumOrGenre || ''}
                    onChange={(e) => handleInputChange('mediumOrGenre', e.target.value)}
                    placeholder="Óleo sobre tela, Oratório, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dimensions">Dimensões/Duração</Label>
                  <Input
                    id="dimensions"
                    value={formData.dimensionsOrDuration || ''}
                    onChange={(e) => handleInputChange('dimensionsOrDuration', e.target.value)}
                    placeholder="100cm x 80cm ou 120 min"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Mídia */}
            <Card className="gradient-card border-0">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Mídia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">URL da Imagem</Label>
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl || ''}
                    onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                    placeholder="/src/assets/obra.jpg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="embedUrl">URL de Embed (YouTube, etc.)</Label>
                  <Input
                    id="embedUrl"
                    value={formData.embedUrl || ''}
                    onChange={(e) => handleInputChange('embedUrl', e.target.value)}
                    placeholder="https://www.youtube.com/embed/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sourceUrl">URL da Fonte</Label>
                  <Input
                    id="sourceUrl"
                    value={formData.sourceUrl || ''}
                    onChange={(e) => handleInputChange('sourceUrl', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Descrição */}
            <Card className="gradient-card border-0">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descrição da obra de arte..."
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Referências Bíblicas */}
            <Card className="gradient-card border-0">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Referências Bíblicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Lista de referências existentes */}
                {formData.references.length > 0 && (
                  <div className="space-y-2">
                    {formData.references.map((ref, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">
                          {ref.book} {ref.chapter}{ref.verses && `:${ref.verses}`}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveReference(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Separator />
                
                {/* Adicionar nova referência */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Livro (ex: Gênesis)"
                      value={newReference.book}
                      onChange={(e) => setNewReference(prev => ({ ...prev, book: e.target.value }))}
                    />
                    <Input
                      placeholder="Capítulo (ex: 1)"
                      value={newReference.chapter}
                      onChange={(e) => setNewReference(prev => ({ ...prev, chapter: e.target.value }))}
                    />
                  </div>
                  <Input
                    placeholder="Versículos (ex: 1-3, opcional)"
                    value={newReference.verses}
                    onChange={(e) => setNewReference(prev => ({ ...prev, verses: e.target.value }))}
                  />
                  <Button size="sm" onClick={handleAddReference} className="w-full">
                    <Plus className="w-3 h-3 mr-2" />
                    Adicionar Referência
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}