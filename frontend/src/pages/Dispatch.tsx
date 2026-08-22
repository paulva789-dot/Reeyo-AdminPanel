import { useState } from 'react';
import PageTitle from '../components/layout/PageTitle';
import Card from '../components/ui/Card';
import Pill from '../components/ui/Pill';
import Toggle from '../components/ui/Toggle';
import Segments from '../components/ui/Segments';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import RiderMap from '../components/domain/RiderMap';
import { useAppState } from '../state/AppState';
import { money } from '../lib/format';
import { riders, zoneStats, teams } from '../data/seed';
import type { Team, Rider } from '../data/types';

/** Capacity thresholds from section 8.3: green under 50, amber 50–75, red above. */
function capacityToken(pct: number): string {
  if (pct > 75) return 'stop';
  if (pct >= 50) return 'watch';
  return 'go';
}

function Zones() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(238px, 1fr))',
        gap: 14,
      }}
    >
      {zoneStats.map((z) => {
        const token = capacityToken(z.capacity);
        return (
          <Card key={z.zone} title={z.zone}>
            <div style={{ display: 'flex', gap: 20, marginBottom: 14 }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 3 }}>Riders</div>
                <div className="mono" style={{ fontSize: 17, color: 'var(--forest)' }}>
                  {z.riders}
                </div>
              </div>
              <div>
                <div className="eyebrow" style={{ marginBottom: 3 }}>Active</div>
                <div className="mono" style={{ fontSize: 17, color: 'var(--forest)' }}>
                  {z.activeOrders}
                </div>
              </div>
              <div>
                <div className="eyebrow" style={{ marginBottom: 3 }}>Avg time</div>
                <div className="mono" style={{ fontSize: 17, color: 'var(--forest)' }}>
                  {z.avgMinutes}m
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 6,
              }}
            >
              <span className="eyebrow">Capacity</span>
              <span className="mono" style={{ fontSize: 11, color: `var(--${token})` }}>
                {z.capacity}%
              </span>
            </div>
            <div
              style={{
                height: 6, borderRadius: 'var(--r-pill)',
                background: 'var(--line-soft)', overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${z.capacity}%`, height: '100%',
                  borderRadius: 'var(--r-pill)', background: `var(--${token})`,
                }}
              />
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function Teams() {
  const columns: Column<Team>[] = [
    { key: 'name', header: 'Team', render: (t) => t.name },
    { key: 'lead', header: 'Lead', render: (t) => t.lead },
    {
      key: 'size', header: 'Riders', align: 'right',
      render: (t) => <span className="mono" style={{ fontSize: 12 }}>{t.size}</span>,
    },
    { key: 'zone', header: 'Zone', render: (t) => t.zone },
    {
      key: 'shift', header: 'Shift',
      render: (t) => <span className="mono" style={{ fontSize: 12 }}>{t.shift}</span>,
    },
    {
      key: 'load', header: 'Load', align: 'right',
      render: (t) => (
        <span className="mono" style={{ fontSize: 12, color: `var(--${capacityToken(t.load)})` }}>
          {t.load}%
        </span>
      ),
    },
  ];

  return (
    <Card title="Delivery teams">
      <DataTable columns={columns} rows={teams} rowKey={(t) => t.id} />
    </Card>
  );
}

function Fees() {
  const { feeRules, toggleFeeRule } = useAppState();

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(268px, 1fr))',
        gap: 14,
      }}
    >
      {feeRules.map((f) => (
        <Card
          key={f.id}
          title={f.name}
          action={(
            <Toggle
              checked={f.active}
              onChange={() => toggleFeeRule(f.id)}
              label={`${f.name} rule`}
            />
          )}
        >
          <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 3 }}>Base fare</div>
              <div className="mono" style={{ fontSize: 15, color: 'var(--forest)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>FCFA </span>
                {money(f.baseFare)}
              </div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 3 }}>Per km</div>
              <div className="mono" style={{ fontSize: 15, color: 'var(--forest)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>FCFA </span>
                {money(f.perKm)}
              </div>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)' }}>{f.condition}</p>
        </Card>
      ))}
    </div>
  );
}

export default function Dispatch() {
  const [tab, setTab] = useState('map');

  const riderColumns: Column<Rider>[] = [
    {
      key: 'name', header: 'Rider',
      render: (r) => (
        <div>
          <div>{r.name}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.id}</div>
        </div>
      ),
    },
    { key: 'zone', header: 'Zone', render: (r) => r.zone },
    { key: 'state', header: 'State', render: (r) => <Pill status={r.state} /> },
  ];

  return (
    <>
      <PageTitle>Live dispatch</PageTitle>

      <div style={{ marginBottom: 14 }}>
        <Segments
          ariaLabel="Dispatch view"
          value={tab}
          onChange={setTab}
          segments={[
            { value: 'map', label: 'Map' },
            { value: 'zones', label: 'Zones' },
            { value: 'teams', label: 'Teams' },
            { value: 'fees', label: 'Delivery fees' },
          ]}
        />
      </div>

      {tab === 'map' && (
        <div className="reeyo-split">
          <Card title="Fleet position">
            <RiderMap />
          </Card>
          <Card title="Riders on shift">
            <DataTable
              columns={riderColumns}
              rows={riders}
              rowKey={(r) => r.id}
              minWidth={320}
            />
          </Card>
        </div>
      )}

      {tab === 'zones' && <Zones />}
      {tab === 'teams' && <Teams />}
      {tab === 'fees' && <Fees />}
    </>
  );
}
