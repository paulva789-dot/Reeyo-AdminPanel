import { useState, useMemo, useEffect } from 'react';
import { useT } from '../i18n/useT';
import { useSearchParams } from 'react-router-dom';
import PageTitle from '../components/layout/PageTitle';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Segments from '../components/ui/Segments';
import DataTable, { TableToolbar } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { FilterInput, Select } from '../components/ui/Field';
import Pill from '../components/ui/Pill';
import OrderDrawer from '../components/domain/OrderDrawer';
import EditStatusModal from '../components/domain/EditStatusModal';
import { columnWords } from '../components/domain/orderVocabulary';
import { useAppState } from '../state/useAppState';
import { useDateRange, withinRange } from '../state/useDateRange';
import { resources } from '../services/resources';
import { money, isLate } from '../lib/format';
import { ORDER_FLOW, PAYMENT_METHOD_LIST } from '../data/types';
import type { Order } from '../data/types';

const ANY = 'any';

/** The clock beside the date, since §3.1 asks for date *and* time placed. */
function placedAt(order: Order): string {
  const at = new Date(order.placedAt);
  if (Number.isNaN(at.getTime())) return order.placedAgo;
  return at.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function placedOn(order: Order): string {
  const at = new Date(order.placedAt);
  if (Number.isNaN(at.getTime())) return '—';
  return at.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function Orders() {
  const t = useT();
  const { orders, isSample, setOrderStage } = useAppState();
  const { range } = useDateRange();
  const [params, setParams] = useSearchParams();
  const vertical = params.get('vertical') ?? 'all';
  const [query, setQuery] = useState(() => params.get('q') ?? '');
  const [open, setOpen] = useState<Order | null>(null);
  const [quickStatus, setQuickStatus] = useState<Order | null>(null);

  // §3.1 filters, beyond the service segments and the shared date range.
  const [status, setStatus] = useState<string>(ANY);
  const [zone, setZone] = useState<string>(ANY);
  const [payment, setPayment] = useState<string>(ANY);
  const [rider, setRider] = useState<string>(ANY);

  // Keyed by the query it answers, so a stale result is ignored rather than
  // needing a synchronous reset inside the effect.
  const [remote, setRemote] = useState<{ query: string; rows: Order[] } | null>(null);
  const [searching, setSearching] = useState(false);

  // A term handed over from the topbar search arrives as ?q=. Adjusting during
  // render rather than in an effect means the table never paints one frame of
  // unfiltered rows before the search applies.
  const handedOver = params.get('q');
  const [seenQ, setSeenQ] = useState(handedOver);
  if (seenQ !== handedOver) {
    setSeenQ(handedOver);
    if (handedOver !== null) setQuery(handedOver);
  }

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

  const zones = useMemo(
    () => [...new Set(orders.map((o) => o.zone))].sort(),
    [orders],
  );
  const riders = useMemo(
    () => [...new Set(orders.map((o) => o.rider).filter((r): r is string => Boolean(r)))].sort(),
    [orders],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    const narrow = (list: Order[]) => list.filter((o) => {
      if (!withinRange(o.placedAt, range)) return false;
      if (status !== ANY && o.status !== status) return false;
      if (zone !== ANY && o.zone !== zone) return false;
      if (payment !== ANY && o.payment !== payment) return false;
      if (rider !== ANY && (o.rider ?? '') !== rider) return false;
      return true;
    });

    const base = narrow(byVertical);
    if (!q) return sortForOperator(base);

    // §3.1 — search by order ID, customer, phone number or vendor.
    const local = base.filter((o) => [
      o.id, o.customer, o.vendor, o.rider ?? '', o.zone,
      o.to.phone, o.from.phone,
    ].join(' ').toLowerCase().includes(q));

    if (local.length > 0) return sortForOperator(local);
    if (!remote || remote.query !== query.trim()) return local;
    return sortForOperator(narrow(
      vertical === 'all' ? remote.rows : remote.rows.filter((o) => o.vertical === vertical),
    ));
  }, [byVertical, query, remote, vertical, range, status, zone, payment, rider]);

  const words = columnWords(rows);

  const columns: Column<Order>[] = [
    {
      key: 'order',
      header: t('Order'),
      render: (o) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* New and unacknowledged orders are marked until opened (§3.1). */}
          {!o.acknowledged && (
            <span
              aria-label="Not yet opened"
              title="Not yet opened"
              style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                background: 'var(--emerald)',
              }}
            />
          )}
          <div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--forest)', fontWeight: 600 }}>
              {o.id}
            </div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>
              {placedOn(o)} {placedAt(o)}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'service',
      header: t('Service'),
      render: (o) => <Pill status={o.vertical} token={o.vertical} />,
    },
    {
      key: 'customer',
      header: words.to,
      render: (o) => (
        <div>
          <div>{o.customer}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {o.to.phone || '—'}
          </div>
        </div>
      ),
    },
    { key: 'vendor', header: words.from, render: (o) => o.vendor },
    {
      key: 'rider',
      header: t('Rider'),
      render: (o) => (o.rider
        ? o.rider
        : <span style={{ color: 'var(--text-3)' }}>Unassigned</span>),
    },
    {
      key: 'zone', header: t('Zone'),
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
      header: t('Total'),
      align: 'right',
      render: (o) => <span className="mono" style={{ fontSize: 12 }}>{money(o.total)}</span>,
    },
    {
      key: 'payment',
      header: t('Payment'),
      render: (o) => (
        <div>
          <div style={{ fontSize: 12 }}>{o.payment}</div>
          <div style={{ fontSize: 11, color: o.paymentStatus === 'Paid' ? 'var(--go)' : 'var(--watch)' }}>
            {o.paymentStatus.toLowerCase()}
          </div>
        </div>
      ),
    },
    {
      key: 'eta',
      header: t('ETA'),
      align: 'right',
      render: (o) => (
        <span
          className="mono"
          style={{
            fontSize: 12,
            color: o.isLate || isLate(o.eta) ? 'var(--stop)' : 'var(--text-2)',
          }}
        >
          {o.eta}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('Status'),
      render: (o) => <Pill status={o.status} />,
    },
    {
      key: 'open',
      header: '',
      align: 'right',
      render: (o) => (
        <div onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', gap: 6 }}>
          {/* §3.2 asks for the status control as a quick action on the row as
              well as on the detail, so a run of orders can be moved without
              opening each one. */}
          <Button variant="soft" onClick={() => setQuickStatus(o)}>Status</Button>
          <Button variant="outline" onClick={() => setOpen(o)}>Open</Button>
        </div>
      ),
    },
  ];

  const count = (v: string) => (v === 'all'
    ? orders.length
    : orders.filter((o) => o.vertical === v).length);

  const filtersOn = status !== ANY || zone !== ANY || payment !== ANY || rider !== ANY;

  return (
    <>
      <PageTitle>{t('Orders')}</PageTitle>

      <div style={{ marginBottom: 14 }}>
        <Segments
          ariaLabel="Filter orders by service"
          value={vertical}
          onChange={(v) => setParams(v === 'all' ? {} : { vertical: v })}
          segments={[
            { value: 'all', label: t('All'), count: count('all') },
            { value: 'food', label: t('Food'), count: count('food') },
            { value: 'grocery', label: t('Grocery'), count: count('grocery') },
            { value: 'parcel', label: t('Parcel'), count: count('parcel') },
          ]}
        />
      </div>

      <Card style={{ marginBottom: 14 }}>
        <div
          style={{
            display: 'grid', gap: 10,
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          }}
        >
          <Select
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: ANY, label: t('Any status') },
              ...ORDER_FLOW.map((s) => ({ value: s, label: s })),
              { value: 'cancelled', label: 'cancelled' },
              { value: 'failed', label: 'failed / returned' },
            ]}
          />
          <Select
            label="Zone"
            value={zone}
            onChange={setZone}
            options={[
              { value: ANY, label: t('Any zone') },
              ...zones.map((z) => ({ value: z, label: z })),
            ]}
          />
          <Select
            label="Payment method"
            value={payment}
            onChange={setPayment}
            options={[
              { value: ANY, label: t('Any method') },
              ...PAYMENT_METHOD_LIST.map((m) => ({ value: m, label: m })),
            ]}
          />
          <Select
            label="Rider"
            value={rider}
            onChange={setRider}
            options={[
              { value: ANY, label: t('Any rider') },
              ...riders.map((r) => ({ value: r, label: r })),
            ]}
          />
        </div>
        {filtersOn && (
          <div style={{ display: 'flex', marginTop: 10 }}>
            <div style={{ flex: 1 }} />
            <Button
              variant="outline"
              onClick={() => {
                setStatus(ANY); setZone(ANY); setPayment(ANY); setRider(ANY);
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </Card>

      <Card>
        <TableToolbar title="All orders" count={rows.length}>
          {searching && (
            <span className="eyebrow" style={{ marginRight: 4 }}>Searching</span>
          )}
          <FilterInput
            value={query}
            onChange={setQuery}
            placeholder="ID, name, phone or vendor"
          />
        </TableToolbar>

        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(o) => o.id}
          onRowClick={setOpen}
          minWidth={1180}
          empty={{
            heading: 'No order matches that filter',
            line: isSample
              ? 'Nothing here matches what you chose, so there is nothing to act on.'
              : 'Nothing matches, on this page or anywhere else in the order history.',
            action: (
              <Button
                variant="primary"
                onClick={() => {
                  setQuery('');
                  setStatus(ANY); setZone(ANY); setPayment(ANY); setRider(ANY);
                }}
              >
                Clear filter
              </Button>
            ),
          }}
        />
      </Card>

      {open && <OrderDrawer order={open} onClose={() => setOpen(null)} />}

      {quickStatus && (
        <EditStatusModal
          order={quickStatus}
          onApply={(stage, detail) => {
            setOrderStage(quickStatus.id, stage, detail);
            setQuickStatus(null);
          }}
          onClose={() => setQuickStatus(null)}
        />
      )}
    </>
  );
}

/**
 * Unopened orders first, then oldest first within each group.
 *
 * §3.1 asks for new orders pinned to the top. The second half matters as much:
 * among orders that all need attention, the one that has been waiting longest
 * is the one closest to becoming a complaint.
 */
function sortForOperator(list: Order[]): Order[] {
  return [...list].sort((a, b) => {
    if (a.acknowledged !== b.acknowledged) return a.acknowledged ? 1 : -1;
    return new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime();
  });
}
