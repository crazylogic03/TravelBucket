import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/layouts/AppShell.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button.jsx';
import { StatCard } from '@/components/ui/StatCard.jsx';
import { ErrorState } from '@/components/ui/EmptyState.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import {
  getTripSummary,
  completeTripWithSummary,
} from '@/features/copilot/copilotApi.js';

export default function TripSummaryPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completing, setCompleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getTripSummary(tripId);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const result = await completeTripWithSummary(tripId);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setCompleting(false);
    }
  };

  const { summary, stats, trip } = data || {};

  return (
    <AppShell title="Summary">
      <PageHeader
        title="Trip summary"
        description={trip?.title || 'Your journey recap'}
        action={
          <Link to={`/trips/${tripId}`} className="text-sm font-medium text-primary-600">
            ← Trip overview
          </Link>
        }
      />

      {loading && <Skeleton className="h-96 w-full" />}
      {error && <ErrorState description={error} onRetry={load} />}

      {summary && stats && (
        <div className="space-y-6">
          {trip?.status !== 'COMPLETED' && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-amber-900">
                Mark this trip complete to save your final summary.
              </p>
              <PrimaryButton onClick={handleComplete} disabled={completing}>
                {completing ? 'Completing…' : 'Complete trip'}
              </PrimaryButton>
            </div>
          )}

          <article className="rounded-3xl bg-gradient-to-br from-primary-600 to-secondary-600 text-white p-8">
            <p className="text-sm uppercase tracking-wide text-white/70">YOLO recap</p>
            <h2 className="font-display text-3xl font-bold mt-2">{summary.headline}</h2>
            <p className="mt-4 text-white/90 leading-relaxed">{summary.narrative}</p>
          </article>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Progress" value={`${stats.progressPercentage}%`} />
            <StatCard label="Visited" value={String(stats.destinationsVisited)} />
            <StatCard label="Skipped" value={String(stats.destinationsSkipped)} />
            <StatCard
              label="Spent"
              value={`${stats.currency} ${stats.totalSpent.toLocaleString()}`}
            />
          </div>

          {summary.highlights?.length > 0 && (
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
              <h3 className="font-display font-semibold text-lg">Highlights</h3>
              <ul className="mt-3 space-y-2">
                {summary.highlights.map((h) => (
                  <li key={h} className="flex gap-2 text-[var(--text-secondary)] text-sm">
                    <span className="text-primary-500">✦</span>
                    {h}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
            <h3 className="font-display font-semibold text-lg">Tip for next time</h3>
            <p className="mt-2 text-[var(--text-secondary)]">{summary.tipForNextTrip}</p>
          </section>

          <div className="flex flex-wrap gap-3">
            <SecondaryButton onClick={() => navigate('/dashboard')}>
              Back to dashboard
            </SecondaryButton>
            <PrimaryButton onClick={() => navigate('/trips/new/basics')}>
              Plan another trip
            </PrimaryButton>
          </div>
        </div>
      )}
    </AppShell>
  );
}
