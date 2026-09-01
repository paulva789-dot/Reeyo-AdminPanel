import Button from '../../components/ui/Button';
import Toggle from '../../components/ui/Toggle';
import type { DayHours, HourSlot } from '../../data/types';
import { WEEKDAYS } from '../../data/types';

interface HoursEditorProps {
  hours: DayHours[];
  onChange: (hours: DayHours[]) => void;
}

const timeInput: React.CSSProperties = {
  width: 88, height: 30, borderRadius: 'var(--r-ctrl)',
  border: '1px solid var(--line)', background: 'var(--card)',
  color: 'var(--text)', padding: '0 8px', fontSize: 12, outline: 'none',
};

/**
 * Opening hours — specification §4.2.
 *
 * Several slots per day, because a vendor that closes for lunch is not a vendor
 * that closes for the day, and one open/close pair cannot say the difference.
 */
export default function HoursEditor({ hours, onChange }: HoursEditorProps) {
  const byDay = WEEKDAYS.map(
    (day) => hours.find((h) => h.day === day) ?? { day, closed: true, slots: [] },
  );

  const update = (day: string, next: Partial<DayHours>) => {
    onChange(byDay.map((h) => (h.day === day ? { ...h, ...next } : h)));
  };

  const setSlot = (day: string, index: number, slot: Partial<HourSlot>) => {
    const row = byDay.find((h) => h.day === day);
    if (!row) return;
    update(day, {
      slots: row.slots.map((s, i) => (i === index ? { ...s, ...slot } : s)),
    });
  };

  return (
    <div>
      <div
        style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          gap: 10, marginBottom: 9,
        }}
      >
        <div className="eyebrow">Operating hours</div>
        <Button
          variant="soft"
          onClick={() => {
            // Copy the first open day across the week — the shortcut §4.2 asks
            // for, and the difference between a two-minute job and a ten-minute one.
            const source = byDay.find((h) => !h.closed && h.slots.length > 0);
            if (!source) return;
            onChange(byDay.map((h) => ({
              ...h,
              closed: false,
              slots: source.slots.map((s) => ({ ...s })),
            })));
          }}
        >
          Copy to all days
        </Button>
      </div>

      <div
        style={{
          border: '1px solid var(--line)', borderRadius: 'var(--r-card)',
          overflow: 'hidden',
        }}
      >
        {byDay.map((row, i) => (
          <div
            key={row.day}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 12px',
              borderTop: i === 0 ? 'none' : '1px solid var(--line-soft)',
              background: row.closed ? 'var(--canvas)' : 'transparent',
            }}
          >
            <span
              className="mono"
              style={{ width: 34, fontSize: 11.5, color: 'var(--text-2)', paddingTop: 7 }}
            >
              {row.day}
            </span>

            <div style={{ flex: 1, minWidth: 0 }}>
              {row.closed ? (
                <div style={{ fontSize: 12, color: 'var(--text-3)', paddingTop: 7 }}>
                  Closed — no orders can be placed
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {row.slots.map((slot, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="time"
                        value={slot.opens}
                        onChange={(e) => setSlot(row.day, index, { opens: e.target.value })}
                        aria-label={`${row.day} slot ${index + 1} opens`}
                        className="mono"
                        style={timeInput}
                      />
                      <span style={{ color: 'var(--text-3)', fontSize: 12 }}>to</span>
                      <input
                        type="time"
                        value={slot.closes}
                        onChange={(e) => setSlot(row.day, index, { closes: e.target.value })}
                        aria-label={`${row.day} slot ${index + 1} closes`}
                        className="mono"
                        style={timeInput}
                      />
                      {row.slots.length > 1 && (
                        <button
                          onClick={() => update(row.day, {
                            slots: row.slots.filter((_, x) => x !== index),
                          })}
                          aria-label={`Remove ${row.day} slot ${index + 1}`}
                          style={{
                            border: '1px solid var(--line)', background: 'var(--card)',
                            borderRadius: 6, width: 24, height: 24, cursor: 'pointer',
                            color: 'var(--text-3)', fontSize: 13, lineHeight: 1, padding: 0,
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => update(row.day, {
                      slots: [...row.slots, { opens: '17:00', closes: '21:00' }],
                    })}
                    style={{
                      alignSelf: 'flex-start', border: 'none', background: 'transparent',
                      color: 'var(--emerald-ink)', cursor: 'pointer', padding: 0,
                      fontFamily: 'var(--sans)', fontSize: 11.5, fontWeight: 600,
                    }}
                  >
                    Add a slot
                  </button>
                </div>
              )}
            </div>

            <Toggle
              checked={!row.closed}
              onChange={(open) => update(row.day, {
                closed: !open,
                slots: open && row.slots.length === 0
                  ? [{ opens: '08:00', closes: '20:00' }]
                  : row.slots,
              })}
              label={`${row.day} open`}
            />
          </div>
        ))}
      </div>

      <p style={{ margin: '9px 0 0', fontSize: 11.5, color: 'var(--text-3)' }}>
        Outside these hours the vendor shows as closed in the customer app and
        no order can be placed.
      </p>
    </div>
  );
}
