import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageTitle from '../components/layout/PageTitle';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Segments from '../components/ui/Segments';
import DataTable, { TableToolbar } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { FilterInput, Select } from '../components/ui/Field';
import OrderDrawer from '../components/domain/OrderDrawer';
import { useAppState } from '../state/AppState';
import { money, isLate } from '../lib/format';
import type { Order, OrderStatus } from '../data/types';

const STATUSES: OrderStatus[] = [
  'new', 'accepted', 'preparing', 'ready', 'on the way', 'delivered', 'cancelled', 'delayed',
];

export default function Orders() {
  const { orders, setOrderStatus } = useAppState();
  const [params, setParams] = useSearchParams();
  const vertical = params.get('vertical') ?? 'all';
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Order | null>(null);

  const byVertical = useMemo(
    () => (vertical === 'all' ? orders : orders.filter((o) => o.vertical === vertical)),
    [orders, vertical],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return byVertical;
    return byVertical.filter((o) => [o.id, o.customer, o.vendor, o.rider ?? '', o.zone]
      .join(' ').toLowerCase().includes(q));
  }, [byVertical, query]);

  const columns: Column<Order>[] = [
    {
      key: 'order',
      header: 'Order',
      render: (o) => (
        <div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--forest)', fontWeight: 600 }}>
            {o.id}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{o.placedAgo}</div>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (o) => (
        <div>
          <div>{o.customer}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{o.payment}</div>
        </div>
      ),
    },
    { key: 'vendor', header: 'Vendor', render: (o) => o.vendor },
    {
      key: 'rider',
      header: 'Rider',
      render: (o) => (o.rider
        ? o.rider
        : <span style={{ color: 'var(--text-3)' }}>Unassigned</span>),
    },
    { key: 'zone', header: 'Zone', render: (o) => o.zone },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (o) => <span className="mono" style={{ fontSize: 12 }}>{money(o.total)}</span>,
    },
    {
      key: 'eta',
      header: 'ETA',
      align: 'right',
      render: (o) => (
        <span
          className="mono"
          style={{ fontSize: 12, color: isLate(o.eta) ? 'var(--stop)' : 'var(--text-2)' }}
        >
          {o.eta}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (o) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Select
            compact
            label={`Status for ${o.id}`}
            value={o.status}
            onChange={(v) => setOrderStatus(o.id, v as OrderStatus)}
            options={STATUSES.map((s) => ({ value: s, label: s }))}
          />
        </div>
      ),
    },
    {
      key: 'open',
      header: '',
      align: 'right',
      render: (o) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Button variant="soft" onClick={() => setOpen(o)}>Open</Button>
        </div>
      ),
    },
  ];

  const count = (v: string) => (v === 'all'
    ? orders.length
    : orders.filter((o) => o.vertical === v).length);

  return (
    <>
      <PageTitle>Orders</PageTitle>

      <div style={{ marginBottom: 14 }}>
        <Segments
          ariaLabel="Filter orders by service"
          value={vertical}
          onChange={(v) => setParams(v === 'all' ? {} : { vertical: v })}
          segments={[
            { value: 'all', label: 'All', count: count('all') },
            { value: 'food', label: 'Food', count: count('food') },
            { value: 'grocery', label: 'Grocery', count: count('grocery') },
            { value: 'parcel', label: 'Parcel', count: count('parcel') },
          ]}
        />
      </div>

      <Card>
        <TableToolbar title="All orders" count={rows.length}>
          <FilterInput
            value={query}
            onChange={setQuery}
            placeholder="Filter by ID, name or zone"
          />
        </TableToolbar>

        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(o) => o.id}
          minWidth={980}
          empty={{
            heading: 'No order matches that filter',
            line: 'Nothing here matches what you typed, so there is nothing to act on.',
            action: <Button variant="primary" onClick={() => setQuery('')}>Clear filter</Button>,
          }}
        />
      </Card>

      {open && <OrderDrawer order={open} onClose={() => setOpen(null)} />}
    </>
  );
}
