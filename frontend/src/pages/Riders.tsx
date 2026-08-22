import { useState, useMemo } from 'react';
import PageTitle from '../components/layout/PageTitle';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Pill from '../components/ui/Pill';
import MetricTile, { MetricRow } from '../components/ui/MetricTile';
import DataTable, { TableToolbar } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { FilterInput } from '../components/ui/Field';
import { useAppState } from '../state/AppState';
import { money } from '../lib/format';
import { riders } from '../data/seed';
import type { Rider } from '../data/types';

export default function Riders() {
  const { pushToast } = useAppState();
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return riders;
    return riders.filter((r) => [r.name, r.zone, r.vehicle, r.id, r.state]
      .join(' ').toLowerCase().includes(q));
  }, [query]);

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
    { key: 'zone', header: 'Zone', render: (r) => r.zone },
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
      key: 'action', header: '', align: 'right',
      render: (r) => (
        <Button
          variant="soft"
          onClick={() => pushToast(`FCFA ${money(r.owed)} released to ${r.name}`)}
        >
          Release payout
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageTitle>Riders</PageTitle>

      <div style={{ marginBottom: 14 }}>
        <MetricRow>
          <MetricTile label="Fleet size" value={String(riders.length)} note="across five zones" />
          <MetricTile label="On shift" value={String(onShift)} delta={2} deltaSuffix="" note="vs this hour" />
          <MetricTile label="Owed to riders" value={money(owed)} prefix="FCFA" />
          <MetricTile label="Average rating" value={avgRating} delta={0} note="steady" />
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
    </>
  );
}
