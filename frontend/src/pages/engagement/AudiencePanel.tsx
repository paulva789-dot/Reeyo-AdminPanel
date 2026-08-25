import Pill from '../../components/ui/Pill';
import DataTable from '../../components/ui/DataTable';
import type { Column } from '../../components/ui/DataTable';
import { CollectionCard } from './shared';
import { money } from '../../lib/format';
import type { EngagementState } from '../../state/useEngagement';
import type { SharedCart } from '../../data/types';

/**
 * The three read-only engagement collections: what customers say they like,
 * what the tracking screen tells them while they wait, and who is shopping
 * together right now.
 */
export default function AudiencePanel({ engagement }: { engagement: EngagementState }) {
  const { preferenceTags, trackingFacts, sharedCarts } = engagement;

  const cartColumns: Column<SharedCart>[] = [
    { key: 'owner', header: 'Started by', render: (c) => c.owner },
    {
      key: 'participants', header: 'People', align: 'right',
      render: (c) => <span className="mono" style={{ fontSize: 12 }}>{c.participants}</span>,
    },
    {
      key: 'total', header: 'Basket', align: 'right',
      render: (c) => (
        <span className="mono" style={{ fontSize: 12, color: 'var(--forest)' }}>
          {money(c.total)}
        </span>
      ),
    },
    {
      key: 'created', header: 'Started', align: 'right',
      render: (c) => (
        <span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>
          {c.createdAgo}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="reeyo-split-even">
        <CollectionCard
          title="Preference tags"
          source={preferenceTags}
          empty={{
            heading: 'No tags yet',
            line: 'Customers have not told the app anything about what they like.',
          }}
        >
          {(rows) => (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {[...rows]
                .sort((a, b) => b.usageCount - a.usageCount)
                .map((t) => (
                  <span
                    key={t.tag}
                    style={{
                      display: 'inline-flex', alignItems: 'baseline', gap: 6,
                      padding: '5px 11px', borderRadius: 'var(--r-pill)',
                      background: 'var(--olive)', color: 'var(--forest)',
                      fontSize: 12, fontWeight: 600,
                    }}
                  >
                    {t.tag}
                    <span className="mono" style={{ fontSize: 10.5, opacity: 0.7 }}>
                      {t.usageCount.toLocaleString('fr-FR')}
                    </span>
                  </span>
                ))}
            </div>
          )}
        </CollectionCard>

        <CollectionCard
          title="Tracking screen facts"
          source={trackingFacts}
          empty={{
            heading: 'No facts',
            line: 'The tracking screen shows nothing while a customer waits.',
          }}
        >
          {(rows) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rows.map((f) => (
                <div
                  key={f.id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '9px 11px', borderRadius: 'var(--r-ctrl)',
                    border: '1px solid var(--line)',
                    opacity: f.isActive ? 1 : 0.7,
                  }}
                >
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--text-2)' }}>
                    {f.text}
                  </span>
                  {!f.isActive && <Pill status="paused" />}
                </div>
              ))}
            </div>
          )}
        </CollectionCard>
      </div>

      <CollectionCard
        title="Shared carts"
        source={sharedCarts}
        empty={{
          heading: 'Nobody is shopping together',
          line: 'Shared carts appear here while they are open.',
        }}
      >
        {(rows) => (
          <DataTable
            columns={cartColumns}
            rows={rows}
            rowKey={(c) => c.id}
            minWidth={560}
          />
        )}
      </CollectionCard>
    </div>
  );
}
