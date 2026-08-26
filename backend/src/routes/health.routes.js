/** @param {import('fastify').FastifyInstance} app */
export default async function healthRoutes(app) {
  app.get('/health', async (request) => {
    let database = 'unknown';

    try {
      await app.prisma.$queryRaw`SELECT 1`;
      database = 'connected';
    } catch (err) {
      request.log.warn({ err }, 'Database health check failed');
      database = 'disconnected';
    }

    return {
      status: database === 'connected' ? 'ok' : 'degraded',
      service: 'yolo-backend',
      database,
      timestamp: new Date().toISOString(),
    };
  });
}
