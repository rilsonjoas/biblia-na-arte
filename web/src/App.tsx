import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import BibleBooks from "./pages/BibleBooks";
import BibleBook from "./pages/BibleBook";
import ArtCategories from "./pages/ArtCategories";
import ArtworkDetail from "./pages/ArtworkDetail";
import About from "./pages/About";
import Contribute from "./pages/Contribute";
import Search from "./pages/Search";
import NotFound from "./pages/NotFound";

// Rotas administrativas (/admin/*) removidas em 2026-08-07 — dependiam do
// Supabase Auth, que morreu junto com o resto do projeto Supabase. A UI
// continua arquivada em src/_archived-supabase-admin/ pra quando existir
// uma API de admin de verdade.

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/biblia" element={<BibleBooks />} />
          <Route path="/biblia/:bookSlug" element={<BibleBook />} />
          <Route path="/arte" element={<ArtCategories />} />
          <Route path="/arte/:category" element={<ArtCategories />} />
          <Route path="/obra/:artworkId" element={<ArtworkDetail />} />
          <Route path="/sobre" element={<About />} />
          <Route path="/contribuir" element={<Contribute />} />
          <Route path="/busca" element={<Search />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
