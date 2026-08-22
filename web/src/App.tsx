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
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
