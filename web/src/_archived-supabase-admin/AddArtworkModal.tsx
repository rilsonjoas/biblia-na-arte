import { useState } from 'react';
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
} from 'lucide-react';

interface AddArtworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newArtwork: Omit<Artwork, 'id'>) => void;
  isLoading?: boolean;
}

export default function AddArtworkModal({ 
  isOpen, 
  onClose, 
  onSave,
  isLoading = false 
}: AddArtworkModalProps) {
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    artistOrDirector: '',
    year: '',
    category: 'painting' as 'painting' | 'music' | 'film',
    mediumOrGenre: '',
    description: '',
    imageUrl: '',
    embedUrl: '',
    sourceUrl: '',
    dimensionsOrDuration: '',
  });

  const [references, setReferences] = useState<BibleReference[]>([]);
  const [newReference, setNewReference] = useState({
    book: '',
    bookSlug: '',
    chapter: '',
    verses: '',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      artistOrDirector: '',
      year: '',
      category: 'painting',
      mediumOrGenre: '',
      description: '',
      imageUrl: '',
      embedUrl: '',
      sourceUrl: '',
      dimensionsOrDuration: '',
    });
    setReferences([]);
    setNewReference({
      book: '',
      bookSlug: '',
      chapter: '',
      verses: '',
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addReference = () => {
    if (!newReference.book.trim() || !newReference.bookSlug.trim() || !newReference.chapter.trim()) {
      toast({
        title: "Erro",
        description: "Livro, slug e capítulo são obrigatórios para a referência.",
        variant: "destructive",
      });
      return;
    }

    const reference: BibleReference = {
      book: newReference.book.trim(),
      bookSlug: newReference.bookSlug.trim(),
      chapter: parseInt(newReference.chapter),
      verses: newReference.verses.trim() || undefined,
    };

    setReferences(prev => [...prev, reference]);
    setNewReference({
      book: '',
      bookSlug: '',
      chapter: '',
      verses: '',
    });
  };

  const removeReference = (index: number) => {
    setReferences(prev => prev.filter((_, i) => i !== index));
  };

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

  const handleSave = () => {
    // Validation
    if (!formData.title.trim()) {
      toast({
        title: "Erro",
        description: "O título é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.artistOrDirector.trim()) {
      toast({
        title: "Erro", 
        description: "O artista/diretor é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    const newArtwork: Omit<Artwork, 'id'> = {
      title: formData.title.trim(),
      artistOrDirector: formData.artistOrDirector.trim(),
      year: formData.year.trim() || undefined,
      category: formData.category,
      mediumOrGenre: formData.mediumOrGenre.trim() || undefined,
      description: formData.description.trim(),
      imageUrl: formData.imageUrl.trim() || undefined,
      embedUrl: formData.embedUrl.trim() || undefined,
      sourceUrl: formData.sourceUrl.trim() || undefined,
      dimensionsOrDuration: formData.dimensionsOrDuration.trim() || undefined,
      references: references,
    };

    onSave(newArtwork);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-primary" />
            <span>Nova Obra de Arte</span>
          </DialogTitle>
          <DialogDescription>
            Adicione uma nova obra ao acervo do BiblianaArte.com
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <ImageIcon className="w-4 h-4" />
                <span>Informações Básicas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  placeholder="Ex: A Criação de Adão"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="artist">Artista/Diretor *</Label>
                <Input
                  id="artist"
                  placeholder="Ex: Michelangelo"
                  value={formData.artistOrDirector}
                  onChange={(e) => handleInputChange('artistOrDirector', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="year">Ano</Label>
                  <Input
                    id="year"
                    placeholder="Ex: 1508-1512"
                    value={formData.year}
                    onChange={(e) => handleInputChange('year', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="painting">
                        <div className="flex items-center space-x-2">
                          <Palette className="w-4 h-4" />
                          <span>Pintura</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="music">
                        <div className="flex items-center space-x-2">
                          <Music className="w-4 h-4" />
                          <span>Música</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="film">
                        <div className="flex items-center space-x-2">
                          <Film className="w-4 h-4" />
                          <span>Filme</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="medium">Técnica/Gênero</Label>
                <Input
                  id="medium"
                  placeholder="Ex: Afresco, Óleo sobre tela"
                  value={formData.mediumOrGenre}
                  onChange={(e) => handleInputChange('mediumOrGenre', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descrição da obra..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* URLs e Mídia */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">URLs e Mídia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="imageUrl">URL da Imagem</Label>
                <Input
                  id="imageUrl"
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={formData.imageUrl}
                  onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="embedUrl">URL de Embed (YouTube, etc.)</Label>
                <Input
                  id="embedUrl"
                  placeholder="https://youtube.com/embed/..."
                  value={formData.embedUrl}
                  onChange={(e) => handleInputChange('embedUrl', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="sourceUrl">URL da Fonte</Label>
                <Input
                  id="sourceUrl"
                  placeholder="https://exemplo.com/fonte"
                  value={formData.sourceUrl}
                  onChange={(e) => handleInputChange('sourceUrl', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="dimensions">Dimensões/Duração</Label>
                <Input
                  id="dimensions"
                  placeholder="Ex: 280 x 570 cm, 3:45 min"
                  value={formData.dimensionsOrDuration}
                  onChange={(e) => handleInputChange('dimensionsOrDuration', e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Preview da categoria */}
              <div className="pt-4">
                <Badge variant="secondary" className="flex items-center space-x-1 w-fit">
                  {getCategoryIcon(formData.category)}
                  <span>
                    {formData.category === 'painting' ? 'Pintura' : 
                     formData.category === 'music' ? 'Música' : 'Filme'}
                  </span>
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referências Bíblicas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Referências Bíblicas</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Adicionar nova referência */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <Label htmlFor="book">Livro</Label>
                <Input
                  id="book"
                  placeholder="Ex: Gênesis"
                  value={newReference.book}
                  onChange={(e) => setNewReference(prev => ({ ...prev, book: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="bookSlug">Slug</Label>
                <Input
                  id="bookSlug"
                  placeholder="Ex: genesis"
                  value={newReference.bookSlug}
                  onChange={(e) => setNewReference(prev => ({ ...prev, bookSlug: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="chapter">Capítulo</Label>
                <Input
                  id="chapter"
                  placeholder="Ex: 1"
                  type="number"
                  value={newReference.chapter}
                  onChange={(e) => setNewReference(prev => ({ ...prev, chapter: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="verses">Versículos</Label>
                <Input
                  id="verses"
                  placeholder="Ex: 1-3"
                  value={newReference.verses}
                  onChange={(e) => setNewReference(prev => ({ ...prev, verses: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addReference}
              className="mb-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Referência
            </Button>

            {/* Lista de referências */}
            {references.length > 0 && (
              <div>
                <Separator className="mb-4" />
                <div className="space-y-2">
                  {references.map((ref, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">
                        {ref.book} {ref.chapter}{ref.verses ? `:${ref.verses}` : ''}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeReference(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botões de ação */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Salvando...' : 'Salvar Obra'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}