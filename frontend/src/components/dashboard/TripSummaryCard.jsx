import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { StatusBadge } from '@/components/ui/StatusBadge.jsx';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button.jsx';
import { TravelImage } from '@/components/common/TravelImage.jsx';
import { HERO_BACKPACK, POPULAR_DESTINATIONS } from '@/lib/travelImagery.js';
import { cn } from '@/lib/cn.js';

function coverForTrip(trip) {
  return (
    trip?.destinations?.[0]?.imageUrl ||
    POPULAR_DESTINATIONS.find((d) =>
      trip?.destinationName?.toLowerCase().includes(d.name.toLowerCase()),
    )?.image ||
    HERO_BACKPACK
  );
}

function tripHref(trip) {
  if (trip.status === 'ACTIVE') return `/trips/${trip.id}/live`;
  if (trip.status === 'DRAFT') return `/trips/new/${trip.wizardStep || 'basics'}?tripId=${trip.id}`;
  return `/trips/${trip.id}`;
}

function sectionLabel(status) {
  if (status === 'ACTIVE') return 'Current journey';
  if (status === 'PLANNED') return 'Upcoming trip';
  if (status === 'DRAFT') return 'Draft trip';
  return 'Your trip';
}

/**
 * Compact premium trip summary — dashboard overview only.
 */
export function TripSummaryCard({
  trip,
  cover,
  onOpen,
  featured = false,
  className,
}) {
  if (!trip) return null;

  const image = cover || coverForTrip(trip);
  const progress = Math.round(trip.progressPercentage || 0);
  const showProgress = trip.status === 'ACTIVE' || trip.status === 'COMPLETED';
  const cta =
    trip.status === 'ACTIVE'
      ? 'Continue Journey'
      : trip.status === 'DRAFT'
        ? 'Continue Planning'
        : 'Open Trip';

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'yolo-widget overflow-hidden p-0 flex flex-col sm:flex-row',
        featured ? 'sm:min-h-[200px]' : 'sm:min-h-[168px]',
        className,
      )}
    >
      <div
        className={cn(
          'relative shrink-0 overflow-hidden',
          featured ? 'sm:w-[220px] h-[140px] sm:h-auto' : 'sm:w-[180px] h-[120px] sm:h-auto',
        )}
      >
        <TravelImage
          src={image}
          label={trip.destinationName || trip.title}
          alt=""
          className="absolute inset-0 h-full w-full"
          imgClassName="h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/50 to-transparent" />
      </div>

      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5 min-w-0">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <p className="yolo-label text-[var(--brand)]">{sectionLabel(trip.status)}</p>
            <StatusBadge status={trip.status} />
          </div>
          <h2 className="font-display font-bold text-lg sm:text-xl text-[var(--text-primary)] truncate">
            {trip.destinationName || trip.title}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)] truncate">
            {trip.startLocationName} → {trip.destinationName}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {trip.startDate} – {trip.endDate}
            {trip.numberOfDays ? ` · ${trip.numberOfDays} days` : ''}
          </p>
        </div>

        {showProgress && (
          <div className="mt-3 max-w-xs">
            <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--surface-muted)] overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, var(--brand), var(--travel-coral))',
                }}
              />
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <PrimaryButton className="!px-5 !py-2.5 !text-sm" onClick={onOpen}>
            {cta} →
          </PrimaryButton>
          {trip.status !== 'DRAFT' && (
            <Link to={tripHref(trip)}>
              <SecondaryButton className="!px-5 !py-2.5 !text-sm">View trip</SecondaryButton>
            </Link>
          )}
        </div>
      </div>
    </motion.article>
  );
}
