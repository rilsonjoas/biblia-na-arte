import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { env } from '../config.js';
import * as schema from './schema.js';

// Pool pequeno de propósito — o VPS tem 4GB de RAM divididos entre vários
// serviços (Traefik, WordPress, a-bancada-evangelica, este Postgres
// compartilhado). Não faz sentido um pool grande pra uma API só-leitura
// de tráfego baixo/médio.
const queryClient = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, { schema });

export async function closeDb() {
  await queryClient.end({ timeout: 5 });
}
