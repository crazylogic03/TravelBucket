import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AppShell } from '@/layouts/AppShell.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { PrimaryButton } from '@/components/ui/Button.jsx';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { StatusBadge } from '@/components/ui/StatusBadge.jsx';
import { listTrips } from '@/features/trips/tripApi.js';

export default function ExpensesHubPage() {
  const navigate = useNavigate();
  const tripsQuery = useQuery({ queryKey: ['trips'], queryFn: listTrips });
  const trips = tripsQuery.data?.trips || [];
  const listed = trips;

  return (
    <AppShell title="Expenses" subtitle="Budgets across your journeys">
      <PageHeader
        title="Expenses"
        subtitle="Open a trip to track spend, categories, and budget intelligence."
      />

      {tripsQuery.isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      )}

      {tripsQuery.isError && (
        <ErrorState
          description={tripsQuery.error?.message}
          onRetry={() => tripsQuery.refetch()}
        />
      )}

      {!tripsQuery.isLoading && !tripsQuery.isError && trips.length === 0 && (
        <EmptyState
          title="No trips to track yet"
          description="Plan a journey first, then log expenses as you go."
          actionLabel="Plan My First Journey"
          onAction={() => navigate('/trips/new/basics')}
        />
      )}

      {!tripsQuery.isLoading && !tripsQuery.isError && trips.length > 0 && (
        <ul className="space-y-3">
          {listed.map((trip, i) => (
            <motion.li
              key={trip.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                to={`/trips/${trip.id}/expenses`}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 yolo-surface yolo-card-hover px-5 py-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-display font-semibold text-[var(--text-primary)] truncate">
                      {trip.title}
                    </p>
                    <StatusBadge status={trip.status} />
                  </div>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    {trip.startLocationName} → {trip.destinationName}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Budget</p>
                    <p className="font-semibold text-[var(--text-primary)]">
                      {trip.currency} {Number(trip.budgetAmount || 0).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-[var(--brand-primary)]">Open →</span>
                </div>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}

      {!tripsQuery.isLoading && trips.length > 0 && (
        <div className="mt-8">
          <PrimaryButton onClick={() => navigate('/trips/new/basics')}>
            Plan another journey
          </PrimaryButton>
        </div>
      )}
    </AppShell>
  );
}
