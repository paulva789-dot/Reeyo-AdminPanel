import type { Order, OrderStatus } from '../../data/types';
import { padCount } from '../../lib/format';

export type Stage =
  | 'new' | 'accepted' | 'preparing' | 'ready' | 'on the way' | 'delivered' | 'problem';

interface StageDef {
  key: Stage;
  label: string;
  token: string;
}

const STAGES: StageDef[] = [
  { key: 'new', label: 'New', token: 'parcel' },
  { key: 'accepted', label: 'Accepted', token: 'parcel' },
  { key: 'preparing', label: 'Preparing', token: 'watch' },
  { key: 'ready', label: 'Ready', token: 'watch' },
  { key: 'on the way', label: 'On the way', token: 'go' },
  { key: 'delivered', label: 'Delivered', token: 'go' },
  { key: 'problem', label: 'Problem', token: 'stop' },
];

/** Problem folds delayed and cancelled together — section 8.1a. */
export function matchesStage(order: Order, stage: Stage): boolean {
  if (stage === 'problem') return order.status === 'delayed' || order.status === 'cancelled';
  return order.status === (stage as OrderStatus);
}

export function countForStage(orders: Order[], stage: Stage): number {
  return orders.filter((o) => matchesStage(o, stage)).length;
}

interface OrderFlowRailProps {
  orders: Order[];
  selected: Stage | null;
  onSelect: (stage: Stage | null) => void;
}

export default function OrderFlowRail({ orders, selected, onSelect }: OrderFlowRailProps) {
  const counts = STAGES.map((s) => countForStage(orders, s.key));
  const peak = Math.max(...counts, 1);

  return (
    <section
      style={{
        position: 'relative', overflow: 'hidden',
        borderRadius: 'var(--r-card)',
        background: 'linear-gradient(180deg, var(--forest) 0%, var(--forest-900) 100%)',
        padding: '15px 18px 17px',
      }}
    >
      {/* Radial emerald glow, top left */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', top: -90, left: -60, width: 320, height: 220,
          background: 'radial-gradient(circle, rgba(0,191,99,.30) 0%, transparent 62%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative', display: 'flex', alignItems: 'center',
          gap: 10, marginBottom: 14, flexWrap: 'wrap',
        }}
      >
        <h2
          style={{
            margin: 0, fontSize: 14, fontWeight: 800,
            letterSpacing: '-0.02em', color: 'var(--on-brand)',
          }}
        >
          Order flow
        </h2>
        <span
          className="eyebrow"
          style={{ color: 'var(--mint)', display: 'inline-flex', alignItems: 'center', gap: 5 }}
        >
          <span
            aria-hidden="true"
            className="reeyo-pulse"
            style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--emerald)', display: 'inline-block',
            }}
          />
          Live
        </span>
        <div style={{ flex: 1 }} />
        {selected && (
          <button
            onClick={() => onSelect(null)}
            style={{
              background: 'var(--dark-line)', border: 'none', color: 'var(--on-brand)',
              borderRadius: 'var(--r-pill)', padding: '4px 12px',
              fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Clear filter
          </button>
        )}
      </div>

      <div
        className="reeyo-flow-grid"
        style={{ position: 'relative', display: 'grid', gap: 10 }}
      >
        {STAGES.map((stage, i) => {
          const count = counts[i];
          const dimmed = selected !== null && selected !== stage.key;
          const isActive = selected === stage.key;

          return (
            <button
              key={stage.key}
              onClick={() => onSelect(isActive ? null : stage.key)}
              aria-pressed={isActive}
              style={{
                textAlign: 'left', border: 'none', cursor: 'pointer',
                background: isActive ? 'var(--dark-fill)' : 'transparent',
                borderRadius: 'var(--r-ctrl)',
                padding: '7px 9px',
                opacity: dimmed ? 0.38 : 1,
                transition: 'opacity 200ms, background 200ms',
                minWidth: 0,
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 23, fontWeight: 600, color: 'var(--on-brand)',
                  letterSpacing: '-0.03em', lineHeight: 1.1,
                }}
              >
                {padCount(count)}
              </div>
              <div
                style={{
                  fontSize: 11, color: 'var(--on-dark-1)', marginTop: 2,
                  marginBottom: 8, whiteSpace: 'nowrap',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                }}
              >
                {stage.label}
              </div>
              <div
                style={{
                  height: 3, borderRadius: 'var(--r-pill)',
                  background: 'var(--dark-fill-2)', overflow: 'hidden',
                }}
              >
                <div
                  className="reeyo-flow-track"
                  style={{
                    height: '100%', borderRadius: 'var(--r-pill)',
                    background: `var(--${stage.token})`,
                    // Animates left to right on load, 60ms stagger
                    width: `${(count / peak) * 100}%`,
                    animationDelay: `${i * 60}ms`,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
