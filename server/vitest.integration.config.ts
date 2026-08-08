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
  },
});
