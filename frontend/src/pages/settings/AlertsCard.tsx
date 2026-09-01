import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Toggle from '../../components/ui/Toggle';
import { Select } from '../../components/ui/Field';
import { useAlerts } from '../../state/useAlerts';
import { useT } from '../../i18n/useT';
import { TONES, TONE_LABEL, PRIORITY_TONE } from '../../lib/tones';
import type { ToneId } from '../../lib/tones';
import type { Vertical } from '../../data/types';

const SERVICES: { key: Vertical; label: string }[] = [
  { key: 'food', label: 'Food' },
  { key: 'grocery', label: 'Grocery' },
  { key: 'parcel', label: 'Parcel' },
];

const OPTIONS = TONES.map((tone) => ({ value: tone.id, label: TONE_LABEL[tone.id] }));

/** Incoming-order alert settings — specification §2.4. */
export default function AlertsCard() {
  const t = useT();
  const {
    settings, setTone, setVolume, setRepeat, unlocked, enableSound, preview,
  } = useAlerts();

  const muted = settings.volume === 0;

  return (
    <Card title={t('sound.title')}>
      {!unlocked && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14,
            padding: '10px 12px', borderRadius: 'var(--r-ctrl)',
            background: 'var(--watch-soft)', border: '1px solid var(--olive)',
          }}
        >
          <span style={{ flex: 1, fontSize: 12.5, color: 'var(--watch)' }}>
            {t('sound.blocked')}
          </span>
          <Button variant="primary" onClick={enableSound}>{t('sound.enable')}</Button>
        </div>
      )}

      {muted && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
            padding: '9px 12px', borderRadius: 'var(--r-ctrl)',
            background: 'var(--stop-soft)', border: '1px solid var(--destructive-line)',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--stop)', flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 12.5, color: 'var(--stop)' }}>
            {t('sound.muted')} — new orders will arrive silently. The toast, the
            tab title and the Orders badge still carry them.
          </span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {SERVICES.map((service) => (
          <div key={service.key} style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Select
                label={`${service.label} — ${t('sound.tone')}`}
                value={settings.tones[service.key]}
                onChange={(v) => setTone(service.key, v as ToneId)}
                options={OPTIONS}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => preview(settings.tones[service.key])}
            >
              {t('sound.preview')}
            </Button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <label
          style={{
            display: 'block', fontSize: 11.5, fontWeight: 700,
            color: 'var(--text-2)', marginBottom: 6,
          }}
          htmlFor="alert-volume"
        >
          {t('sound.volume')}
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            id="alert-volume"
            type="range"
            aria-label={t('sound.volume')}
            min={0}
            max={100}
            value={settings.volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--emerald)' }}
          />
          <span
            className="mono"
            style={{
              fontSize: 12, width: 44, textAlign: 'right',
              color: muted ? 'var(--stop)' : 'var(--forest)', fontWeight: 700,
            }}
          >
            {settings.volume}%
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 14, marginTop: 16,
          paddingTop: 14, borderTop: '1px solid var(--line-soft)',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Repeat until acknowledged</div>
          <p style={{ margin: '3px 0 0', fontSize: 11.5, color: 'var(--text-2)' }}>
            Rings again every 20 seconds, up to {settings.maxRepeats} times, until the
            order is opened. Late and escalated orders use the {TONE_LABEL[PRIORITY_TONE]}{' '}
            tone whichever service they belong to.
          </p>
        </div>
        <Toggle
          checked={settings.repeat}
          onChange={setRepeat}
          label="Repeat until acknowledged"
        />
      </div>
    </Card>
  );
}
