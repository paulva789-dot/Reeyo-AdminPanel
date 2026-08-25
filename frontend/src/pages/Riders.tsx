import { useState, useMemo, useCallback } from 'react';
import PageTitle from '../components/layout/PageTitle';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Pill from '../components/ui/Pill';
import MetricTile, { MetricRow } from '../components/ui/MetricTile';
import DataTable, { TableToolbar } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { FilterInput } from '../components/ui/Field';
import { Drawer, FooterSpacer } from '../components/ui/Overlay';
import OrderHistory from '../components/domain/OrderHistory';
import ReasonModal from './approvals/ReasonModal';
import { platform } from '../services/platformResources';
import { useDetail } from '../state/useDetail';
import { useAppState } from '../state/useAppState';
import { money } from '../lib/format';

import type { Rider } from '../data/types';

function RiderDrawer({ rider, onClose }: { rider: Rider; onClose: () => void }) {
  const { orders, suspendRider } = useAppState();
  const [suspending, setSuspending] = useState(false);
  const fetcher = useCallback(() => platform.riderDeliveries(rider.id), [rider.id]);
  const history = useDetail(rider.id, fetcher);

  const theirs = useMemo(
    () => orders.filter((o) => o.rider === rider.name),
    [orders, rider.name],
  );

  return (
    <>
      <Drawer
        title={rider.name}
        subtitle={`${rider.vehicle} · ${rider.zone} · ${rider.city}`}
        onClose={onClose}
        footer={(
          <>
            <Button variant="destructive" onClick={() => setSuspending(true)}>Suspend</Button>
            <FooterSpacer />
          </>
        )}
      >
        <div style={{ marginBottom: 16 }}>
          <Pill status={rider.state} />
        </div>

        <MetricRow>
          <MetricTile label="Trips" value={String(rider.trips)} />
          <MetricTile label="Rating" value={String(rider.rating)} />
          <MetricTile label="Owed" value={money(rider.owed)} prefix="FCFA" />
        </MetricRow>

        <div style={{ marginTop: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 9 }}>Deliveries</div>
          <div
            style={{
              background: 'var(--card)', border: '1px solid var(--line)',
              borderRadius: 'var(--r-card)', padding: '4px 14px 12px',
            }}
          >
            <OrderHistory
              history={history}
              fallback={theirs}
              emptyLine={`${rider.name} has completed no deliveries.`}
            />
          </div>
        </div>

        <p style={{ margin: '14px 0 0', fontSize: 11, color: 'var(--text-3)' }}>
          What {rider.name} is owed is released from the payouts queue, not from
          here — there is no rider-level route that releases money.
        </p>
      </Drawer>

      {suspending && (
        <ReasonModal
          title="Suspend this rider"
          subtitle={`${rider.name} · ${rider.zone}`}
          explain="They stop receiving deliveries immediately. A Super Admin can lift it."
          placeholder="Three orders marked delivered without reaching the customer."
          confirmLabel="Suspend rider"
          cancelLabel="Leave on shift"
          onConfirm={(reason) => { suspendRider(rider.id, reason); setSuspending(false); onClose(); }}
          onClose={() => setSuspending(false)}
        />
      )}
    </>
  );
}

export default function Riders() {
  const { riders, sampleOnly } = useAppState();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Rider | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return riders;
    return riders.filter((r) => [r.name, r.zone, r.vehicle, r.id, r.state]
      .join(' ').toLowerCase().includes(q));
  }, [query, riders]);

  const zoneSpread = new Set(riders.map((r) => r.zone)).size;
  const owed = riders.reduce((sum, r) => sum + r.owed, 0);
  const onShift = riders.filter((r) => r.state !== 'idle').length;
  const avgRating = (riders.reduce((s, r) => s + r.rating, 0) / riders.length).toFixed(1);

  const columns: Column<Rider>[] = [
    {
      key: 'name', header: 'Rider',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.name}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.phone}</div>
        </div>
      ),
    },
    {
      key: 'zone', header: 'Zone',
      render: (r) => (
        <div>
          <div>{r.zone}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {r.city} · {r.region}
          </div>
        </div>
      ),
    },
    { key: 'vehicle', header: 'Vehicle', render: (r) => r.vehicle },
    {
      key: 'trips', header: 'Trips', align: 'right',
      render: (r) => <span className="mono" style={{ fontSize: 12 }}>{r.trips}</span>,
    },
    {
      key: 'rating', header: 'Rating', align: 'right',
      // Below 4.2 reads red — section 8.5
      render: (r) => (
        <span
          className="mono"
          style={{ fontSize: 12, color: r.rating < 4.2 ? 'var(--stop)' : 'var(--text-2)' }}
        >
          {r.rating}
        </span>
      ),
    },
    {
      key: 'owed', header: 'Owed', align: 'right',
      render: (r) => <span className="mono" style={{ fontSize: 12 }}>{money(r.owed)}</span>,
    },
    { key: 'state', header: 'State', render: (r) => <Pill status={r.state} /> },
    {
      // Releasing money happens in the payouts queue; there is no rider-level
      // route for it, so this opens what the console can actually show.
      key: 'action', header: '', align: 'right',
      render: (r) => (
        <Button variant="soft" onClick={() => setOpen(r)}>Deliveries</Button>
      ),
    },
  ];

  return (
    <>
      <PageTitle>Riders</PageTitle>

      <div style={{ marginBottom: 14 }}>
        <MetricRow>
          <MetricTile
            label="Fleet size" value={String(riders.length)}
            note={`across ${zoneSpread} ${zoneSpread === 1 ? 'zone' : 'zones'}`}
          />
          <MetricTile label="On shift" value={String(onShift)} note={`of ${riders.length}`} />
          <MetricTile label="Owed to riders" value={money(owed)} prefix="FCFA" />
          <MetricTile label="Average rating" value={avgRating} note={sampleOnly('steady')} />
        </MetricRow>
      </div>

      <Card>
        <TableToolbar title="All riders" count={rows.length}>
          <FilterInput value={query} onChange={setQuery} placeholder="Filter by name or zone" />
        </TableToolbar>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          minWidth={900}
          empty={{
            heading: 'No rider matches that filter',
            line: 'Nothing here matches what you typed, so there is nothing to act on.',
            action: <Button variant="primary" onClick={() => setQuery('')}>Clear filter</Button>,
          }}
        />
      </Card>

      {open && <RiderDrawer rider={open} onClose={() => setOpen(null)} />}
    </>
  );
}
