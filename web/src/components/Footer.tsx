import { Link } from 'react-router';
import { Instagram } from 'lucide-react';

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
              Descubra como as narrativas sagradas foram interpretadas ao 
              longo da história através de pinturas ligadas às passagens 
              que as inspiraram.
            </p>
            <a
              href="https://www.instagram.com/artecristadiaria/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Arte Cristã Diária no Instagram"
              className="inline-flex items-center gap-2 mt-5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Instagram className="w-4 h-4" />
              @artecristadiaria · uma obra por dia
            </a>
          </div>

          {/* Navigation Links — "Explorar", não "Navegação": mesmo verbo já
              usado nos CTAs do site ("Explorar pela Bíblia", "Descobrir
              Arte") — achado real 2026-08-22 ("Navegação é uma palavra
              estranha pra isso") */}
          <div>
            <h3 className="text-display font-semibold mb-4 text-foreground">Explorar</h3>
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
              {/* Diretório de pintores (roadmap, 2026-09-05) — pedido do
                  Rilson, olhando esse mesmo rodapé. */}
              <Link
                to="/pintores"
                className="block text-muted-foreground hover:text-primary transition-colors"
              >
                Pintores
              </Link>
              <Link
                to="/busca" 
                className="block text-muted-foreground hover:text-primary transition-colors"
              >
                Busca Avançada
              </Link>
            </div>
          </div>

          {/* Resources — "Sobre", não "Projeto": evita repetir "Projeto"
              dentro do próprio link "Sobre o Projeto" logo abaixo */}
          <div>
            <h3 className="text-display font-semibold mb-4 text-foreground">Sobre</h3>
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
              <Link
                to="/privacidade"
                className="block text-muted-foreground hover:text-primary transition-colors"
              >
                Política de Privacidade
              </Link>
            </div>
          </div>
        </div>

        {/* Cluster A Biblioteca — mesmo modelo aprovado no Gerador C.S. Lewis
            (ClusterFooter.tsx): rótulo-nicho em caps espaçadas, links
            uniformes com ✦ dourado, pares ornamento+link atômicos pra quebra
            de linha limpa no mobile */}
        <div className="mt-10 flex flex-col items-center gap-2.5 text-center border-t border-border/50 pt-8">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
            Conheça também
          </span>
          <nav
            aria-label="Outros projetos do cluster A Biblioteca"
            className="flex max-w-md sm:max-w-none flex-wrap items-baseline justify-center gap-y-1.5 text-xs text-muted-foreground"
          >
            {[
              { label: 'Narniano', href: 'https://narniano.com' },
              { label: 'Scriptorium Divinum', href: 'https://scriptorium.narniano.com' },
              { label: 'Lecionário', href: 'https://lecionario.narniano.com' },
              { label: 'Gerador C.S. Lewis', href: 'https://cslewis.narniano.com' },
            ].map((link, i) => (
              <span key={link.href} className="flex items-baseline whitespace-nowrap">
                {i > 0 && (
                  <span aria-hidden="true" className="mx-2.5 text-[var(--dourado)]">
                    ✦
                  </span>
                )}
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors underline-offset-2 hover:text-primary hover:underline"
                >
                  {link.label}
                </a>
              </span>
            ))}
          </nav>
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