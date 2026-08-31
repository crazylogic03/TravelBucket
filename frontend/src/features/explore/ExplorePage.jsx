import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/layouts/AppShell.jsx';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button.jsx';
import { PopularDestinationsSection } from '@/components/ui/PopularDestinationsSection.jsx';
import { TravelImage } from '@/components/common/TravelImage.jsx';
import { getPopularDestinations, getExploreVibes } from '@/features/explore/exploreApi.js';
import { cn } from '@/lib/cn.js';

export default function ExplorePage() {
  const navigate = useNavigate();

  const popularQuery = useQuery({
    queryKey: ['popular-destinations'],
    queryFn: getPopularDestinations,
  });
  const vibesQuery = useQuery({
    queryKey: ['explore-vibes'],
    queryFn: getExploreVibes,
  });

  const destinations = popularQuery.data?.destinations || [];
  const vibes = vibesQuery.data?.vibes || [];
  const featuredDestinations = destinations.slice(0, 5);
  const moreDestinations = destinations.slice(5);

  return (
    <AppShell title="Explore" subtitle="Discover places worth going to">
      <div className="max-w-[1400px] mx-auto space-y-8 md:space-y-10">
        {/* Compact intro — no hero image */}
        <section className="yolo-widget p-5 md:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="max-w-2xl">
            <p className="yolo-label text-[var(--brand)]">Explore the world</p>
            <h1 className="mt-1 text-2xl md:text-3xl font-display font-bold text-[var(--text-primary)]">
              Discover places worth going to
            </h1>
            <p className="mt-2 text-sm md:text-base text-[var(--text-secondary)] leading-relaxed">
              Browse trending destinations, pick a vibe, and start planning with YOLO — transport,
              stays, and a day-by-day itinerary built around how you travel.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <PrimaryButton onClick={() => navigate('/trips/new/basics')}>Plan My Journey</PrimaryButton>
            <SecondaryButton onClick={() => navigate('/trips')}>View My Trips</SecondaryButton>
          </div>
        </section>

        {/* Popular destinations — above the fold, horizontal rail */}
        <PopularDestinationsSection
          destinations={featuredDestinations}
          loading={popularQuery.isLoading}
          error={popularQuery.isError ? popularQuery.error?.message : null}
          onRetry={() => popularQuery.refetch()}
          onExplore={() => navigate('/trips/new/basics')}
          title="Trending destinations"
          subtitle="Popular right now"
          layout="rail"
        />

        {/* Browse by vibe — compact uniform grid */}
        <section>
          <div className="mb-4">
            <p className="yolo-label text-[var(--brand)]">Browse by vibe</p>
            <h2 className="mt-1 text-xl md:text-2xl font-display font-bold text-[var(--text-primary)]">
              Find your travel mood
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Weekend escapes, hidden gems, and trending experiences.
            </p>
          </div>

          {vibesQuery.isError && (
            <div className="mb-4 rounded-xl yolo-error-state px-4 py-3 text-sm flex items-center justify-between gap-3">
              <span>{vibesQuery.error?.message || 'Could not load vibes'}</span>
              <button
                type="button"
                className="font-semibold underline shrink-0"
                onClick={() => vibesQuery.refetch()}
              >
                Retry
              </button>
            </div>
          )}

          {!vibesQuery.isError && (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
            {(vibesQuery.isLoading ? Array.from({ length: 6 }) : vibes).map((cat, i) => (
              <button
                key={cat?.id || i}
                type="button"
                onClick={() => navigate('/trips/new/basics')}
                className={cn(
                  'group text-left yolo-widget overflow-hidden p-0 yolo-card-hover transition-all duration-300',
                  vibesQuery.isLoading && 'animate-pulse bg-[var(--surface-muted)] min-h-[140px]',
                )}
              >
                {!vibesQuery.isLoading && cat && (
                  <>
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                      <TravelImage
                        src={cat.imageUrl}
                        label={cat.label}
                        alt={cat.label}
                        className="h-full w-full transition-transform duration-500 group-hover:scale-[1.04]"
                        imgClassName="h-full w-full"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                        <p className="font-display font-semibold text-sm">{cat.label}</p>
                        {cat.vibe && <p className="text-[10px] text-white/70 mt-0.5">{cat.vibe}</p>}
                      </div>
                    </div>
                  </>
                )}
              </button>
            ))}
          </div>
          )}
        </section>

        {moreDestinations.length > 0 && (
          <PopularDestinationsSection
            destinations={moreDestinations}
            loading={popularQuery.isLoading}
            onExplore={() => navigate('/trips/new/basics')}
            title="More places to explore"
            subtitle="Discover"
            layout="grid"
          />
        )}

        {/* Compact CTA — no giant image */}
        <section className="yolo-widget p-5 md:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-display font-semibold text-lg text-[var(--text-primary)]">
              Ready to plan your route?
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              YOLO builds transport, stays, and a smart itinerary — then stays with you on the road.
            </p>
          </div>
          <PrimaryButton onClick={() => navigate('/trips/new/basics')}>Start Planning</PrimaryButton>
        </section>
      </div>
    </AppShell>
  );
}
