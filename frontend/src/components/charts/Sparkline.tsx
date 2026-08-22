import { useId } from 'react';

interface SparklineProps {
  data: number[];
  colour?: string;
  width?: number;
  height?: number;
}

/**
 * Section 9 — 104 x 34, 1.6px stroke, gradient area fill 18% -> 0%.
 * No axes, no labels, no tooltip.
 */
export default function Sparkline({
  data, colour = 'var(--emerald)', width = 104, height = 34,
}: SparklineProps) {
  // Per-instance id: deriving it from the data let two sparklines with the same
  // sum and length collide, so one would borrow the other's gradient.
  const gradientId = `spark${useId().replace(/:/g, '')}`;

  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stepX = width / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * stepX;
    // 2px inset top and bottom so the stroke is never clipped
    const y = height - 2 - ((v - min) / span) * (height - 4);
    return [x, y] as const;
  });

  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;

  return (
    <svg
      width={width} height={height} viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true" focusable="false" style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colour} stopOpacity="0.18" />
          <stop offset="100%" stopColor={colour} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line} fill="none" stroke={colour} strokeWidth={1.6}
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}
