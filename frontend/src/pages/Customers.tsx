import { useState, useMemo, useCallback } from 'react';
import PageTitle from '../components/layout/PageTitle';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Pill from '../components/ui/Pill';
import MetricTile, { MetricRow } from '../components/ui/MetricTile';
import DataTable, { TableToolbar } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { FilterInput } from '../components/ui/Field';
import { Drawer, Modal, FooterSpacer } from '../components/ui/Overlay';
import OrderHistory from '../components/domain/OrderHistory';
import ReasonModal from './approvals/ReasonModal';
import { platform } from '../services/platformResources';
import { useDetail } from '../state/useDetail';
import { money } from '../lib/format';
import { useAppState } from '../state/useAppState';
import type { Customer } from '../data/types';

function CustomerDrawer({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const { orders, suspendCustomer, unsuspendCustomer, deleteCustomer } = useAppState();
  const [suspending, setSuspending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fetcher = useCallback(() => platform.userOrders(customer.id), [customer.id]);
  const history = useDetail(customer.id, fetcher);

  const theirs = useMemo(
    () => orders.filter((o) => o.customer === customer.name),
    [orders, customer.name],
  );

  return (
    <>
      <Drawer
        title={customer.name}
        subtitle={`${customer.zone} · ${customer.city} · last ordered ${customer.lastOrder}`}
        onClose={onClose}
        footer={(
          <>
            <Button variant="destructive" onClick={() => setDeleting(true)}>Delete</Button>
            <FooterSpacer />
            <Button variant="outline" onClick={() => unsuspendCustomer(customer.id)}>
              Reinstate
            </Button>
            <Button variant="outline" onClick={() => setSuspending(true)}>Suspend</Button>
          </>
        )}
      >
        <div style={{ marginBottom: 16 }}>
          <Pill status={customer.segment} token={SEGMENT_TOKEN[customer.segment]} />
        </div>

        <MetricRow>
          <MetricTile label="Orders" value={String(customer.orders)} />
          <MetricTile label="Spend" value={money(customer.spend)} prefix="FCFA" />
        </MetricRow>

        <div style={{ marginTop: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 9 }}>Order history</div>
          <div
            style={{
              background: 'var(--card)', border: '1px solid var(--line)',
              borderRadius: 'var(--r-card)', padding: '4px 14px 12px',
            }}
          >
            <OrderHistory
              history={history}
              fallback={theirs}
              emptyLine={`${customer.name} has not ordered.`}
            />
          </div>
        </div>

        <p style={{ margin: '14px 0 0', fontSize: 11, color: 'var(--text-3)' }}>
          The customers list carries no suspension state, so this drawer cannot
          show whether {customer.name} is currently suspended — only carry the
          act out.
        </p>
      </Drawer>

      {suspending && (
        <ReasonModal
          title="Suspend this customer"
          subtitle={`${customer.name} · ${customer.zone}`}
          explain="They can no longer place orders. Reinstating is one click, from here."
          placeholder="Repeated refused deliveries at the door."
          confirmLabel="Suspend customer"
          cancelLabel="Leave as is"
          onConfirm={(reason) => { suspendCustomer(customer.id, reason); setSuspending(false); }}
          onClose={() => setSuspending(false)}
        />
      )}

      {deleting && (
        <Modal
          title="Delete this customer"
          subtitle={customer.name}
          onClose={() => setDeleting(false)}
          width={440}
          footer={(
            <>
              <FooterSpacer />
              <Button variant="outline" onClick={() => setDeleting(false)}>Keep the account</Button>
              <Button
                variant="destructive"
                onClick={() => { deleteCustomer(customer.id); setDeleting(false); onClose(); }}
              >
                Delete account
              </Button>
            </>
          )}
        >
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-2)' }}>
            This removes the account from the platform and cannot be undone from
            here. If you only want to stop them ordering, suspend them instead —
            that keeps their history and can be lifted.
          </p>
        </Modal>
      )}
    </>
  );
}

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
  const [open, setOpen] = useState<Customer | null>(null);

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
          onRowClick={setOpen}
          minWidth={860}
          empty={{
            heading: 'No customer matches that filter',
            line: 'Nothing here matches what you typed, so there is nothing to act on.',
            action: <Button variant="primary" onClick={() => setQuery('')}>Clear filter</Button>,
          }}
        />
      </Card>

      {open && <CustomerDrawer customer={open} onClose={() => setOpen(null)} />}
    </>
  );
}
