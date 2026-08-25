import Pill from '../../components/ui/Pill';
import BarList from '../../components/charts/BarList';
import { CollectionCard, Stat } from './shared';
import type { EngagementState } from '../../state/useEngagement';

/**
 * Loyalty rules and rewards.
 *
 * Both are read-only here on purpose. The API takes POST and DELETE but no
 * PATCH on a rule, so "editing" one would mean silently deleting and recreating
 * it under a new id — and any customer balance keyed to the old id would go
 * with it. Creating and retiring them is a decision for the loyalty owner, not
 * something to make one click deep in an admin console.
 */
export default function LoyaltyPanel({ engagement }: { engagement: EngagementState }) {
  const { loyaltyRules, loyaltyRewards } = engagement;

  const active = loyaltyRules.rows.filter((r) => r.isActive);
  const bestRate = active.reduce((max, r) => Math.max(max, r.pointsPerOrder), 0);

  return (
    <>
      <p
        role="note"
        style={{
          margin: '0 0 14px', fontSize: 12.5, lineHeight: 1.5,
          color: 'var(--text-2)',
        }}
      >
        These read live from <span className="mono">/engagement/loyalty</span>.
        They are not editable here: the API offers no PATCH on a rule, so an
        edit would mean deleting and recreating it under a new id, taking every
        balance keyed to the old one with it.
      </p>

      <div className="reeyo-split-even">
        <CollectionCard
          title="Earning rules"
          action={<Stat label="best rate" value={bestRate ? `${bestRate} pts` : '—'} />}
          source={loyaltyRules}
          empty={{
            heading: 'No earning rules',
            line: 'Customers collect no points on their orders.',
          }}
        >
          {(rows) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {rows.map((r) => (
                <div
                  key={r.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                    border: '1px solid var(--line)', borderRadius: 'var(--r-card)',
                    opacity: r.isActive ? 1 : 0.7,
                  }}
                >
                  <span style={{ flex: 1, fontSize: 12.5, minWidth: 0 }}>{r.name}</span>
                  <span
                    className="mono"
                    style={{ fontSize: 12.5, color: 'var(--forest)', fontWeight: 700 }}
                  >
                    {r.pointsPerOrder} pts
                  </span>
                  <Pill status={r.isActive ? 'active' : 'paused'} />
                </div>
              ))}
            </div>
          )}
        </CollectionCard>

        <CollectionCard
          title="Rewards"
          source={loyaltyRewards}
          empty={{
            heading: 'Nothing to spend points on',
            line: 'Points accumulate with no way for a customer to use them.',
          }}
        >
          {(rows) => (
            <>
              <BarList
                items={rows.map((r) => ({
                  label: r.name,
                  value: r.pointsCost,
                  token: r.isActive ? 'go' : 'calm',
                }))}
                format={(v) => `${v.toLocaleString('fr-FR')} pts`}
              />
              {rows.some((r) => !r.isActive) && (
                <p style={{ margin: '12px 0 0', fontSize: 11.5, color: 'var(--text-3)' }}>
                  Muted bars are rewards a customer cannot currently redeem.
                </p>
              )}
            </>
          )}
        </CollectionCard>
      </div>
    </>
  );
}
