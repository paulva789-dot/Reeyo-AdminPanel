interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}

/** Section 5.7 — 40 x 22 track, 16px knob with 3px inset, 200ms. */
export default function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      style={{
        width: 40, height: 22, flexShrink: 0,
        borderRadius: 'var(--r-pill)', border: 'none', padding: 0,
        background: checked ? 'var(--emerald)' : 'var(--toggle-off)',
        position: 'relative', cursor: 'pointer',
        transition: 'background 200ms',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute', top: 3, left: checked ? 21 : 3,
          width: 16, height: 16, borderRadius: '50%', background: 'var(--on-brand)',
          transition: 'left 200ms',
          boxShadow: '0 1px 2px rgba(6,56,49,.28)',
        }}
      />
    </button>
  );
}
