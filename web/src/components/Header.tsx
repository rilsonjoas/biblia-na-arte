import { useState } from 'react';
import { Link } from 'react-router';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Book, Palette, Search, Menu, Sparkles, ScrollText, Cross, HeartHandshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CommandPalette } from '@/components/CommandPalette';

export default function Header() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-card/90 backdrop-blur-md supports-[backdrop-filter]:bg-card/75 transition-colors">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2.5 group focus:outline-none shrink-0">
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
                    <NavigationMenuTrigger className="text-display text-sm font-medium bg-transparent hover:bg-muted/60 data-[state=open]:bg-muted/80">
                      <Book className="w-4 h-4 mr-2 text-primary" />
                      Navegar pela Bíblia
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="w-[380px] p-3">
                        <div className="grid gap-2">
                          <NavigationMenuLink asChild>
                            <Link
                              to="/biblia"
                              className="block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                              <div className="text-sm font-semibold text-foreground">Todos os 66 Livros</div>
                              <p className="text-xs leading-relaxed text-muted-foreground mt-1">
                                Explore os livros do cânon bíblico e suas ricas conexões na história da arte
                              </p>
                            </Link>
                          </NavigationMenuLink>
                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40">
                            <NavigationMenuLink asChild>
                              <Link
                                to="/biblia?testament=old"
                                className="block rounded-md p-2 hover:bg-accent hover:text-accent-foreground text-xs font-medium"
                              >
                                <ScrollText className="w-3.5 h-3.5 inline mr-1.5 text-primary" />
                                Antigo Testamento
                              </Link>
                            </NavigationMenuLink>
                            <NavigationMenuLink asChild>
                              <Link
                                to="/biblia?testament=new"
                                className="block rounded-md p-2 hover:bg-accent hover:text-accent-foreground text-xs font-medium"
                              >
                                <Cross className="w-3.5 h-3.5 inline mr-1.5 text-primary" />
                                Novo Testamento
                              </Link>
                            </NavigationMenuLink>
                          </div>
                        </div>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="text-display text-sm font-medium bg-transparent hover:bg-muted/60 data-[state=open]:bg-muted/80">
                      <Palette className="w-4 h-4 mr-2 text-amber-600 dark:text-amber-400" />
                      Galeria de Arte
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="w-[300px] p-3">
                        <div className="grid gap-2">
                          <NavigationMenuLink asChild>
                            <Link
                              to="/arte/painting"
                              className="block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                              <div className="text-sm font-semibold text-foreground">Pinturas & Obras Visuais</div>
                              <p className="text-xs leading-relaxed text-muted-foreground mt-1">
                                Obras de mestres clássicos, renascentistas e barrocos
                              </p>
                            </Link>
                          </NavigationMenuLink>
                          <NavigationMenuLink asChild>
                            <Link
                              to="/busca"
                              className="block rounded-md p-2.5 hover:bg-accent hover:text-accent-foreground text-xs font-medium text-muted-foreground"
                            >
                              <Search className="w-3.5 h-3.5 inline mr-1.5" />
                              Busca detalhada por artista ou período
                            </Link>
                          </NavigationMenuLink>
                        </div>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    {/* text-display: os dois itens irmãos (NavigationMenuTrigger
                        acima) já usam a fonte serifada da marca — este link
                        simples tinha ficado sem, caindo no sans padrão e
                        destoando visualmente dos outros dois — achado real
                        2026-08-22 */}
                    <Link
                      to="/sobre"
                      className="inline-flex items-center justify-center rounded-md px-3 py-2 text-display text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
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