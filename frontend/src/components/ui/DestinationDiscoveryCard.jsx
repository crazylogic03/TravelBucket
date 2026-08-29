import { cn } from '@/lib/cn.js';
import { TravelImage } from '@/components/common/TravelImage.jsx';

/**
 * Compact informative destination card — desktop-first discovery.
 */
export function DestinationDiscoveryCard({
  destination,
  onClick,
  className,
  imageAspect = 'aspect-[16/10]',
}) {
  const d = destination;
  const imageSrc = d.imageUrl || d.image;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group text-left yolo-widget overflow-hidden p-0 flex flex-col yolo-card-hover w-full',
        'transition-all duration-300 hover:shadow-[var(--shadow-card)]',
        className,
      )}
    >
      <div className={cn('relative w-full shrink-0 overflow-hidden', imageAspect)}>
        <TravelImage
          src={imageSrc}
          label={d.name}
          alt={d.name}
          className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]"
          imgClassName="h-full w-full"
        />
        {d.category && (
          <span className="absolute top-2 left-2 yolo-chip bg-[var(--surface-glass)] text-[var(--text-primary)] text-[10px] backdrop-blur-md">
            {d.category}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3 md:p-3.5 min-h-[88px]">
        <h3 className="font-display font-semibold text-sm md:text-base text-[var(--text-primary)] truncate">
          {d.name}
        </h3>
        {d.region && (
          <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{d.region}</p>
        )}
        {(d.vibe || d.description) && (
          <p className="mt-1.5 text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
            {d.vibe || d.description}
          </p>
        )}
        <div className="mt-auto pt-2 flex items-center justify-between gap-2 text-[11px]">
          {d.rating != null && (
            <span className="font-semibold text-[var(--text-primary)]">
              <span className="text-[var(--travel-coral)]">★</span> {d.rating}
            </span>
          )}
          {d.visits && <span className="text-[var(--text-muted)] truncate">{d.visits} travelers</span>}
        </div>
      </div>
    </button>
  );
}
