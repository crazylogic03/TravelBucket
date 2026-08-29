import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn.js';

const DEFAULT_ACTIONS = [
  { id: 'optimize', label: 'Suggest', prompt: 'Optimize tomorrow\'s itinerary' },
  { id: 'rearrange', label: 'Rearrange', prompt: 'Rearrange today based on my pace' },
  { id: 'ask', label: 'Ask YOLO', prompt: 'What should I do next on this trip?' },
];

const QUICK_PILLS = [
  'Suggest nearby restaurants',
  'Find a break point',
  'Optimize today\'s route',
  'Find something interesting nearby',
];

/**
 * Premium floating AI assistant panel — reference-inspired composition.
 */
export function AIAssistantWidget({
  message = 'Want me to optimize tomorrow\'s itinerary?',
  actions = DEFAULT_ACTIONS,
  quickPills = QUICK_PILLS,
  tripId,
  copilotHref,
  onAction,
  className,
}) {
  const href = copilotHref || (tripId ? `/trips/${tripId}/copilot` : '/help');

  return (
    <div
      className={cn(
        'yolo-widget p-4 border-[var(--ai-accent)]/20 yolo-ai-glow',
        className,
      )}
      style={{ background: 'linear-gradient(145deg, var(--surface) 0%, var(--ai-accent-soft) 120%)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-sm"
          style={{ background: 'var(--ai-accent-soft)' }}
        >
          ✨
        </span>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ai-accent)]">
          YOLO AI
        </p>
      </div>

      <p className="text-sm font-medium text-[var(--text-primary)] leading-snug">&ldquo;{message}&rdquo;</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {actions.map((action) => (
          <Link
            key={action.id}
            to={href}
            state={action.prompt ? { prefilledPrompt: action.prompt } : undefined}
            onClick={() => onAction?.(action)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
              action.id === 'ask'
                ? 'bg-gradient-to-r from-indigo-500 to-teal-600 text-white'
                : 'text-[var(--text-primary)]',
            )}
            style={action.id !== 'ask' ? { background: 'var(--surface-muted)' } : undefined}
          >
            {action.label}
          </Link>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-[var(--border)] flex flex-wrap gap-1.5">
        {quickPills.slice(0, 3).map((pill) => (
          <Link
            key={pill}
            to={href}
            state={{ prefilledPrompt: pill }}
            className="rounded-full px-2.5 py-1 text-[10px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            style={{ background: 'var(--surface-muted)' }}
          >
            ✨ {pill}
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * Floating chat composer for live-trip style contexts.
 */
export function AIChatComposer({
  placeholder = 'Ask YOLO about your journey…',
  onSubmit,
  className,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const text = String(fd.get('message') || '').trim();
    if (text) onSubmit?.(text);
    e.target.reset();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'yolo-surface-glass p-3 flex items-center gap-2 yolo-ai-glow border-[var(--ai-accent)]/25',
        className,
      )}
    >
      <input
        name="message"
        placeholder={placeholder}
        className="flex-1 bg-transparent border-0 outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] min-w-0"
      />
      <span className="text-lg shrink-0 opacity-60" aria-hidden>
        🎤
      </span>
      <button
        type="submit"
        className="shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-white text-sm"
        style={{ background: 'var(--gradient-ai)' }}
        aria-label="Send"
      >
        ✨
      </button>
    </form>
  );
}
