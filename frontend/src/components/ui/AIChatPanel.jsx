import { useEffect, useRef, useState } from 'react';
import { SecondaryButton } from './Button.jsx';
import { cn } from '@/lib/cn.js';

/**
 * Reusable chat panel for YOLO Copilot — token-based theming.
 */
export function AIChatPanel({
  messages = [],
  quickActions = [],
  onSend,
  onClear,
  sending = false,
  placeholder = 'Ask YOLO anything about your trip…',
  className,
  showLocationHint = false,
}) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    await onSend(text);
  };

  const handleQuick = async (prompt) => {
    if (sending) return;
    await onSend(prompt);
  };

  return (
    <div className={cn('flex flex-col h-full min-h-0', className)}>
      {quickActions.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-3 shrink-0">
          {quickActions.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={sending}
              onClick={() => handleQuick(action.prompt)}
              className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
              style={{ background: 'var(--surface-muted)', color: 'var(--text-secondary)' }}
            >
              ✨ {action.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[200px] text-[var(--text-primary)]">
        {!messages.length && (
          <p className="text-sm text-[var(--text-muted)]">
            Hi! I&apos;m YOLO Copilot. Ask about weather, food, ETA, budget, or your itinerary.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id || `${m.role}-${m.createdAt}`}
            className={cn(
              'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap',
              m.role === 'USER' || m.role === 'user'
                ? 'ml-auto text-white'
                : 'mr-auto text-[var(--text-secondary)]',
            )}
            style={
              m.role === 'USER' || m.role === 'user'
                ? { background: 'var(--gradient-ai)' }
                : { background: 'var(--ai-accent-soft)' }
            }
          >
            {m.content}
          </div>
        ))}
        {sending && (
          <div
            className="rounded-2xl px-4 py-2.5 text-sm w-fit mr-auto text-[var(--text-muted)]"
            style={{ background: 'var(--surface-muted)' }}
          >
            <span className="inline-flex gap-1">
              <span className="animate-pulse">●</span>
              <span className="animate-pulse">●</span>
              <span className="animate-pulse">●</span>
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {showLocationHint && (
        <p className="text-xs mt-2 shrink-0 text-[var(--text-muted)]">
          Using your live GPS for nearby search when available.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-3 yolo-surface-glass p-2 flex gap-2 shrink-0 yolo-ai-glow border-[var(--ai-accent)]/20">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={sending}
          className="flex-1 bg-transparent border-0 outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] min-w-0 px-2"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-white text-sm disabled:opacity-40"
          style={{ background: 'var(--gradient-ai)' }}
          aria-label="Send"
        >
          ✨
        </button>
      </form>

      {onClear && messages.length > 0 && (
        <SecondaryButton
          type="button"
          className="mt-2 w-full text-xs"
          onClick={onClear}
          disabled={sending}
        >
          Clear chat
        </SecondaryButton>
      )}
    </div>
  );
}
