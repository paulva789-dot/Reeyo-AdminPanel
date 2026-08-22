export interface Segment {
  value: string;
  label: string;
  count?: number;
}

interface SegmentsProps {
  segments: Segment[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}

/** Segmented control. Active label uses --emerald-ink, never --emerald (rule 3.1). */
export default function Segments({ segments, value, onChange, ariaLabel }: SegmentsProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      style={{
        display: 'inline-flex', gap: 2, padding: 3, flexWrap: 'wrap',
        background: 'var(--calm-soft)', borderRadius: 'var(--r-pill)',
      }}
    >
      {segments.map((s) => {
        const active = s.value === value;
        return (
          <button
            key={s.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(s.value)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              height: 30, padding: '0 14px',
              borderRadius: 'var(--r-pill)', border: 'none',
              background: active ? 'var(--card)' : 'transparent',
              color: active ? 'var(--emerald-ink)' : 'var(--text-2)',
              fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
              boxShadow: active ? '0 1px 2px rgba(6,56,49,.10)' : 'none',
            }}
          >
            {s.label}
            {s.count !== undefined && (
              <span
                className="mono"
                style={{
                  fontSize: 10.5,
                  color: active ? 'var(--emerald-ink)' : 'var(--text-3)',
                }}
              >
                {s.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
