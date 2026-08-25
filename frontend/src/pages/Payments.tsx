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
import EmptyState from '../components/ui/EmptyState';
import { Modal, FooterSpacer } from '../components/ui/Overlay';
import { useAppState } from '../state/useAppState';
import { money } from '../lib/format';

import type { Payment, PayoutRequest } from '../data/types';

const COMMISSION = 0.15;
const SERVICE_FEE = 0.025;
const RIDER_CUT = 0.10;

function Deduction({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        display: 'flex', justifyContent: 'space-between',
        gap: 12, padding: '5px 0',
      }}
    >
      <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{label}</span>
      <span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>
        −{money(value)}
      </span>
    </div>
  );
}

function Ledger() {
  const { payments } = useAppState();
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter((p) => [p.id, p.from, p.to, p.method, p.reason]
      .join(' ').toLowerCase().includes(q));
  }, [query, payments]);

  const columns: Column<Payment>[] = [
    {
      key: 'id', header: 'Transaction',
      render: (p) => (
        <div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--forest)', fontWeight: 600 }}>
            {p.id}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.reason}</div>
        </div>
      ),
    },
    {
      key: 'date', header: 'Date',
      render: (p) => <span className="mono" style={{ fontSize: 12 }}>{p.date}</span>,
    },
    { key: 'from', header: 'From', render: (p) => p.from },
    { key: 'to', header: 'To', render: (p) => p.to },
    { key: 'method', header: 'Method', render: (p) => p.method },
    {
      key: 'amount', header: 'Amount', align: 'right',
      render: (p) => <span className="mono" style={{ fontSize: 12 }}>{money(p.amount)}</span>,
    },
    { key: 'status', header: 'Status', render: (p) => <Pill status={p.status} /> },
  ];

  return (
    <Card>
      <TableToolbar title="Ledger" count={rows.length}>
        <FilterInput value={query} onChange={setQuery} placeholder="Filter by ID or name" />
      </TableToolbar>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(p) => p.id}
        minWidth={940}
        empty={{
          heading: 'No transaction matches that filter',
          line: 'Nothing here matches what you typed, so there is nothing to reconcile.',
          action: <Button variant="primary" onClick={() => setQuery('')}>Clear filter</Button>,
        }}
      />
    </Card>
  );
}

function VendorSettlements() {
  const { vendors } = useAppState();
  const settleable = vendors.filter((v) => v.status === 'active');

  if (settleable.length === 0) {
    return (
      <Card>
        <EmptyState
          heading="No vendor is ready to settle"
          line="Only active vendors are settled. Suspended and in-review vendors are held back."
        />
      </Card>
    );
  }

  return (
    <div
      style={{
        display: 'grid', gap: 14,
        gridTemplateColumns: 'repeat(auto-fit, minmax(268px, 1fr))',
      }}
    >
      {settleable.map((v) => {
        const commission = Math.round(v.revenue * COMMISSION);
        const service = Math.round(v.revenue * SERVICE_FEE);
        const net = v.revenue - commission - service;
        return (
          <Card key={v.id} title={v.name}>
            <div
              style={{
                display: 'flex', justifyContent: 'space-between',
                gap: 12, paddingBottom: 5,
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Gross</span>
              <span className="mono" style={{ fontSize: 12 }}>{money(v.revenue)}</span>
            </div>
            <Deduction label={`Commission ${COMMISSION * 100}%`} value={commission} />
            <Deduction label={`Service fee ${SERVICE_FEE * 100}%`} value={service} />
            <div style={{ height: 1, background: 'var(--line-soft)', margin: '6px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--forest)' }}>Net</span>
              <span
                className="mono"
                style={{ fontSize: 13, fontWeight: 700, color: 'var(--forest)' }}
              >
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>FCFA </span>
                {money(net)}
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function RiderSettlements() {
  const { riders } = useAppState();

  if (riders.length === 0) {
    return (
      <Card>
        <EmptyState
          heading="No riders to settle"
          line="Riders appear here once they are on the fleet and have earnings owed."
        />
      </Card>
    );
  }

  return (
    <div
      style={{
        display: 'grid', gap: 14,
        gridTemplateColumns: 'repeat(auto-fit, minmax(268px, 1fr))',
      }}
    >
      {riders.map((r) => {
        const gross = Math.round(r.owed / (1 - RIDER_CUT));
        const cut = gross - r.owed;
        return (
          <Card key={r.id} title={r.name}>
            <div
              style={{
                display: 'flex', justifyContent: 'space-between',
                gap: 12, paddingBottom: 5,
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Gross</span>
              <span className="mono" style={{ fontSize: 12 }}>{money(gross)}</span>
            </div>
            <Deduction label={`Platform cut ${RIDER_CUT * 100}%`} value={cut} />
            <div style={{ height: 1, background: 'var(--line-soft)', margin: '6px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--forest)' }}>Net</span>
              <span
                className="mono"
                style={{ fontSize: 13, fontWeight: 700, color: 'var(--forest)' }}
              >
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>FCFA </span>
                {money(r.owed)}
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function Requests() {
  const { payouts, approvePayout, declinePayout } = useAppState();
  const [confirm, setConfirm] = useState<PayoutRequest | null>(null);
  const [declining, setDeclining] = useState<PayoutRequest | null>(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');

  const columns: Column<PayoutRequest>[] = [
    {
      key: 'id', header: 'Request',
      render: (p) => (
        <div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--forest)', fontWeight: 600 }}>
            {p.id}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.kind}</div>
        </div>
      ),
    },
    { key: 'who', header: 'Who', render: (p) => p.who },
    {
      key: 'date', header: 'Requested',
      render: (p) => <span className="mono" style={{ fontSize: 12 }}>{p.date}</span>,
    },
    {
      key: 'method', header: 'Destination',
      render: (p) => (
        <div>
          <div style={{ fontSize: 12.5 }}>{p.method}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.number}</div>
        </div>
      ),
    },
    {
      key: 'amount', header: 'Amount', align: 'right',
      render: (p) => <span className="mono" style={{ fontSize: 12 }}>{money(p.amount)}</span>,
    },
    { key: 'status', header: 'Status', render: (p) => <Pill status={p.status} /> },
    {
      key: 'actions', header: '', align: 'right',
      render: (p) => (p.status === 'pending' ? (
        <div style={{ display: 'inline-flex', gap: 6 }}>
          <Button variant="destructive" onClick={() => setDeclining(p)}>Decline</Button>
          <Button variant="primary" onClick={() => setConfirm(p)}>Release payout</Button>
        </div>
      ) : null),
    },
  ];

  return (
    <>
      <Card>
        <TableToolbar
          title="Payout requests"
          count={payouts.filter((p) => p.status === 'pending').length}
        />
        <DataTable columns={columns} rows={payouts} rowKey={(p) => p.id} minWidth={980} />
      </Card>


      {declining && (
        <Modal
          title="Decline this payout"
          subtitle={`${declining.id} · ${declining.who}`}
          onClose={() => { setDeclining(null); setReason(''); setReasonError(''); }}
          width={460}
          footer={(
            <>
              <FooterSpacer />
              <Button
                variant="outline"
                onClick={() => { setDeclining(null); setReason(''); setReasonError(''); }}
              >
                Keep pending
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (!reason.trim()) {
                    setReasonError('Give a reason — the recipient sees why');
                    return;
                  }
                  declinePayout(declining.id, reason.trim());
                  setDeclining(null);
                  setReason('');
                  setReasonError('');
                }}
              >
                Decline payout
              </Button>
            </>
          )}
        >
          <TextArea
            label="Reason"
            value={reason}
            onChange={(v) => { setReason(v); setReasonError(''); }}
            placeholder="Bank details do not match the registered account."
            rows={3}
          />
          {reasonError && (
            <p style={{ margin: '9px 0 0', fontSize: 12, color: 'var(--stop)' }}>{reasonError}</p>
          )}
        </Modal>
      )}

      {confirm && (
        <Modal
          title="Release this payout"
          subtitle={`${confirm.id} · ${confirm.who}`}
          onClose={() => setConfirm(null)}
          width={440}
          footer={(
            <>
              <FooterSpacer />
              <Button variant="outline" onClick={() => setConfirm(null)}>Keep pending</Button>
              <Button
                variant="primary"
                onClick={() => { approvePayout(confirm.id); setConfirm(null); }}
              >
                Release payout
              </Button>
            </>
          )}
        >
          <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text)' }}>
            FCFA <span className="mono">{money(confirm.amount)}</span> goes to {confirm.who} by{' '}
            {confirm.method}. Money that has left cannot be pulled back from this screen.
          </p>
          <div
            style={{
              background: 'var(--card)', border: '1px solid var(--line)',
              borderRadius: 'var(--r-card)', padding: '10px 13px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Destination</span>
              <span className="mono" style={{ fontSize: 12 }}>{confirm.number}</span>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

export default function Payments() {
  const { payouts, payments, sampleOnly } = useAppState();
  const [tab, setTab] = useState('ledger');

  const pending = payouts.filter((p) => p.status === 'pending');
  const pendingTotal = pending.reduce((s, p) => s + p.amount, 0);
  const settled = payments
    .filter((p) => p.status === 'completed')
    .reduce((s, p) => s + p.amount, 0);
  const failed = payments.filter((p) => p.status === 'failed').length;

  return (
    <>
      <PageTitle>Payments</PageTitle>

      <div style={{ marginBottom: 14 }}>
        <MetricRow>
          <MetricTile label="Settled today" value={money(settled)} prefix="FCFA" delta={sampleOnly(11)} />
          <MetricTile
            label="Waiting to release" value={money(pendingTotal)} prefix="FCFA"
            note={pending.length ? 'oldest is 2 days' : 'nothing waiting'}
          />
          <MetricTile label="Open requests" value={String(pending.length)} />
          <MetricTile label="Failed" value={String(failed)} delta={failed} invertDelta note="needs a retry" />
        </MetricRow>
      </div>

      <div style={{ marginBottom: 14 }}>
        <Segments
          ariaLabel="Payments view"
          value={tab}
          onChange={setTab}
          segments={[
            { value: 'ledger', label: 'Ledger' },
            { value: 'vendor', label: 'Vendor settlements' },
            { value: 'rider', label: 'Rider settlements' },
            { value: 'requests', label: 'Payout requests', count: pending.length },
          ]}
        />
      </div>

      {tab === 'ledger' && <Ledger />}
      {tab === 'vendor' && <VendorSettlements />}
      {tab === 'rider' && <RiderSettlements />}
      {tab === 'requests' && <Requests />}
    </>
  );
}
