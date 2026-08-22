import { statusToken } from '../../lib/format';

interface PillProps {
  status: string;
  /** Override the derived token when the label is not itself a status word. */
  token?: string;
}

const FILL: Record<string, { bg: string; fg: string }> = {
  go: { bg: 'var(--go-soft)', fg: 'var(--go)' },
  watch: { bg: 'var(--watch-soft)', fg: 'var(--watch)' },
  stop: { bg: 'var(--stop-soft)', fg: 'var(--stop)' },
  calm: { bg: 'var(--calm-soft)', fg: 'var(--calm)' },
  parcel: { bg: 'var(--parcel-soft)', fg: 'var(--parcel)' },
  food: { bg: 'var(--food-soft)', fg: 'var(--food)' },
  grocery: { bg: 'var(--grocery-soft)', fg: 'var(--grocery)' },
};

/**
 * Section 5.5 — lowercase, 11px/700, leading dot inheriting the text colour.
 * Word plus dot, so state is never carried by colour alone (section 11).
 */
export default function Pill({ status, token }: PillProps) {
  const key = token ?? statusToken(status);
  const fill = FILL[key] ?? FILL.calm;

  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: fill.bg, color: fill.fg,
        borderRadius: 'var(--r-pill)',
        padding: '3px 9px',
        fontSize: 11, fontWeight: 700,
        textTransform: 'lowercase',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 5, height: 5, borderRadius: '50%',
          background: 'currentColor', flexShrink: 0,
        }}
      />
      {status}
    </span>
  );
}
