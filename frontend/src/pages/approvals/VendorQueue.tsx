import { useState, useMemo } from 'react';
import { useT } from '../../i18n/useT';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Pill from '../../components/ui/Pill';
import Segments from '../../components/ui/Segments';
import MetricTile, { MetricRow } from '../../components/ui/MetricTile';
import DataTable, { TableToolbar } from '../../components/ui/DataTable';
import type { Column } from '../../components/ui/DataTable';
import { FilterInput } from '../../components/ui/Field';
import { useAppState } from '../../state/useAppState';
import type { PendingVendor } from '../../data/types';
import ReasonModal from './ReasonModal';

type Ask = { kind: 'reject' | 'suspend'; vendor: PendingVendor };

export default function VendorQueue() {
  const t = useT();
  const { pendingVendors, approveVendor, rejectVendor, suspendVendor } = useAppState();
  const [status, setStatus] = useState('pending');
  const [query, setQuery] = useState('');
  const [ask, setAsk] = useState<Ask | null>(null);

  const rows = useMemo(() => {
    const byStatus = status === 'all'
      ? pendingVendors : pendingVendors.filter((v) => v.status === status);
    const q = query.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter((v) => [v.name, v.owner, v.category, v.city, v.zone]
      .join(' ').toLowerCase().includes(q));
  }, [pendingVendors, status, query]);

  const count = (s: string) => (s === 'all'
    ? pendingVendors.length : pendingVendors.filter((v) => v.status === s).length);

  const columns: Column<PendingVendor>[] = [
    {
      key: 'vendor', header: t('Vendor'),
      render: (v) => (
        <div>
          <div style={{ fontWeight: 600 }}>{v.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{v.category}</div>
        </div>
      ),
    },
    {
      key: 'owner', header: t('Owner'),
      render: (v) => (
        <div>
          <div>{v.owner}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{v.phone}</div>
        </div>
      ),
    },
    {
      key: 'where', header: t('Where'),
      render: (v) => (
        <div>
          <div>{v.zone}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{v.city} · {v.region}</div>
        </div>
      ),
    },
    {
      key: 'submitted', header: t('Applied'), align: 'right',
      render: (v) => (
        <span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>
          {v.submittedAgo}
        </span>
      ),
    },
    { key: 'status', header: t('Status'), render: (v) => <Pill status={v.status} /> },
    {
      key: 'actions', header: '', align: 'right',
      render: (v) => {
        if (v.status === 'pending') {
          return (
            <div style={{ display: 'inline-flex', gap: 6 }}>
              <Button
                variant="destructive"
                onClick={() => setAsk({ kind: 'reject', vendor: v })}
              >
                Reject
              </Button>
              <Button variant="primary" onClick={() => approveVendor(v.id)}>Approve</Button>
            </div>
          );
        }
        // An approved vendor is already trading, so the act that matters is
        // taking them offline rather than deciding on them again.
        if (v.status === 'approved') {
          return (
            <Button
              variant="outline"
              onClick={() => setAsk({ kind: 'suspend', vendor: v })}
            >
              Suspend
            </Button>
          );
        }
        return null;
      },
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <MetricRow>
          <MetricTile
            label="Waiting"
            value={String(count('pending'))}
            note="cannot trade until you decide"
          />
          <MetricTile label="Approved" value={String(count('approved'))} />
          <MetricTile label="Rejected" value={String(count('rejected'))} />
          <MetricTile label="Suspended" value={String(count('suspended'))} note="taken offline" />
        </MetricRow>
      </div>

      <div style={{ marginBottom: 14 }}>
        <Segments
          ariaLabel="Filter vendor applications by status"
          value={status}
          onChange={setStatus}
          segments={[
            { value: 'pending', label: t('Waiting'), count: count('pending') },
            { value: 'approved', label: t('Approved'), count: count('approved') },
            { value: 'rejected', label: t('Rejected'), count: count('rejected') },
            { value: 'all', label: t('All'), count: count('all') },
          ]}
        />
      </div>

      <Card>
        <TableToolbar title="Applications" count={rows.length}>
          <FilterInput value={query} onChange={setQuery} placeholder="Filter by name, owner or zone" />
        </TableToolbar>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(v) => v.id}
          minWidth={940}
          empty={{
            heading: status === 'pending' && !query
              ? 'No vendor is waiting'
              : 'No application matches that filter',
            line: status === 'pending' && !query
              ? 'Every vendor that has applied has been decided on.'
              : 'Nothing here matches what you chose, so there is nothing to act on.',
            action: query
              ? <Button variant="primary" onClick={() => setQuery('')}>Clear filter</Button>
              : undefined,
          }}
        />
      </Card>

      {ask?.kind === 'reject' && (
        <ReasonModal
          title="Reject this vendor"
          subtitle={`${ask.vendor.name} · ${ask.vendor.city}`}
          explain="The owner sees this reason and can apply again once it is fixed."
          placeholder="The business licence photo is unreadable. Reapply with a clear scan."
          confirmLabel="Reject application"
          onConfirm={(reason) => { rejectVendor(ask.vendor.id, reason); setAsk(null); }}
          onClose={() => setAsk(null)}
        />
      )}

      {ask?.kind === 'suspend' && (
        <ReasonModal
          title="Suspend this vendor"
          subtitle={`${ask.vendor.name} · ${ask.vendor.city}`}
          explain="They stop taking orders immediately. A Super Admin can lift it later."
          placeholder="Repeated cancellations after accepting orders."
          confirmLabel="Suspend vendor"
          cancelLabel="Leave trading"
          onConfirm={(reason) => { suspendVendor(ask.vendor.id, reason); setAsk(null); }}
          onClose={() => setAsk(null)}
        />
      )}
    </>
  );
}
