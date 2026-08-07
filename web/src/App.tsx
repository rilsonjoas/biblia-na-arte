import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import BibleBooks from "./pages/BibleBooks";
import BibleBook from "./pages/BibleBook";
import ArtCategories from "./pages/ArtCategories";
import ArtworkDetail from "./pages/ArtworkDetail";
import About from "./pages/About";
import Contribute from "./pages/Contribute";
import Search from "./pages/Search";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
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
            
            {/* Rotas administrativas */}
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
