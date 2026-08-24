import { useState, useMemo } from 'react';
import PageTitle from '../components/layout/PageTitle';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Pill from '../components/ui/Pill';
import MetricTile, { MetricRow } from '../components/ui/MetricTile';
import DataTable, { TableToolbar } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { FilterInput } from '../components/ui/Field';
import { money } from '../lib/format';
import { useAppState } from '../state/AppState';
import type { Customer } from '../data/types';

/** Segments are not order states, so they carry their own tokens. */
const SEGMENT_TOKEN: Record<string, string> = {
  loyal: 'go',
  active: 'parcel',
  new: 'watch',
  lapsed: 'calm',
};

export default function Customers() {
  const { customers, sampleOnly } = useAppState();
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => [c.name, c.zone, c.segment, c.id]
      .join(' ').toLowerCase().includes(q));
  }, [query, customers]);

  const spend = customers.reduce((sum, c) => sum + c.spend, 0);
  const loyal = customers.filter((c) => c.segment === 'loyal').length;
  const lapsed = customers.filter((c) => c.segment === 'lapsed').length;

  const columns: Column<Customer>[] = [
    {
      key: 'name', header: 'Customer',
      render: (c) => (
        <div>
          <div style={{ fontWeight: 600 }}>{c.name}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{c.id}</div>
        </div>
      ),
    },
    {
      key: 'zone', header: 'Zone',
      render: (c) => (
        <div>
          <div>{c.zone}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {c.city} · {c.region}
          </div>
        </div>
      ),
    },
    {
      key: 'orders', header: 'Orders', align: 'right',
      render: (c) => <span className="mono" style={{ fontSize: 12 }}>{c.orders}</span>,
    },
    {
      key: 'spend', header: 'Lifetime spend', align: 'right',
      render: (c) => <span className="mono" style={{ fontSize: 12 }}>{money(c.spend)}</span>,
    },
    {
      key: 'last', header: 'Last order', align: 'right',
      render: (c) => (
        <span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>
          {c.lastOrder}
        </span>
      ),
    },
    {
      key: 'rating', header: 'Rating', align: 'right',
      render: (c) => <span className="mono" style={{ fontSize: 12 }}>{c.rating}</span>,
    },
    {
      key: 'segment', header: 'Segment',
      render: (c) => <Pill status={c.segment} token={SEGMENT_TOKEN[c.segment]} />,
    },
  ];

  return (
    <>
      <PageTitle>Customers</PageTitle>

      <div style={{ marginBottom: 14 }}>
        <MetricRow>
          <MetricTile label="Customers" value={String(customers.length)} delta={sampleOnly(9)} note={sampleOnly('new this month')} />
          <MetricTile label="Lifetime spend" value={money(spend)} prefix="FCFA" delta={sampleOnly(14)} />
          <MetricTile label="Loyal" value={String(loyal)} note="ordered 40+ times" />
          <MetricTile label="Lapsed" value={String(lapsed)} note="worth a nudge" />
        </MetricRow>
      </div>

      <Card>
        <TableToolbar title="All customers" count={rows.length}>
          <FilterInput value={query} onChange={setQuery} placeholder="Filter by name or zone" />
        </TableToolbar>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(c) => c.id}
          minWidth={860}
          empty={{
            heading: 'No customer matches that filter',
            line: 'Nothing here matches what you typed, so there is nothing to act on.',
            action: <Button variant="primary" onClick={() => setQuery('')}>Clear filter</Button>,
          }}
        />
      </Card>
    </>
  );
}
