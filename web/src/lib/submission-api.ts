// Submissão pública de artistas (roadmap, 2026-09-05) — separado do
// `apiClient` de leitura porque manda multipart/form-data, não JSON.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export class SubmissionApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SubmissionApiError';
  }
}

export interface SubmitArtworkInput {
  submitterName: string;
  submitterEmail: string;
  submitterContact?: string;
  rightsConfirmed: boolean;
  title: string;
  subtitle?: string;
  artistName?: string;
  year?: string;
  description?: string;
  location?: string;
  sourceUrl?: string;
  suggestedBook?: string;
  suggestedChapter?: number;
  suggestedVerses?: string;
  suggestedPassageText?: string;
  image: File;
}

export async function submitArtwork(input: SubmitArtworkInput): Promise<{ id: string; status: string }> {
  const formData = new FormData();
  const { image, rightsConfirmed, ...rest } = input;

  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined && value !== '') formData.set(key, String(value));
  }
  formData.set('rightsConfirmed', String(rightsConfirmed));
  formData.set('image', image);

  const response = await fetch(`${API_URL}/api/v1/submissions`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new SubmissionApiError(body.message ?? `Erro ${response.status} ao enviar a obra`);
  }

  return response.json();
}
