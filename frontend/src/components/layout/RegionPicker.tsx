import { useState, useRef, useEffect } from 'react';
import { PinIcon } from './icons';
import { useAppState } from '../../state/useAppState';
import { REGIONS, ALL_REGIONS, citiesInRegion } from '../../data/geography';
import type { RegionScope } from '../../data/geography';

/**
 * Declared at module scope, not inside RegionPicker: a component defined during
 * render is a new type every time, so React unmounts and remounts the whole
 * list on each keystroke or state change.
 */
function RegionRow({
  value, name, count, sub, active, onPick,
}: {
  value: RegionScope;
  name: string;
  count: number;
  sub?: string;
  active: boolean;
  onPick: (value: RegionScope) => void;
}) {
  return (
    <button
      role="option"
      aria-selected={active}
      onClick={() => onPick(value)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        padding: '8px 12px', border: 'none', cursor: 'pointer', textAlign: 'left',
        background: active ? 'var(--go-soft)' : 'transparent',
        color: active ? 'var(--emerald-ink)' : 'var(--text)',
        fontWeight: active ? 700 : 500, fontSize: 12.5,
      }}
      className="reeyo-region-row"
    >
      <span style={{ flex: 1, minWidth: 0 }}>
        {name}
        {sub && (
          <span
            style={{
              display: 'block', fontSize: 10.5, color: 'var(--text-3)',
              fontWeight: 500, marginTop: 1,
            }}
          >
            {sub}
          </span>
        )}
      </span>
      <span
        className="mono"
        style={{ fontSize: 11, color: count > 0 ? 'var(--text-2)' : 'var(--text-3)' }}
      >
        {count}
      </span>
    </button>
  );
}

/**
 * The topbar location control. Section 5.2 of the brand guide keeps a location
 * pill here; now that reeyo runs in all ten regions it has to be a real
 * selector rather than a fixed address, because the console is scoped by
 * whatever it says.
 */
export default function RegionPicker() {
  const { region, setRegion, ordersByRegion } = useAppState();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const label = region === ALL_REGIONS ? 'All regions' : region;
  const nationwide = Object.values(ordersByRegion).reduce((a, b) => a + b, 0);

  function choose(next: RegionScope) {
    setRegion(next);
    setOpen(false);
  }

  return (
    <div ref={wrap} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Region: ${label}. Change the region the console is scoped to`}
        className="reeyo-location"
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'var(--go-soft)', color: 'var(--forest)',
          border: 'none', borderRadius: 'var(--r-pill)', padding: '6px 13px',
          fontSize: 12.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        <span style={{ display: 'flex', color: 'var(--emerald-ink)' }}>
          <PinIcon size={15} />
        </span>
        {label}
        <span
          className="mono"
          style={{ fontSize: 10.5, color: 'var(--emerald-ink)', opacity: 0.75 }}
        >
          {region === ALL_REGIONS ? nationwide : (ordersByRegion[region] ?? 0)}
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Regions"
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 70,
            width: 268, maxHeight: 380, overflowY: 'auto',
            background: 'var(--card)', border: '1px solid var(--line)',
            borderRadius: 'var(--r-card)', boxShadow: 'var(--shadow)',
            paddingBlock: 5,
          }}
        >
          <RegionRow
            value={ALL_REGIONS}
            name="All regions"
            count={nationwide}
            sub="Everywhere reeyo operates"
            active={region === ALL_REGIONS}
            onPick={choose}
          />
          <div style={{ height: 1, background: 'var(--line-soft)', margin: '5px 0' }} />
          <div className="eyebrow" style={{ padding: '4px 12px 6px' }}>
            Cameroon · 10 regions
          </div>
          {REGIONS.map((r) => (
            <RegionRow
              key={r}
              value={r}
              name={r}
              count={ordersByRegion[r] ?? 0}
              sub={citiesInRegion(r).join(' · ')}
              active={region === r}
              onPick={choose}
            />
          ))}
        </div>
      )}
    </div>
  );
}
