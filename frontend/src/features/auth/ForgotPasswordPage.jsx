import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from './authStore.js';
import { forgotPassword } from './authApi.js';
import { AuthField, AuthHero } from './AuthFormBits.jsx';
import { PublicFooter } from '@/components/PublicFooter.jsx';

export default function ForgotPasswordPage() {
  const { status, bootstrap } = useAuthStore();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === 'idle') bootstrap();
  }, [status, bootstrap]);

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const data = await forgotPassword(email);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Could not start password reset');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_#EEF6FF_0%,_#F9FAFC_45%,_#F3F7FB_100%)]">
      <div className="flex-1 grid lg:grid-cols-2">
        <AuthHero
          title="Reset access securely."
          subtitle="We never email or display your password. Reset links expire quickly."
        />
        <div className="flex items-center justify-center px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <Link to="/" className="font-display text-2xl font-bold text-[var(--text-primary)]">
              YOLO
            </Link>
            <h1 className="mt-8 text-3xl font-display font-semibold text-[var(--text-primary)]">
              Forgot password
            </h1>
            <p className="mt-2 text-[var(--text-secondary)]">
              Enter your account email. If a local password account exists, we prepare a reset link.
            </p>

            {error && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {result ? (
              <div className="mt-8 rounded-2xl border border-secondary-200 bg-secondary-50 px-5 py-4 text-sm text-[var(--text-primary)] space-y-3">
                <p>{result.message}</p>
                {result.resetUrl && (
                  <div className="rounded-xl bg-[var(--surface-elevated)] border border-secondary-100 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">
                      Development fallback (email not configured)
                    </p>
                    <Link
                      to={result.resetUrl.replace(/^https?:\/\/[^/]+/, '')}
                      className="text-primary-700 font-medium break-all underline"
                    >
                      Open reset link
                    </Link>
                  </div>
                )}
                <Link to="/login" className="inline-block font-semibold text-primary-600">
                  Back to login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <AuthField
                  id="email"
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-2xl yolo-btn-primary disabled:opacity-60 text-[var(--text-inverse)] font-semibold px-6 py-3.5"
                >
                  {submitting ? 'Preparing…' : 'Send reset instructions'}
                </button>
                <p className="text-sm text-center text-[var(--text-secondary)]">
                  <Link to="/login" className="font-semibold text-primary-600">
                    Back to login
                  </Link>
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>
      <PublicFooter compact />
    </div>
  );
}
