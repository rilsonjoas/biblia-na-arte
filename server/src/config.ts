import { z } from 'zod';
import 'dotenv/config';

// Falha rápido no boot se faltar alguma variável — erro aparece no deploy,
// não em produção quando alguém bater numa rota que precisa dela.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),

  // Postgres compartilhado do VPS — usuário deve ter só SELECT no
  // biblia_na_arte_db (v1 é somente leitura pública, sem admin exposto).
  DATABASE_URL: z.string().url(),

  // Origem(s) do frontend, pra restringir o CORS. Em produção deve ser
  // domínio(s) público(s) do site, não "*" — aceita lista separada por
  // vírgula (ex.: "https://biblianaarte.narniano.com,https://lecionario.narniano.com")
  // porque outros projetos da mesma "Biblioteca" (ver hetzner-infra)
  // também consomem essa API direto do navegador, não só o site oficial.
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:8080')
    .transform((val) =>
      val
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),

  // Rate limit — requisições por IP por janela.
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(200),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),

  // Painel administrativo / submissão de artistas (roadmap, 2026-09-05).
  // Sem valor padrão de propósito — gerar com `openssl rand -hex 32` e
  // nunca reaproveitar entre ambientes; trocar esse valor invalida todo
  // login ativo (aceitável, é só isso mesmo que teria que acontecer se
  // vazasse).
  JWT_SECRET: z.string().min(32, 'JWT_SECRET precisa ter pelo menos 32 caracteres'),

  // Diretório onde imagens de submissões pendentes ficam salvas —
  // separado de `web/public/images` de propósito: nada aqui é servido
  // publicamente até a submissão ser aprovada (ver ROADMAP, "Submissão
  // de artistas...").
  SUBMISSION_UPLOADS_DIR: z.string().default('./uploads/pending-submissions'),

  // Achado ao implementar: `web` é build estático servido por nginx
  // (Dockerfile copia `web/dist` já pronto, sem volume gravável em
  // produção) — a imagem de uma obra de submissão NÃO pode ir pra
  // `web/public/images` como as do vault. Fica num diretório próprio,
  // persistente, servido pela própria API (rota pública `/uploads/:file`).
  APPROVED_SUBMISSION_UPLOADS_DIR: z.string().default('./uploads/approved-submissions'),

  // URL pública de onde ESTA API responde — precisa ser absoluta porque
  // o site (`web`, subdomínio diferente) não sabe converter uma URL
  // relativa da API pro domínio certo. Só usada pra montar `imageUrl`
  // de obras de submissão (as do vault continuam relativas, servidas
  // pelo próprio nginx do `web`).
  PUBLIC_API_URL: z.string().url().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas ou faltando:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
