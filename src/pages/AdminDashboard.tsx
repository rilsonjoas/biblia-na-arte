import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import EditArtworkModal from '@/components/EditArtworkModal';
import AddArtworkModal from '@/components/AddArtworkModal';
import DeleteArtworkDialog from '@/components/DeleteArtworkDialog';
import { useToast } from '@/components/ui/use-toast';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useAllArtworks, useCreateArtwork, useUpdateArtwork, useDeleteArtwork } from '@/hooks/use-artworks';
import { Artwork } from '@/types';
import { 
  Palette, 
  Music, 
  Film, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  User, 
  Calendar,
  ImageIcon,
  LogOut,
  BarChart3
} from 'lucide-react';

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingArtwork, setDeletingArtwork] = useState<Artwork | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { user, logout } = useAuth();
  const { data: artworks = [], isLoading } = useAllArtworks();
  const { toast } = useToast();
  const createArtworkMutation = useCreateArtwork();
  const updateArtworkMutation = useUpdateArtwork();
  const deleteArtworkMutation = useDeleteArtwork();

  // Filtrar artworks
  const filteredArtworks = useMemo(() => {
    let filtered = artworks;

    if (searchTerm) {
      filtered = filtered.filter(artwork =>
        artwork.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        artwork.artistOrDirector.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(artwork => artwork.category === categoryFilter);
    }

    return filtered;
  }, [artworks, searchTerm, categoryFilter]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = artworks.length;
    const paintings = artworks.filter(a => a.category === 'painting').length;
    const music = artworks.filter(a => a.category === 'music').length;
    const films = artworks.filter(a => a.category === 'film').length;
    const withImages = artworks.filter(a => a.imageUrl || a.embedUrl).length;

    return { total, paintings, music, films, withImages };
  }, [artworks]);

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

  const handleEditArtwork = (artwork: Artwork) => {
    setEditingArtwork(artwork);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingArtwork(null);
  };

  const handleSaveArtwork = async (updatedArtwork: Artwork) => {
    try {
      await updateArtworkMutation.mutateAsync(updatedArtwork);
      
      handleCloseEditModal();
      
      toast({
        title: "Obra atualizada com sucesso",
        description: `As alterações em "${updatedArtwork.title}" foram salvas.`,
        variant: "default",
      });
      
    } catch (error) {
      console.error('Erro ao salvar obra:', error);
      
      toast({
        title: "Erro ao salvar obra",
        description: `Não foi possível salvar as alterações em "${updatedArtwork.title}".`,
        variant: "destructive",
      });
    }
  };

  const handleAddArtwork = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleSaveNewArtwork = async (newArtwork: Omit<Artwork, 'id'>) => {
    try {
      await createArtworkMutation.mutateAsync(newArtwork);
      
      handleCloseAddModal();
      
      toast({
        title: "Obra criada com sucesso",
        description: `A obra "${newArtwork.title}" foi adicionada ao acervo.`,
        variant: "default",
      });
      
    } catch (error) {
      console.error('Erro ao criar obra:', error);
      
      toast({
        title: "Erro ao criar obra",
        description: `Não foi possível adicionar "${newArtwork.title}". Tente novamente.`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteArtwork = (artwork: Artwork) => {
    setDeletingArtwork(artwork);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeletingArtwork(null);
  };

  const handleConfirmDelete = async (artwork: Artwork) => {
    setIsDeleting(true);
    try {
      await deleteArtworkMutation.mutateAsync(artwork.id);
      
      // Close the dialog
      handleCloseDeleteDialog();
      
      // Show success toast
      toast({
        title: "Obra excluída com sucesso",
        description: `A obra "${artwork.title}" foi removida permanentemente.`,
        variant: "default",
      });
      
    } catch (error) {
      console.error('Erro ao excluir obra:', error);
      
      // Show error toast
      toast({
        title: "Erro ao excluir obra",
        description: `Não foi possível excluir "${artwork.title}". Tente novamente.`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-display text-3xl md:text-4xl font-bold mb-2">
              Dashboard Administrativo
            </h1>
            <p className="text-muted-foreground">
              Bem-vindo, {user?.username}! Gerencie o acervo do BiblianaArte.com
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={logout} className="shadow-card">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="gradient-card border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Obras</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Total no acervo
              </p>
            </CardContent>
          </Card>

          <Card className="gradient-card border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pinturas</CardTitle>
              <Palette className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.paintings}</div>
              <p className="text-xs text-muted-foreground">
                Obras de arte visual
              </p>
            </CardContent>
          </Card>

          <Card className="gradient-card border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Músicas</CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.music}</div>
              <p className="text-xs text-muted-foreground">
                Composições sacras
              </p>
            </CardContent>
          </Card>

          <Card className="gradient-card border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Filmes</CardTitle>
              <Film className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.films}</div>
              <p className="text-xs text-muted-foreground">
                Produções cinematográficas
              </p>
            </CardContent>
          </Card>

          <Card className="gradient-card border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Com Mídia</CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.withImages}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((stats.withImages / stats.total) * 100)}% do acervo
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="gradient-card border-0 mb-8">
          <CardHeader>
            <CardTitle className="text-display text-xl">
              Gerenciar Obras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título ou artista..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 shadow-card"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[200px] shadow-card">
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  <SelectItem value="painting">Pinturas</SelectItem>
                  <SelectItem value="music">Músicas</SelectItem>
                  <SelectItem value="film">Filmes</SelectItem>
                </SelectContent>
              </Select>
              <Button className="shadow-card" onClick={handleAddArtwork}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Obra
              </Button>
            </div>

            {/* Lista de Obras */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Imagem</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Artista</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Carregando obras...
                      </TableCell>
                    </TableRow>
                  ) : filteredArtworks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Nenhuma obra encontrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredArtworks.map((artwork) => (
                      <TableRow key={artwork.id}>
                        <TableCell>
                          <div className="w-16 h-12">
                            <AspectRatio ratio={4/3}>
                              {artwork.embedUrl ? (
                                <div className="w-full h-full bg-primary/10 rounded flex items-center justify-center">
                                  <Music className="w-4 h-4 text-primary" />
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
                        </TableCell>
                        <TableCell>
                          <div>
                            <Link 
                              to={`/obra/${artwork.id}`}
                              className="font-medium hover:text-primary transition-colors"
                            >
                              {artwork.title}
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span>{artwork.artistOrDirector}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="flex items-center space-x-1 w-fit">
                            {getCategoryIcon(artwork.category)}
                            <span>{getCategoryLabel(artwork.category)}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{artwork.year}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditArtwork(artwork)}
                              title="Editar obra"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteArtwork(artwork)}
                              title="Excluir obra"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Paginação info */}
            <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
              <span>
                Mostrando {filteredArtworks.length} de {stats.total} obras
              </span>
              <span>
                {searchTerm || categoryFilter !== 'all' ? 'Filtrados' : 'Total'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />

      {/* Modal de Adição */}
      <AddArtworkModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSave={handleSaveNewArtwork}
        isLoading={createArtworkMutation.isPending}
      />

      {/* Modal de Edição */}
      <EditArtworkModal
        artwork={editingArtwork}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveArtwork}
      />

      {/* Modal de Exclusão */}
      <DeleteArtworkDialog
        artwork={deletingArtwork}
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}