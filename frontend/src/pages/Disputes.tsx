import { useState, useMemo } from 'react';
import PageTitle from '../components/layout/PageTitle';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Pill from '../components/ui/Pill';
import Segments from '../components/ui/Segments';
import MetricTile, { MetricRow } from '../components/ui/MetricTile';
import DataTable, { TableToolbar } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import Field, { FilterInput, TextArea } from '../components/ui/Field';
import { Drawer, Modal, FooterSpacer } from '../components/ui/Overlay';
import { useAppState } from '../state/useAppState';
import { money } from '../lib/format';
import type { Dispute } from '../data/types';

function DisputeDrawer({ dispute, onClose }: { dispute: Dispute; onClose: () => void }) {
  const { resolveDispute, rejectDispute, replyToDispute } = useAppState();
  const [reply, setReply] = useState('');
  const [resolving, setResolving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [resolution, setResolution] = useState('');
  const [refund, setRefund] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const settled = dispute.status !== 'open';

  return (
    <>
      <Drawer
        title={dispute.ticket}
        subtitle={<>{dispute.customer} · {dispute.category} · opened {dispute.openedAgo}</>}
        onClose={onClose}
        footer={settled ? (
          <>
            <FooterSpacer />
            <Button variant="outline" onClick={onClose}>Close</Button>
          </>
        ) : (
          <>
            <Button variant="destructive" onClick={() => setRejecting(true)}>
              Reject
            </Button>
            <FooterSpacer />
            <Button variant="primary" onClick={() => setResolving(true)}>
              Resolve dispute
            </Button>
          </>
        )}
      >
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          <Pill status={dispute.status} />
          <Pill status={dispute.priority} />
          {dispute.orderId && (
            <span className="mono" style={{ fontSize: 12, color: 'var(--text-2)', alignSelf: 'center' }}>
              {dispute.orderId}
            </span>
          )}
        </div>

        <section style={{ marginBottom: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 9 }}>Subject</div>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text)' }}>{dispute.subject}</p>
        </section>

        {dispute.resolution && (
          <section style={{ marginBottom: 18 }}>
            <div className="eyebrow" style={{ marginBottom: 9 }}>Resolution</div>
            <p
              style={{
                margin: 0, padding: '10px 13px', fontSize: 12.5,
                background: 'var(--go-soft)', color: 'var(--go)',
                borderRadius: 'var(--r-ctrl)',
              }}
            >
              {dispute.resolution}
            </p>
          </section>
        )}

        <section style={{ marginBottom: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 9 }}>Conversation</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {dispute.messages.length === 0 && (
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-3)' }}>
                No messages on this ticket.
              </p>
            )}
            {dispute.messages.map((m) => {
              const fromSupport = m.author.toLowerCase().includes('support');
              return (
                <div
                  key={m.id}
                  style={{
                    background: fromSupport ? 'var(--pastel)' : 'var(--card)',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--r-card)',
                    padding: '10px 13px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex', justifyContent: 'space-between',
                      gap: 10, marginBottom: 4,
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--forest)' }}>
                      {m.author}
                    </span>
                    <span className="mono" style={{ fontSize: 10.5, color: 'var(--text-3)' }}>
                      {m.sentAt}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text)' }}>{m.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {!settled && (
          <section>
            <TextArea
              label="Reply to the customer"
              value={reply}
              onChange={setReply}
              placeholder="What should they know?"
              rows={3}
            />
            <div style={{ display: 'flex', marginTop: 9 }}>
              <FooterSpacer />
              <Button
                variant="outline"
                disabled={!reply.trim()}
                onClick={() => { replyToDispute(dispute.id, reply.trim()); setReply(''); }}
              >
                Send reply
              </Button>
            </div>
          </section>
        )}
      </Drawer>

      {resolving && (
        <Modal
          title="Resolve this dispute"
          subtitle={`${dispute.ticket} · ${dispute.customer}`}
          onClose={() => setResolving(false)}
          width={470}
          footer={(
            <>
              <FooterSpacer />
              <Button variant="outline" onClick={() => setResolving(false)}>Keep open</Button>
              <Button
                variant="primary"
                onClick={() => {
                  if (!resolution.trim()) {
                    setError('Say what was done to resolve it');
                    return;
                  }
                  resolveDispute(dispute.id, resolution.trim(), Number(refund) || undefined);
                  setResolving(false);
                  onClose();
                }}
              >
                Resolve dispute
              </Button>
            </>
          )}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <TextArea
              label="What was done"
              value={resolution}
              onChange={(v) => { setResolution(v); setError(''); }}
              placeholder="Refunded the delivery fee and spoke to the vendor."
              rows={3}
            />
            <Field
              label="Refund amount, if any"
              value={refund}
              onChange={setRefund}
              placeholder="0"
              mono
            />
            {Number(refund) > 0 && (
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)' }}>
                FCFA <span className="mono">{money(Number(refund))}</span> goes back to{' '}
                {dispute.customer}. Money that has left cannot be pulled back here.
              </p>
            )}
            {error && (
              <p style={{ margin: 0, fontSize: 12, color: 'var(--stop)' }}>{error}</p>
            )}
          </div>
        </Modal>
      )}

      {rejecting && (
        <Modal
          title="Reject this dispute"
          subtitle={`${dispute.ticket} · ${dispute.customer}`}
          onClose={() => setRejecting(false)}
          width={470}
          footer={(
            <>
              <FooterSpacer />
              <Button variant="outline" onClick={() => setRejecting(false)}>Keep open</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (!reason.trim()) {
                    setError('Give the customer a reason');
                    return;
                  }
                  rejectDispute(dispute.id, reason.trim());
                  setRejecting(false);
                  onClose();
                }}
              >
                Reject dispute
              </Button>
            </>
          )}
        >
          <TextArea
            label="Reason"
            value={reason}
            onChange={(v) => { setReason(v); setError(''); }}
            placeholder="The order was delivered as ordered and confirmed on arrival."
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

export default function Disputes() {
  const { disputes } = useAppState();
  const [status, setStatus] = useState('open');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Dispute | null>(null);

  const rows = useMemo(() => {
    const byStatus = status === 'all' ? disputes : disputes.filter((d) => d.status === status);
    const q = query.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter((d) => [d.ticket, d.subject, d.customer, d.category, d.orderId ?? '']
      .join(' ').toLowerCase().includes(q));
  }, [disputes, status, query]);

  const count = (s: string) => (s === 'all'
    ? disputes.length : disputes.filter((d) => d.status === s).length);

  const highPriority = disputes.filter(
    (d) => d.status === 'open' && d.priority === 'high',
  ).length;

  const columns: Column<Dispute>[] = [
    {
      key: 'ticket', header: 'Ticket',
      render: (d) => (
        <div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--forest)', fontWeight: 600 }}>
            {d.ticket}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{d.openedAgo}</div>
        </div>
      ),
    },
    {
      key: 'subject', header: 'Subject',
      render: (d) => (
        <div>
          <div>{d.subject}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{d.category}</div>
        </div>
      ),
    },
    { key: 'customer', header: 'Customer', render: (d) => d.customer },
    {
      key: 'order', header: 'Order',
      render: (d) => (d.orderId
        ? <span className="mono" style={{ fontSize: 12 }}>{d.orderId}</span>
        : <span style={{ color: 'var(--text-3)' }}>None</span>),
    },
    { key: 'priority', header: 'Priority', render: (d) => <Pill status={d.priority} /> },
    { key: 'status', header: 'Status', render: (d) => <Pill status={d.status} /> },
    {
      key: 'open', header: '', align: 'right',
      // Not just "Open": the status filter above uses that word for a state,
      // so a bare "Open" button is ambiguous both on screen and to a reader
      // moving between controls by name.
      render: (d) => (
        <Button variant="soft" onClick={() => setOpen(d)}>Open ticket</Button>
      ),
    },
  ];

  return (
    <>
      <PageTitle>Disputes</PageTitle>

      <div style={{ marginBottom: 14 }}>
        <MetricRow>
          <MetricTile label="Open" value={String(count('open'))} note="waiting on a decision" />
          <MetricTile label="High priority" value={String(highPriority)} note="of the open ones" />
          <MetricTile label="Resolved" value={String(count('resolved'))} />
          <MetricTile label="Rejected" value={String(count('rejected'))} />
        </MetricRow>
      </div>

      <div style={{ marginBottom: 14 }}>
        <Segments
          ariaLabel="Filter disputes by status"
          value={status}
          onChange={setStatus}
          segments={[
            { value: 'open', label: 'Open', count: count('open') },
            { value: 'resolved', label: 'Resolved', count: count('resolved') },
            { value: 'rejected', label: 'Rejected', count: count('rejected') },
            { value: 'all', label: 'All', count: count('all') },
          ]}
        />
      </div>

      <Card>
        <TableToolbar title="Tickets" count={rows.length}>
          <FilterInput value={query} onChange={setQuery} placeholder="Filter by ticket or name" />
        </TableToolbar>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(d) => d.id}
          minWidth={900}
          empty={{
            heading: status === 'open' && !query
              ? 'No dispute is waiting on you'
              : 'No dispute matches that filter',
            line: status === 'open' && !query
              ? 'Every ticket a customer has raised has been resolved or rejected.'
              : 'Nothing here matches what you chose, so there is nothing to act on.',
            action: query
              ? <Button variant="primary" onClick={() => setQuery('')}>Clear filter</Button>
              : undefined,
          }}
        />
      </Card>

      {open && <DisputeDrawer dispute={open} onClose={() => setOpen(null)} />}
    </>
  );
}
