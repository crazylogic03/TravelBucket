import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/layouts/AppShell.jsx';
import { PrimaryButton } from '@/components/ui/Button.jsx';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { TripCard } from '@/features/trips/TripCard.jsx';
import { listTrips } from '@/features/trips/tripApi.js';

export default function TripsPage() {
  const navigate = useNavigate();
  const tripsQuery = useQuery({ queryKey: ['trips'], queryFn: listTrips });
  const trips = tripsQuery.data?.trips || [];

  const grouped = useMemo(
    () => ({
      active: trips.filter((t) => t.status === 'ACTIVE'),
      upcoming: trips.filter((t) => t.status === 'PLANNED'),
      draft: trips.filter((t) => t.status === 'DRAFT'),
      completed: trips.filter((t) => t.status === 'COMPLETED'),
    }),
    [trips],
  );

  return (
    <AppShell title="My Trips" subtitle="Every adventure in one place">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-semibold text-[var(--text-primary)]">My Trips</h1>
          <p className="mt-1 text-[var(--text-secondary)]">Browse drafts, upcoming journeys, and memories.</p>
        </div>
        <PrimaryButton onClick={() => navigate('/trips/new/basics')}>Plan a Trip</PrimaryButton>
      </div>

      {tripsQuery.isLoading && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      )}
      {tripsQuery.isError && (
        <ErrorState description={tripsQuery.error?.message} onRetry={() => tripsQuery.refetch()} />
      )}
      {!tripsQuery.isLoading && !tripsQuery.isError && trips.length === 0 && (
        <EmptyState
          title="Ready for your next adventure?"
          description="You have not planned a trip yet. Pack your bags and let YOLO craft the journey."
          actionLabel="Pack Your Bags"
          onAction={() => navigate('/trips/new/basics')}
        />
      )}
      {trips.length > 0 && (
        <>
          <Section title="Active" trips={grouped.active} />
          <Section title="Upcoming" trips={grouped.upcoming} />
          <Section title="Drafts" trips={grouped.draft} />
          <Section title="Completed" trips={grouped.completed} />
        </>
      )}
    </AppShell>
  );
}

function Section({ title, trips }) {
  if (!trips.length) return null;
  return (
    <section className="mb-10">
      <h2 className="text-lg font-display font-semibold text-[var(--text-primary)] mb-4">{title}</h2>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </div>
    </section>
  );
}
