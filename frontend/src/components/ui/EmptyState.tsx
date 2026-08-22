interface EmptyStateProps {
  heading: string;
  line: string;
  action?: React.ReactNode;
}

/**
 * Section 5.7 — says what is not there, then the consequence, then one action.
 * Never an illustration, never "oops", never an exclamation mark.
 */
export default function EmptyState({ heading, line, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 7, padding: '46px 20px', textAlign: 'center',
      }}
    >
      <p
        style={{
          margin: 0, fontSize: 14.5, fontWeight: 800,
          letterSpacing: '-0.02em', color: 'var(--forest)',
        }}
      >
        {heading}
      </p>
      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-2)', maxWidth: 380 }}>
        {line}
      </p>
      {action && <div style={{ marginTop: 7 }}>{action}</div>}
    </div>
  );
}
