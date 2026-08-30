import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '@/layouts/AppShell.jsx';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button.jsx';
import { StatCard } from '@/components/ui/StatCard.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { ErrorState } from '@/components/ui/EmptyState.jsx';
import { TripCard } from '@/features/trips/TripCard.jsx';
import { useAuthStore } from '@/features/auth/authStore.js';
import { getProfile, updateProfile } from '@/features/auth/authApi.js';
import { Modal } from '@/components/ui/Modal.jsx';
import { TravelImage } from '@/components/common/TravelImage.jsx';
import { HERO_VIEWPOINT } from '@/lib/travelImagery.js';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { logout, setUser } = useAuthStore();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const profile = await getProfile();
      setData(profile);
      setName(profile.user.name || '');
      setAvatarUrl(profile.user.avatarUrl || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { user } = await updateProfile({ name, avatarUrl: avatarUrl || null });
      setUser(user);
      setEditOpen(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const user = data?.user;
  const stats = data?.stats;
  const settings = data?.settings;

  return (
    <AppShell title="Profile" subtitle="Your travel identity">
      {loading && <Skeleton className="h-72 w-full" />}
      {error && <ErrorState description={error} onRetry={load} />}

      {user && stats && (
        <>
          <div className="relative overflow-hidden rounded-3xl bg-[var(--live-bg)] text-white mb-8">
            <TravelImage
              src={HERO_VIEWPOINT}
              label="Travel profile"
              alt=""
              className="absolute inset-0 h-full w-full opacity-40"
              imgClassName="h-full w-full"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-950/70 to-transparent" />
            <div className="relative p-8 md:p-10 flex flex-col md:flex-row md:items-end gap-6">
              {user.avatarUrl ? (
                <TravelImage
                  src={user.avatarUrl}
                  label={user.name}
                  alt={user.name}
                  className="h-24 w-24 rounded-3xl border-2 border-white/30 shrink-0"
                  imgClassName="h-24 w-24 rounded-3xl"
                  objectFit="cover"
                  showPlaceholder={false}
                />
              ) : (
                <div className="h-24 w-24 rounded-3xl bg-primary-500/30 border border-white/20 flex items-center justify-center text-3xl font-display font-semibold">
                  {user.name?.[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Traveler profile</p>
                <h1 className="mt-2 text-3xl md:text-4xl font-display font-semibold truncate">
                  {user.name}
                </h1>
                <p className="mt-1 text-white/70">{user.email}</p>
                <p className="mt-2 text-sm text-white/50">
                  Member since{' '}
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                      })
                    : '—'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <PrimaryButton onClick={() => setEditOpen(true)}>Edit Profile</PrimaryButton>
                <SecondaryButton onClick={() => navigate('/settings')}>Settings</SecondaryButton>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-10">
            <StatCard label="Total trips" value={String(stats.totalTrips)} />
            <StatCard label="Active" value={String(stats.activeTrips)} />
            <StatCard label="Completed" value={String(stats.completedTrips)} />
            <StatCard label="Destinations" value={String(stats.totalDestinations)} />
            <StatCard
              label="Expenses tracked"
              value={String(stats.totalExpensesTracked)}
              hint={
                stats.totalExpensesAmount
                  ? `${settings?.currency || 'INR'} ${stats.totalExpensesAmount.toLocaleString()}`
                  : undefined
              }
            />
          </div>

          <section className="mb-10 rounded-3xl bg-[var(--surface-elevated)] shadow-card p-6 md:p-8">
            <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">Travel identity</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Preferences from your settings — edit them anytime.
            </p>
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <IdentityChip
                label="Preferred transport"
                value={settings?.preferredTransport || 'Not set'}
              />
              <IdentityChip
                label="Typical trip length"
                value={
                  settings?.typicalTripLengthDays
                    ? `${settings.typicalTripLengthDays} days`
                    : 'Not set'
                }
              />
              <IdentityChip
                label="Budget range"
                value={
                  settings?.preferredBudgetMin != null || settings?.preferredBudgetMax != null
                    ? `${settings.currency || 'INR'} ${settings.preferredBudgetMin ?? '—'} – ${settings.preferredBudgetMax ?? '—'}`
                    : 'Not set'
                }
              />
              <IdentityChip
                label="Interests"
                value={
                  Array.isArray(settings?.travelInterests) && settings.travelInterests.length
                    ? settings.travelInterests.join(', ')
                    : 'Not set'
                }
              />
            </div>
            <Link
              to="/settings"
              className="inline-block mt-4 text-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              Update in Settings →
            </Link>
          </section>

          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">Trip history</h2>
              <SecondaryButton onClick={() => navigate('/trips')}>View Trips</SecondaryButton>
            </div>
            {(data.trips || []).length === 0 ? (
              <p className="text-[var(--text-secondary)] text-sm">No trips yet.</p>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {data.trips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            )}
          </section>

          <div className="flex flex-wrap gap-3">
            <SecondaryButton
              onClick={async () => {
                await logout();
                navigate('/');
              }}
            >
              Logout
            </SecondaryButton>
          </div>
        </>
      )}

      <Modal
        open={editOpen}
        title="Edit profile"
        confirmLabel={saving ? 'Saving…' : 'Save'}
        onClose={() => setEditOpen(false)}
        onConfirm={handleSave}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Full name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] px-4 py-3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Profile photo URL
            </label>
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-xl border border-[var(--border)] px-4 py-3"
            />
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Paste an image URL. File upload storage is not configured yet.
            </p>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}

function IdentityChip({ label, value }) {
  return (
    <div className="rounded-2xl bg-[var(--background)] border border-[var(--border-subtle)] px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[var(--text-primary)] capitalize">{value}</p>
    </div>
  );
}
