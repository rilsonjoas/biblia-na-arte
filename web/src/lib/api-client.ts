const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  params?: Record<string, string | number | string[] | undefined>,
): Promise<T> {
  const url = new URL(`${API_URL}/api/v1${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      // Multiselect de artista/tema (roadmap 2026-09-01) manda um
      // array — serializado como 1 param separado por vírgula (mesmo
      // formato que o backend já espera, ver artwork.schema.ts), não
      // vírgula repetida (`?artists=a&artists=b`), que exigiria mudar o
      // parse do Fastify também.
      if (Array.isArray(value)) {
        if (value.length > 0) url.searchParams.set(key, value.join(','));
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(response.status, body.message ?? `Erro ${response.status} ao chamar a API`);
  }

  return response.json() as Promise<T>;
}

export const apiClient = { request };
