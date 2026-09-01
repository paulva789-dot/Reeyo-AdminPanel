import { useState, useEffect, useRef } from 'react';
import Button from './Button';
import { useT } from '../../i18n/useT';
import { usePreferences } from '../../state/usePreferences';
import { useDateRange, describeRange, isoDay } from '../../state/useDateRange';
import type { PresetKey } from '../../state/useDateRange';

const PRESETS: { key: Exclude<PresetKey, 'custom'>; label: Parameters<ReturnType<typeof useT>>[0] }[] = [
  { key: 'today', label: 'date.today' },
  { key: 'yesterday', label: 'date.yesterday' },
  { key: 'last7', label: 'date.last7' },
  { key: 'last30', label: 'date.last30' },
  { key: 'thisMonth', label: 'date.thisMonth' },
  { key: 'lastMonth', label: 'date.lastMonth' },
];

/**
 * The one date range control — specification §2.3.
 *
 * The active range shows as a chip rather than as a label on a hidden menu,
 * because the question it answers ("what am I looking at?") is asked far more
 * often than the question the menu answers ("what else could I look at?").
 */
export default function DateFilter() {
  const t = useT();
  const { language } = usePreferences();
  const { range, setPreset, setCustom } = useDateRange();
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(() => isoDay(range.from));
  const [to, setTo] = useState(() => isoDay(range.to));
  const holder = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onClick = (e: MouseEvent) => {
      if (holder.current && !holder.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const locale = language === 'fr' ? 'fr-FR' : 'en-GB';
  const activeLabel = range.preset === 'custom'
    ? describeRange(range, locale)
    : t(PRESETS.find((p) => p.key === range.preset)?.label ?? 'date.today');

  return (
    <div ref={holder} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`${t('date.range')}: ${activeLabel}`}
        style={{
          height: 34, display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '0 12px', borderRadius: 'var(--r-pill)',
          border: '1px solid var(--line)', background: 'var(--card)',
          color: 'var(--text)', cursor: 'pointer',
          fontFamily: 'var(--sans)', fontSize: 12.5, fontWeight: 600,
        }}
      >
        <span className="eyebrow" style={{ letterSpacing: '0.12em' }}>{t('date.range')}</span>
        <span className="mono" style={{ fontSize: 12, color: 'var(--emerald-ink)' }}>
          {activeLabel}
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t('date.range')}
          style={{
            position: 'absolute', top: 40, right: 0, zIndex: 42, width: 280, padding: 10,
            background: 'var(--card)', border: '1px solid var(--line)',
            borderRadius: 'var(--r-card)', boxShadow: 'var(--shadow)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {PRESETS.map((preset) => {
              const active = range.preset === preset.key;
              return (
                <button
                  key={preset.key}
                  onClick={() => { setPreset(preset.key); setOpen(false); }}
                  style={{
                    padding: '8px 10px', borderRadius: 'var(--r-ctrl)', cursor: 'pointer',
                    border: `1px solid ${active ? 'var(--emerald)' : 'var(--line)'}`,
                    background: active ? 'var(--go-soft)' : 'transparent',
                    color: active ? 'var(--emerald-ink)' : 'var(--text)',
                    fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 600,
                    textAlign: 'left',
                  }}
                >
                  {t(preset.label)}
                </button>
              );
            })}
          </div>

          <div
            style={{
              marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--line-soft)',
            }}
          >
            <div className="eyebrow" style={{ marginBottom: 7 }}>{t('date.custom')}</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                aria-label={t('date.start')}
                className="mono"
                style={dateInput}
              />
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                aria-label={t('date.end')}
                className="mono"
                style={dateInput}
              />
            </div>
            <div style={{ display: 'flex', marginTop: 8 }}>
              <div style={{ flex: 1 }} />
              <Button
                variant="primary"
                onClick={() => {
                  const a = new Date(from);
                  const b = new Date(to);
                  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return;
                  setCustom(a, b);
                  setOpen(false);
                }}
              >
                {t('date.apply')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const dateInput: React.CSSProperties = {
  flex: 1, minWidth: 0, height: 32,
  borderRadius: 'var(--r-ctrl)', border: '1px solid var(--line)',
  background: 'var(--canvas)', color: 'var(--text)',
  padding: '0 8px', fontSize: 12, outline: 'none',
};
