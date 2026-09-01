import { useState } from 'react';
import { useT } from '../../i18n/useT';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Pill from '../../components/ui/Pill';
import DataTable from '../../components/ui/DataTable';
import type { Column } from '../../components/ui/DataTable';
import Field, { Select } from '../../components/ui/Field';
import EmptyState from '../../components/ui/EmptyState';
import { Modal, FooterSpacer } from '../../components/ui/Overlay';
import { useAuth } from '../../state/useAuth';
import { initials } from '../../lib/format';
import type { PlatformAdminState } from '../../state/usePlatformAdmin';
import type { AdminUser, AdminRole } from '../../data/types';

const ROLES: { value: AdminRole; label: string }[] = [
  { value: 'ADMIN', label: 'Admin — day-to-day operations' },
  { value: 'SUPER_ADMIN', label: 'Super Admin — configuration and other admins' },
];

function InviteModal({
  onInvite, onClose,
}: {
  onInvite: (email: string, name: string, role: AdminRole) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminRole>('ADMIN');
  const [error, setError] = useState('');

  return (
    <Modal
      title="Invite an admin"
      onClose={onClose}
      width={460}
      footer={(
        <>
          <FooterSpacer />
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!name.trim()) {
                setError('Give the account a name, so the team knows whose it is');
                return;
              }
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
                setError('That does not look like an email address');
                return;
              }
              onInvite(email.trim(), name.trim(), role);
            }}
          >
            Send invite
          </Button>
        </>
      )}
    >
      <Field
        label="Name"
        value={name}
        onChange={(v) => { setName(v); setError(''); }}
        placeholder="Sylvie Abena"
      />
      <div style={{ marginTop: 12 }}>
        <Field
          label="Email"
          value={email}
          onChange={(v) => { setEmail(v); setError(''); }}
          placeholder="sylvie@reeyo.cm"
          type="email"
          mono
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <Select
          label="Role"
          value={role}
          onChange={(v) => setRole(v as AdminRole)}
          options={ROLES}
        />
      </div>
      {role === 'SUPER_ADMIN' && (
        <p style={{ margin: '9px 0 0', fontSize: 11.5, color: 'var(--watch)' }}>
          A Super Admin can change commission, feature flags, API keys and other
          admin accounts — including yours.
        </p>
      )}
      {error && (
        <p style={{ margin: '9px 0 0', fontSize: 12, color: 'var(--stop)' }}>{error}</p>
      )}
    </Modal>
  );
}

/**
 * The admin accounts themselves, from `/admin-users`. The whole resource is
 * SuperAdmin — a plain admin cannot even read it, so rather than show a seeded
 * team that would read as the real one, the card says who can.
 */
export default function AdminUsersCard({ state }: { state: PlatformAdminState }) {
  const t = useT();
  const { isSuperAdmin, admin } = useAuth();
  const { admins, adminsError, createAdmin, updateAdmin, deleteAdmin } = state;
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<AdminUser | null>(null);

  const columns: Column<AdminUser>[] = [
    {
      key: 'name', header: t('Admin'),
      render: (a) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span
            aria-hidden="true"
            className="mono"
            style={{
              width: 28, height: 28, borderRadius: 'var(--r-pill)', flexShrink: 0,
              background: 'var(--calm-soft)', color: 'var(--text-2)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10,
            }}
          >
            {initials(a.name)}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>{a.name}</div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>
              {a.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'role', header: t('Role'),
      render: (a) => (
        <Pill
          status={a.role === 'SUPER_ADMIN' ? 'super admin' : 'admin'}
          token={a.role === 'SUPER_ADMIN' ? 'parcel' : 'calm'}
        />
      ),
    },
    {
      key: 'status', header: t('Status'),
      render: (a) => <Pill status={a.status === 'ACTIVE' ? 'active' : 'suspended'} />,
    },
    {
      key: 'seen', header: t('Last seen'), align: 'right',
      render: (a) => (
        <span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>
          {a.lastLogin ?? 'never'}
        </span>
      ),
    },
    {
      key: 'actions', header: '', align: 'right',
      render: (a) => {
        // Nothing here may be turned on yourself: locking your own account out,
        // or demoting yourself, would leave the console unusable with no way back.
        const isSelf = Boolean(admin?.email) && a.email === admin?.email;
        if (isSelf) {
          return <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>you</span>;
        }
        return (
          <div style={{ display: 'inline-flex', gap: 6 }}>
            <Button
              variant="soft"
              onClick={() => updateAdmin(a.id, {
                role: a.role === 'SUPER_ADMIN' ? 'ADMIN' : 'SUPER_ADMIN',
              })}
            >
              {a.role === 'SUPER_ADMIN' ? 'Make admin' : 'Make super'}
            </Button>
            <Button
              variant="outline"
              onClick={() => updateAdmin(a.id, {
                status: a.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
              })}
            >
              {a.status === 'ACTIVE' ? 'Suspend' : 'Reinstate'}
            </Button>
            <Button variant="destructive" onClick={() => setRemoving(a)}>Remove</Button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <Card
        title="Admin team"
        action={isSuperAdmin
          ? <Button variant="outline" onClick={() => setInviting(true)}>Invite admin</Button>
          : undefined}
      >
        {!isSuperAdmin ? (
          <EmptyState
            heading="Admin accounts need a Super Admin"
            line="The platform does not let a plain admin read or change who else has
              access. Ask a Super Admin if someone needs an account."
          />
        ) : adminsError ? (
          <EmptyState heading="Could not load the admin team" line={adminsError} />
        ) : admins.length === 0 ? (
          <EmptyState
            heading="No admin accounts"
            line="Nobody but you can sign in to this console."
          />
        ) : (
          <DataTable
            columns={columns}
            rows={admins}
            rowKey={(a) => a.id}
            minWidth={760}
          />
        )}
      </Card>

      {inviting && (
        <InviteModal
          onInvite={(e, n, r) => { createAdmin(e, n, r); setInviting(false); }}
          onClose={() => setInviting(false)}
        />
      )}

      {removing && (
        <Modal
          title="Remove this admin"
          subtitle={`${removing.name} · ${removing.email}`}
          onClose={() => setRemoving(null)}
          width={440}
          footer={(
            <>
              <FooterSpacer />
              <Button variant="outline" onClick={() => setRemoving(null)}>
                Keep the account
              </Button>
              <Button
                variant="destructive"
                onClick={() => { deleteAdmin(removing.id); setRemoving(null); }}
              >
                Remove admin
              </Button>
            </>
          )}
        >
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-2)' }}>
            They lose access immediately and the account cannot be restored from
            here. Suspending keeps it, and can be lifted.
          </p>
        </Modal>
      )}
    </>
  );
}
