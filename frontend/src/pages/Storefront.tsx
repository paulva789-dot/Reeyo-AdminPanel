import { useState } from 'react';
import PageTitle from '../components/layout/PageTitle';
import Card from '../components/ui/Card';
import Toggle from '../components/ui/Toggle';
import Pill from '../components/ui/Pill';
import { useAppState } from '../state/AppState';

const THUMB_GRADIENT: Record<string, string> = {
  Food: 'linear-gradient(135deg, var(--food-soft) 0%, var(--food-vivid) 100%)',
  Grocery: 'linear-gradient(135deg, var(--grocery-soft) 0%, var(--grocery-vivid) 100%)',
  Parcel: 'linear-gradient(135deg, var(--parcel-soft) 0%, var(--parcel-vivid) 100%)',
};

export default function Storefront() {
  const { banners, toggleBanner, reorderBanners, sections, toggleSection } = useAppState();
  const [dragging, setDragging] = useState<number | null>(null);

  return (
    <>
      <PageTitle>Storefront</PageTitle>

      <div className="reeyo-split-even">
        <Card title="Home banners">
          <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--text-2)' }}>
            Drag to reorder. The first active banner is what a customer sees first.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {banners.map((b, index) => (
              <div
                key={b.id}
                draggable
                onDragStart={() => setDragging(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragging !== null && dragging !== index) reorderBanners(dragging, index);
                  setDragging(null);
                }}
                onDragEnd={() => setDragging(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: 10, cursor: 'grab',
                  background: 'var(--card)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--r-card)',
                  opacity: dragging === index ? 0.5 : 1,
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: 54, height: 38, borderRadius: 8, flexShrink: 0,
                    background: THUMB_GRADIENT[b.vertical] ?? 'var(--calm-soft)',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                    {b.vertical} · {b.zone} ·{' '}
                    <span className="mono">{b.taps.toLocaleString('fr-FR')}</span> taps
                  </div>
                </div>
                <Toggle
                  checked={b.active}
                  onChange={() => toggleBanner(b.id)}
                  label={`${b.name} visibility`}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card title="Section order">
          <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--text-2)' }}>
            The order here decides what the customer scrolls past first.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {sections.map((s, i) => (
              <div
                key={s.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px',
                  background: 'var(--card)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--r-card)',
                }}
              >
                <span
                  className="mono"
                  style={{
                    width: 22, height: 22, borderRadius: 'var(--r-pill)', flexShrink: 0,
                    background: 'var(--calm-soft)', color: 'var(--text-2)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11,
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ flex: 1, fontSize: 12.5, minWidth: 0 }}>{s.name}</span>
                {!s.active && <Pill status="hidden" token="calm" />}
                <Toggle
                  checked={s.active}
                  onChange={() => toggleSection(s.id)}
                  label={`${s.name} visibility`}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
