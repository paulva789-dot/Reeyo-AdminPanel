import { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Toggle from '../../components/ui/Toggle';
import { Modal, FooterSpacer } from '../../components/ui/Overlay';
import EmptyState from '../../components/ui/EmptyState';
import { SuperAdminBadge } from '../../components/ui/SuperAdminOnly';
import { useAuth } from '../../state/useAuth';
import type { PlatformAdminState } from '../../state/usePlatformAdmin';

/** `surge_pricing` reads better as "Surge pricing" without inventing a new name. */
function humanise(key: string): string {
  const words = key.replace(/[_-]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Feature flags, from `/config/feature-flags`. These replaced a hard-coded list
 * of five switches that were not connected to anything: whatever the platform
 * actually has is what shows here now, including flags this console has never
 * heard of.
 */
export default function FeatureFlagsCard({ state }: { state: PlatformAdminState }) {
  const { isSuperAdmin } = useAuth();
  const { flags, flagsError, setFlag, deleteFlag } = state;
  const [removing, setRemoving] = useState<string | null>(null);

  return (
    <Card
      title="Platform switches"
      action={isSuperAdmin ? undefined : <SuperAdminBadge />}
    >
      {flagsError && (
        <p
          style={{
            margin: '0 0 12px', fontSize: 11.5, color: 'var(--stop)',
            background: 'var(--stop-soft)', padding: '7px 10px',
            borderRadius: 'var(--r-ctrl)',
          }}
        >
          {flagsError} The switches below are samples and do not reflect the
          platform.
        </p>
      )}

      {flags.length === 0 ? (
        <EmptyState
          heading="No feature flags"
          line="The platform exposes no switches, so there is nothing to turn on or off."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {flags.map((f, i) => (
            <div
              key={f.key}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 0',
                borderBottom: i === flags.length - 1 ? 'none' : '1px solid var(--line-soft)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{humanise(f.key)}</div>
                <p style={{ margin: '3px 0 0', fontSize: 11.5, color: 'var(--text-2)' }}>
                  {f.description || (
                    <span className="mono" style={{ color: 'var(--text-3)' }}>{f.key}</span>
                  )}
                </p>
              </div>
              {isSuperAdmin ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Toggle
                    checked={f.enabled}
                    onChange={(next) => setFlag(f.key, next)}
                    label={humanise(f.key)}
                  />
                  <Button variant="destructive" onClick={() => setRemoving(f.key)}>
                    Remove
                  </Button>
                </div>
              ) : (
                <span
                  className="mono"
                  style={{
                    fontSize: 11, color: f.enabled ? 'var(--go)' : 'var(--text-3)',
                    flexShrink: 0, marginTop: 3,
                  }}
                >
                  {f.enabled ? 'on' : 'off'}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {removing && (
        <Modal
          title="Remove this flag"
          subtitle={removing}
          onClose={() => setRemoving(null)}
          width={440}
          footer={(
            <>
              <FooterSpacer />
              <Button variant="outline" onClick={() => setRemoving(null)}>Keep it</Button>
              <Button
                variant="destructive"
                onClick={() => { deleteFlag(removing); setRemoving(null); }}
              >
                Remove flag
              </Button>
            </>
          )}
        >
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-2)' }}>
            The platform falls back to whatever this feature does by default,
            which may not be what the switch currently says. Turning it off is
            the safer move if you only want the feature disabled.
          </p>
        </Modal>
      )}
    </Card>
  );
}
