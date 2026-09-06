import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router";
import { ThemeProvider } from "next-themes";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import Index from "./pages/Index";
import BibleBooks from "./pages/BibleBooks";
import BibleBook from "./pages/BibleBook";
import Chapter from "./pages/Chapter";
import ArtCategories from "./pages/ArtCategories";
import ArtworkDetail from "./pages/ArtworkDetail";
import ArtistPage from "./pages/ArtistPage";
import Artists from "./pages/Artists";
import Explore from "./pages/Explore";
import About from "./pages/About";
import Contribute from "./pages/Contribute";
import SubmitArtwork from "./pages/SubmitArtwork";
import Search from "./pages/Search";
import Favorites from "./pages/Favorites";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminSubmissions from "./pages/admin/AdminSubmissions";
import AdminSubmissionDetail from "./pages/admin/AdminSubmissionDetail";
import AdminUsers from "./pages/admin/AdminUsers";

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
      <AdminAuthProvider>
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
              <Route path="/artista/:slug" element={<ArtistPage />} />
              {/* Diretório de pintores (roadmap, 2026-09-05) — faltava
                  índice pra /artista/:slug, que já existia. */}
              <Route path="/pintores" element={<Artists />} />
              {/* "Mapa de obras ↔ referências bíblicas" (roadmap 2026-09-02):
                  rotas novas fora do /biblia pra não tocar nas URLs indexadas. */}
              <Route path="/explorar/:bookSlug/:chapter" element={<Explore />} />
              <Route path="/sobre" element={<About />} />
              <Route path="/contribuir" element={<Contribute />} />
              {/* Submissão de artistas (roadmap, 2026-09-05) — rota nova,
                  fora do fluxo por e-mail existente em /contribuir. */}
              <Route path="/contribuir/enviar-obra" element={<SubmitArtwork />} />
              <Route path="/busca" element={<Search />} />
              <Route path="/favoritos" element={<Favorites />} />
              <Route path="/privacidade" element={<Privacy />} />

              {/* Painel administrativo (roadmap, 2026-09-05) — de
                  propósito sem link nenhum na navegação pública (ver
                  Header.tsx), só por URL direta. Login não é protegido
                  (senão ninguém entraria); as outras duas são. */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin/submissoes"
                element={
                  <AdminProtectedRoute>
                    <AdminSubmissions />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/submissoes/:id"
                element={
                  <AdminProtectedRoute>
                    <AdminSubmissionDetail />
                  </AdminProtectedRoute>
                }
              />
              {/* Gestão de usuários (roadmap, 2026-09-06) — só admin,
                  requireAdminRole redireciona revisor de volta pra fila. */}
              <Route
                path="/admin/usuarios"
                element={
                  <AdminProtectedRoute requireAdminRole>
                    <AdminUsers />
                  </AdminProtectedRoute>
                }
              />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AdminAuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
