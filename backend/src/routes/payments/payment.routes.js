import { requireAuth } from '../../middleware/auth.middleware.js';
import {
  createConciergeOrder,
  verifyConciergePayment,
  listTripPayments,
} from '../../services/payments/payment.service.js';
import { z } from 'zod';

/** @param {import('fastify').FastifyInstance} app */
export default async function paymentRoutes(app) {
  app.addHook('preHandler', requireAuth);

  app.get('/trips/:tripId/payments', async (request) => {
    const payments = await listTripPayments(request.params.tripId, request.user.id);
    return { payments, testMode: true };
  });

  app.post('/trips/:tripId/payments/concierge/order', async (request, reply) => {
    try {
      const order = await createConciergeOrder(request.params.tripId, request.user.id);
      return order;
    } catch (err) {
      request.log.error(err);
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });

  app.post('/trips/:tripId/payments/concierge/verify', async (request, reply) => {
    const schema = z.object({
      razorpayOrderId: z.string().min(1),
      razorpayPaymentId: z.string().min(1),
      razorpaySignature: z.string().min(1),
    });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed' });
    }
    try {
      const result = await verifyConciergePayment({
        tripId: request.params.tripId,
        userId: request.user.id,
        ...parsed.data,
      });
      return result;
    } catch (err) {
      request.log.error(err);
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });
}
