import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { StatusBadge } from '@/components/ui/StatusBadge.jsx';
import { PrimaryButton } from '@/components/ui/Button.jsx';
import { TravelImage } from '@/components/common/TravelImage.jsx';
import { HERO_BACKPACK } from '@/lib/travelImagery.js';
import { cn } from '@/lib/cn.js';

/**
 * Dominant large trip card — visual anchor of the dashboard.
 */
export function LargeTripCard({ trip, cover, onOpen, className }) {
  if (!trip) return null;

  const progress = Math.round(trip.progressPercentage || 0);
  const showProgress = trip.status === 'ACTIVE' || trip.status === 'COMPLETED';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-[1.75rem] min-h-[320px] md:min-h-[360px] group',
        className,
      )}
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <TravelImage
        src={cover}
        label={trip.destinationName || trip.title}
        alt=""
        className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-[1.03]"
        imgClassName="h-full w-full"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b1220]/92 via-[#0b1220]/55 to-[#0b1220]/15" />

      <div className="relative flex flex-col justify-between h-full min-h-[inherit] p-6 md:p-8 text-white">
        <div className="flex items-start justify-between gap-3">
          <StatusBadge status={trip.status} />
          {trip.transportMode && (
            <span className="yolo-chip bg-white/10 text-white/80 text-[10px] capitalize">
              {trip.transportMode.toLowerCase()}
            </span>
          )}
        </div>

        <div className="mt-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-teal-300/80">Your journey</p>
          <h2 className="mt-2 text-3xl md:text-4xl font-display font-bold leading-tight">
            {trip.destinationName}
          </h2>
          <p className="mt-2 text-white/75 text-sm md:text-base">
            {trip.startLocationName} → {trip.destinationName}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/55">
            <span>{trip.numberOfDays || '—'} days</span>
            <span>{trip.travelerCount} travelers</span>
            <span>
              {trip.currency} {Number(trip.budgetAmount).toLocaleString()}
            </span>
          </div>

          {showProgress && (
            <div className="mt-4 max-w-sm">
              <div className="flex justify-between text-[10px] text-white/50 mb-1">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, var(--brand), var(--travel-coral))',
                  }}
                />
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryButton onClick={onOpen}>
              {trip.status === 'ACTIVE' ? 'Continue Journey' : 'Open Trip'}
            </PrimaryButton>
            {trip.status !== 'DRAFT' && (
              <Link
                to={`/trips/${trip.id}`}
                className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold hover:bg-white/15 transition-colors"
              >
                Trip details
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
