import { useState, lazy, Suspense } from 'react';
import { useT } from '../i18n/useT';
import PageTitle from '../components/layout/PageTitle';
import Card from '../components/ui/Card';
import Pill from '../components/ui/Pill';
import Segments from '../components/ui/Segments';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import RiderMap from '../components/domain/RiderMap';
import NoEndpoint from '../components/ui/NoEndpoint';

// Leaflet is a third of the bundle and only this tab needs it, so it loads when
// the tab is opened rather than on every page of the console.
const ZonesPanel = lazy(() => import('./dispatch/ZonesPanel'));
const LiveMapPanel = lazy(() => import('./dispatch/LiveMapPanel'));
const FeesPanel = lazy(() => import('./dispatch/FeesPanel'));
const TeamsPanel = lazy(() => import('./dispatch/TeamsPanel'));
import { useAppState } from '../state/useAppState';
import EmptyState from '../components/ui/EmptyState';
import { zoneStats } from '../data/seed';
import { ALL_REGIONS } from '../data/geography';
import type { Rider } from '../data/types';

/**
 * Zone capacity has no backend route, so it stays seeded — but it still honours
 * the region the console is scoped to, or the page would contradict the topbar.
 */
function useDispatchGeography() {
  const { region } = useAppState();
  const scope = region === ALL_REGIONS ? null : region;
  return {
    region: region === ALL_REGIONS ? 'any region' : region,
    zoneStatsInScope: scope ? zoneStats.filter((z) => z.region === scope) : zoneStats,
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
      <NoEndpoint
        what="Zone capacity"
        consequence="You cannot see how loaded each area's riders are."
      >
        <Card>
          <EmptyState
            heading={`No delivery zones in ${region}`}
            line="reeyo has not opened a zone in this region yet, so there is no capacity to report."
          />
        </Card>
      </NoEndpoint>
    );
  }

  // Grouped by region: a flat grid of every zone in the country is unreadable,
  // and capacity only means something next to its neighbours.
  const byRegion = new Map<string, typeof zoneStatsInScope>();
  for (const z of zoneStatsInScope) {
    byRegion.set(z.region, [...(byRegion.get(z.region) ?? []), z]);
  }

  return (
    <NoEndpoint
      what="Zone capacity"
      consequence="You cannot see how loaded each area's riders are."
    >
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
    </NoEndpoint>
  );
}

export default function Dispatch() {
  const t = useT();
  const { riders, isSample } = useAppState();
  const [tab, setTab] = useState('map');

  const riderColumns: Column<Rider>[] = [
    {
      key: 'name', header: t('Rider'),
      render: (r) => (
        <div>
          <div>{r.name}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.id}</div>
        </div>
      ),
    },
    { key: 'zone', header: t('Zone'), render: (r) => r.zone },
    { key: 'state', header: t('State'), render: (r) => <Pill status={r.state} /> },
  ];

  return (
    <>
      <PageTitle>{t('Live dispatch')}</PageTitle>

      <div style={{ marginBottom: 14 }}>
        <Segments
          ariaLabel="Dispatch view"
          value={tab}
          onChange={setTab}
          segments={[
            { value: 'map', label: t('Map') },
            { value: 'zones', label: t('Zones') },
            { value: 'capacity', label: t('Capacity') },
            { value: 'teams', label: t('Teams') },
            { value: 'fees', label: t('Delivery fees') },
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
      {tab === 'teams' && (
        <Suspense fallback={<Card><EmptyState heading="Loading…" line="Fetching the teams." /></Card>}>
          <TeamsPanel />
        </Suspense>
      )}
      {tab === 'fees' && (
        <Suspense fallback={<Card><EmptyState heading="Loading…" line="Fetching the fee table." /></Card>}>
          <FeesPanel />
        </Suspense>
      )}
    </>
  );
}
