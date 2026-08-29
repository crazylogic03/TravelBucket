import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from './authStore.js';
import { signup, startGoogleLogin } from './authApi.js';
import {
  AuthField,
  AuthHero,
  GoogleButton,
  PasswordField,
  PasswordStrength,
} from './AuthFormBits.jsx';
import { PublicFooter } from '@/components/PublicFooter.jsx';

export default function SignupPage() {
  const { status, bootstrap, setUser } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (status === 'idle') bootstrap();
  }, [status, bootstrap]);

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGoogle = () => {
    setStarting(true);
    startGoogleLogin('/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      const data = await signup({
        name,
        email,
        password,
        confirmPassword,
        rememberMe: true,
      });
      setUser(data.user);
    } catch (err) {
      setFormError(err.message || 'Could not create account');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <div className="flex-1 grid lg:grid-cols-2">
        <AuthHero
          title="Create your travel identity."
          subtitle="Save trips, track expenses, and travel with an AI copilot that knows your plan."
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
              Create Account
            </h1>
            <p className="mt-2 text-[var(--text-secondary)]">Join YOLO and start planning smarter trips.</p>

            {formError && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <AuthField
                id="name"
                label="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="Your name"
              />
              <AuthField
                id="email"
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
              />
              <div>
                <PasswordField
                  id="password"
                  label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                />
                <PasswordStrength password={password} />
              </div>
              <PasswordField
                id="confirmPassword"
                label="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Repeat password"
              />

              <button
                type="submit"
                disabled={submitting || status === 'loading'}
                className="w-full rounded-2xl yolo-btn-primary disabled:opacity-60 text-[var(--text-inverse)] font-semibold px-6 py-3.5 transition-colors"
              >
                {submitting ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs text-[var(--text-muted)] uppercase tracking-wider">
              <div className="h-px flex-1 bg-[var(--surface-muted)]" />
              or
              <div className="h-px flex-1 bg-[var(--surface-muted)]" />
            </div>

            <GoogleButton onClick={handleGoogle} disabled={starting || status === 'loading'} />

            <p className="mt-8 text-sm text-[var(--text-secondary)] text-center">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
                Log in
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
      <PublicFooter compact />
    </div>
  );
}
