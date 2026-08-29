import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn.js';

/**
 * Destination image with compact minimal fallback — no illustration art.
 */
export function TravelImage({
  src,
  alt = '',
  label,
  className,
  imgClassName,
  objectFit = 'cover',
  loading = 'lazy',
  showPlaceholder = true,
  ...props
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  const hasSrc = Boolean(src);
  const showImage = hasSrc && !failed;
  const displayLabel = label || alt;
  const initial = (displayLabel || '?').trim().charAt(0).toUpperCase();

  return (
    <div className={cn('relative overflow-hidden bg-[var(--surface-muted)]', className)}>
      {showPlaceholder && showImage && !loaded && (
        <div className="absolute inset-0 animate-pulse bg-[var(--surface-muted)]" aria-hidden />
      )}

      {showImage && (
        <img
          {...props}
          src={src}
          alt={alt || label || ''}
          loading={loading}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            'h-full w-full transition-opacity duration-300',
            loaded ? 'opacity-100' : 'opacity-0',
            imgClassName,
          )}
          style={{ objectFit, ...(props.style || {}) }}
        />
      )}

      {(!hasSrc || failed) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center bg-[var(--brand-soft)]">
          <span className="font-display text-xl md:text-2xl font-bold text-[var(--brand-primary)]">
            {initial}
          </span>
          {displayLabel && (
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] line-clamp-2">
              {displayLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
