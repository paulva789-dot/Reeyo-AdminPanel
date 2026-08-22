import { useState } from 'react';
import type { CSSProperties } from 'react';

const CONTROL: CSSProperties = {
  height: 38,
  width: '100%',
  borderRadius: 'var(--r-ctrl)',
  border: '1px solid var(--line)',
  background: 'var(--card)',
  color: 'var(--text)',
  fontFamily: 'var(--sans)',
  fontSize: 12.5,
  padding: '0 11px',
  outline: 'none',
};

const LABEL: CSSProperties = {
  display: 'block',
  fontSize: 11.5,
  fontWeight: 700,
  color: 'var(--text-2)',
  marginBottom: 6,
};

function useFocusRing() {
  const [focused, setFocused] = useState(false);
  return {
    focused,
    handlers: {
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
    },
    ring: focused
      ? { borderColor: 'var(--emerald)', boxShadow: '0 0 0 3px var(--focus-ring)' }
      : null,
  };
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  mono?: boolean;
  style?: CSSProperties;
}

/** Section 5.7 — 38px, 10px radius, emerald border + 3px ring on focus. */
export default function Field({
  label, value, onChange, placeholder, type = 'text', mono, style,
}: FieldProps) {
  const { handlers, ring } = useFocusRing();
  return (
    <label style={{ display: 'block', ...style }}>
      <span style={LABEL}>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        {...handlers}
        className={mono ? 'mono' : undefined}
        style={{ ...CONTROL, ...ring }}
      />
    </label>
  );
}

export function TextArea({
  label, value, onChange, placeholder, rows = 4,
}: Omit<FieldProps, 'type' | 'mono'> & { rows?: number }) {
  const { handlers, ring } = useFocusRing();
  return (
    <label style={{ display: 'block' }}>
      <span style={LABEL}>{label}</span>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        {...handlers}
        style={{ ...CONTROL, height: 'auto', padding: '9px 11px', resize: 'vertical', ...ring }}
      />
    </label>
  );
}

export function Select({
  label, value, onChange, options, compact,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; compact?: boolean;
}) {
  const { handlers, ring } = useFocusRing();
  const control = (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      {...handlers}
      style={{
        ...CONTROL,
        ...(compact ? { height: 30, fontSize: 12, padding: '0 7px' } : null),
        cursor: 'pointer',
        ...ring,
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );

  if (compact) return control;

  return (
    <label style={{ display: 'block' }}>
      <span style={LABEL}>{label}</span>
      {control}
    </label>
  );
}

/** Filter input used in table toolbars. */
export function FilterInput({
  value, onChange, placeholder = 'Filter',
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const { handlers, ring } = useFocusRing();
  return (
    <input
      type="search"
      value={value}
      placeholder={placeholder}
      aria-label={placeholder}
      onChange={(e) => onChange(e.target.value)}
      {...handlers}
      style={{
        ...CONTROL, width: 'auto', minWidth: 180, maxWidth: 240,
        background: 'var(--canvas)', ...ring,
      }}
    />
  );
}
