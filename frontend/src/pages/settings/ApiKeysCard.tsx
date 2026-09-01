import { useState } from 'react';
import { useT } from '../../i18n/useT';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Pill from '../../components/ui/Pill';
import DataTable from '../../components/ui/DataTable';
import type { Column } from '../../components/ui/DataTable';
import Field from '../../components/ui/Field';
import { Modal, FooterSpacer } from '../../components/ui/Overlay';
import SuperAdminOnly from '../../components/ui/SuperAdminOnly';
import { useAuth } from '../../state/useAuth';
import { useAppState } from '../../state/useAppState';
import { API_KEY_SCOPES } from '../../data/seed';
import type { ApiKey } from '../../data/types';

function CopyIcon({ done }: { done: boolean }) {
  return (
    <svg
      width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      {done
        ? <path d="M4 12.5l5 5L20 6.5" />
        : (
          <>
            <rect x="9" y="9" width="12" height="12" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </>
        )}
    </svg>
  );
}

/** Shown once, immediately after creation. The value never comes back. */
function RevealModal({ name, rawKey, onClose }: {
  name: string; rawKey: string; onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <Modal
      title={`${name} is ready`}
      onClose={onClose}
      width={520}
      footer={(
        <>
          <FooterSpacer />
          <Button variant="primary" onClick={onClose}>I have saved it</Button>
        </>
      )}
    >
      <p style={{ margin: '0 0 13px', fontSize: 13, color: 'var(--stop)', fontWeight: 600 }}>
        Copy this now. It is never shown again, and it cannot be recovered.
      </p>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 9,
          background: 'var(--card)', border: '1px solid var(--line)',
          borderRadius: 'var(--r-ctrl)', padding: '10px 12px',
        }}
      >
        <code
          className="mono"
          style={{ flex: 1, minWidth: 0, fontSize: 12.5, wordBreak: 'break-all' }}
        >
          {rawKey}
        </code>
        <Button
          variant="soft"
          onClick={() => {
            navigator.clipboard?.writeText(rawKey).catch(() => {});
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          <CopyIcon done={copied} />
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <p style={{ margin: '13px 0 0', fontSize: 11.5, color: 'var(--text-2)' }}>
        Treat it like a password. Anyone holding it can act with the scopes you
        granted, until it is revoked.
      </p>
    </Modal>
  );
}

function CreateModal({ onClose }: { onClose: () => void }) {
  const { createApiKey } = useAppState();
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<string[]>([]);
  const [expires, setExpires] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [revealed, setRevealed] = useState<{ name: string; key: string } | null>(null);

  const toggle = (scope: string) => setScopes((prev) => (prev.includes(scope)
    ? prev.filter((s) => s !== scope) : [...prev, scope]));

  async function submit() {
    if (!name.trim()) {
      setError('Give the key a name so you can recognise it later');
      return;
    }
    if (scopes.length === 0) {
      setError('Pick at least one scope, or the key can do nothing');
      return;
    }
    setBusy(true);
    setError('');
    const raw = await createApiKey(name.trim(), scopes, expires || undefined);
    setBusy(false);
    if (raw) setRevealed({ name: name.trim(), key: raw });
    else onClose();
  }

  if (revealed) {
    return (
      <RevealModal
        name={revealed.name}
        rawKey={revealed.key}
        onClose={onClose}
      />
    );
  }

  return (
    <Modal
      title="New API key"
      onClose={onClose}
      width={500}
      footer={(
        <>
          <FooterSpacer />
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={busy}>
            {busy ? 'Creating' : 'Create key'}
          </Button>
        </>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field
          label="Name"
          value={name}
          onChange={(v) => { setName(v); setError(''); }}
          placeholder="support-bot"
        />

        <div>
          <span
            style={{
              display: 'block', fontSize: 11.5, fontWeight: 700,
              color: 'var(--text-2)', marginBottom: 6,
            }}
          >
            Scopes
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {API_KEY_SCOPES.map((scope) => {
              const on = scopes.includes(scope);
              return (
                <button
                  key={scope}
                  onClick={() => { toggle(scope); setError(''); }}
                  aria-pressed={on}
                  className="mono"
                  style={{
                    fontSize: 11, padding: '5px 10px',
                    borderRadius: 'var(--r-pill)', cursor: 'pointer',
                    border: `1px solid ${on ? 'var(--emerald)' : 'var(--line)'}`,
                    background: on ? 'var(--go-soft)' : 'var(--card)',
                    color: on ? 'var(--emerald-ink)' : 'var(--text-2)',
                    fontWeight: on ? 700 : 500,
                  }}
                >
                  {scope}
                </button>
              );
            })}
          </div>
        </div>

        <Field
          label="Expires, if it should"
          value={expires}
          onChange={setExpires}
          type="date"
          mono
        />

        {error && <p style={{ margin: 0, fontSize: 12, color: 'var(--stop)' }}>{error}</p>}
      </div>
    </Modal>
  );
}

export default function ApiKeysCard() {
  const t = useT();
  const { apiKeys, revokeApiKey } = useAppState();
  const { isSuperAdmin } = useAuth();
  const [creating, setCreating] = useState(false);
  const [confirming, setConfirming] = useState<ApiKey | null>(null);

  const columns: Column<ApiKey>[] = [
    { key: 'name', header: t('Name'), render: (k) => <span style={{ fontWeight: 600 }}>{k.name}</span> },
    {
      key: 'prefix', header: t('Key'),
      render: (k) => (
        <span className="mono" style={{ fontSize: 12, color: 'var(--text-3)' }}>
          {k.prefix}…
        </span>
      ),
    },
    {
      key: 'scopes', header: t('Scopes'),
      render: (k) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {k.scopes.map((s) => (
            <span
              key={s}
              className="mono"
              style={{
                fontSize: 10, padding: '2px 6px', borderRadius: 4,
                background: 'var(--calm-soft)', color: 'var(--text-2)',
              }}
            >
              {s}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'lastUsed', header: t('Last used'), align: 'right',
      render: (k) => (
        <span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>
          {k.lastUsed ?? 'Never'}
        </span>
      ),
    },
    {
      key: 'status', header: t('Status'),
      render: (k) => <Pill status={k.revoked ? 'archived' : 'active'} />,
    },
    {
      key: 'actions', header: '', align: 'right',
      render: (k) => (k.revoked ? null : (
        <Button variant="destructive" onClick={() => setConfirming(k)}>Revoke</Button>
      )),
    },
  ];

  return (
    <>
      <Card
        title="API keys"
        action={isSuperAdmin
          ? <Button variant="outline" onClick={() => setCreating(true)}>New key</Button>
          : undefined}
      >
        {!isSuperAdmin ? (
          <SuperAdminOnly what="API keys">{null}</SuperAdminOnly>
        ) : (
        <>
        <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--text-2)' }}>
          For bots and automations. The full key is shown once, at creation, and
          only the prefix afterwards.
        </p>
        <DataTable
          columns={columns}
          rows={apiKeys}
          rowKey={(k) => k.id}
          minWidth={840}
          empty={{
            heading: 'No API keys yet',
            line: 'Nothing outside the console can reach the platform programmatically.',
            action: <Button variant="primary" onClick={() => setCreating(true)}>Create the first key</Button>,
          }}
        />
        </>
        )}
      </Card>

      {creating && <CreateModal onClose={() => setCreating(false)} />}

      {confirming && (
        <Modal
          title="Revoke this key"
          subtitle={confirming.name}
          onClose={() => setConfirming(null)}
          width={430}
          footer={(
            <>
              <FooterSpacer />
              <Button variant="outline" onClick={() => setConfirming(null)}>Keep it active</Button>
              <Button
                variant="destructive"
                onClick={() => { revokeApiKey(confirming.id); setConfirming(null); }}
              >
                Revoke key
              </Button>
            </>
          )}
        >
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text)' }}>
            Anything using <span className="mono">{confirming.prefix}…</span> stops
            working immediately. This cannot be undone — a replacement has to be
            a new key.
          </p>
        </Modal>
      )}
    </>
  );
}
