import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TravelImage } from '@/components/common/TravelImage.jsx';
import { HERO_BACKPACK } from '@/lib/travelImagery.js';

/**
 * Shared Google OAuth button.
 */
export function GoogleButton({ onClick, disabled, label = 'Continue with Google' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full inline-flex items-center justify-center gap-3 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] hover:bg-[var(--background)] disabled:opacity-60 text-[var(--text-primary)] font-semibold px-6 py-3.5 transition-colors shadow-sm"
    >
      <GoogleIcon />
      {label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.4 4 24 4 16.1 4 9.2 8.5 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.1 39.5 16 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C39.4 35.3 44 30.1 44 24c0-1.3-.1-2.5-.4-3.5z"
      />
    </svg>
  );
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  required = true,
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required={required}
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 pr-12 text-[var(--text-primary)] shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-400/40 focus:border-primary-400"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
}

export function PasswordStrength({ password }) {
  const score = scorePassword(password);
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-lime-500', 'bg-secondary-500'];
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= score ? colors[score] : 'bg-[var(--surface-muted)]'}`}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-[var(--text-muted)]">{labels[score]}</p>
    </div>
  );
}

function scorePassword(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(4, Math.max(0, score - 1));
}

export function AuthHero({ title, subtitle }) {
  return (
    <div className="relative hidden lg:block min-h-screen overflow-hidden">
      <TravelImage
        src={HERO_BACKPACK}
        alt=""
        className="absolute inset-0 h-full w-full"
        imgClassName="h-full w-full"
        loading="eager"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-neutral-950/35 to-neutral-950/20" />
      <div className="absolute bottom-12 left-12 right-12 text-white z-10">
        <Link to="/" className="font-display text-3xl font-bold tracking-tight">
          YOLO
        </Link>
        <p className="mt-6 font-display text-3xl font-semibold leading-tight max-w-md">{title}</p>
        <p className="mt-3 text-white/75 max-w-md">{subtitle}</p>
      </div>
    </div>
  );
}

export function AuthField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  autoComplete,
  placeholder,
  required = true,
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-[var(--text-primary)] shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-400/40 focus:border-primary-400"
      />
    </div>
  );
}
