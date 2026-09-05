// Painel administrativo (roadmap, 2026-09-05) — cliente de API separado
// do `apiClient` de leitura pública (api-client.ts): precisa de token
// Authorization e métodos além de GET, coisa que o cliente público
// nunca precisou. Token via header, não cookie — a API roda num
// subdomínio diferente do site, ver server/src/plugins/jwt-auth.ts pro
// porquê.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const TOKEN_KEY = 'biblianaarte_admin_token';

export class AdminApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AdminApiError';
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function authedRequest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${API_URL}/api/v1${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401) {
    // Token ausente/inválido/expirado — limpa e deixa o chamador decidir
    // o redirect (ver AdminProtectedRoute), não força navegação aqui.
    clearStoredToken();
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new AdminApiError(response.status, body.message ?? `Erro ${response.status} ao chamar a API`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'revisor';
}

export async function login(email: string, password: string): Promise<AdminUser> {
  const result = await authedRequest<{ token: string; user: AdminUser }>('/admin/login', {
    method: 'POST',
    body: { email, password },
  });
  setStoredToken(result.token);
  return result.user;
}

export interface Submission {
  id: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  submitterName: string;
  submitterEmail: string;
  submitterContact: string | null;
  rightsConfirmed: boolean;
  title: string;
  subtitle: string | null;
  artistName: string | null;
  year: string | null;
  category: string;
  description: string | null;
  location: string | null;
  sourceUrl: string | null;
  suggestedBook: string | null;
  suggestedChapter: number | null;
  suggestedVerses: string | null;
  suggestedPassageText: string | null;
  reviewerNotes: string | null;
  approvedArtworkId: string | null;
  createdAt: string;
}

export async function listSubmissions(status?: Submission['status']): Promise<Submission[]> {
  const query = status ? `?status=${status}` : '';
  return authedRequest<Submission[]>(`/admin/submissions${query}`);
}

export async function getSubmission(id: string): Promise<Submission> {
  return authedRequest<Submission>(`/admin/submissions/${id}`);
}

/** Devolve uma object URL (`blob:...`) pra imagem de uma submissão
 *  pendente — não dá pra usar `<img src="...">` direto com token no
 *  header (tag de imagem não manda header customizado), e colocar o
 *  token na query string vazaria em log de acesso do servidor. Quem
 *  chama precisa `URL.revokeObjectURL()` no cleanup (useEffect) pra não
 *  vazar memória. */
export async function fetchSubmissionImageUrl(id: string): Promise<string> {
  const token = getStoredToken();
  const response = await fetch(`${API_URL}/api/v1/admin/submissions/${id}/image`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new AdminApiError(response.status, 'Não foi possível carregar a imagem');
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export type UpdateSubmissionInput = Partial<
  Pick<
    Submission,
    | 'title'
    | 'subtitle'
    | 'artistName'
    | 'year'
    | 'description'
    | 'location'
    | 'sourceUrl'
    | 'suggestedBook'
    | 'suggestedChapter'
    | 'suggestedVerses'
    | 'suggestedPassageText'
    | 'reviewerNotes'
  >
>;

export async function updateSubmission(id: string, input: UpdateSubmissionInput): Promise<Submission> {
  return authedRequest<Submission>(`/admin/submissions/${id}`, { method: 'PATCH', body: input });
}

export async function approveSubmission(id: string): Promise<{ artworkId: string }> {
  return authedRequest<{ artworkId: string }>(`/admin/submissions/${id}/approve`, { method: 'POST' });
}

export async function rejectSubmission(id: string, reason?: string): Promise<Submission> {
  return authedRequest<Submission>(`/admin/submissions/${id}/reject`, { method: 'POST', body: { reason } });
}
