import { useState } from 'react';
import Card from '../../components/ui/Card';
import Toggle from '../../components/ui/Toggle';
import Segments from '../../components/ui/Segments';
import BarList from '../../components/charts/BarList';
import EmptyState from '../../components/ui/EmptyState';
import { WriteGate } from './shared';
import type { EngagementState } from '../../state/useEngagement';
import type { SpinWheel } from '../../data/types';

/** Reward types map onto the service palette so a slice's colour means something. */
const REWARD_TOKEN: Record<string, string> = {
  DELIVERY: 'parcel',
  DISCOUNT: 'food',
  POINTS: 'grocery',
  NONE: 'calm',
};

function tokenFor(rewardType: string): string {
  return REWARD_TOKEN[rewardType.toUpperCase()] ?? 'calm';
}

/** Hand-drawn SVG wheel — each slice sized by its weight (section 8.8). */
function Wheel({ wheel }: { wheel: SpinWheel }) {
  const total = wheel.segments.reduce((s, seg) => s + seg.weight, 0);
  const size = 236;
  const r = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;

  if (total === 0) {
    return (
      <EmptyState
        heading="Every slice weighs nothing"
        line="With no weights the wheel cannot pick a prize, so it will never spin."
      />
    );
  }

  // Each slice's start angle is derived from the ones before it rather than by
  // mutating a running value while rendering.
  const slices = wheel.segments.reduce<
  { id: string; label: string; token: string; from: number; sweep: number }[]
  >((acc, seg) => {
    const sweep = (seg.weight / total) * Math.PI * 2;
    const from = acc.length
      ? acc[acc.length - 1].from + acc[acc.length - 1].sweep
      : -Math.PI / 2;
    return [...acc, { id: seg.id, label: seg.label, token: tokenFor(seg.rewardType), from, sweep }];
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <svg
        width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={wheel.segments
          .map((s) => `${s.label} ${Math.round((s.weight / total) * 100)}%`)
          .join(', ')}
      >
        {slices.map(({ id, token, from, sweep }) => {
          const to = from + sweep;
          const x1 = cx + r * Math.cos(from);
          const y1 = cy + r * Math.sin(from);
          const x2 = cx + r * Math.cos(to);
          const y2 = cy + r * Math.sin(to);
          const large = sweep > Math.PI ? 1 : 0;
          return (
            <path
              key={id}
              d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`}
              fill={`var(--${token})`}
              stroke="var(--card)"
              strokeWidth="2"
            />
          );
        })}
        <circle cx={cx} cy={cy} r="26" fill="var(--card)" stroke="var(--line)" strokeWidth="2" />
      </svg>
    </div>
  );
}

export default function SpinWheelPanel({ engagement }: { engagement: EngagementState }) {
  const { spinWheels, toggleSpinWheel } = engagement;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (spinWheels.loading) {
    return (
      <Card title="Spin wheels">
        <EmptyState heading="Loading…" line="Fetching the wheels from the platform." />
      </Card>
    );
  }

  if (spinWheels.rows.length === 0) {
    return (
      <Card title="Spin wheels">
        <EmptyState
          heading="No wheels"
          line="Customers have nothing to spin. Wheels are created by the engagement team."
        />
      </Card>
    );
  }

  const wheel = spinWheels.rows.find((w) => w.id === selectedId) ?? spinWheels.rows[0];
  const total = wheel.segments.reduce((s, seg) => s + seg.weight, 0);

  return (
    <>
      {spinWheels.error && (
        <p
          style={{
            margin: '0 0 14px', fontSize: 11.5, color: 'var(--stop)',
            background: 'var(--stop-soft)', padding: '9px 12px',
            borderRadius: 'var(--r-ctrl)',
          }}
        >
          {spinWheels.error} The wheel below is a sample, not what customers spin.
        </p>
      )}

      {spinWheels.rows.length > 1 && (
        <div style={{ marginBottom: 14 }}>
          <Segments
            ariaLabel="Choose a wheel"
            value={wheel.id}
            onChange={setSelectedId}
            segments={spinWheels.rows.map((w) => ({
              value: w.id,
              label: w.isActive ? w.name : `${w.name} (off)`,
            }))}
          />
        </div>
      )}

      <div className="reeyo-split-even">
        <Card
          title="Prize weights"
          action={(
            <WriteGate>
              <Toggle
                checked={wheel.isActive}
                onChange={() => toggleSpinWheel(wheel.id, !wheel.isActive)}
                label={`${wheel.name} live`}
              />
            </WriteGate>
          )}
        >
          {wheel.segments.length === 0 ? (
            <EmptyState
              heading="No slices"
              line="This wheel has no prizes on it yet, so there is nothing to win."
            />
          ) : (
            <>
              <BarList
                items={wheel.segments.map((s) => ({
                  label: s.label,
                  value: total ? Math.round((s.weight / total) * 1000) / 10 : 0,
                  token: tokenFor(s.rewardType),
                }))}
                format={(v) => `${v}%`}
              />
              <p style={{ margin: '13px 0 0', fontSize: 11.5, color: 'var(--text-3)' }}>
                Percentages are each slice's weight over {total}. Slices are set
                on <span className="mono">/engagement/spin-wheels/:id/segments</span>,
                which this screen reads but does not write.
              </p>
            </>
          )}
        </Card>

        <Card title={wheel.name}>
          <Wheel wheel={wheel} />
        </Card>
      </div>
    </>
  );
}
