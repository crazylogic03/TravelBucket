import { buildApp } from './app.js';
import { config } from './config/env.js';
import { disconnectPrisma } from './db/prisma.js';

async function start() {
  const app = await buildApp();

  const shutdown = async () => {
    await app.close();
    await disconnectPrisma();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    app.log.info(`YOLO backend listening on http://localhost:${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
