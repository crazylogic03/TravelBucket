import { PrimaryButton } from './Button.jsx';
import { TravelImage } from '@/components/common/TravelImage.jsx';

export function EmptyState({ title, description, actionLabel, onAction, image }) {
  return (
    <div className="relative overflow-hidden rounded-3xl min-h-[360px] border border-[var(--border-subtle)]">
      {image && (
        <>
          <TravelImage
            src={image}
            alt=""
            className="absolute inset-0 h-full w-full"
            imgClassName="h-full w-full"
          />
          <div className="yolo-hero-overlay" />
        </>
      )}
      <div
        className={`relative flex flex-col items-center justify-center text-center px-8 py-16 min-h-[360px] ${
          image ? 'text-white' : 'bg-[var(--surface-elevated)]'
        }`}
      >
        <h3 className="text-2xl md:text-3xl font-display font-semibold max-w-md">{title}</h3>
        {description && (
          <p
            className={`mt-3 max-w-md ${image ? 'text-white/80' : 'text-[var(--text-secondary)]'}`}
          >
            {description}
          </p>
        )}
        {actionLabel && onAction && (
          <PrimaryButton className="mt-8" onClick={onAction}>
            {actionLabel}
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', description, onRetry }) {
  return (
    <div className="rounded-3xl yolo-error-state px-8 py-10 text-center">
      <h3 className="text-lg font-display font-semibold">{title}</h3>
      {description && <p className="mt-2 text-sm opacity-90">{description}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-4 text-sm font-semibold underline">
          Try again
        </button>
      )}
    </div>
  );
}
