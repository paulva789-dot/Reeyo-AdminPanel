import { useAppState } from '../../state/useAppState';

interface LocalOnlyProps {
  what: string;
  /**
   * The route that backs this feature, when one exists.
   *
   * Given, the notice says the data is real but this screen is not wired to it
   * yet. Omitted, it says admin-api has no route at all. Those are very
   * different claims and the console must not blur them: an earlier version
   * marked twelve features "no backend route" when the routes existed all
   * along, under paths that had simply not been probed.
   */
  endpoint?: string;
}

/**
 * Marks a section running on local data while the rest of the console is live,
 * so seed rows are never mistaken for real platform state.
 *
 * In sample mode the page-level banner already says everything is sample, so
 * this stays out of the way.
 */
export default function LocalOnly({ what, endpoint }: LocalOnlyProps) {
  const { isSample } = useAppState();
  if (isSample) return null;

  const pending = Boolean(endpoint);

  return (
    <p
      role="note"
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 8,
        margin: '0 0 14px', padding: '9px 13px',
        background: pending ? 'var(--watch-soft)' : 'var(--calm-soft)',
        color: pending ? 'var(--watch)' : 'var(--text-2)',
        border: `1px solid ${pending ? 'var(--olive)' : 'var(--line)'}`,
        borderRadius: 'var(--r-ctrl)',
        fontSize: 12.5, lineHeight: 1.5,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 6, height: 6, borderRadius: '50%', marginTop: 6,
          background: 'currentColor', flexShrink: 0,
        }}
      />
      {pending ? (
        <span>
          {what} is served by <span className="mono">{endpoint}</span>, but this
          screen is not wired to it yet, so it runs on local data and nothing you
          change here is saved.
        </span>
      ) : (
        <span>
          {what} has no endpoint on the admin API, so this runs on local data and
          nothing you change here is saved.
        </span>
      )}
    </p>
  );
}
