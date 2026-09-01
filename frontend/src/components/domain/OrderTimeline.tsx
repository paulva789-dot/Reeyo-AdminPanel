import { useCallback } from 'react';
import { ORDER_STAGES } from '../../lib/format';
import { platform } from '../../services/platformResources';
import { useDetail } from '../../state/useDetail';
import type { Order, OrderEvent } from '../../data/types';

/**
 * An order's journey — spec §3.7.
 *
 * Three sources, in order of authority: the platform's own recorded timeline
 * from `/orders/:id/timeline`, the timeline carried on the order itself, and
 * failing both, the fixed stages with the reached ones filled in. The last of
 * those is a derived guess rather than a record of what happened, and the panel
 * says so — presenting the two as the same thing is the one mistake this block
 * must never make.
 */

const CLOCK: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };

function clockOf(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return '—';
  return at.toLocaleTimeString('en-GB', CLOCK);
}

/** How long the order sat at the previous stage before reaching this one. */
function gapMinutes(events: OrderEvent[], index: number): number | null {
  if (index === 0) return null;
  const prev = new Date(events[index - 1].at).getTime();
  const here = new Date(events[index].at).getTime();
  if (Number.isNaN(prev) || Number.isNaN(here)) return null;
  return Math.max(0, Math.round((here - prev) / 60_000));
}

/** The label the spec asks for beside each stage. */
function durationLabel(stage: string, minutes: number | null): string | null {
  if (minutes === null) return null;
  switch (stage) {
    case 'confirmed': return `${minutes} min to accept`;
    case 'ready for pickup': return `${minutes} min preparing`;
    case 'rider assigned': return `${minutes} min waiting for a rider`;
    case 'delivered': return `${minutes} min on the road`;
    default: return `+${minutes} min`;
  }
}

function Dot({ tone }: { tone: 'done' | 'now' | 'stop' | 'todo' }) {
  const background = tone === 'stop' ? 'var(--stop)'
    : tone === 'todo' ? 'var(--line)'
      : tone === 'now' ? 'var(--emerald)' : 'var(--forest-400)';
  return (
    <span
      aria-hidden="true"
      style={{
        width: 9, height: 9, borderRadius: '50%', flexShrink: 0, marginTop: 4,
        background,
        boxShadow: tone === 'now' ? '0 0 0 3px var(--focus-ring)' : undefined,
      }}
    />
  );
}

function Recorded({ events, order }: { events: OrderEvent[]; order: Order }) {
  return (
    <>
      {events.map((event, i) => {
        const last = i === events.length - 1;
        const failed = event.stage === 'cancelled' || event.stage === 'failed';
        const duration = durationLabel(event.stage, gapMinutes(events, i));

        return (
          <div
            key={`${event.stage}-${event.at}`}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 0' }}
          >
            <Dot tone={failed ? 'stop' : last ? 'now' : 'done'} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12.5, textTransform: 'capitalize', fontWeight: 600,
                  color: failed ? 'var(--stop)' : 'var(--text)',
                }}
              >
                {event.stage}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                {event.by}
                {duration && ` · ${duration}`}
              </div>
              {event.reason && (
                <div style={{ fontSize: 11.5, color: 'var(--stop)', marginTop: 3 }}>
                  {event.reason}
                </div>
              )}
              {event.note && (
                <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 3 }}>
                  {event.note}
                </div>
              )}
            </div>
            <span
              className="mono"
              style={{ fontSize: 11, color: 'var(--text-3)', flexShrink: 0, marginTop: 3 }}
            >
              {clockOf(event.at)}
            </span>
          </div>
        );
      })}

      {order.fulfilmentMinutes !== null && (
        <div
          style={{
            marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--line-soft)',
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12,
          }}
        >
          <span className="eyebrow">Total fulfilment</span>
          <span
            className="mono"
            style={{ fontSize: 13, fontWeight: 700, color: 'var(--forest)' }}
          >
            {order.fulfilmentMinutes} min
          </span>
        </div>
      )}
    </>
  );
}

export default function OrderTimeline({ order }: { order: Order }) {
  const fetcher = useCallback(() => platform.orderTimeline(order.id), [order.id]);
  const remote = useDetail(order.id, fetcher);

  // The platform's own record wins; the order's own timeline is next.
  const recorded: OrderEvent[] = (remote.value && remote.value.length > 0)
    ? remote.value.map((e) => ({
      stage: e.status as OrderEvent['stage'],
      at: e.at,
      by: 'Platform',
      reason: null,
      note: e.note,
    }))
    : order.timeline;

  if (recorded.length > 0) return <Recorded events={recorded} order={order} />;

  // Nothing recorded anywhere: show the shape of the journey, and label it.
  const reached = order.status === 'cancelled' || order.status === 'failed'
    ? -1
    : ORDER_STAGES.indexOf(order.status);

  return (
    <>
      {ORDER_STAGES.map((stage, i) => (
        <div
          key={stage}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}
        >
          <Dot tone={i <= reached ? 'done' : 'todo'} />
          <span
            style={{
              fontSize: 12.5, textTransform: 'capitalize',
              color: i <= reached ? 'var(--text)' : 'var(--text-3)',
              fontWeight: i <= reached ? 600 : 400,
            }}
          >
            {stage}
          </span>
        </div>
      ))}

      <p style={{ margin: '10px 0 2px', fontSize: 11, color: 'var(--text-3)' }}>
        {remote.loading
          ? 'Loading the recorded timeline…'
          : 'The standard stages. Nothing was recorded for this order, so these are'
            + ' the steps it would follow, not the times it took.'}
      </p>
    </>
  );
}
