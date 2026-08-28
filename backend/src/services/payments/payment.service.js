import crypto from 'crypto';
import Razorpay from 'razorpay';
import { config } from '../../config/env.js';
import { getPrisma } from '../../db/prisma.js';
import { getOwnedTrip } from '../trips/trip.service.js';

const CONCIERGE_AMOUNT_PAISE = 9900; // ₹99.00
const CONCIERGE_PURPOSE = 'YOLO Premium Trip Concierge';

/**
 * @returns {Razorpay}
 */
function getRazorpayClient() {
  if (!config.razorpayKeyId || !config.razorpayKeySecret) {
    const err = new Error('Razorpay Test Mode is not configured');
    err.statusCode = 503;
    throw err;
  }
  return new Razorpay({
    key_id: config.razorpayKeyId,
    key_secret: config.razorpayKeySecret,
  });
}

/**
 * Create a Razorpay TEST MODE order for Premium Concierge.
 */
export async function createConciergeOrder(tripId, userId) {
  await getOwnedTrip(tripId, userId);
  const prisma = getPrisma();
  const razorpay = getRazorpayClient();

  const order = await razorpay.orders.create({
    amount: CONCIERGE_AMOUNT_PAISE,
    currency: 'INR',
    receipt: `yolo_concierge_${tripId.slice(0, 8)}_${Date.now()}`,
    notes: {
      tripId,
      userId,
      purpose: CONCIERGE_PURPOSE,
      mode: 'TEST',
    },
  });

  const payment = await prisma.payment.create({
    data: {
      tripId,
      userId,
      razorpayOrderId: order.id,
      amount: CONCIERGE_AMOUNT_PAISE / 100,
      currency: 'INR',
      status: 'CREATED',
      purpose: CONCIERGE_PURPOSE,
    },
  });

  return {
    paymentId: payment.id,
    orderId: order.id,
    amount: CONCIERGE_AMOUNT_PAISE,
    currency: 'INR',
    keyId: config.razorpayKeyId,
    purpose: CONCIERGE_PURPOSE,
    testMode: true,
  };
}

/**
 * Verify Razorpay payment signature server-side and mark CAPTURED.
 */
export async function verifyConciergePayment({
  tripId,
  userId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) {
  await getOwnedTrip(tripId, userId);

  if (!config.razorpayKeySecret) {
    const err = new Error('Razorpay Test Mode is not configured');
    err.statusCode = 503;
    throw err;
  }

  const expected = crypto
    .createHmac('sha256', config.razorpayKeySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expected !== razorpaySignature) {
    const err = new Error('Payment verification failed');
    err.statusCode = 400;
    throw err;
  }

  const prisma = getPrisma();
  const existing = await prisma.payment.findFirst({
    where: { razorpayOrderId, userId, tripId },
  });

  if (!existing) {
    const err = new Error('Payment order not found');
    err.statusCode = 404;
    throw err;
  }

  const payment = await prisma.payment.update({
    where: { id: existing.id },
    data: {
      razorpayPaymentId,
      razorpaySignature,
      status: 'CAPTURED',
    },
  });

  return {
    payment: {
      ...payment,
      amount: Number(payment.amount),
    },
    testMode: true,
    message: 'TEST MODE payment verified. No real money was charged.',
  };
}

/**
 * List payments for a trip.
 */
export async function listTripPayments(tripId, userId) {
  await getOwnedTrip(tripId, userId);
  const prisma = getPrisma();
  const payments = await prisma.payment.findMany({
    where: { tripId, userId },
    orderBy: { createdAt: 'desc' },
  });
  return payments.map((p) => ({
    ...p,
    amount: Number(p.amount),
    testMode: true,
  }));
}

export { CONCIERGE_AMOUNT_PAISE, CONCIERGE_PURPOSE };
