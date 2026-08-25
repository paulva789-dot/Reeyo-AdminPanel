import { useAuth } from '../../state/useAuth';
import EmptyState from './EmptyState';

interface SuperAdminOnlyProps {
  what: string;
  children: React.ReactNode;
}

/**
 * Hides a control the signed-in admin cannot use.
 *
 * These routes answer 403 for a plain admin, and a button that silently fails
 * is worse than one that is not there — it reads as the platform being broken
 * rather than as a permission the account does not hold. Saying which role is
 * needed also tells them who to ask.
 */
export default function SuperAdminOnly({ what, children }: SuperAdminOnlyProps) {
  const { isSuperAdmin, role } = useAuth();
  if (isSuperAdmin) return <>{children}</>;

  return (
    <EmptyState
      heading={`${what} needs a Super Admin`}
      line={`Your account is signed in as ${role || 'an admin'}, and the platform
        restricts this to Super Admins. Ask one to make the change, or to raise
        your role.`.replace(/\s+/g, ' ')}
    />
  );
}

/** The inline form, for a single control rather than a whole panel. */
export function SuperAdminBadge() {
  const { isSuperAdmin } = useAuth();
  if (isSuperAdmin) return null;

  return (
    <span
      className="mono"
      style={{
        fontSize: 10, padding: '2px 7px', borderRadius: 'var(--r-pill)',
        background: 'var(--calm-soft)', color: 'var(--text-2)',
        whiteSpace: 'nowrap',
      }}
    >
      super admin only
    </span>
  );
}
