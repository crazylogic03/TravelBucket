import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { StatusBadge } from '@/components/ui/StatusBadge.jsx';
import { TravelImage } from '@/components/common/TravelImage.jsx';
import { HERO_BACKPACK } from '@/lib/travelImagery.js';

const COVER_FALLBACK = HERO_BACKPACK;

export function TripCard({ trip }) {
  const cover = trip.destinations?.[0]?.imageUrl || COVER_FALLBACK;
  const href =
    trip.status === 'ACTIVE'
      ? `/trips/${trip.id}/live`
      : trip.status === 'DRAFT'
        ? `/trips/new/${trip.wizardStep || 'basics'}?tripId=${trip.id}`
        : `/trips/${trip.id}`;

  const cta =
    trip.status === 'ACTIVE'
      ? 'Continue Trip'
      : trip.status === 'DRAFT'
        ? 'Continue Planning'
        : 'View Trip';

  return (
    <motion.div whileHover={{ y: -4 }} className="group">
      <Link
        to={href}
        className="block rounded-3xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--surface-raised)] yolo-card-hover"
        style={{ boxShadow: 'var(--shadow-soft)' }}
      >
        <div className="relative h-44 overflow-hidden">
          <TravelImage
            src={cover}
            label={trip.title || trip.destinationName}
            alt=""
            className="h-full w-full transition-transform duration-700 group-hover:scale-105"
            imgClassName="h-full w-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute top-3 left-3">
            <StatusBadge status={trip.status} />
          </div>
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <h3 className="font-display font-semibold text-lg leading-snug line-clamp-2">
              {trip.title}
            </h3>
          </div>
        </div>
        <div className="p-4 space-y-2">
          <p className="text-sm text-[var(--text-secondary)]">
            {trip.startLocationName} → {trip.destinationName}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            {trip.startDate} – {trip.endDate} · {trip.travelerCount} traveler
            {trip.travelerCount === 1 ? '' : 's'}
          </p>
          <div className="flex items-center justify-between pt-1">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {trip.currency} {Number(trip.budgetAmount).toLocaleString()}
            </p>
            <span className="text-sm font-semibold text-[var(--brand-primary)] group-hover:opacity-80">
              {cta} →
            </span>
          </div>
          {trip.status === 'ACTIVE' || trip.status === 'COMPLETED' ? (
            <div className="h-1.5 rounded-full bg-[var(--surface-muted)] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-coral-500"
                style={{ width: `${trip.progressPercentage || 0}%` }}
              />
            </div>
          ) : null}
        </div>
      </Link>
    </motion.div>
  );
}
