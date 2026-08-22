import { Check, Moon, Sun, Laptop } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full" aria-label="Alternar tema">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-600 dark:text-amber-400" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-amber-300" />
          <span className="sr-only">Alternar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card border-border">
        <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer flex items-center gap-2">
          <Sun className="h-4 w-4 text-amber-600" />
          <span>Claro</span>
          {theme === 'light' && <Check className="ml-auto w-3 h-3 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer flex items-center gap-2">
          <Moon className="h-4 w-4 text-amber-400" />
          <span>Escuro</span>
          {theme === 'dark' && <Check className="ml-auto w-3 h-3 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer flex items-center gap-2">
          <Laptop className="h-4 w-4 text-muted-foreground" />
          <span>Sistema</span>
          {theme === 'system' && <Check className="ml-auto w-3 h-3 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
