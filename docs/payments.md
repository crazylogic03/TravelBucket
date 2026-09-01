# Payments

Razorpay **TEST MODE** integration for YOLO Premium Trip Concierge (₹99).

## Flow

1. Trip overview → Unlock Premium Concierge → `/trips/:tripId/concierge`
2. `POST /api/trips/:tripId/payments/concierge/order` creates Razorpay order + Payment row (`CREATED`)
3. Frontend opens Razorpay Checkout with test key
4. `POST /api/trips/:tripId/payments/concierge/verify` verifies HMAC signature server-side
5. Payment marked `CAPTURED` only after verification

## Rules

- Never expose `RAZORPAY_KEY_SECRET`
- Never mark success from frontend alone
- UI always labels **TEST MODE**
- No claim of a real (production) payment
