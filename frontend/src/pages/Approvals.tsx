import { useState, useMemo } from 'react';
import PageTitle from '../components/layout/PageTitle';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Pill from '../components/ui/Pill';
import Segments from '../components/ui/Segments';
import MetricTile, { MetricRow } from '../components/ui/MetricTile';
import DataTable, { TableToolbar } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { FilterInput, TextArea } from '../components/ui/Field';
import { Modal, FooterSpacer } from '../components/ui/Overlay';
import { useAppState } from '../state/AppState';
import { money } from '../lib/format';
import type { MenuApproval } from '../data/types';

/** The number an admin actually decides on: how far the price moves. */
function priceDelta(a: MenuApproval): number | null {
  if (a.currentPrice === null || a.currentPrice === 0) return null;
  return Math.round(((a.requestedPrice - a.currentPrice) / a.currentPrice) * 100);
}

function PriceChange({ approval }: { approval: MenuApproval }) {
  const delta = priceDelta(approval);

  if (approval.currentPrice === null) {
    return (
      <div>
        <span className="mono" style={{ fontSize: 12, color: 'var(--forest)' }}>
          {money(approval.requestedPrice)}
        </span>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>new item</div>
      </div>
    );
  }

  // A rise costs the customer, a cut costs the vendor; neither is an error, so
  // both read as watch rather than stop.
  const token = delta === null || delta === 0 ? 'calm' : delta > 0 ? 'watch' : 'go';

  return (
    <div>
      <span
        className="mono"
        style={{ fontSize: 11.5, color: 'var(--text-3)', textDecoration: 'line-through' }}
      >
        {money(approval.currentPrice)}
      </span>
      <span className="mono" style={{ fontSize: 12, color: 'var(--forest)', marginLeft: 7 }}>
        {money(approval.requestedPrice)}
      </span>
      {delta !== null && delta !== 0 && (
        <div className="mono" style={{ fontSize: 11, color: `var(--${token})`, marginTop: 2 }}>
          {delta > 0 ? '+' : ''}{delta}%
        </div>
      )}
    </div>
  );
}

export default function Approvals() {
  const { approvals, approveMenu, rejectMenu } = useAppState();
  const [status, setStatus] = useState('pending');
  const [query, setQuery] = useState('');
  const [rejecting, setRejecting] = useState<MenuApproval | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const rows = useMemo(() => {
    const byStatus = status === 'all' ? approvals : approvals.filter((a) => a.status === status);
    const q = query.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter((a) => [a.vendor, a.itemName, a.category]
      .join(' ').toLowerCase().includes(q));
  }, [approvals, status, query]);

  const count = (s: string) => (s === 'all'
    ? approvals.length : approvals.filter((a) => a.status === s).length);

  const pending = approvals.filter((a) => a.status === 'pending');
  const newItems = pending.filter((a) => a.changeType === 'new item').length;
  const rises = pending.filter((a) => {
    const d = priceDelta(a);
    return d !== null && d > 0;
  }).length;

  const columns: Column<MenuApproval>[] = [
    {
      key: 'item', header: 'Item',
      render: (a) => (
        <div>
          <div style={{ fontWeight: 600 }}>{a.itemName}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{a.category}</div>
        </div>
      ),
    },
    { key: 'vendor', header: 'Vendor', render: (a) => a.vendor },
    {
      key: 'change', header: 'Change',
      render: (a) => <Pill status={a.changeType} />,
    },
    {
      key: 'price', header: 'Price', align: 'right',
      render: (a) => <PriceChange approval={a} />,
    },
    {
      key: 'reason', header: 'Reason given',
      render: (a) => (
        <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{a.reason}</span>
      ),
    },
    {
      key: 'submitted', header: 'Submitted', align: 'right',
      render: (a) => (
        <span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>
          {a.submittedAgo}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (a) => <Pill status={a.status} /> },
    {
      key: 'actions', header: '', align: 'right',
      render: (a) => (a.status === 'pending' ? (
        <div style={{ display: 'inline-flex', gap: 6 }}>
          <Button variant="destructive" onClick={() => setRejecting(a)}>Reject</Button>
          <Button variant="primary" onClick={() => approveMenu(a.id)}>Approve</Button>
        </div>
      ) : (
        a.adminNotes
          ? <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{a.adminNotes}</span>
          : null
      )),
    },
  ];

  return (
    <>
      <PageTitle>Menu approvals</PageTitle>

      <div style={{ marginBottom: 14 }}>
        <MetricRow>
          <MetricTile label="Waiting" value={String(pending.length)} note="vendors are blocked until you decide" />
          <MetricTile label="Price rises" value={String(rises)} note="of those waiting" />
          <MetricTile label="New items" value={String(newItems)} note="of those waiting" />
          <MetricTile label="Rejected" value={String(count('rejected'))} />
        </MetricRow>
      </div>

      <div style={{ marginBottom: 14 }}>
        <Segments
          ariaLabel="Filter approvals by status"
          value={status}
          onChange={setStatus}
          segments={[
            { value: 'pending', label: 'Waiting', count: count('pending') },
            { value: 'approved', label: 'Approved', count: count('approved') },
            { value: 'rejected', label: 'Rejected', count: count('rejected') },
            { value: 'all', label: 'All', count: count('all') },
          ]}
        />
      </div>

      <Card>
        <TableToolbar title="Requests" count={rows.length}>
          <FilterInput value={query} onChange={setQuery} placeholder="Filter by vendor or item" />
        </TableToolbar>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(a) => a.id}
          minWidth={1040}
          empty={{
            heading: status === 'pending' && !query
              ? 'Nothing is waiting for approval'
              : 'No request matches that filter',
            line: status === 'pending' && !query
              ? 'Every menu change vendors have submitted has been decided.'
              : 'Nothing here matches what you chose, so there is nothing to act on.',
            action: query
              ? <Button variant="primary" onClick={() => setQuery('')}>Clear filter</Button>
              : undefined,
          }}
        />
      </Card>

      {rejecting && (
        <Modal
          title="Reject this change"
          subtitle={`${rejecting.itemName} · ${rejecting.vendor}`}
          onClose={() => { setRejecting(null); setReason(''); setError(''); }}
          width={470}
          footer={(
            <>
              <FooterSpacer />
              <Button
                variant="outline"
                onClick={() => { setRejecting(null); setReason(''); setError(''); }}
              >
                Keep waiting
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (!reason.trim()) {
                    setError('Tell the vendor why, so they can resubmit');
                    return;
                  }
                  rejectMenu(rejecting.id, reason.trim());
                  setRejecting(null);
                  setReason('');
                  setError('');
                }}
              >
                Reject change
              </Button>
            </>
          )}
        >
          <p style={{ margin: '0 0 13px', fontSize: 12.5, color: 'var(--text-2)' }}>
            The vendor sees this reason and can submit a new price.
          </p>
          <TextArea
            label="Reason"
            value={reason}
            onChange={(v) => { setReason(v); setError(''); }}
            placeholder="That rise is too steep. Resubmit with a smaller change."
            rows={3}
          />
          {error && (
            <p style={{ margin: '9px 0 0', fontSize: 12, color: 'var(--stop)' }}>{error}</p>
          )}
        </Modal>
      )}
    </>
  );
}
