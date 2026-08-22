import { riders, riderPositions } from '../../data/seed';

const STATE_TOKEN: Record<string, string> = {
  'on a delivery': 'emerald',
  idle: 'olive',
  'running late': 'stop',
};

const LEGEND = [
  { state: 'on a delivery', label: 'On a delivery' },
  { state: 'idle', label: 'Idle' },
  { state: 'running late', label: 'Running late' },
];

/** Section 8.3 — dark forest panel, SVG grid, three roads, halo'd rider dots. */
export default function RiderMap() {
  return (
    <div>
      <div
        style={{
          position: 'relative', height: 340, overflow: 'hidden',
          borderRadius: 'var(--r-card)',
          background: 'linear-gradient(180deg, var(--forest) 0%, var(--forest-900) 100%)',
        }}
      >
        <svg
          width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0 }}
          aria-hidden="true"
        >
          <defs>
            <pattern id="reeyo-grid" width="6" height="6" patternUnits="userSpaceOnUse">
              <path d="M6 0H0V6" fill="none" stroke="var(--mint)" strokeOpacity="0.10" strokeWidth="0.3" />
            </pattern>
          </defs>
          <rect width="100" height="60" fill="url(#reeyo-grid)" />

          {/* Three road paths */}
          <path
            d="M-2 44 C 20 40, 34 26, 58 24 S 88 16, 104 12"
            fill="none" stroke="var(--mint)" strokeOpacity="0.24" strokeWidth="1.1"
          />
          <path
            d="M12 -2 C 16 18, 28 32, 40 62"
            fill="none" stroke="var(--mint)" strokeOpacity="0.18" strokeWidth="0.9"
          />
          <path
            d="M-2 18 C 26 22, 52 48, 104 46"
            fill="none" stroke="var(--mint)" strokeOpacity="0.18" strokeWidth="0.9"
          />
        </svg>

        {riderPositions.map((pos) => {
          const rider = riders.find((r) => r.id === pos.riderId);
          if (!rider) return null;
          const token = STATE_TOKEN[rider.state] ?? 'calm';
          return (
            <div
              key={pos.riderId}
              style={{
                position: 'absolute',
                left: `${pos.x}%`, top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}
            >
              <span
                className="mono"
                style={{
                  fontSize: 9, color: 'var(--on-dark-1)',
                  background: 'var(--dark-label)', borderRadius: 4, padding: '1px 4px',
                  whiteSpace: 'nowrap',
                }}
              >
                {rider.id}
              </span>
              <span
                title={`${rider.name} — ${rider.state}`}
                style={{
                  width: 11, height: 11, borderRadius: '50%',
                  background: `var(--${token})`,
                  boxShadow: `0 0 0 5px color-mix(in srgb, var(--${token}) 26%, transparent)`,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Legend — state never carried by colour alone */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
        {LEGEND.map((l) => (
          <span
            key={l.state}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: `var(--${STATE_TOKEN[l.state]})`,
              }}
            />
            <span style={{ color: 'var(--text-2)' }}>{l.label}</span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>
              {riders.filter((r) => r.state === l.state).length}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
