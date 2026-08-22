export interface DonutSlice {
  label: string;
  value: number;
  token: string;
}

interface DonutProps {
  slices: DonutSlice[];
  format?: (v: number) => string;
  size?: number;
}

/**
 * Section 9 — 15px stroke, 2px white gap between slices, legend right with
 * mono values. Max five slices; a sixth becomes "Other".
 */
export default function Donut({ slices, format = (v) => String(v), size = 152 }: DonutProps) {
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

  let offset = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
      <svg
        width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        style={{ flexShrink: 0 }}
        role="img"
        aria-label={capped.map((s) => `${s.label} ${format(s.value)}`).join(', ')}
      >
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {capped.map((s) => {
            const length = (s.value / total) * circumference;
            const dash = Math.max(0, length - GAP);
            const el = (
              <circle
                key={s.label}
                cx={size / 2} cy={size / 2} r={radius}
                fill="none"
                stroke={`var(--${s.token})`}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += length;
            return el;
          })}
        </g>
      </svg>

      {/* Legend — required so the chart never carries meaning by colour alone */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0 }}>
        {capped.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              aria-hidden="true"
              style={{
                width: 9, height: 9, borderRadius: 3, flexShrink: 0,
                background: `var(--${s.token})`,
              }}
            />
            <span style={{ fontSize: 12.5, color: 'var(--text)', flex: 1 }}>
              {s.label}
            </span>
            <span className="mono" style={{ fontSize: 11.5, color: 'var(--text-2)' }}>
              {format(s.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
