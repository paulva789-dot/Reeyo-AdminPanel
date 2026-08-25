import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageTitle from '../components/layout/PageTitle';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Segments from '../components/ui/Segments';
import DataTable, { TableToolbar } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { FilterInput } from '../components/ui/Field';
import Pill from '../components/ui/Pill';
import OrderDrawer from '../components/domain/OrderDrawer';
import { useAppState } from '../state/useAppState';
import { resources } from '../services/resources';
import { money, isLate } from '../lib/format';
import type { Order } from '../data/types';

export default function Orders() {
  const { orders, isSample } = useAppState();
  const [params, setParams] = useSearchParams();
  const vertical = params.get('vertical') ?? 'all';
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Order | null>(null);
  // Keyed by the query it answers, so a stale result is ignored rather than
  // needing a synchronous reset inside the effect.
  const [remote, setRemote] = useState<{ query: string; rows: Order[] } | null>(null);
  const [searching, setSearching] = useState(false);

  // The loaded page is only the most recent slice, so a filter that matches
  // nothing locally is asked of the backend, which searches the whole dataset.
  useEffect(() => {
    const q = query.trim();
    if (isSample || q.length < 2) return;

    const timer = setTimeout(() => {
      setSearching(true);
      resources.searchOrders(q)
        .then((rows) => setRemote({ query: q, rows }))
        .catch(() => setRemote({ query: q, rows: [] }))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [query, isSample]);

  const byVertical = useMemo(
    () => (vertical === 'all' ? orders : orders.filter((o) => o.vertical === vertical)),
    [orders, vertical],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return byVertical;
    const local = byVertical.filter((o) => [o.id, o.customer, o.vendor, o.rider ?? '', o.zone]
      .join(' ').toLowerCase().includes(q));
    // Prefer local hits; fall back to the backend's answer for this exact
    // query, ignoring any result that belongs to something typed earlier.
    if (local.length > 0) return local;
    if (!remote || remote.query !== query.trim()) return local;
    return vertical === 'all'
      ? remote.rows
      : remote.rows.filter((o) => o.vertical === vertical);
  }, [byVertical, query, remote, vertical]);

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
    {
      key: 'zone', header: 'Zone',
      render: (o) => (
        <div>
          <div>{o.zone}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {o.city} · {o.region}
          </div>
        </div>
      ),
    },
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
      // Read-only. admin-api has no generic status update: an order's status is
      // moved by the platform, and the only status a console can set is
      // cancelled, which lives in the drawer because it needs a reason.
      key: 'status',
      header: 'Status',
      render: (o) => <Pill status={o.status} />,
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
          {searching && (
            <span className="eyebrow" style={{ marginRight: 4 }}>Searching</span>
          )}
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
            line: isSample
              ? 'Nothing here matches what you typed, so there is nothing to act on.'
              : 'Nothing matches, on this page or anywhere else in the order history.',
            action: <Button variant="primary" onClick={() => setQuery('')}>Clear filter</Button>,
          }}
        />
      </Card>

      {open && <OrderDrawer order={open} onClose={() => setOpen(null)} />}
    </>
  );
}
