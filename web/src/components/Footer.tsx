import { Link } from 'react-router-dom';
import { Book, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-accent rounded-md flex items-center justify-center">
                <Book className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="text-display text-xl font-bold">
                BiblianaArte.com
              </span>
            </div>
            <p className="text-primary-foreground/80 max-w-md">
              Explorando as profundas conexões entre a Bíblia e as artes. 
              Descubra como as narrativas sagradas foram interpretadas e 
              retratadas ao longo da história através de pinturas, músicas e filmes.
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="text-display font-semibold mb-4 text-white">Navegação</h3>
            <div className="space-y-2">
              <Link 
                to="/biblia" 
                className="block text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                Livros da Bíblia
              </Link>
              <Link 
                to="/arte/painting" 
                className="block text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                Pinturas
              </Link>
              <Link 
                to="/arte/music" 
                className="block text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                Músicas
              </Link>
              <Link 
                to="/arte/film" 
                className="block text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                Filmes
              </Link>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-display font-semibold mb-4 text-white">Recursos</h3>
            <div className="space-y-2">
              <Link 
                to="/sobre" 
                className="block text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                Sobre o Projeto
              </Link>
              <Link 
                to="/contribuir" 
                className="block text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                Como Contribuir
              </Link>
              <Link 
                to="/privacidade" 
                className="block text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                Política de Privacidade
              </Link>
              <Link 
                to="/contato" 
                className="block text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                Contato
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-primary-foreground/60 text-sm">
            © {currentYear} BiblianaArte.com. Desenvolvido com{' '}
            <Heart className="inline w-4 h-4 text-accent" />{' '}
            para a glória de Deus.
          </p>
          <p className="text-primary-foreground/60 text-sm mt-2 md:mt-0">
            Todas as obras são de domínio público ou utilizadas sob licença adequada.
          </p>
        </div>
      </div>
    </footer>
  );
}