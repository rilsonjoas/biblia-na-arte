import { defineConfig } from 'vitest/config';

// Config separada pros testes de integração (precisam de Postgres de
// teste rodando — ver docker-compose.test.yml). Roda com:
//   pnpm --filter server test:integration
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
    setupFiles: ['./src/test/integration-setup.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Cada arquivo de teste de integração roda `migrate()` contra o
    // mesmo Postgres de teste no próprio `beforeAll`. Com o paralelismo
    // padrão do Vitest, dois arquivos migrando/inserindo ao mesmo tempo
    // colidem: a migration (DDL, AccessExclusiveLock) contra um INSERT
    // do outro arquivo (RowShareLock por checagem de FK) — deadlock real
    // do Postgres (40P01), achado 2026-09-19 num CI run que nada tinha a
    // ver com o server (só um commit de docs). Arquivos de integração
    // sempre serializados evita a corrida.
    fileParallelism: false,
  },
});
