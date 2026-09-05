// Roda antes de qualquer módulo do server ser importado nos testes de
// integração. Aponta a API pro Postgres de teste (docker-compose.test.yml)
// em vez do banco real do VPS — se DATABASE_URL já estiver no ambiente
// (ex.: CI com Postgres service), ela ganha e esse default não é usado.
import { config as loadEnv } from 'dotenv';

loadEnv();

const testUrl =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL ??
  'postgresql://biblia_test:biblia_test@localhost:5433/biblia_na_arte_test';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = testUrl;
process.env.CORS_ORIGIN = 'http://localhost:8080';
// JWT_SECRET é obrigatório desde a Fase 2 da submissão de artistas
// (2026-09-05) — sem isso buildApp() derruba o processo via
// config.ts, e no CI não existe .env local pro dotenv pegar de bônus
// como acontecia no dev (achado real: passava local, falhava no CI).
process.env.JWT_SECRET ??= 'test-secret-with-at-least-32-characters-for-integration';
