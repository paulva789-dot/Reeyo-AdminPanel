import { useState, useMemo } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Pill from '../../components/ui/Pill';
import Segments from '../../components/ui/Segments';
import MetricTile, { MetricRow } from '../../components/ui/MetricTile';
import DataTable, { TableToolbar } from '../../components/ui/DataTable';
import type { Column } from '../../components/ui/DataTable';
import { FilterInput } from '../../components/ui/Field';
import { useAppState } from '../../state/useAppState';
import type { PendingRider, RiderDocument } from '../../data/types';
import type { DocumentVerdict } from '../../services/platformResources';
import ReasonModal from './ReasonModal';
import DocumentReview from './DocumentReview';
import { reviewed } from './riderDocs';

function DocumentProgress({ docs }: { docs: RiderDocument[] }) {
  const done = reviewed(docs);
  const rejected = docs.filter((d) => d.status === 'rejected').length;
  const token = rejected > 0 ? 'stop' : done === docs.length ? 'go' : 'watch';

  return (
    <div>
      <span className="mono" style={{ fontSize: 12, color: `var(--${token})`, fontWeight: 700 }}>
        {done}/{docs.length}
      </span>
      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
        {rejected > 0
          ? `${rejected} refused`
          : done === docs.length ? 'all reviewed' : 'reviewed'}
      </div>
    </div>
  );
}

type Ask = { kind: 'reject'; rider: PendingRider };

export default function RiderQueue() {
  const {
    pendingRiders, approveRider, rejectRider, verifyRiderDocuments,
  } = useAppState();
  const [status, setStatus] = useState('pending');
  const [query, setQuery] = useState('');
  const [reviewing, setReviewing] = useState<PendingRider | null>(null);
  const [ask, setAsk] = useState<Ask | null>(null);

  const rows = useMemo(() => {
    const byStatus = status === 'all'
      ? pendingRiders : pendingRiders.filter((r) => r.status === status);
    const q = query.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter((r) => [r.name, r.phone, r.plate, r.vehicle, r.city, r.zone]
      .join(' ').toLowerCase().includes(q));
  }, [pendingRiders, status, query]);

  const count = (s: string) => (s === 'all'
    ? pendingRiders.length : pendingRiders.filter((r) => r.status === s).length);

  // The live row, so the review modal reflects a decision the moment it lands.
  const live = reviewing
    ? pendingRiders.find((r) => r.id === reviewing.id) ?? reviewing
    : null;

  const awaitingDocs = pendingRiders.filter(
    (r) => r.status === 'pending' && reviewed(r.documents) < r.documents.length,
  ).length;

  const columns: Column<PendingRider>[] = [
    {
      key: 'rider', header: 'Rider',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.name}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.phone}</div>
        </div>
      ),
    },
    {
      key: 'vehicle', header: 'Vehicle',
      render: (r) => (
        <div>
          <div>{r.vehicle}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.plate}</div>
        </div>
      ),
    },
    {
      key: 'where', header: 'Where',
      render: (r) => (
        <div>
          <div>{r.zone}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.city} · {r.region}</div>
        </div>
      ),
    },
    {
      key: 'documents', header: 'Documents', align: 'right',
      render: (r) => <DocumentProgress docs={r.documents} />,
    },
    {
      key: 'submitted', header: 'Applied', align: 'right',
      render: (r) => (
        <span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>
          {r.submittedAgo}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (r) => <Pill status={r.status} /> },
    {
      key: 'actions', header: '', align: 'right',
      render: (r) => (
        <div style={{ display: 'inline-flex', gap: 6 }}>
          <Button variant="outline" onClick={() => setReviewing(r)}>Documents</Button>
          {r.status === 'pending' && (
            <>
              <Button variant="destructive" onClick={() => setAsk({ kind: 'reject', rider: r })}>
                Reject
              </Button>
              <Button
                variant="primary"
                disabled={reviewed(r.documents) < r.documents.length}
                title={reviewed(r.documents) < r.documents.length
                  ? 'Review every document first'
                  : undefined}
                onClick={() => approveRider(r.id)}
              >
                Approve
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <MetricRow>
          <MetricTile
            label="Waiting"
            value={String(count('pending'))}
            note="cannot take deliveries until you decide"
          />
          <MetricTile
            label="Documents outstanding"
            value={String(awaitingDocs)}
            note="riders with something still unreviewed"
          />
          <MetricTile label="Approved" value={String(count('approved'))} />
          <MetricTile label="Rejected" value={String(count('rejected'))} />
        </MetricRow>
      </div>

      <div style={{ marginBottom: 14 }}>
        <Segments
          ariaLabel="Filter rider applications by status"
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
        <TableToolbar title="Applications" count={rows.length}>
          <FilterInput value={query} onChange={setQuery} placeholder="Filter by name, plate or zone" />
        </TableToolbar>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          minWidth={1040}
          empty={{
            heading: status === 'pending' && !query
              ? 'No rider is waiting'
              : 'No application matches that filter',
            line: status === 'pending' && !query
              ? 'Every rider that has applied has been decided on.'
              : 'Nothing here matches what you chose, so there is nothing to act on.',
            action: query
              ? <Button variant="primary" onClick={() => setQuery('')}>Clear filter</Button>
              : undefined,
          }}
        />
      </Card>

      {live && (
        <DocumentReview
          rider={live}
          onSubmit={(decisions: DocumentVerdict[]) => {
            verifyRiderDocuments(live.id, decisions);
          }}
          onClose={() => setReviewing(null)}
        />
      )}

      {ask && (
        <ReasonModal
          title="Reject this rider"
          subtitle={`${ask.rider.name} · ${ask.rider.city}`}
          explain="The rider sees this reason and can reapply once it is fixed."
          placeholder="The licence has expired. Reapply with a valid one."
          confirmLabel="Reject application"
          onConfirm={(reason) => { rejectRider(ask.rider.id, reason); setAsk(null); }}
          onClose={() => setAsk(null)}
        />
      )}
    </>
  );
}
