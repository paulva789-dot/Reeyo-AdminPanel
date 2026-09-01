import { useState } from 'react';
import { GEOGRAPHY, REGIONS } from '../../data/geography';

interface ZonePickerProps {
  label: string;
  /** Empty means every zone — the campaign is national. */
  value: string[];
  onChange: (zones: string[]) => void;
}

/**
 * Choosing the zones a campaign runs in — specification §7.
 *
 * Grouped by region and city rather than offered as one flat list of
 * fifty-eight names, because "which zones are in Douala" is the question being
 * asked and a flat list makes the operator answer it from memory.
 *
 * An empty selection means everywhere. That is stated on screen rather than
 * left to be inferred: an empty multi-select reads just as easily as "nothing
 * selected, so nothing will show".
 */
export default function ZonePicker({ label, value, onChange }: ZonePickerProps) {
  const [open, setOpen] = useState<string | null>(null);

  const toggle = (zone: string) => {
    onChange(value.includes(zone) ? value.filter((z) => z !== zone) : [...value, zone]);
  };

  const toggleCity = (zones: readonly string[]) => {
    const all = zones.every((z) => value.includes(z));
    onChange(all
      ? value.filter((z) => !zones.includes(z))
      : [...new Set([...value, ...zones])]);
  };

  return (
    <div>
      <div
        style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          gap: 10, marginBottom: 6,
        }}
      >
        <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-2)' }}>
          {label}
        </span>
        {value.length > 0 && (
          <button
            onClick={() => onChange([])}
            style={{
              border: 'none', background: 'transparent', cursor: 'pointer', padding: 0,
              color: 'var(--emerald-ink)', fontFamily: 'var(--sans)',
              fontSize: 11.5, fontWeight: 600,
            }}
          >
            Show everywhere
          </button>
        )}
      </div>

      <div
        style={{
          border: '1px solid var(--line)', borderRadius: 'var(--r-ctrl)',
          maxHeight: 210, overflowY: 'auto',
        }}
      >
        {REGIONS.map((region) => {
          const cities = GEOGRAPHY[region];
          const zones = cities.flatMap((c) => c.zones);
          const chosen = zones.filter((z) => value.includes(z)).length;
          const expanded = open === region;

          return (
            <div key={region} style={{ borderBottom: '1px solid var(--line-soft)' }}>
              <button
                onClick={() => setOpen(expanded ? null : region)}
                aria-expanded={expanded}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  padding: '8px 11px', border: 'none', background: 'transparent',
                  cursor: 'pointer', textAlign: 'left',
                  fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--text)',
                }}
              >
                <span style={{ flex: 1 }}>{region}</span>
                {chosen > 0 && (
                  <span
                    className="mono"
                    style={{
                      fontSize: 10, padding: '1px 6px', borderRadius: 'var(--r-pill)',
                      background: 'var(--go-soft)', color: 'var(--emerald-ink)',
                    }}
                  >
                    {chosen}
                  </span>
                )}
                <span aria-hidden="true" style={{ color: 'var(--text-3)', fontSize: 11 }}>
                  {expanded ? '−' : '+'}
                </span>
              </button>

              {expanded && cities.map((city) => (
                <div key={city.name} style={{ padding: '0 11px 8px 22px' }}>
                  <button
                    onClick={() => toggleCity(city.zones)}
                    className="eyebrow"
                    style={{
                      border: 'none', background: 'transparent', cursor: 'pointer',
                      padding: '4px 0', color: 'var(--text-3)',
                    }}
                  >
                    {city.name}
                  </button>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {city.zones.map((zone) => {
                      const on = value.includes(zone);
                      return (
                        <button
                          key={zone}
                          onClick={() => toggle(zone)}
                          aria-pressed={on}
                          style={{
                            padding: '3px 9px', borderRadius: 'var(--r-pill)', cursor: 'pointer',
                            border: `1px solid ${on ? 'var(--emerald)' : 'var(--line)'}`,
                            background: on ? 'var(--go-soft)' : 'transparent',
                            color: on ? 'var(--emerald-ink)' : 'var(--text-2)',
                            fontFamily: 'var(--sans)', fontSize: 11.5, fontWeight: 600,
                          }}
                        >
                          {zone}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--text-3)' }}>
        {value.length === 0
          ? 'No zone chosen, so this shows everywhere in the country.'
          : `Shown only in ${value.length} zone${value.length === 1 ? '' : 's'}.`}
      </p>
    </div>
  );
}
