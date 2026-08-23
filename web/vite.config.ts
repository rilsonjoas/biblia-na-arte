import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      // manifest: false — site.webmanifest já existe (ícones 192/512
      // reais, tema, cores) e está linkado no index.html; o plugin só
      // cuida do service worker, não duplica/gera outro manifest.
      manifest: false,
      registerType: "autoUpdate",
      injectRegister: "auto",
      workbox: {
        // Achado 2026-08-22 (roadmap "PWA instalável"): objetivo real é a
        // galeria funcionar offline depois da 1ª visita, não cachear a
        // API (conteúdo muda com curadoria — cache agressivo de dado
        // ficaria velho). Precache só o shell (JS/CSS do build);
        // runtime caching cobre imagem e fonte.
        globPatterns: ["**/*.{js,css,html,ico,svg}"],
        runtimeCaching: [
          {
            // Pinturas do acervo (WebP) — o alvo principal do item do
            // roadmap: cache-first, galeria já vista funciona offline.
            urlPattern: /\/images\/.*\.(?:webp|png|jpe?g)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "artwork-images-cache",
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // API: NetworkFirst com fallback curto — resiliência a uma
            // queda momentânea de rede, sem servir catálogo desatualizado
            // por muito tempo (conteúdo muda com a curadoria contínua).
            urlPattern: /\/api\/v1\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
