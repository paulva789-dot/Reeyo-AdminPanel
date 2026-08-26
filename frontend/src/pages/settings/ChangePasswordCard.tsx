import { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Field from '../../components/ui/Field';
import { platform } from '../../services/platformResources';
import { ApiError } from '../../services/apiClient';
import { useAuth } from '../../state/useAuth';
import { useAppState } from '../../state/useAppState';

/** Short enough to be memorable, long enough not to be guessed. */
const MIN_LENGTH = 8;

/**
 * `POST /auth/change-password`. Open to any admin — it only ever changes the
 * account making the request, which is why it needs the current password and
 * why there is no field to name someone else.
 */
export default function ChangePasswordCard() {
  const { mode, admin } = useAuth();
  const { pushToast } = useAppState();
  const isLive = mode === 'live';

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const clear = () => {
    setCurrent('');
    setNext('');
    setConfirm('');
  };

  const submit = async () => {
    if (!current) {
      setError('Enter your current password');
      return;
    }
    if (next.length < MIN_LENGTH) {
      setError(`The new password needs at least ${MIN_LENGTH} characters`);
      return;
    }
    if (next === current) {
      setError('The new password has to differ from the current one');
      return;
    }
    if (next !== confirm) {
      setError('The two new passwords do not match');
      return;
    }

    setError('');
    setBusy(true);
    try {
      await platform.changePassword(current, next);
      pushToast('Password changed');
      clear();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (err.status === 401
            ? 'That is not your current password.'
            : `The password was not changed — ${err.message}`)
          : 'The password was not changed.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Your password">
      <p style={{ margin: '0 0 13px', fontSize: 12, color: 'var(--text-2)' }}>
        Changes the password for {admin?.email ?? 'the account you are signed in as'},
        and nobody else. You stay signed in on this device.
      </p>

      <div
        style={{
          display: 'grid', gap: 13,
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        }}
      >
        <Field
          label="Current password"
          value={current}
          onChange={(v) => { setCurrent(v); setError(''); }}
          type="password"
        />
        <Field
          label="New password"
          value={next}
          onChange={(v) => { setNext(v); setError(''); }}
          type="password"
        />
        <Field
          label="New password again"
          value={confirm}
          onChange={(v) => { setConfirm(v); setError(''); }}
          type="password"
        />
      </div>

      {error && (
        <p style={{ margin: '11px 0 0', fontSize: 12, color: 'var(--stop)' }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <div style={{ flex: 1 }} />
        <Button
          variant="outline"
          disabled={busy || (!current && !next && !confirm)}
          onClick={() => { clear(); setError(''); }}
        >
          Clear
        </Button>
        <Button
          variant="primary"
          disabled={busy || !isLive}
          title={isLive ? undefined : 'Changing a password needs a live session'}
          onClick={() => void submit()}
        >
          {busy ? 'Changing…' : 'Change password'}
        </Button>
      </div>

      {!isLive && (
        <p style={{ margin: '9px 0 0', fontSize: 11, color: 'var(--text-3)' }}>
          Sample mode has no account to change. Sign in against the live API first.
        </p>
      )}
    </Card>
  );
}
