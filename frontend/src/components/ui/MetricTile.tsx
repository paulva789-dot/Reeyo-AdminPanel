import Sparkline from '../charts/Sparkline';

interface MetricTileProps {
  label: string;
  value: string;
  /** Positive numbers read as up, negative as down, 0 as flat. */
  delta?: number;
  deltaSuffix?: string;
  note?: string;
  series?: number[];
  seriesColour?: string;
  /** When lower is better (delivery time, cancel rate) a fall is good news. */
  invertDelta?: boolean;
  prefix?: string;
}

/** Section 5.3. */
export default function MetricTile({
  label, value, delta, deltaSuffix = '%', note, series,
  seriesColour = 'var(--emerald)', invertDelta = false, prefix,
}: MetricTileProps) {
  const good = delta === undefined || delta === 0
    ? null
    : invertDelta ? delta < 0 : delta > 0;

  const chip = delta === undefined ? null : {
    bg: delta === 0 ? 'var(--olive)' : good ? 'var(--go-soft)' : 'var(--stop-soft)',
    fg: delta === 0 ? 'var(--forest)' : good ? 'var(--go)' : 'var(--stop)',
    text: `${delta > 0 ? '+' : ''}${delta}${deltaSuffix}`,
  };

  return (
    <div
      style={{
        position: 'relative', overflow: 'hidden',
        background: 'var(--card)', border: '1px solid var(--line)',
        borderRadius: 'var(--r-card)', boxShadow: 'var(--shadow)',
        padding: 16, minWidth: 0,
      }}
    >
      <div className="eyebrow" style={{ fontSize: 9.5, marginBottom: 8 }}>{label}</div>

      <div
        className="mono"
        style={{
          fontSize: 27, fontWeight: 600, letterSpacing: '-0.03em',
          color: 'var(--forest)', lineHeight: 1.1,
          display: 'flex', alignItems: 'baseline', gap: 5,
        }}
      >
        {prefix && (
          <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>
            {prefix}
          </span>
        )}
        {value}
      </div>

      {(chip || note) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9 }}>
          {chip && (
            <span
              className="mono"
              style={{
                background: chip.bg, color: chip.fg,
                borderRadius: 'var(--r-pill)', padding: '2px 8px',
                fontSize: 11, fontWeight: 600,
              }}
            >
              {chip.text}
            </span>
          )}
          {note && (
            <span style={{ fontSize: 11.5, color: 'var(--text-2)' }}>{note}</span>
          )}
        </div>
      )}

      {series && (
        <div style={{ position: 'absolute', right: 0, bottom: 0, pointerEvents: 'none' }}>
          <Sparkline data={series} colour={seriesColour} />
        </div>
      )}
    </div>
  );
}

/** The auto-fit grid from section 5.3, reused wherever a metric row appears. */
export function MetricRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(214px, 1fr))',
        gap: 14,
      }}
    >
      {children}
    </div>
  );
}
