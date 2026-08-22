export interface BarItem {
  label: string;
  value: number;
  token?: string;
  /** Overrides the token when a threshold decides the colour. */
  colour?: string;
}

interface BarListProps {
  items: BarItem[];
  format?: (v: number) => string;
}

/**
 * Section 9 — label left, mono figure right, 6px bar below at pill radius.
 * The bar takes the service or signal colour of what it measures.
 */
export default function BarList({ items, format = (v) => String(v) }: BarListProps) {
  const max = Math.max(...items.map((i) => i.value)) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
      {items.map((item) => (
        <div key={item.label}>
          <div
            style={{
              display: 'flex', alignItems: 'baseline',
              justifyContent: 'space-between', gap: 10, marginBottom: 5,
            }}
          >
            <span style={{ fontSize: 12.5, color: 'var(--text)', minWidth: 0 }}>
              {item.label}
            </span>
            <span
              className="mono"
              style={{ fontSize: 12, color: 'var(--text-2)', flexShrink: 0 }}
            >
              {format(item.value)}
            </span>
          </div>
          <div
            style={{
              height: 6, borderRadius: 'var(--r-pill)',
              background: 'var(--line-soft)', overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(item.value / max) * 100}%`,
                height: '100%', borderRadius: 'var(--r-pill)',
                background: item.colour ?? `var(--${item.token ?? 'calm'})`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
