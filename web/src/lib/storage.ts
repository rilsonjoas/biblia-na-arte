/**
 * As imagens do catálogo são estáticas, servidas pelo próprio Traefik do
 * VPS junto com o build do site (web/public/images/*, copiado pro dist/
 * pelo Vite) — sem Supabase Storage, sem S3/MinIO. É um acervo curado
 * fixo, não upload de usuário, não justifica object storage próprio.
 */
export function isLocalAsset(url: string): boolean {
  if (!url) return false;
  return url.startsWith('/images/');
}
