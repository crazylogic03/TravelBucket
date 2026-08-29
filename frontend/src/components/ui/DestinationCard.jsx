import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn.js';
import { TravelImage } from '@/components/common/TravelImage.jsx';

const ACCENT_RING = {
  teal: 'ring-teal-500/30 group-hover:ring-teal-400/50',
  coral: 'ring-coral-500/30 group-hover:ring-coral-400/50',
  ocean: 'ring-ocean-500/30 group-hover:ring-ocean-400/50',
  green: 'ring-green-500/30 group-hover:ring-green-400/50',
  sunset: 'ring-orange-400/30 group-hover:ring-orange-300/50',
};

/**
 * Rich horizontal destination card for discovery / dashboard.
 */
export function DestinationCard({
  name,
  region,
  category,
  rating,
  visits,
  distance,
  description,
  image,
  accent = 'teal',
  href,
  onAction,
  actionLabel = 'Explore',
  className,
  size = 'default',
}) {
  const inner = (
    <motion.div
      whileHover={{ y: -4 }}
      className={cn(
        'group relative overflow-hidden rounded-3xl yolo-card-hover',
        size === 'large' ? 'min-h-[280px]' : 'min-h-[220px]',
        className,
      )}
    >
      <TravelImage
        src={image}
        label={name}
        alt={name}
        className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-110"
        imgClassName="h-full w-full"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/95 via-neutral-950/40 to-transparent" />
      <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-3xl" />

      <div className="relative flex flex-col justify-end h-full min-h-[inherit] p-5 md:p-6 text-white">
        {category && (
          <span className="self-start yolo-chip bg-white/15 text-white/90 backdrop-blur-sm mb-3">
            {category}
          </span>
        )}
        <h3 className="font-display text-xl md:text-2xl font-semibold">{name}</h3>
        {region && <p className="text-sm text-white/60 mt-0.5">{region}</p>}
        {description && (
          <p className="text-sm text-white/75 mt-2 line-clamp-2 max-w-md">{description}</p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/70">
          {rating != null && (
            <span className="flex items-center gap-1">
              <span className="text-coral-400">★</span> {rating}
            </span>
          )}
          {visits && <span>{visits} travelers</span>}
          {distance && <span>{distance}</span>}
        </div>
        {onAction && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAction();
            }}
            className="mt-4 self-start rounded-full bg-white/15 hover:bg-white/25 backdrop-blur px-4 py-2 text-sm font-semibold transition-colors"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </motion.div>
  );

  if (href) {
    return (
      <Link to={href} className={cn('block', ACCENT_RING[accent])}>
        {inner}
      </Link>
    );
  }
  return inner;
}

/**
 * Compact destination tile for horizontal scroll sections.
 */
export function DestinationTile({ name, image, category, rating, className, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group shrink-0 w-[200px] md:w-[240px] text-left overflow-hidden rounded-2xl yolo-card-hover',
        className,
      )}
    >
      <div className="relative h-36 overflow-hidden">
        <TravelImage
          src={image}
          label={name}
          alt={name}
          className="h-full w-full transition-transform duration-500 group-hover:scale-110"
          imgClassName="h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        {category && (
          <span className="absolute top-2 left-2 yolo-chip bg-black/40 text-white text-[10px]">
            {category}
          </span>
        )}
      </div>
      <div className="p-3 bg-[var(--surface-raised)] border border-[var(--border-subtle)] border-t-0 rounded-b-2xl">
        <p className="font-semibold text-sm text-[var(--text-primary)] truncate">{name}</p>
        {rating != null && (
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            <span className="text-coral-500">★</span> {rating}
          </p>
        )}
      </div>
    </button>
  );
}
