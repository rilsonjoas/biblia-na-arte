import { Link } from 'react-router';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border/70 text-foreground transition-colors">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg overflow-hidden shadow-md shrink-0">
                <img
                  src="/logo-header-light.png"
                  alt="Bíblia na Arte"
                  className="w-8 h-8 dark:hidden"
                  width={32}
                  height={32}
                />
                <img
                  src="/logo-header-dark.png"
                  alt="Bíblia na Arte"
                  className="hidden w-8 h-8 dark:block"
                  width={32}
                  height={32}
                />
              </div>
              <span className="text-display text-xl font-bold text-foreground">
                Bíblia<span className="text-amber-500 font-normal"> na Arte</span>
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
              Explorando as profundas conexões entre a Bíblia e as artes. 
              Descubra como as narrativas sagradas foram interpretadas e 
              retratadas ao longo da história através de pinturas, músicas e filmes.
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="text-display font-semibold mb-4 text-foreground">Navegação</h3>
            <div className="space-y-2 text-sm">
              <Link 
                to="/biblia" 
                className="block text-muted-foreground hover:text-primary transition-colors"
              >
                Livros da Bíblia
              </Link>
              <Link 
                to="/arte/painting" 
                className="block text-muted-foreground hover:text-primary transition-colors"
              >
                Pinturas
              </Link>
              <Link 
                to="/busca" 
                className="block text-muted-foreground hover:text-primary transition-colors"
              >
                Busca Avançada
              </Link>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-display font-semibold mb-4 text-foreground">Projeto</h3>
            <div className="space-y-2 text-sm">
              <Link 
                to="/sobre" 
                className="block text-muted-foreground hover:text-primary transition-colors"
              >
                Sobre o Projeto
              </Link>
              <Link 
                to="/contribuir" 
                className="block text-muted-foreground hover:text-primary transition-colors"
              >
                Como Contribuir
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground gap-4">
          <p>© {currentYear} Bíblia na Arte.</p>
          <p>
            Obras de domínio público e licenciadas com atribuição.
          </p>
        </div>
      </div>
    </footer>
  );
}