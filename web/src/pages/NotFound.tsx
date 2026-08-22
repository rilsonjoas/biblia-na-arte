import { useLocation, Link } from 'react-router';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Home, Book, Palette } from 'lucide-react';

// Reescrita 2026-08-22 — a versão anterior era o boilerplate padrão do
// scaffold (inglês, sem Header/Footer, cinza genérico "bg-gray-100"),
// nunca tinha sido adaptada ao resto do site. Achado ao revisar se "as
// páginas estão profissionais o suficiente" — não estava.
export default function NotFound() {
  const location = useLocation();

  useEffect(() => {
    console.error('404 — rota inexistente:', location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Página não encontrada"
        description="A página que você procura não existe ou foi movida."
      />
      <Header />

      <div className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-md">
          <p className="font-mono text-sm text-muted-foreground mb-2">Erro 404</p>
          <h1 className="text-display text-4xl md:text-5xl font-bold mb-4">
            Página não encontrada
          </h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            A página <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{location.pathname}</code>{' '}
            não existe ou foi movida. Que tal explorar o acervo?
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="shadow-classical">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Voltar ao Início
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="shadow-card">
              <Link to="/biblia">
                <Book className="w-4 h-4 mr-2" />
                Livros da Bíblia
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="shadow-card">
              <Link to="/arte/painting">
                <Palette className="w-4 h-4 mr-2" />
                Galeria de Arte
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
