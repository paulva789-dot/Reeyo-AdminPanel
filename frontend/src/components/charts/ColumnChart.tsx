interface ColumnChartProps {
  data: number[];
  labels?: string[];
  colour?: string;
  height?: number;
  /**
   * Print each bar's value above it (section 9.1). Off by default: on a
   * thirty-bar series the numbers collide into a grey smear and the chart is
   * harder to read than it was without them, so the caller decides.
   */
  showValues?: boolean;
  format?: (v: number) => string;
}

/**
 * Section 9 — 3px gap, 3px top radius, opacity scaled 0.45 -> 1 by value.
 * Only first, middle and last labels printed.
 */
export default function ColumnChart({
  data, labels, colour = 'var(--forest-400)', height = 168,
  showValues, format = (v) => String(v),
}: ColumnChartProps) {
  // Values are printed when asked for, and also whenever the series is short
  // enough that they will not collide.
  const withValues = showValues ?? data.length <= 12;
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
            title={format(v)}
            style={{
              flex: 1, minWidth: 0, height: '100%',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            }}
          >
            {withValues && (
              <span
                className="mono"
                style={{
                  fontSize: 9.5, color: 'var(--text-2)', textAlign: 'center',
                  marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden',
                }}
              >
                {format(v)}
              </span>
            )}
            <div
              style={{
                height: `${Math.max(4, ((v - min) / span) * 88 + 12)}%`,
                background: colour,
                // Opacity carries magnitude so the eye finds the peak without axes
                opacity: 0.45 + ((v - min) / span) * 0.55,
                borderRadius: '3px 3px 0 0',
              }}
            />
          </div>
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
