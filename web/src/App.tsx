import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router";
import { ThemeProvider } from "next-themes";
import { ScrollToTop } from "@/components/ScrollToTop";
import Index from "./pages/Index";
import BibleBooks from "./pages/BibleBooks";
import BibleBook from "./pages/BibleBook";
import Chapter from "./pages/Chapter";
import ArtCategories from "./pages/ArtCategories";
import ArtworkDetail from "./pages/ArtworkDetail";
import About from "./pages/About";
import Contribute from "./pages/Contribute";
import Search from "./pages/Search";
import Favorites from "./pages/Favorites";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/biblia" element={<BibleBooks />} />
            <Route path="/biblia/:bookSlug" element={<BibleBook />} />
            <Route path="/biblia/:bookSlug/:chapter" element={<Chapter />} />
            <Route path="/arte" element={<ArtCategories />} />
            {/* Achado 2026-08-23: /arte/:category unificado com Search —
                mesma UI de /busca, categoria pré-selecionada pela rota.
                URL preservada de propósito (2.115 páginas indexadas). */}
            <Route path="/arte/:category" element={<Search />} />
            <Route path="/obra/:artworkId" element={<ArtworkDetail />} />
            <Route path="/sobre" element={<About />} />
            <Route path="/contribuir" element={<Contribute />} />
            <Route path="/busca" element={<Search />} />
            <Route path="/favoritos" element={<Favorites />} />
            <Route path="/privacidade" element={<Privacy />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
