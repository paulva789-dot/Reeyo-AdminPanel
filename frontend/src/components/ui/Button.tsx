import type { CSSProperties, ButtonHTMLAttributes } from 'react';

export type ButtonVariant =
  | 'primary' | 'command' | 'outline' | 'soft' | 'tag' | 'destructive';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

// Section 5.1. Height 36px, radius 999px, 13px/700 unless the variant says otherwise.
const BASE: CSSProperties = {
  height: 36,
  borderRadius: 'var(--r-pill)',
  fontSize: 13,
  fontWeight: 700,
  fontFamily: 'var(--sans)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  padding: '0 16px',
  cursor: 'pointer',
  border: '1px solid transparent',
  whiteSpace: 'nowrap',
  transition: 'filter 160ms, background 160ms',
};

const VARIANTS: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: 'var(--emerald)',
    color: 'var(--on-brand)',
  },
  command: {
    background: 'var(--forest)',
    color: 'var(--on-brand)',
  },
  outline: {
    background: 'transparent',
    border: '2px solid var(--emerald)',
    color: 'var(--forest)',
  },
  soft: {
    background: 'var(--pastel)',
    color: 'var(--forest)',
    height: 28,
    fontSize: 12,
    padding: '0 12px',
  },
  tag: {
    background: 'var(--olive)',
    color: 'var(--forest)',
    height: 22,
    fontSize: 11,
    padding: '0 10px',
    cursor: 'default',
  },
  destructive: {
    background: 'var(--on-brand)',
    border: '1px solid var(--destructive-line)',
    color: 'var(--stop)',
  },
};

export default function Button({
  variant = 'outline', children, style, disabled, ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled}
      style={{
        ...BASE,
        ...VARIANTS[variant],
        ...(disabled ? { opacity: 0.5, cursor: 'not-allowed' } : null),
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.filter = 'brightness(0.94)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.filter = 'none';
      }}
    >
      {children}
    </button>
  );
}
