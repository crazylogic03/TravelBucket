import { motion } from 'framer-motion';
import { cn } from '@/lib/cn.js';
import { TravelImage } from '@/components/common/TravelImage.jsx';

/** Editorial mosaic layout — varied card sizes, image-dominant. */
const LAYOUT = [
  'col-span-12 sm:col-span-7 row-span-2',
  'col-span-12 sm:col-span-5 row-span-1',
  'col-span-6 sm:col-span-5 row-span-2',
  'col-span-6 sm:col-span-7 row-span-1',
  'col-span-6 sm:col-span-4 row-span-1',
  'col-span-6 sm:col-span-8 row-span-1',
];
const MIN_H = [280, 160, 240, 180, 180, 180];

/**
 * Popular places — editorial discovery grid (landing + dashboard).
 */
export function EditorialDestinations({
  destinations,
  onExplore,
  className,
  showHeader = true,
  variant = 'editorial',
}) {
  const items = destinations.slice(0, variant === 'compact' ? 4 : 6);
  const compact = variant === 'compact';

  return (
    <section className={cn(compact ? 'pt-4' : 'yolo-section-gap', className)}>
      {showHeader && (
        <div className="mb-6 md:mb-8">
          <p className="yolo-label text-[var(--brand)]">Popular Places</p>
          <h2 className="mt-2 text-2xl md:text-3xl font-display font-bold text-[var(--text-primary)]">
            {compact
              ? 'Discover your next destination'
              : 'Places travelers are loving right now'}
          </h2>
        </div>
      )}

      <div
        className={cn(
          compact
            ? 'grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4'
            : 'grid grid-cols-12 gap-3 md:gap-4 auto-rows-auto',
        )}
      >
        {items.map((d, i) => (
          <motion.button
            key={d.id}
            type="button"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            onClick={() => onExplore?.(d)}
            className={cn(
              'group relative overflow-hidden rounded-2xl md:rounded-3xl text-left yolo-card-hover',
              compact ? 'col-span-1 aspect-[4/5] max-h-[220px]' : LAYOUT[i] || 'col-span-12',
            )}
            style={compact ? undefined : { minHeight: MIN_H[i] || 200 }}
          >
            <TravelImage
              src={d.imageUrl || d.image}
              label={d.name}
              alt={d.name}
              className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-105"
              imgClassName="h-full w-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />

            <div className="relative flex flex-col justify-end h-full p-4 md:p-5 text-white min-h-[inherit]">
              {d.category && (
                <span className="self-start yolo-chip bg-white/15 text-white/90 text-[10px] mb-2">
                  {d.category}
                </span>
              )}
              <h3 className={cn('font-display font-bold', compact ? 'text-base md:text-lg' : 'text-xl md:text-2xl')}>
                {d.name}
              </h3>
              {d.region && <p className="text-xs text-white/60 mt-0.5">{d.region}</p>}
              {d.rating != null && (
                <p className="mt-1 text-xs text-white/80">
                  <span className="text-[var(--travel-coral)]">★</span> {d.rating}
                  {d.description && (
                    <span className="text-white/50"> · {d.description.split('.')[0]}</span>
                  )}
                </p>
              )}
              <span className="mt-3 self-start text-[10px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 px-3 py-1.5 rounded-full">
                Explore →
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
