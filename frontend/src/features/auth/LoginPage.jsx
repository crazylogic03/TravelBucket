import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from './authStore.js';
import { login, startGoogleLogin } from './authApi.js';
import { AuthField, AuthHero, GoogleButton, PasswordField } from './AuthFormBits.jsx';
import { PublicFooter } from '@/components/PublicFooter.jsx';

function isSafeRedirect(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//');
}

export default function LoginPage() {
  const [params] = useSearchParams();
  const { status, bootstrap, setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const redirect = useMemo(() => {
    const raw = params.get('redirect') || '/dashboard';
    if (!isSafeRedirect(raw)) return '/dashboard';
    // Never force new-trip after auth
    if (raw.startsWith('/trips/new')) return '/dashboard';
    return raw;
  }, [params]);

  const error = params.get('error');

  useEffect(() => {
    if (status === 'idle') bootstrap();
  }, [status, bootstrap]);

  if (status === 'authenticated') {
    return <Navigate to={redirect} replace />;
  }

  const handleGoogle = () => {
    setStarting(true);
    startGoogleLogin(redirect);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const data = await login({ email, password, rememberMe });
      setUser(data.user);
    } catch (err) {
      setFormError(err.message || 'Sign-in failed');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <div className="flex-1 grid lg:grid-cols-2">
        <AuthHero
          title="Plan boldly. Travel freely."
          subtitle="YOLO plans your trip before you leave and becomes your AI travel copilot on the road."
        />

        <div className="flex items-center justify-center px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <Link to="/" className="lg:hidden font-display text-2xl font-bold text-[var(--text-primary)]">
              YOLO
            </Link>
            <h1 className="mt-6 lg:mt-0 text-3xl font-display font-semibold text-[var(--text-primary)]">
              Welcome back
            </h1>
            <p className="mt-2 text-[var(--text-secondary)]">Sign in to continue your adventures.</p>

            {(error || formError) && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                {formError || error || 'Sign-in failed. Please try again.'}
              </div>
            )}

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
              <PasswordField
                id="password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Your password"
              />

              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2 text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-[var(--border-strong)] text-primary-600 focus:ring-primary-400"
                  />
                  Remember me
                </label>
                <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-700">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={submitting || status === 'loading'}
                className="w-full rounded-2xl yolo-btn-primary disabled:opacity-60 text-[var(--text-inverse)] font-semibold px-6 py-3.5 transition-colors"
              >
                {submitting ? 'Signing in…' : 'Log in'}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs text-[var(--text-muted)] uppercase tracking-wider">
              <div className="h-px flex-1 bg-[var(--surface-muted)]" />
              or
              <div className="h-px flex-1 bg-[var(--surface-muted)]" />
            </div>

            <GoogleButton onClick={handleGoogle} disabled={starting || status === 'loading'} />

            <p className="mt-8 text-sm text-[var(--text-secondary)] text-center">
              New to YOLO?{' '}
              <Link to="/signup" className="font-semibold text-primary-600 hover:text-primary-700">
                Create Account
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
      <PublicFooter compact />
    </div>
  );
}
