import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { Book, Palette, Search, Menu, Sparkles, HeartHandshake, Shuffle, RefreshCcw, Bookmark, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CommandPalette } from '@/components/CommandPalette';
import { SurpriseMeButton } from '@/components/SurpriseMeButton';
import { getRandomArtwork } from '@/lib/api-data';
import { artworkHref } from '@/lib/utils';

export default function Header() {
  const navigate = useNavigate();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [surpriseLoading, setSurpriseLoading] = useState(false);

  async function handleSurpriseMe() {
    if (surpriseLoading) return;
    setSurpriseLoading(true);
    try {
      const artwork = await getRandomArtwork();
      setMobileMenuOpen(false);
      navigate(artworkHref(artwork));
    } catch (error) {
      console.warn('[SurpriseMe] falha ao buscar obra aleatória:', error);
    } finally {
      setSurpriseLoading(false);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-card/90 backdrop-blur-md supports-[backdrop-filter]:bg-card/75 transition-colors">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2.5 group rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shrink-0">
              <div className="w-8 h-8 rounded-lg overflow-hidden shadow-md group-hover:scale-105 transition-transform shrink-0">
                {/* Duas versões (clara/escura) trocadas via CSS, sem JS — mesmo
                    padrão do resto do site (--primary muda de vinho pra
                    dourado no dark mode; a logo acompanha). */}
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
              <span className="text-display text-xl font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">
                Bíblia<span className="text-amber-500 font-normal"> na Arte</span>
              </span>
            </Link>

            {/* Desktop Navigation Menu */}
            <div className="hidden lg:flex items-center space-x-6">
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    {/* Estático de propósito — achado 2026-09-02 (Rilson):
                        o split trigger (link + chevron abrindo submenu)
                        tinha sido a solução do achado anterior (2026-08-22,
                        "clicar deveria levar direto pra /biblia"), mas o
                        Rilson preferiu ir direto ao ponto: sem chevron, sem
                        submenu, só o link. "Todos os 66 Livros" e os atalhos
                        de Antigo/Novo Testamento que viviam no submenu não
                        somem — já estão na própria página /biblia. Mesmo
                        estilo do link "Sobre o Projeto" logo abaixo. */}
                    <Link
                      to="/biblia"
                      className="inline-flex items-center justify-center rounded-md px-3 py-2 text-display text-sm font-medium hover:bg-muted/60 transition-colors"
                    >
                      <Book className="w-4 h-4 mr-1.5 text-primary" />
                      Navegar pela Bíblia
                    </Link>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    {/* Mesmo achado acima — estático, sem submenu. */}
                    <Link
                      to="/arte/painting"
                      className="inline-flex items-center justify-center rounded-md px-3 py-2 text-display text-sm font-medium hover:bg-muted/60 transition-colors"
                    >
                      <Palette className="w-4 h-4 mr-1.5 text-amber-600 dark:text-amber-400" />
                      Galeria de Arte
                    </Link>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <Link
                      to="/colecoes"
                      className="inline-flex items-center justify-center rounded-md px-3 py-2 text-display text-sm font-medium hover:bg-muted/60 transition-colors"
                    >
                      <Layers className="w-4 h-4 mr-1.5 text-amber-500" />
                      Coleções
                    </Link>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <Link
                      to="/sobre"
                      className="inline-flex items-center justify-center rounded-md px-3 py-2 text-display text-sm font-medium hover:bg-muted/60 transition-colors"
                    >
                      <Sparkles className="w-4 h-4 mr-1.5 text-amber-500" />
                      Sobre o Projeto
                    </Link>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>

            {/* Right Actions: Command Palette Button & Theme Toggle */}
            <div className="flex items-center gap-2">
              {/* Quick Search Button (Triggers Command Palette) */}
              <button
                onClick={() => setPaletteOpen(true)}
                className="hidden sm:flex items-center gap-3 w-48 md:w-64 px-3 py-1.5 text-xs text-muted-foreground bg-muted/50 hover:bg-muted border border-border/80 rounded-full transition-all shadow-inner focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Abrir busca rápida"
              >
                <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">Buscar livros ou obras...</span>
                <kbd className="ml-auto pointer-events-none hidden md:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border/80 bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </button>

              {/* Mobile Search Icon Button — h-11 w-11 (44px), não h-9 w-9
                  (36px): alvo de toque abaixo do recomendado pelo Apple HIG
                  (44px) e Material (48dp) — achado real 2026-08-22 */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPaletteOpen(true)}
                className="sm:hidden h-11 w-11 rounded-full"
                aria-label="Buscar"
              >
                <Search className="w-4 h-4" />
              </Button>

              {/* Me surpreenda — só desktop, header mobile já está no
                  limite de alvos de toque (busca + tema + menu) */}
              <SurpriseMeButton className="hidden sm:inline-flex h-11 w-11 rounded-full" />

              {/* Favoritos — mesmo critério do Me surpreenda, só desktop */}
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="hidden sm:inline-flex h-11 w-11 rounded-full"
              >
                <Link to="/favoritos" aria-label="Meus favoritos">
                  <Bookmark className="w-4 h-4" />
                </Link>
              </Button>

              {/* Theme Toggle Button */}
              <ThemeToggle />

              {/* Mobile Menu Trigger */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full" aria-label="Abrir menu">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-card border-border w-[280px] p-6">
                  <SheetHeader className="text-left pb-4 border-b border-border/50">
                    <SheetTitle className="text-display text-lg font-bold">
                      Bíblia na Arte
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-2 mt-6">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setPaletteOpen(true);
                      }}
                      className="flex items-center justify-between w-full px-3 py-2 text-sm bg-muted/60 rounded-lg hover:bg-muted text-foreground transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-primary" />
                        Busca Rápida
                      </span>
                      <kbd className="text-[10px] font-mono bg-background px-1 rounded border">⌘K</kbd>
                    </button>

                    <Link
                      to="/biblia"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <Book className="w-4 h-4 text-primary" />
                      <span>Livros da Bíblia</span>
                    </Link>

                    <Link
                      to="/arte/painting"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <Palette className="w-4 h-4 text-amber-500" />
                      <span>Galeria de Pinturas</span>
                    </Link>

                    <Link
                      to="/colecoes"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <Layers className="w-4 h-4 text-amber-500" />
                      <span>Coleções Temáticas</span>
                    </Link>

                    <button
                      onClick={handleSurpriseMe}
                      disabled={surpriseLoading}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors text-left disabled:opacity-60"
                    >
                      {surpriseLoading ? (
                        <RefreshCcw className="w-4 h-4 text-amber-500 animate-spin" />
                      ) : (
                        <Shuffle className="w-4 h-4 text-amber-500" />
                      )}
                      <span>Me surpreenda</span>
                    </button>

                    <Link
                      to="/favoritos"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <Bookmark className="w-4 h-4 text-amber-500" />
                      <span>Meus Favoritos</span>
                    </Link>

                    <Link
                      to="/sobre"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Sobre o Projeto</span>
                    </Link>

                    <Link
                      to="/contribuir"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <HeartHandshake className="w-4 h-4 text-primary" />
                      <span>Contribuir</span>
                    </Link>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  );
}