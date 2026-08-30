import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/layouts/AppShell.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { AIChatPanel } from '@/components/ui/AIChatPanel.jsx';
import { ErrorState } from '@/components/ui/EmptyState.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import {
  getCopilotSession,
  sendCopilotMessage,
  clearCopilotSession,
} from '@/features/copilot/copilotApi.js';

function useGeolocationOptional(enabled) {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!enabled || !navigator.geolocation) return undefined;
    const id = navigator.geolocation.watchPosition(
      (pos) =>
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 30_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [enabled]);

  return position;
}

export default function CopilotPage({ activeMode = false }) {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const mode = activeMode ? 'ACTIVE_TRIP' : 'PLANNING';

  const [messages, setMessages] = useState([]);
  const [quickActions, setQuickActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const position = useGeolocationOptional(activeMode);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCopilotSession(tripId, mode);
      setMessages(data.messages || []);
      setQuickActions(data.quickActions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tripId, mode]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleSend = async (text) => {
    setSending(true);
    setError(null);
    const optimistic = {
      id: `tmp-${Date.now()}`,
      role: 'USER',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const data = await sendCopilotMessage(tripId, {
        message: text,
        mode,
        location: position || undefined,
      });
      setMessages((prev) => [...prev, data.message]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleClear = async () => {
    try {
      await clearCopilotSession(tripId, mode);
      setMessages([]);
    } catch (err) {
      setError(err.message);
    }
  };

  const shell = activeMode ? (
    <div className="min-h-screen bg-[var(--live-bg)] text-[var(--live-text)] flex flex-col">
      <header className="border-b border-[var(--live-border)] px-4 py-4 flex items-center gap-3 bg-[var(--live-panel)]">
        <button
          type="button"
          onClick={() => navigate(`/trips/${tripId}/active`)}
          className="text-sm text-[var(--live-text-muted)] hover:text-[var(--live-text)]"
        >
          ← Live trip
        </button>
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--live-text-muted)]">Live copilot</p>
          <h1 className="font-display font-semibold text-lg">YOLO Copilot</h1>
        </div>
      </header>
      <div className="flex-1 p-4 min-h-0 flex flex-col max-w-2xl mx-auto w-full">
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : error ? (
          <ErrorState description={error} onRetry={reload} />
        ) : (
          <div className="yolo-surface flex-1 flex flex-col p-4 min-h-0">
            <AIChatPanel
              messages={messages}
              quickActions={quickActions}
              onSend={handleSend}
              onClear={handleClear}
              sending={sending}
              showLocationHint
              className="flex-1"
            />
          </div>
        )}
      </div>
    </div>
  ) : (
    <AppShell title="Copilot">
      <PageHeader
        title="AI Copilot"
        description="Ask about weather, food, budget, and your itinerary."
        action={
          <Link to={`/trips/${tripId}`} className="text-sm font-medium text-[var(--brand-primary)]">
            ← Back to trip
          </Link>
        }
      />
      {loading ? (
        <Skeleton className="h-[480px] w-full" />
      ) : error ? (
        <ErrorState description={error} onRetry={reload} />
      ) : (
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 h-[min(70vh,640px)] flex flex-col">
          <AIChatPanel
            messages={messages}
            quickActions={quickActions}
            onSend={handleSend}
            onClear={handleClear}
            sending={sending}
            className="flex-1"
          />
        </div>
      )}
    </AppShell>
  );

  return shell;
}
