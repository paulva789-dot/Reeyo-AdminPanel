import { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Field from '../../components/ui/Field';
import EmptyState from '../../components/ui/EmptyState';
import { SuperAdminBadge } from '../../components/ui/SuperAdminOnly';
import { useAuth } from '../../state/useAuth';
import type { PlatformAdminState } from '../../state/usePlatformAdmin';
import type { PlatformConfig } from '../../data/types';

const FIELDS: { key: keyof PlatformConfig; label: string; hint: string }[] = [
  { key: 'commissionRate', label: 'Vendor commission %', hint: 'Taken from every vendor order' },
  { key: 'serviceFee', label: 'Service fee %', hint: 'Added to the customer basket' },
  { key: 'riderCut', label: 'Rider platform cut %', hint: 'Taken from the delivery fee' },
  { key: 'baseDeliveryFare', label: 'Base delivery fare', hint: 'FCFA, before distance' },
];

function text(value: number | null): string {
  return value === null ? '' : String(value);
}

function toDraft(config: PlatformConfig): Record<string, string> {
  return Object.fromEntries(FIELDS.map((f) => [f.key, text(config[f.key])]));
}

/**
 * Commission and fees, from `/config`. Saving is `PATCH /config`, which is
 * SuperAdmin — a plain admin sees the figures and a badge saying whose call a
 * change is, rather than a Save button that would 403.
 */
export default function ConfigCard({ state }: { state: PlatformAdminState }) {
  const { isSuperAdmin } = useAuth();
  const { config, configError, configLoading, saveConfig } = state;

  const [draft, setDraft] = useState<Record<string, string>>(() => toDraft(config));
  const [error, setError] = useState('');

  // When the loaded configuration changes underneath the form, the form starts
  // again from it. Adjusting during render rather than in an effect keeps the
  // stale values from being painted for a frame first.
  const [seen, setSeen] = useState(config);
  if (seen !== config) {
    setSeen(config);
    setDraft(toDraft(config));
    setError('');
  }

  const dirty = FIELDS.some((f) => (draft[f.key] ?? '') !== text(config[f.key]));

  const save = () => {
    const patch: Partial<PlatformConfig> = {};
    for (const f of FIELDS) {
      const raw = (draft[f.key] ?? '').trim();
      if (raw === text(config[f.key])) continue;
      const parsed = Number(raw);
      if (raw === '' || !Number.isFinite(parsed) || parsed < 0) {
        setError(`${f.label} has to be a number, and cannot be negative`);
        return;
      }
      patch[f.key] = parsed;
    }
    setError('');
    saveConfig(patch);
  };

  return (
    <Card
      title="Commission and fees"
      action={isSuperAdmin ? undefined : <SuperAdminBadge />}
    >
      {configLoading ? (
        <EmptyState heading="Loading…" line="Fetching the platform configuration." />
      ) : (
        <>
          {configError && (
            <p
              style={{
                margin: '0 0 12px', fontSize: 11.5, color: 'var(--stop)',
                background: 'var(--stop-soft)', padding: '7px 10px',
                borderRadius: 'var(--r-ctrl)',
              }}
            >
              {configError} The figures below are samples, not what the platform
              is charging.
            </p>
          )}

          <div
            style={{
              display: 'grid', gap: 13,
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            }}
          >
            {FIELDS.map((f) => (
              <div key={f.key}>
                <Field
                  label={f.label}
                  value={draft[f.key] ?? ''}
                  onChange={(v) => {
                    setDraft((prev) => ({ ...prev, [f.key]: v }));
                    setError('');
                  }}
                  mono
                />
                <p style={{ margin: '5px 0 0', fontSize: 10.5, color: 'var(--text-3)' }}>
                  {f.hint}
                </p>
              </div>
            ))}
          </div>

          {error && (
            <p style={{ margin: '11px 0 0', fontSize: 12, color: 'var(--stop)' }}>{error}</p>
          )}

          {isSuperAdmin && (
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <div style={{ flex: 1 }} />
              <Button
                variant="outline"
                disabled={!dirty}
                onClick={() => { setDraft(toDraft(config)); setError(''); }}
              >
                Discard
              </Button>
              <Button
                variant="primary"
                disabled={!dirty}
                title={dirty ? undefined : 'Nothing has changed'}
                onClick={save}
              >
                Save configuration
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
