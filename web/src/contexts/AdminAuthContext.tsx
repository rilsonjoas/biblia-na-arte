import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
  login as apiLogin,
  getStoredToken,
  clearStoredToken,
  type AdminUser,
} from '@/lib/admin-api';

// Painel administrativo (roadmap, 2026-09-05) — reescrita do
// `_archived-supabase-admin/AuthContext.tsx` (Supabase Auth, morto em
// 2026-08-07) contra a API de admin nova (JWT próprio, ver
// server/src/plugins/jwt-auth.ts). Não decodifica o token aqui pra
// saber quem é o usuário — não vale a complexidade de um decoder JWT no
// front só pra isso; o `user` guardado localmente é só o que o
// `/admin/login` devolveu no momento do login. Se o token expirar
// (7 dias), a próxima chamada autenticada volta 401 e o
// `AdminProtectedRoute` redireciona pro login — não tem refresh
// automático de token nessa v1.
interface AdminAuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const USER_KEY = 'biblianaarte_admin_user';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    const savedUser = localStorage.getItem(USER_KEY);
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem(USER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const loggedUser = await apiLogin(email, password);
    localStorage.setItem(USER_KEY, JSON.stringify(loggedUser));
    setUser(loggedUser);
  }

  function logout() {
    clearStoredToken();
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  return (
    <AdminAuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth precisa ser usado dentro de um AdminAuthProvider');
  }
  return context;
}
