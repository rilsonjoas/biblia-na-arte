import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { LoadingCard } from '@/components/ui/loading';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface AdminProtectedRouteProps {
  children: ReactNode;
  /** Só usado em `/admin/submissoes/:id` pra bloquear o botão de
   *  aprovar de quem é `revisor` — o servidor já rejeita com 403
   *  (ver plugins/jwt-auth.ts, `requireAdmin`), isso aqui é só UX. */
  requireAdminRole?: boolean;
}

export default function AdminProtectedRoute({ children, requireAdminRole }: AdminProtectedRouteProps) {
  const { user, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <LoadingCard text="Verificando autenticação..." />
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (requireAdminRole && user.role !== 'admin') {
    return <Navigate to="/admin/submissoes" replace />;
  }

  return <>{children}</>;
}
