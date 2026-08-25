import { useCallback } from 'react';
import { ORDER_STAGES } from '../../lib/format';
import { platform } from '../../services/platformResources';
import { useDetail } from '../../state/useDetail';
import type { Order } from '../../data/types';

/**
 * An order's journey.
 *
 * `GET /orders/:id/timeline` records what actually happened and when. When it
 * answers, that is what shows. When it does not — sample mode, or an order the
 * platform has no events for — the drawer falls back to the five fixed stages
 * with the reached ones filled in, and says which of the two it is showing.
 * Presenting a derived guess as a recorded history would be the one thing this
 * block must never do.
 */
export default function OrderTimeline({ order }: { order: Order }) {
  const fetcher = useCallback(() => platform.orderTimeline(order.id), [order.id]);
  const timeline = useDetail(order.id, fetcher);

  const events = timeline.value ?? [];

  if (events.length > 0) {
    return (
      <>
        {events.map((event, i) => (
          <div
            key={event.id}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 0' }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 9, height: 9, borderRadius: '50%', flexShrink: 0, marginTop: 4,
                background: i === events.length - 1 ? 'var(--emerald)' : 'var(--forest-400)',
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, textTransform: 'capitalize', fontWeight: 600 }}>
                {event.status}
              </div>
              {event.note && (
                <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 2 }}>
                  {event.note}
                </div>
              )}
            </div>
            <span
              className="mono"
              style={{ fontSize: 11, color: 'var(--text-3)', flexShrink: 0, marginTop: 3 }}
            >
              {event.at}
            </span>
          </div>
        ))}
      </>
    );
  }

  // The journey stops at the current stage; a cancelled order never advanced.
  const reached = order.status === 'cancelled'
    ? -1
    : ORDER_STAGES.indexOf(order.status === 'delayed' ? 'on the way' : order.status);

  return (
    <>
      {ORDER_STAGES.map((stage, i) => {
        const done = i <= reached;
        return (
          <div
            key={stage}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
                background: done ? 'var(--emerald)' : 'var(--line)',
              }}
            />
            <span
              style={{
                fontSize: 12.5, textTransform: 'capitalize',
                color: done ? 'var(--text)' : 'var(--text-3)',
                fontWeight: done ? 600 : 400,
              }}
            >
              {stage}
            </span>
          </div>
        );
      })}

      {order.status === 'cancelled' && (
        <p style={{ margin: '8px 0 4px', fontSize: 12, color: 'var(--stop)' }}>
          This order was cancelled before it moved.
        </p>
      )}

      <p style={{ margin: '10px 0 2px', fontSize: 11, color: 'var(--text-3)' }}>
        {timeline.sample
          ? 'Sample mode — the standard stages, not a recorded timeline.'
          : timeline.loading
            ? 'Loading the recorded timeline…'
            : timeline.error
              ? `${timeline.error} These are the standard stages, not what happened.`
              : 'Standard stages — the platform has no recorded timeline for this order.'}
      </p>
    </>
  );
}
