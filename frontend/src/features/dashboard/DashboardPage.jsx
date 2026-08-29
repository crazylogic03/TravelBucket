import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/layouts/AppShell.jsx';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button.jsx';
import { ErrorState } from '@/components/ui/EmptyState.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { TripSummaryCard } from '@/components/dashboard/TripSummaryCard.jsx';
import { AIAssistantWidget } from '@/components/dashboard/AIAssistantWidget.jsx';
import { PopularDestinationsSection } from '@/components/ui/PopularDestinationsSection.jsx';
import { listTrips } from '@/features/trips/tripApi.js';
import { getPopularDestinations } from '@/features/explore/exploreApi.js';
import { useAuthStore } from '@/features/auth/authStore.js';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function prioritizeTrips(trips) {
  const active = trips.filter((t) => t.status === 'ACTIVE');
  const planned = trips
    .filter((t) => t.status === 'PLANNED')
    .sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)));
  const draft = trips.filter((t) => t.status === 'DRAFT');
  const rest = trips.filter(
    (t) => !['ACTIVE', 'PLANNED', 'DRAFT'].includes(t.status),
  );
  return [...active, ...planned, ...draft, ...rest];
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(' ')[0] || 'Traveler';

  const tripsQuery = useQuery({ queryKey: ['trips'], queryFn: listTrips });
  const popularQuery = useQuery({
    queryKey: ['popular-destinations'],
    queryFn: getPopularDestinations,
    staleTime: 60_000,
  });
  const trips = useMemo(() => tripsQuery.data?.trips || [], [tripsQuery.data?.trips]);
  const destinations = popularQuery.data?.destinations || [];
  const orderedTrips = useMemo(() => prioritizeTrips(trips), [trips]);
  const primaryTrip = orderedTrips[0] || null;
  const secondaryTrips = orderedTrips.slice(1, 4);

  const openTrip = useCallback(
    (trip) => {
      if (!trip) return;
      if (trip.status === 'ACTIVE') navigate(`/trips/${trip.id}/live`);
      else if (trip.status === 'DRAFT')
        navigate(`/trips/new/${trip.wizardStep || 'basics'}?tripId=${trip.id}`);
      else navigate(`/trips/${trip.id}`);
    },
    [navigate],
  );

  if (tripsQuery.isLoading) {
    return (
      <AppShell title="Dashboard">
        <Skeleton className="h-24 w-full rounded-2xl mb-6" />
        <Skeleton className="h-[200px] w-full rounded-2xl mb-4" />
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  if (tripsQuery.isError) {
    return (
      <AppShell title="Dashboard">
        <ErrorState description={tripsQuery.error?.message} onRetry={() => tripsQuery.refetch()} />
      </AppShell>
    );
  }

  return (
    <AppShell title="Dashboard" subtitle="Your travel command center">
      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* Compact greeting — no giant hero */}
        <section className="yolo-widget p-5 md:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--text-muted)]">
              {greeting()}, {firstName}.
            </p>
            <h1 className="mt-1 text-2xl md:text-3xl font-display font-bold text-[var(--text-primary)]">
              {trips.length ? 'Your travel command center' : 'Plan your next journey'}
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-xl">
              {trips.length
                ? 'Important trips first — open a journey for maps, itinerary, and expenses.'
                : 'Tell YOLO where you want to go and build a smarter route.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <PrimaryButton onClick={() => navigate('/trips/new/basics')}>Plan a Journey</PrimaryButton>
            <SecondaryButton onClick={() => navigate('/explore')}>Explore</SecondaryButton>
          </div>
        </section>

        {trips.length === 0 ? (
          <section className="grid md:grid-cols-2 gap-4">
            <div className="yolo-widget p-6 md:p-8">
              <p className="yolo-label text-[var(--brand)]">Get started</p>
              <h2 className="mt-2 text-xl font-display font-bold text-[var(--text-primary)]">
                Your next adventure starts here
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Discovery, itineraries, live guidance, and expenses — powered by AI.
              </p>
              <PrimaryButton className="mt-5" onClick={() => navigate('/trips/new/basics')}>
                Plan My First Journey
              </PrimaryButton>
            </div>
            <AIAssistantWidget message="Ready when you are — tell me where you'd like to go." />
          </section>
        ) : (
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display font-semibold text-lg text-[var(--text-primary)]">
                {primaryTrip?.status === 'ACTIVE' ? 'Current & upcoming' : 'Your trips'}
              </h2>
              {trips.length > 1 && (
                <button
                  type="button"
                  onClick={() => navigate('/trips')}
                  className="text-xs font-semibold text-[var(--brand)]"
                >
                  View all →
                </button>
              )}
            </div>

            {primaryTrip && (
              <TripSummaryCard
                trip={primaryTrip}
                featured
                onOpen={() => openTrip(primaryTrip)}
              />
            )}

            {secondaryTrips.length > 0 && (
              <div className="grid md:grid-cols-2 gap-4">
                {secondaryTrips.map((trip) => (
                  <TripSummaryCard key={trip.id} trip={trip} onOpen={() => openTrip(trip)} />
                ))}
              </div>
            )}

            <AIAssistantWidget
              tripId={primaryTrip?.id}
              message={
                primaryTrip?.status === 'ACTIVE'
                  ? 'Need help on the road? Ask about lunch, ETA, or the next stop.'
                  : 'Want help refining your upcoming route?'
              }
            />
          </section>
        )}

        <PopularDestinationsSection
          destinations={destinations}
          loading={popularQuery.isLoading}
          error={popularQuery.isError ? popularQuery.error?.message : null}
          onRetry={() => popularQuery.refetch()}
          onExplore={() => navigate('/trips/new/basics')}
          title="Discover your next destination"
          subtitle="Popular Places"
          layout="rail"
        />
      </div>
    </AppShell>
  );
}
