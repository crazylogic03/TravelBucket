import { buildApp } from './app.js';
import { config, validateConfig } from './config/env.js';
import { disconnectPrisma, getPrisma } from './db/prisma.js';

async function start() {
  try {
    validateConfig(config);
  } catch (err) {
    console.error('[startup] Configuration error:', err.message);
    process.exit(1);
  }

  try {
    await getPrisma().$connect();
  } catch (err) {
    console.error('[startup] Database connection failed. Check DATABASE_URL.');
    console.error(err.message);
    process.exit(1);
  }

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
    app.log.info(`YOLO backend listening on port ${config.port} (${config.nodeEnv})`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start().catch((err) => {
  console.error('[startup] Unhandled error:', err);
  process.exit(1);
});
