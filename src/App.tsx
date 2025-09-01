import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import BibleBooks from "./pages/BibleBooks";
import ArtCategories from "./pages/ArtCategories";
import ArtworkDetail from "./pages/ArtworkDetail";
import About from "./pages/About";
import Contribute from "./pages/Contribute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/biblia" element={<BibleBooks />} />
          <Route path="/arte" element={<ArtCategories />} />
          <Route path="/arte/:category" element={<ArtCategories />} />
          <Route path="/obra/:artworkId" element={<ArtworkDetail />} />
          <Route path="/sobre" element={<About />} />
          <Route path="/contribuir" element={<Contribute />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
