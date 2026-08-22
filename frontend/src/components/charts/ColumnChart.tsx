interface ColumnChartProps {
  data: number[];
  labels?: string[];
  colour?: string;
  height?: number;
}

/**
 * Section 9 — 3px gap, 3px top radius, opacity scaled 0.45 -> 1 by value.
 * Only first, middle and last labels printed.
 */
export default function ColumnChart({
  data, labels, colour = 'var(--forest-400)', height = 168,
}: ColumnChartProps) {
  const max = Math.max(...data) || 1;
  const min = Math.min(...data);
  const span = max - min || 1;
  const plot = labels ? height - 20 : height;

  const midIndex = Math.floor(data.length / 2);

  return (
    <div>
      <div
        style={{
          display: 'flex', alignItems: 'flex-end', gap: 3,
          height: plot,
        }}
        role="img"
        aria-label={`Column chart, ${data.length} points, peak ${max}`}
      >
        {data.map((v, i) => (
          <div
            key={i}
            title={String(v)}
            style={{
              flex: 1,
              minWidth: 0,
              height: `${Math.max(4, ((v - min) / span) * 88 + 12)}%`,
              background: colour,
              // Opacity carries magnitude so the eye finds the peak without axes
              opacity: 0.45 + ((v - min) / span) * 0.55,
              borderRadius: '3px 3px 0 0',
            }}
          />
        ))}
      </div>

      {labels && (
        <div
          className="mono"
          style={{
            display: 'flex', justifyContent: 'space-between',
            marginTop: 7, fontSize: 9.5, color: 'var(--text-3)',
          }}
        >
          <span>{labels[0]}</span>
          <span>{labels[midIndex]}</span>
          <span>{labels[labels.length - 1]}</span>
        </div>
      )}
    </div>
  );
}
