import { useState, lazy, Suspense } from 'react';
import PageTitle from '../components/layout/PageTitle';
import Card from '../components/ui/Card';
import Pill from '../components/ui/Pill';
import Toggle from '../components/ui/Toggle';
import Segments from '../components/ui/Segments';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import RiderMap from '../components/domain/RiderMap';
import LocalOnly from '../components/ui/LocalOnly';

// Leaflet is a third of the bundle and only this tab needs it, so it loads when
// the tab is opened rather than on every page of the console.
const ZonesPanel = lazy(() => import('./dispatch/ZonesPanel'));
const LiveMapPanel = lazy(() => import('./dispatch/LiveMapPanel'));
import { useAppState } from '../state/useAppState';
import { money } from '../lib/format';
import EmptyState from '../components/ui/EmptyState';
import { zoneStats, teams } from '../data/seed';
import { ALL_REGIONS } from '../data/geography';
import type { Team, Rider } from '../data/types';

/**
 * Zone capacity and teams have no backend route, so they stay seeded — but they
 * still honour the region the console is scoped to, or the page would contradict
 * the topbar.
 */
function useDispatchGeography() {
  const { region } = useAppState();
  const scope = region === ALL_REGIONS ? null : region;
  return {
    region: region === ALL_REGIONS ? 'any region' : region,
    zoneStatsInScope: scope ? zoneStats.filter((z) => z.region === scope) : zoneStats,
    teamsInScope: scope ? teams.filter((t) => t.region === scope) : teams,
  };
}

/** Capacity thresholds from section 8.3: green under 50, amber 50–75, red above. */
function capacityToken(pct: number): string {
  if (pct > 75) return 'stop';
  if (pct >= 50) return 'watch';
  return 'go';
}

function Capacity() {
  const { region, zoneStatsInScope } = useDispatchGeography();

  if (zoneStatsInScope.length === 0) {
    return (
      <>
        <LocalOnly what="Zone capacity" />
        <Card>
          <EmptyState
            heading={`No delivery zones in ${region}`}
            line="reeyo has not opened a zone in this region yet, so there is no capacity to report."
          />
        </Card>
      </>
    );
  }

  // Grouped by region: a flat grid of every zone in the country is unreadable,
  // and capacity only means something next to its neighbours.
  const byRegion = new Map<string, typeof zoneStatsInScope>();
  for (const z of zoneStatsInScope) {
    byRegion.set(z.region, [...(byRegion.get(z.region) ?? []), z]);
  }

  return (
    <>
      <LocalOnly what="Zone capacity" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {[...byRegion.entries()].map(([regionName, zones]) => (
          <section key={regionName}>
            <div
              style={{
                display: 'flex', alignItems: 'baseline', gap: 9, marginBottom: 10,
              }}
            >
              <h2
                style={{
                  margin: 0, fontSize: 14, fontWeight: 800,
                  letterSpacing: '-0.02em', color: 'var(--forest)',
                }}
              >
                {regionName}
              </h2>
              <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                {zones.length} {zones.length === 1 ? 'zone' : 'zones'}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(238px, 1fr))',
                gap: 14,
              }}
            >
              {zones.map((z) => {
                const token = capacityToken(z.capacity);
                return (
                  <Card key={`${z.region}-${z.zone}`} title={z.zone}>
                    <div
                      style={{ fontSize: 11, color: 'var(--text-3)', marginTop: -6, marginBottom: 12 }}
                    >
                      {z.city}
                    </div>
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
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', marginBottom: 6,
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
          </section>
        ))}
      </div>
    </>
  );
}

function Teams() {
  const { region, teamsInScope } = useDispatchGeography();
  const columns: Column<Team>[] = [
    { key: 'name', header: 'Team', render: (t) => t.name },
    { key: 'lead', header: 'Lead', render: (t) => t.lead },
    {
      key: 'size', header: 'Riders', align: 'right',
      render: (t) => <span className="mono" style={{ fontSize: 12 }}>{t.size}</span>,
    },
    {
      key: 'zone', header: 'Zone',
      render: (t) => (
        <div>
          <div>{t.zone}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.city} · {t.region}</div>
        </div>
      ),
    },
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
    <>
      <LocalOnly what="Delivery teams" />
      <Card title="Delivery teams">
        <DataTable
          columns={columns}
          rows={teamsInScope}
          rowKey={(t) => t.id}
          minWidth={760}
          empty={{
            heading: `No teams in ${region}`,
            line: 'No delivery team has been set up in this region yet.',
          }}
        />
      </Card>
    </>
  );
}

function Fees() {
  const { feeRules, toggleFeeRule } = useAppState();

  return (
    <>
    <LocalOnly what="Delivery fee rules" />
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
    </>
  );
}

export default function Dispatch() {
  const { riders, isSample } = useAppState();
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
            { value: 'capacity', label: 'Capacity' },
            { value: 'teams', label: 'Teams' },
            { value: 'fees', label: 'Delivery fees' },
          ]}
        />
      </div>

      {tab === 'map' && (
        <Suspense
          fallback={(
            <Card>
              <EmptyState heading="Loading the map…" line="Fetching the map library and rider positions." />
            </Card>
          )}
        >
          {isSample ? (
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
          ) : (
            <LiveMapPanel />
          )}
        </Suspense>
      )}

      {tab === 'zones' && (
        <Suspense
          fallback={(
            <Card>
              <EmptyState heading="Loading the map…" line="Fetching the map library and your zones." />
            </Card>
          )}
        >
          <ZonesPanel />
        </Suspense>
      )}
      {tab === 'capacity' && <Capacity />}
      {tab === 'teams' && <Teams />}
      {tab === 'fees' && <Fees />}
    </>
  );
}
