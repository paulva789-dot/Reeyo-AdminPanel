import { useAppState } from '../../state/AppState';

/**
 * Marks a section the admin-api has no route for (see services/endpoints.ts).
 * These screens run on local data whether or not you are signed in, so while
 * the rest of the console is live they must say that they are not — otherwise
 * seed rows read as real platform state.
 *
 * In sample mode the page-level banner already says everything is sample, so
 * this stays out of the way.
 */
export default function LocalOnly({ what }: { what: string }) {
  const { isSample } = useAppState();
  if (isSample) return null;

  return (
    <p
      role="note"
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        margin: '0 0 14px', padding: '9px 13px',
        background: 'var(--calm-soft)', color: 'var(--text-2)',
        border: '1px solid var(--line)', borderRadius: 'var(--r-ctrl)',
        fontSize: 12.5,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--calm)', flexShrink: 0,
        }}
      />
      <span>
        {what} has no endpoint on the admin API yet, so this runs on local data
        and nothing you change here is saved.
      </span>
    </p>
  );
}
