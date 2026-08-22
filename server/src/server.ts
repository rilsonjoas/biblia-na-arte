import { buildApp } from './app.js';
import { env } from './config.js';
import { closeDb } from './db/client.js';
import { runMigrations } from './db/migrate.js';

async function main() {
  // Migrations antes de ouvir tráfego: garante que o schema do banco
  // está em dia com o código que está subindo (falha aqui = container
  // reinicia via restart policy, não serve API quebrada).
  await runMigrations();

  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }

  // Encerramento gracioso — importante em container Docker, que manda
  // SIGTERM no `docker stop`/redeploy. Sem isso, requisições em voo são
  // cortadas e a conexão com o Postgres fica pendurada.
  const shutdown = async (signal: string) => {
    app.log.info(`Recebido ${signal}, encerrando...`);
    await app.close();
    await closeDb();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main();
