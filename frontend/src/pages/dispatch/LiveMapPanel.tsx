import { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Pill from '../../components/ui/Pill';
import EmptyState from '../../components/ui/EmptyState';
import LiveRiderMap from '../../components/domain/LiveRiderMap';
import { useRiderLocations } from '../../state/useRiderLocations';
import type { RiderLocation } from '../../data/types';

function Freshness({
  lastUpdated, polling, error,
}: { lastUpdated: Date | null; polling: boolean; error: string | null }) {
  if (error) {
    return (
      <span style={{ fontSize: 11.5, color: 'var(--stop)' }}>
        {error} Showing the last positions received.
      </span>
    );
  }
  if (!polling) {
    return (
      <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
        Paused while this tab is in the background
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
      <span
        aria-hidden="true"
        className="reeyo-pulse"
        style={{
          width: 7, height: 7, borderRadius: '50%',
          background: 'var(--emerald)', flexShrink: 0,
        }}
      />
      <span className="eyebrow">Live</span>
      {lastUpdated && (
        <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>
          {lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      )}
    </span>
  );
}

function RiderRow({
  rider, selected, onSelect,
}: { rider: RiderLocation; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        padding: '9px 11px', textAlign: 'left',
        border: `1px solid ${selected ? 'var(--emerald)' : 'var(--line)'}`,
        background: selected ? 'var(--go-soft)' : 'var(--card)',
        borderRadius: 'var(--r-ctrl)', cursor: 'pointer',
        fontFamily: 'var(--sans)', color: 'var(--text)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{rider.name}</div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
          {rider.riderId}
        </div>
      </div>
      {rider.currentOrderId
        ? <Pill status="on a delivery" />
        : <Pill status="idle" />}
    </button>
  );
}

/**
 * Live rider positions.
 *
 * The rebuild shipped a hand-drawn SVG here while the previous admin panel was
 * polling `/riders/live-locations` for real. This is that capability restored:
 * real coordinates on a real map, refreshed every twelve seconds.
 */
export default function LiveMapPanel() {
  const [country, setCountry] = useState('');
  const {
    riders, loading, error, sample, lastUpdated, polling, refresh,
  } = useRiderLocations(country || undefined);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (sample) {
    return (
      <Card title="Fleet position">
        <EmptyState
          heading="Rider positions need a live session"
          line="This map plots what /riders/live-locations reports. Sample mode has no
            positions to plot, and drawing invented ones on a real map would be the
            least honest thing in the console."
        />
      </Card>
    );
  }

  const onDelivery = riders.filter((r) => r.currentOrderId).length;

  return (
    <div className="reeyo-split">
      <Card
        title="Fleet position"
        action={<Freshness lastUpdated={lastUpdated} polling={polling} error={error} />}
      >
        {loading && riders.length === 0 ? (
          <EmptyState heading="Loading…" line="Fetching rider positions from the platform." />
        ) : riders.length === 0 ? (
          <EmptyState
            heading="No riders are reporting a position"
            line={country
              ? `No rider in ${country} is sending location updates right now.`
              : 'Riders appear here as soon as their app starts reporting.'}
            action={country
              ? <Button variant="primary" onClick={() => setCountry('')}>Clear country</Button>
              : undefined}
          />
        ) : (
          <LiveRiderMap
            riders={riders}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        )}
      </Card>

      <Card
        title="Riders reporting"
        action={(
          <span className="mono" style={{ fontSize: 12, color: 'var(--text-3)' }}>
            {onDelivery}/{riders.length}
          </span>
        )}
      >
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          <input
            value={country}
            onChange={(e) => setCountry(e.target.value.toUpperCase().slice(0, 2))}
            placeholder="Country"
            aria-label="Filter riders by country code"
            className="mono"
            style={{
              height: 34, flex: 1, minWidth: 0,
              borderRadius: 'var(--r-ctrl)', border: '1px solid var(--line)',
              background: 'var(--card)', color: 'var(--text)',
              padding: '0 11px', fontSize: 12, textTransform: 'uppercase',
            }}
          />
          <Button variant="outline" onClick={refresh}>Refresh</Button>
        </div>

        {riders.length === 0 ? (
          <EmptyState
            heading="Nobody on the map"
            line="No rider is reporting a position, so there is nothing to follow."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {riders.map((r) => (
              <RiderRow
                key={r.riderId}
                rider={r}
                selected={r.riderId === selectedId}
                onSelect={() => setSelectedId(
                  r.riderId === selectedId ? null : r.riderId,
                )}
              />
            ))}
          </div>
        )}

        <p style={{ margin: '12px 0 0', fontSize: 11, color: 'var(--text-3)' }}>
          Positions refresh every 12 seconds while this tab is in front.
        </p>
      </Card>
    </div>
  );
}
