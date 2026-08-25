import Pill from '../ui/Pill';
import EmptyState from '../ui/EmptyState';
import { money } from '../../lib/format';
import type { Detail } from '../../state/useDetail';
import type { Order } from '../../data/types';

interface OrderHistoryProps {
  history: Detail<Order[]>;
  /** Orders already in the console, used when there is no live history to show. */
  fallback: Order[];
  /** What "no orders" means for this particular subject. */
  emptyLine: string;
}

/**
 * A subject's own orders, from `/users/:id/orders`, `/vendors/:id/orders` or
 * `/riders/:id/deliveries`.
 *
 * When the endpoint answers, that is the whole history. When it cannot, the
 * list falls back to the orders already loaded into the console, which is a
 * fragment of the truth — so the footer says which of the two you are reading.
 */
export default function OrderHistory({ history, fallback, emptyLine }: OrderHistoryProps) {
  const live = history.value !== null;
  const rows = history.value ?? fallback;

  if (history.loading) {
    return <EmptyState heading="Loading…" line="Fetching this history from the platform." />;
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        heading="No orders"
        line={history.error ? `${history.error} ${emptyLine}` : emptyLine}
      />
    );
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {rows.slice(0, 20).map((o, i) => (
          <div
            key={o.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0',
              borderTop: i === 0 ? 'none' : '1px solid var(--line-soft)',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="mono" style={{ fontSize: 12, color: 'var(--forest)' }}>
                {o.id}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                {o.vendor} · {o.placedAgo}
              </div>
            </div>
            <span className="mono" style={{ fontSize: 12, flexShrink: 0 }}>
              {money(o.total)}
            </span>
            <Pill status={o.status} />
          </div>
        ))}
      </div>

      <p style={{ margin: '11px 0 0', fontSize: 11, color: 'var(--text-3)' }}>
        {live
          ? rows.length > 20
            ? `The 20 most recent of ${rows.length} the platform returned.`
            : 'From the platform.'
          : history.sample
            ? 'Sample mode — orders already loaded into the console.'
            : `${history.error ?? 'No history available.'} Showing only the orders
               already loaded into the console, which is not the full history.`}
      </p>
    </>
  );
}
