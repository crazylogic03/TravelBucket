import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from './authStore.js';
import { resetPassword } from './authApi.js';
import { AuthHero, PasswordField, PasswordStrength } from './AuthFormBits.jsx';
import { PublicFooter } from '@/components/PublicFooter.jsx';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const { status, bootstrap } = useAuthStore();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (status === 'idle') bootstrap();
  }, [status, bootstrap]);

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError('Missing reset token');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword({ token, password, confirmPassword });
      setDone(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message || 'Could not reset password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_#EEF6FF_0%,_#F9FAFC_45%,_#F3F7FB_100%)]">
      <div className="flex-1 grid lg:grid-cols-2">
        <AuthHero
          title="Choose a new password."
          subtitle="After resetting, previous sessions are signed out for security."
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
              Reset password
            </h1>

            {!token && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                This reset link is incomplete. Request a new one from{' '}
                <Link to="/forgot-password" className="underline font-medium">
                  Forgot password
                </Link>
                .
              </div>
            )}

            {error && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {done ? (
              <p className="mt-8 text-secondary-700 font-medium">
                Password updated. Redirecting to login…
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div>
                  <PasswordField
                    id="password"
                    label="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <PasswordStrength password={password} />
                </div>
                <PasswordField
                  id="confirmPassword"
                  label="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="submit"
                  disabled={submitting || !token}
                  className="w-full rounded-2xl yolo-btn-primary disabled:opacity-60 text-[var(--text-inverse)] font-semibold px-6 py-3.5"
                >
                  {submitting ? 'Updating…' : 'Update password'}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
      <PublicFooter compact />
    </div>
  );
}
