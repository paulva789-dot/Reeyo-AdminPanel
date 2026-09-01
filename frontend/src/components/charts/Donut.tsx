export interface DonutSlice {
  label: string;
  value: number;
  token: string;
}

interface DonutProps {
  slices: DonutSlice[];
  format?: (v: number) => string;
  size?: number;
  /** Printed in the middle of the ring — section 9.2's service wheel. */
  centreLabel?: string;
  centreValue?: string;
  /** Makes a segment clickable, for filtering the dashboard below it. */
  onSelect?: (label: string) => void;
  selected?: string | null;
}

/**
 * Section 9 — 15px stroke, 2px white gap between slices, legend right with
 * mono values. Max five slices; a sixth becomes "Other".
 */
export default function Donut({
  slices, format = (v) => String(v), size = 152,
  centreLabel, centreValue, onSelect, selected = null,
}: DonutProps) {
  const capped = slices.length > 5
    ? [
      ...slices.slice(0, 4),
      {
        label: 'Other',
        value: slices.slice(4).reduce((sum, s) => sum + s.value, 0),
        token: 'calm',
      },
    ]
    : slices;

  const total = capped.reduce((sum, s) => sum + s.value, 0) || 1;
  const stroke = 15;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const GAP = 2; // px of white between slices

  // Offsets are precomputed: mutating a running total during render breaks
  // under a double-invoked render and the rule that render stays pure.
  const arcs = capped.reduce<{ slice: DonutSlice; length: number; offset: number }[]>(
    (acc, slice) => {
      const length = (slice.value / total) * circumference;
      const offset = acc.length ? acc[acc.length - 1].offset + acc[acc.length - 1].length : 0;
      return [...acc, { slice, length, offset }];
    },
    [],
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
      <svg
        width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        style={{ flexShrink: 0 }}
        role="img"
        aria-label={capped.map((s) => `${s.label} ${format(s.value)}`).join(', ')}
      >
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {arcs.map(({ slice, length, offset }) => {
            const dash = Math.max(0, length - GAP);
            return (
              <circle
                key={slice.label}
                cx={size / 2} cy={size / 2} r={radius}
                fill="none"
                stroke={`var(--${slice.token})`}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              />
            );
          })}
        </g>

        {/* Section 9.2 — the total across every slice, in the middle. */}
        {(centreValue || centreLabel) && (
          <>
            {centreValue && (
              <text
                x={size / 2} y={size / 2 - (centreLabel ? 1 : -5)}
                textAnchor="middle"
                className="mono"
                style={{
                  fontSize: 22, fontWeight: 700, fill: 'var(--forest)',
                  letterSpacing: '-0.03em',
                }}
              >
                {centreValue}
              </text>
            )}
            {centreLabel && (
              <text
                x={size / 2} y={size / 2 + 16}
                textAnchor="middle"
                style={{
                  fontSize: 9.5, fill: 'var(--text-3)', letterSpacing: '0.12em',
                  textTransform: 'uppercase', fontFamily: 'var(--mono)',
                }}
              >
                {centreLabel}
              </text>
            )}
          </>
        )}
      </svg>

      {/* Legend — required so the chart never carries meaning by colour alone.
          Section 9.1 asks each segment to carry its count AND its share, so the
          percentage sits beside the value rather than only in a tooltip. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0 }}>
        {capped.map((s) => {
          const share = Math.round((s.value / total) * 1000) / 10;
          const dimmed = selected !== null && selected !== s.label;
          const row = (
            <>
              <span
                aria-hidden="true"
                style={{
                  width: 9, height: 9, borderRadius: 3, flexShrink: 0,
                  background: `var(--${s.token})`,
                }}
              />
              <span style={{ fontSize: 12.5, color: 'var(--text)', flex: 1, textAlign: 'left' }}>
                {s.label}
              </span>
              <span className="mono" style={{ fontSize: 11.5, color: 'var(--text-2)' }}>
                {format(s.value)}
              </span>
              <span
                className="mono"
                style={{ fontSize: 11, color: 'var(--text-3)', width: 42, textAlign: 'right' }}
              >
                {share}%
              </span>
            </>
          );

          if (!onSelect) {
            return (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {row}
              </div>
            );
          }

          return (
            <button
              key={s.label}
              onClick={() => onSelect(s.label)}
              aria-pressed={selected === s.label}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '3px 6px', margin: '-3px -6px',
                border: 'none', borderRadius: 'var(--r-ctrl)', cursor: 'pointer',
                background: selected === s.label ? 'var(--go-soft)' : 'transparent',
                opacity: dimmed ? 0.45 : 1,
                fontFamily: 'var(--sans)',
              }}
            >
              {row}
            </button>
          );
        })}
      </div>
    </div>
  );
}
