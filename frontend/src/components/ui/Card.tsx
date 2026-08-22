import type { CSSProperties } from 'react';

interface CardProps {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
}

/** Section 5.2 — radius 14, 1px --line, --shadow, 15–16px padding. */
export default function Card({ title, action, children, style, bodyStyle }: CardProps) {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--r-card)',
        boxShadow: 'var(--shadow)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        ...style,
      }}
    >
      {(title || action) && (
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 12, padding: '13px 16px',
            borderBottom: '1px solid var(--line-soft)',
          }}
        >
          <h2
            style={{
              margin: 0, fontSize: 14, fontWeight: 800,
              letterSpacing: '-0.02em', color: 'var(--forest)',
            }}
          >
            {title}
          </h2>
          {action}
        </div>
      )}
      <div style={{ padding: 16, flex: 1, minWidth: 0, ...bodyStyle }}>{children}</div>
    </div>
  );
}
