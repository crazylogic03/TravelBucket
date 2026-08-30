import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/layouts/AppShell.jsx';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { ErrorState } from '@/components/ui/EmptyState.jsx';
import { useAuthStore } from '@/features/auth/authStore.js';
import { useTheme } from '@/providers/ThemeProvider.jsx';
import {
  getSettings,
  updateSettings,
  changePassword,
  listSessions,
  revokeAllSessions,
  deleteAccount,
  updateProfile,
} from '@/features/auth/authApi.js';

const INTEREST_OPTIONS = [
  'nature',
  'culture',
  'food',
  'adventure',
  'photography',
  'relaxation',
  'shopping',
  'nightlife',
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [accountName, setAccountName] = useState(user?.name || '');
  const [accountAvatar, setAccountAvatar] = useState(user?.avatarUrl || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, sess] = await Promise.all([getSettings(), listSessions()]);
      setSettings(s.settings);
      setSessions(sess.sessions || []);
      setAccountName(user?.name || '');
      setAccountAvatar(user?.avatarUrl || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patch = async (partial, successMsg = 'Settings saved') => {
    setSaving(true);
    setMessage(null);
    try {
      const { settings: next } = await updateSettings(partial);
      setSettings(next);
      setMessage(successMsg);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleInterest = (key) => {
    const current = Array.isArray(settings.travelInterests) ? settings.travelInterests : [];
    const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
    patch({ travelInterests: next });
  };

  if (loading) {
    return (
      <AppShell title="Settings">
        <Skeleton className="h-64 w-full" />
      </AppShell>
    );
  }

  if (error && !settings) {
    return (
      <AppShell title="Settings">
        <ErrorState description={error} onRetry={load} />
      </AppShell>
    );
  }

  return (
    <AppShell title="Settings" subtitle="Account, preferences, and security">
      <h1 className="text-3xl font-display font-semibold text-[var(--text-primary)] mb-2">Settings</h1>
      <p className="text-[var(--text-secondary)] mb-8">Every control below persists to your account.</p>

      {message && (
        <div className="mb-6 rounded-2xl yolo-success-banner px-4 py-3 text-sm">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-6 rounded-2xl yolo-error-state px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <Section title="Account">
        <Field label="Name">
          <input
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            className="yolo-input"
          />
        </Field>
        <Field label="Email">
          <input value={user?.email || ''} disabled className="yolo-input opacity-70" />
          <p className="hint">Email changes require support verification (unavailable).</p>
        </Field>
        <Field label="Profile photo URL">
          <input
            value={accountAvatar}
            onChange={(e) => setAccountAvatar(e.target.value)}
            className="yolo-input"
            placeholder="https://…"
          />
        </Field>
        <PrimaryButton
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              const { user: next } = await updateProfile({
                name: accountName,
                avatarUrl: accountAvatar || null,
              });
              setUser(next);
              setMessage('Profile updated');
            } catch (err) {
              setError(err.message);
            } finally {
              setSaving(false);
            }
          }}
        >
          Save account
        </PrimaryButton>

        <div className="mt-8 pt-6 border-t border-[var(--border-subtle)]">
          <h3 className="font-semibold text-[var(--text-primary)] mb-3">Change password</h3>
          {user?.hasPassword === false ? (
            <p className="text-sm text-[var(--text-muted)]">
              This account uses Google sign-in and has no local password.
              <span className="block mt-1 text-[var(--warning)]">
                Change password is unavailable until a password is set on this account.
              </span>
            </p>
          ) : (
            <div className="space-y-3 max-w-md">
              <input
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="yolo-input"
              />
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="yolo-input"
              />
              <SecondaryButton
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  setError(null);
                  try {
                    await changePassword({ currentPassword, newPassword });
                    setCurrentPassword('');
                    setNewPassword('');
                    setMessage('Password updated');
                  } catch (err) {
                    setError(err.message);
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                Update password
              </SecondaryButton>
            </div>
          )}
        </div>
      </Section>

      <Section title="Preferences">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Currency">
            <select
              className="yolo-input"
              value={settings.currency}
              onChange={(e) => patch({ currency: e.target.value })}
            >
              {['INR', 'USD', 'EUR', 'GBP', 'AED'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Distance unit">
            <select
              className="yolo-input"
              value={settings.distanceUnit}
              onChange={(e) => patch({ distanceUnit: e.target.value })}
            >
              <option value="km">Kilometers</option>
              <option value="mi">Miles</option>
            </select>
          </Field>
          <Field label="Time format">
            <select
              className="yolo-input"
              value={settings.timeFormat}
              onChange={(e) => patch({ timeFormat: e.target.value })}
            >
              <option value="24h">24-hour</option>
              <option value="12h">12-hour</option>
            </select>
          </Field>
          <Field label="Preferred transport">
            <select
              className="yolo-input"
              value={settings.preferredTransport || ''}
              onChange={(e) => patch({ preferredTransport: e.target.value || null })}
            >
              <option value="">Not set</option>
              {['FLIGHT', 'TRAIN', 'BUS', 'CAR', 'BIKE'].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Typical trip length (days)">
            <input
              type="number"
              min={1}
              max={60}
              className="yolo-input"
              value={settings.typicalTripLengthDays ?? ''}
              onChange={(e) =>
                patch({
                  typicalTripLengthDays: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </Field>
          <Field label="Preferred budget min">
            <input
              type="number"
              className="yolo-input"
              value={settings.preferredBudgetMin ?? ''}
              onChange={(e) =>
                patch({
                  preferredBudgetMin: e.target.value === '' ? null : Number(e.target.value),
                })
              }
            />
          </Field>
          <Field label="Preferred budget max">
            <input
              type="number"
              className="yolo-input"
              value={settings.preferredBudgetMax ?? ''}
              onChange={(e) =>
                patch({
                  preferredBudgetMax: e.target.value === '' ? null : Number(e.target.value),
                })
              }
            />
          </Field>
        </div>
        <Field label="Travel interests">
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((key) => {
              const on = (settings.travelInterests || []).includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleInterest(key)}
                  className={
                    on
                      ? 'rounded-full bg-[var(--live-bg)] text-white px-3 py-1.5 text-sm capitalize'
                      : 'rounded-full bg-[var(--surface-muted)] text-[var(--text-secondary)] px-3 py-1.5 text-sm capitalize'
                  }
                >
                  {key}
                </button>
              );
            })}
          </div>
        </Field>
      </Section>

      <Section title="Notifications">
        <Toggle
          label="Trip reminders"
          checked={settings.notifyTripReminders}
          onChange={(v) => patch({ notifyTripReminders: v })}
        />
        <Toggle
          label="Budget alerts"
          checked={settings.notifyBudgetAlerts}
          onChange={(v) => patch({ notifyBudgetAlerts: v })}
        />
        <Toggle
          label="AI itinerary updates"
          checked={settings.notifyAiUpdates}
          onChange={(v) => patch({ notifyAiUpdates: v })}
        />
        <Toggle
          label="Travel alerts"
          checked={settings.notifyTravelAlerts}
          onChange={(v) => patch({ notifyTravelAlerts: v })}
        />
        <p className="hint mt-2">
          Preferences are saved. Push/email delivery infrastructure is not configured — toggles
          store intent only.
        </p>
      </Section>

      <Section title="AI">
        <Toggle
          label="AI personalization"
          checked={settings.aiPersonalization}
          onChange={(v) => patch({ aiPersonalization: v })}
        />
        <Field label="Recommendation style">
          <select
            className="yolo-input"
            value={settings.aiRecommendationStyle}
            onChange={(e) => patch({ aiRecommendationStyle: e.target.value })}
          >
            <option value="balanced">Balanced</option>
            <option value="adventure">Adventure</option>
            <option value="relaxed">Relaxed</option>
            <option value="budget">Budget</option>
          </select>
        </Field>
      </Section>

      <Section title="Security">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Active sessions</h3>
        <ul className="space-y-2 mb-4">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--background)] px-4 py-3 text-sm"
            >
              <div className="flex justify-between gap-3">
                <span className="text-[var(--text-primary)] truncate">
                  {s.userAgent || 'Unknown device'}
                  {s.current ? ' · Current' : ''}
                </span>
                <span className="text-[var(--text-muted)] shrink-0">
                  {new Date(s.lastSeenAt).toLocaleString()}
                </span>
              </div>
            </li>
          ))}
          {!sessions.length && <p className="text-sm text-[var(--text-muted)]">No active sessions listed.</p>}
        </ul>
        <div className="flex flex-wrap gap-3">
          <SecondaryButton
            onClick={async () => {
              await logout();
              navigate('/');
            }}
          >
            Logout
          </SecondaryButton>
          <SecondaryButton
            onClick={async () => {
              if (!confirm('Sign out of all devices?')) return;
              try {
                await revokeAllSessions();
                navigate('/');
              } catch (err) {
                setError(err.message || 'Could not revoke sessions');
              }
            }}
          >
            Logout all sessions
          </SecondaryButton>
          <button
            type="button"
            className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--error)] border border-[color-mix(in_srgb,var(--error)_35%,transparent)] hover:bg-[var(--error-soft)]"
            onClick={async () => {
              if (!confirm('Permanently delete your account and all trips? This cannot be undone.'))
                return;
              try {
                await deleteAccount();
                await logout();
                navigate('/');
              } catch (err) {
                setError(err.message || 'Could not delete account');
              }
            }}
          >
            Delete account
          </button>
        </div>
      </Section>

      <Section title="App">
        <Field label="Appearance">
          <div className="flex flex-col gap-3">
            {['light', 'dark'].map((mode) => (
              <label
                key={mode}
                className="flex items-center gap-3 cursor-pointer rounded-xl border border-[var(--border)] px-4 py-3 hover:bg-[var(--surface-muted)]"
              >
                <input
                  type="radio"
                  name="theme"
                  value={mode}
                  checked={theme === mode}
                  onChange={async () => {
                    setTheme(mode);
                    await patch({ theme: mode }, 'Theme updated');
                  }}
                  className="accent-[var(--brand-primary)]"
                />
                <span className="text-sm font-medium text-[var(--text-primary)] capitalize">
                  {mode}
                </span>
              </label>
            ))}
          </div>
          <p className="hint">Applies instantly across the app and persists after refresh.</p>
        </Field>
        <div className="space-y-2 text-sm text-[var(--text-secondary)]">
          <p>
            <strong className="text-[var(--text-primary)]">About YOLO</strong> — Your intelligent
            travel companion. Plan, live, and reflect with AI.
          </p>
          <p>
            <a className="text-[var(--brand-primary)] font-medium" href="/terms">
              Terms of Service
            </a>
            {' · '}
            <a className="text-[var(--brand-primary)] font-medium" href="/privacy">
              Privacy Policy
            </a>
          </p>
        </div>
      </Section>

      <style>{`
        .hint { margin-top: 0.35rem; font-size: 0.75rem; color: var(--text-muted); }
      `}</style>
    </AppShell>
  );
}

function Section({ title, children }) {
  return (
    <section className="mb-8 yolo-surface p-6 md:p-8">
      <h2 className="font-display text-lg font-semibold text-[var(--text-primary)] mb-5">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition-colors ${checked ? 'bg-teal-600' : 'bg-[var(--surface-muted)]'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-[var(--surface-elevated)] shadow transition-transform ${checked ? 'translate-x-5' : ''}`}
        />
      </button>
    </label>
  );
}
