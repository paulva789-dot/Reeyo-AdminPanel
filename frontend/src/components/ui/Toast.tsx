import { useAppState } from '../../state/useAppState';

function CheckIcon() {
  return (
    <svg
      width={15} height={15} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2.6} strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true"
    >
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  );
}

/** Section 5.7 — forest pill, white 13px/600, bottom centre, auto-dismiss 2.6s. */
export default function ToastHost() {
  const { toasts } = useAppState();

  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)',
        zIndex: 80, display: 'flex', flexDirection: 'column', gap: 8,
        alignItems: 'center', pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="reeyo-toast"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--forest)', color: 'var(--on-brand)',
            borderRadius: 'var(--r-pill)', padding: '9px 17px',
            fontSize: 13, fontWeight: 600,
            boxShadow: '0 14px 34px -14px rgba(6,56,49,.6)',
            maxWidth: '90vw',
          }}
        >
          <span style={{ color: 'var(--mint)', display: 'flex', flexShrink: 0 }}>
            <CheckIcon />
          </span>
          {t.message}
        </div>
      ))}
    </div>
  );
}
