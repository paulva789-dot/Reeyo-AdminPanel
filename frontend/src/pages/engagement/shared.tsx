// Pieces every engagement panel needs: the state a collection can be in, and
// the gate that keeps SuperAdmin-only writes from looking available.

import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { SuperAdminBadge } from '../../components/ui/SuperAdminOnly';
import { useAuth } from '../../state/useAuth';
import type { Collection } from '../../state/useEngagement';

/**
 * Renders a collection, or the reason it has nothing to render.
 *
 * A failed load keeps the seed rows on screen — a blank panel teaches an admin
 * nothing — but says plainly, above them, that this is not what the platform
 * is serving.
 */
export function CollectionCard<T>({
  title, action, source, empty, children,
}: {
  title: string;
  action?: React.ReactNode;
  source: Collection<T>;
  empty: { heading: string; line: string };
  children: (rows: T[]) => React.ReactNode;
}) {
  return (
    <Card title={title} action={action}>
      {source.error && (
        <p
          style={{
            margin: '0 0 12px', fontSize: 11.5, color: 'var(--stop)',
            background: 'var(--stop-soft)', padding: '7px 10px',
            borderRadius: 'var(--r-ctrl)',
          }}
        >
          {source.error} What follows is sample data, not what customers see.
        </p>
      )}
      {source.loading ? (
        <EmptyState heading="Loading…" line="Fetching this from the platform." />
      ) : source.rows.length === 0 ? (
        <EmptyState heading={empty.heading} line={empty.line} />
      ) : (
        children(source.rows)
      )}
    </Card>
  );
}

/**
 * Wraps a write control. Every engagement write is SuperAdmin-only, so a plain
 * admin sees a badge saying whose call it is rather than a button that 403s.
 */
export function WriteGate({ children }: { children: React.ReactNode }) {
  const { isSuperAdmin } = useAuth();
  if (!isSuperAdmin) return <SuperAdminBadge />;
  return <>{children}</>;
}

/** A figure with its label under it, for the small stat clusters on these cards. */
export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 14, color: 'var(--forest)', fontWeight: 700 }}>
        {value}
      </div>
      <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 1 }}>{label}</div>
    </div>
  );
}
