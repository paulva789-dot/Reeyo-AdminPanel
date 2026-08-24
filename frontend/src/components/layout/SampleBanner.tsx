import { useAuth } from '../../state/useAuth';
import { useAppState } from '../../state/useAppState';

/**
 * Says plainly when what is on screen is not live. Shown for the whole session
 * in sample mode, and per-session when a live load failed back onto seed rows.
 * The console should never look connected when it is not.
 */
export default function SampleBanner() {
  const { isSample, logout } = useAuth();
  const {
    ordersState, vendorsState, ridersState, customersState,
    paymentsState, payoutsState, reload,
  } = useAppState();

  // Any collection can fail on its own, so the banner watches all of them
  // rather than assuming orders speaks for the rest.
  const failures = [
    ordersState, vendorsState, ridersState,
    customersState, paymentsState, payoutsState,
  ].filter((s) => s.error !== null);

  const liveLoadFailed = !isSample && failures.length > 0;
  if (!isSample && !liveLoadFailed) return null;

  const message = isSample
    ? 'Sample data. Nothing here is live and no change is saved.'
    : failures.length === 1
      ? `Showing sample data — ${failures[0].error}`
      : `Showing sample data for ${failures.length} sections — ${failures[0].error}`;

  return (
    <div
      role="status"
      style={{
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        background: 'var(--watch-soft)', color: 'var(--watch)',
        border: '1px solid var(--olive)',
        borderRadius: 'var(--r-ctrl)',
        padding: '9px 13px', marginBottom: 14,
        fontSize: 12.5, fontWeight: 600,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'currentColor', flexShrink: 0,
        }}
      />
      <span style={{ flex: 1, minWidth: 0 }}>{message}</span>
      <button
        onClick={isSample ? logout : reload}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--forest)', fontSize: 12, fontWeight: 700,
          textDecoration: 'underline', padding: 0,
        }}
      >
        {isSample ? 'Sign in for real data' : 'Try again'}
      </button>
    </div>
  );
}
