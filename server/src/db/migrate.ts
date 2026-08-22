import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { env } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Roda migrations do Drizzle + SQL idempotente (funções/triggers e
 *  correções de dados). Chamada no boot do servidor (server.ts) — sem
 *  isso um deploy com schema novo derruba a API com coluna inexistente
 *  (quase-acidente real de 2026-08-22). Também segue funcionando como
 *  CLI via `pnpm db:migrate`. */
export async function runMigrations(): Promise<void> {
  const migrationClient = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    console.log('▶ Rodando migrations do Drizzle...');
    await migrate(db, { migrationsFolder: path.join(__dirname, 'migrations') });

    console.log('▶ Aplicando funções/triggers customizados (SQL puro)...');
    const functionsSql = readFileSync(
      path.join(__dirname, 'custom-sql/functions.sql'),
      'utf-8',
    );
    await migrationClient.unsafe(functionsSql);

    // Correções de dados idempotentes (ex.: desativação de obras sem licença,
    // docs/AUDITORIA-COPYRIGHT.md) — roda todo deploy, é determinístico.
    const dataFixesSql = readFileSync(
      path.join(__dirname, 'custom-sql/data-fixes.sql'),
      'utf-8',
    );
    await migrationClient.unsafe(dataFixesSql);

    console.log('✅ Migrations concluídas.');
  } finally {
    await migrationClient.end();
  }
}

// Execução direta via CLI (`pnpm db:migrate`) — quando importado pelo
// server.ts, este guard evita rodar duas vezes.
const invokedDirectly =
  process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (invokedDirectly) {
  runMigrations().catch((error) => {
    console.error('❌ Falha ao rodar migrations:', error);
    process.exit(1);
  });
}
