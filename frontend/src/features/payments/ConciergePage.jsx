import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/layouts/AppShell.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button.jsx';
import {
  createConciergeOrder,
  verifyConciergePayment,
  listPayments,
  getTrip,
} from '@/features/trips/tripApi.js';

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay'));
    document.body.appendChild(script);
  });
}

export default function ConciergePage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [unavailable, setUnavailable] = useState(null);

  useEffect(() => {
    getTrip(tripId).then((d) => setTrip(d.trip));
    listPayments(tripId)
      .then((d) => setPayments(d.payments || []))
      .catch(() => {});
  }, [tripId]);

  const unlocked = payments.some((p) => p.status === 'CAPTURED');
  const latest = payments[0];

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setUnavailable(null);
    try {
      await loadRazorpayScript();
      const order = await createConciergeOrder(tripId);

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'YOLO',
        description: `${order.purpose} (TEST PAYMENT)`,
        order_id: order.orderId,
        theme: { color: '#4A90E2' },
        handler: async (response) => {
          try {
            const result = await verifyConciergePayment(tripId, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            setSuccess(result.message);
            const refreshed = await listPayments(tripId);
            setPayments(refreshed.payments || []);
          } catch (err) {
            setError(err.message || 'Verification failed');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      rzp.on('payment.failed', (resp) => {
        setError(resp?.error?.description || 'Payment failed (TEST MODE)');
        setLoading(false);
      });

      rzp.open();
    } catch (err) {
      if (err.status === 503 || /not configured/i.test(err.message || '')) {
        setUnavailable(
          'Razorpay Test Mode is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the server environment. Payment checkout is hidden until then.',
        );
      } else {
        setError(err.message);
      }
      setLoading(false);
    }
  };

  return (
    <AppShell title="Payments" subtitle="Booking & concierge flows">
      <PageHeader
        title="Trip payments & bookings"
        subtitle="Organize travel purchases — external providers may complete the reservation."
      />

      <div className="max-w-2xl rounded-3xl bg-[var(--surface-elevated)] shadow-card p-6 md:p-8 mb-6 space-y-4">
        <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
          Why is payment shown here?
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          This flow is part of a <strong>buildathon / demo</strong> experience. YOLO shows a payment
          step so judges and users can see how booking and concierge unlocks would work in a real
          product — without charging anyone.
        </p>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Checkout runs in <strong>Razorpay TEST MODE</strong> only. Completing a Test Payment does{' '}
          <em>not</em> book a real ticket or hotel, and <strong>no real money is charged</strong>. It
          only unlocks the demo Premium Concierge experience inside YOLO.
        </p>
      </div>

      <div className="max-w-2xl rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-950 mb-6">
        <p className="font-semibold">Test Payment · Razorpay Test Mode</p>
        <p className="mt-1">
          No real booking is created. Use Razorpay test cards only. Provider: Razorpay · Status
          mode: TEST.
        </p>
      </div>

      <div className="max-w-2xl rounded-3xl bg-[var(--surface-elevated)] shadow-card p-6 md:p-8">
        <div className="grid sm:grid-cols-2 gap-4 text-sm mb-6">
          <Info label="Paying for" value="YOLO Premium Trip Concierge" />
          <Info label="Trip" value={trip?.title || '—'} />
          <Info label="Amount" value="₹99.00" />
          <Info label="Provider" value="Razorpay" />
          <Info label="Mode" value="TEST" />
          <Info
            label="Payment status"
            value={unlocked ? 'CAPTURED (unlocked)' : latest?.status || 'Not started'}
          />
        </div>

        {unavailable && (
          <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--text-secondary)]">
            {unavailable}
          </div>
        )}

        {unlocked ? (
          <p className="text-secondary-700 font-medium">
            Premium Concierge unlocked via test payment. No real reservation was made.
          </p>
        ) : (
          !unavailable && (
            <PrimaryButton disabled={loading} onClick={handlePay}>
              {loading ? 'Opening Test Payment…' : 'Pay ₹99 — Test Payment'}
            </PrimaryButton>
          )
        )}

        {success && (
          <p className="mt-4 text-sm text-secondary-700 bg-secondary-50 rounded-xl px-4 py-3">
            {success}
          </p>
        )}
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex gap-3">
          <SecondaryButton onClick={() => navigate(`/trips/${tripId}`)}>
            Back to trip
          </SecondaryButton>
          <Link to={`/trips/${tripId}`} className="text-sm text-primary-600 self-center font-medium">
            Return to overview
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl bg-[var(--background)] border border-[var(--border-subtle)] px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 font-medium text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
