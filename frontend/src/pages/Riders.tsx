import { useState, useMemo, useCallback } from 'react';
import { useT } from '../i18n/useT';
import PageTitle from '../components/layout/PageTitle';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Pill from '../components/ui/Pill';
import MetricTile, { MetricRow } from '../components/ui/MetricTile';
import DataTable, { TableToolbar } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { FilterInput } from '../components/ui/Field';
import { Drawer, Modal, FooterSpacer } from '../components/ui/Overlay';
import Field, { Select } from '../components/ui/Field';
import { ApiError } from '../services/apiClient';
import OrderHistory from '../components/domain/OrderHistory';
import ReasonModal from './approvals/ReasonModal';
import { platform } from '../services/platformResources';
import { useDetail } from '../state/useDetail';
import { useAppState } from '../state/useAppState';
import { useDateRange, withinRange } from '../state/useDateRange';
import { money } from '../lib/format';

import type { Rider } from '../data/types';


/**
 * `PATCH /riders/:id`. Zone is deliberately absent: the console derives a
 * rider's city and region from their zone, and there is no endpoint that
 * returns the zone vocabulary the platform will accept, so offering a free-text
 * zone field would invite writing a value nothing else recognises.
 */
function RiderEditModal({ rider, onClose }: { rider: Rider; onClose: () => void }) {
  const { pushToast } = useAppState();
  const [name, setName] = useState(rider.name);
  const [phone, setPhone] = useState(rider.phone);
  const [vehicle, setVehicle] = useState<string>(rider.vehicle);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const dirty = name.trim() !== rider.name
    || phone.trim() !== rider.phone
    || vehicle !== rider.vehicle;

  const save = async () => {
    if (!name.trim()) {
      setError('A rider needs a name');
      return;
    }
    if (!phone.trim()) {
      setError('A rider needs a phone number — dispatch calls it');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await platform.updateRider(rider.id, {
        name: name.trim(),
        phone: phone.trim(),
        vehicle_type: vehicle,
      });
      pushToast(`${name.trim()} updated`);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError
        ? `Not saved — ${err.message}`
        : 'Not saved.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`Edit ${rider.name}`}
      subtitle={`${rider.zone} · ${rider.city}`}
      onClose={onClose}
      width={460}
      footer={(
        <>
          <FooterSpacer />
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={busy || !dirty}
            title={dirty ? undefined : 'Nothing has changed'}
            onClick={() => void save()}
          >
            {busy ? 'Saving…' : 'Save rider'}
          </Button>
        </>
      )}
    >
      <Field label="Name" value={name} onChange={(v) => { setName(v); setError(''); }} />
      <div style={{ marginTop: 12 }}>
        <Field
          label="Phone"
          value={phone}
          onChange={(v) => { setPhone(v); setError(''); }}
          mono
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <Select
          label="Vehicle"
          value={vehicle}
          onChange={setVehicle}
          options={[
            { value: 'Moto', label: 'Moto' },
            { value: 'Bicycle', label: 'Bicycle' },
            { value: 'Car', label: 'Car' },
          ]}
        />
      </div>
      {error && (
        <p style={{ margin: '9px 0 0', fontSize: 12, color: 'var(--stop)' }}>{error}</p>
      )}
    </Modal>
  );
}

function RiderDrawer({ rider, onClose }: { rider: Rider; onClose: () => void }) {
  const { orders, suspendRider } = useAppState();
  const [suspending, setSuspending] = useState(false);
  const [editing, setEditing] = useState(false);
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
            <Button variant="primary" onClick={() => setEditing(true)}>Edit rider</Button>
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

      {editing && <RiderEditModal rider={rider} onClose={() => setEditing(false)} />}

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
  const t = useT();
  const { riders, orders, sampleOnly } = useAppState();
  const { range } = useDateRange();

  /**
   * Deliveries each rider carried inside the date range — a column, not a
   * filter. Hiding a rider who was off yesterday would make the fleet list
   * useless for the one thing it is for: finding a rider.
   */
  const inPeriod = useMemo(() => {
    const counts = new Map<string, number>();
    for (const o of orders) {
      if (!o.rider || !withinRange(o.placedAt, range)) continue;
      counts.set(o.rider, (counts.get(o.rider) ?? 0) + 1);
    }
    return counts;
  }, [orders, range]);
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
      key: 'name', header: t('Rider'),
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.name}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.phone}</div>
        </div>
      ),
    },
    {
      key: 'zone', header: t('Zone'),
      render: (r) => (
        <div>
          <div>{r.zone}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {r.city} · {r.region}
          </div>
        </div>
      ),
    },
    { key: 'vehicle', header: t('Vehicle'), render: (r) => r.vehicle },
    {
      key: 'trips', header: t('Trips'), align: 'right',
      render: (r) => <span className="mono" style={{ fontSize: 12 }}>{r.trips}</span>,
    },
    {
      // Scoped by the date range in the topbar (spec 2.3).
      key: 'period', header: t('In period'), align: 'right',
      render: (r) => {
        const count = inPeriod.get(r.name) ?? 0;
        return (
          <span
            className="mono"
            style={{ fontSize: 12, color: count > 0 ? 'var(--forest)' : 'var(--text-3)' }}
          >
            {count}
          </span>
        );
      },
    },
    {
      key: 'rating', header: t('Rating'), align: 'right',
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
      key: 'owed', header: t('Owed'), align: 'right',
      render: (r) => <span className="mono" style={{ fontSize: 12 }}>{money(r.owed)}</span>,
    },
    { key: 'state', header: t('State'), render: (r) => <Pill status={r.state} /> },
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
      <PageTitle>{t('Riders')}</PageTitle>

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
