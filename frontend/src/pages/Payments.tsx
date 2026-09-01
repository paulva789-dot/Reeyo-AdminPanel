import { useState, useMemo } from 'react';
import { useT } from '../i18n/useT';
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
import { useDateRange, withinRange } from '../state/useDateRange';
import SettlementsTable from './payments/SettlementsTable';
import { usePlatformAdmin } from '../state/usePlatformAdmin';
import { money } from '../lib/format';

import type { Payment, PayoutRequest } from '../data/types';

/**
 * What the platform charges, read from `/config` rather than assumed.
 *
 * These were hard-coded at 15% / 2.5% / 10%, which meant Settings could show a
 * commission of 18% while every settlement on this page was still worked out at
 * 15% — two screens disagreeing about money, with nothing on either to say
 * which was right. The fallbacks below are only reached when `/config` has not
 * answered, and the page says so when that happens.
 */
const FALLBACK = { commission: 0.15, serviceFee: 0.025, riderCut: 0.10 };

function useRates() {
  const { config, configError, sample } = usePlatformAdmin();
  const pct = (value: number | null, fallback: number) => (
    value === null ? fallback : value / 100
  );
  return {
    commission: pct(config.commissionRate, FALLBACK.commission),
    serviceFee: pct(config.serviceFee, FALLBACK.serviceFee),
    riderCut: pct(config.riderCut, FALLBACK.riderCut),
    // True when the figures came from the platform rather than the fallbacks.
    live: !sample && !configError,
    error: configError,
  };
}

/** Says where the deduction rates came from, because they decide what people are paid. */
function RateSource({ live, error }: { live: boolean; error: string | null }) {
  return (
    <p
      style={{
        margin: '0 0 14px', fontSize: 11.5,
        color: error ? 'var(--stop)' : 'var(--text-3)',
      }}
    >
      {error
        ? `${error} Deductions below use this console's default rates, which may not
           be what the platform charges.`.replace(/\s+/g, ' ')
        : live
          ? 'Deduction rates come from the platform configuration.'
          : 'Sample rates — the platform configuration has not been read.'}
    </p>
  );
}

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
  const t = useT();
  const { payments } = useAppState();
  const { range } = useDateRange();
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    // The ledger honours the shared date range (section 8.2). Payment dates are
    // stored as plain days, so they are read as local midnight.
    const inPeriod = payments.filter((p) => withinRange(
      /^\d{4}-\d{2}-\d{2}$/.test(p.date) ? `${p.date}T12:00:00` : p.date,
      range,
    ));
    const q = query.trim().toLowerCase();
    if (!q) return inPeriod;
    return inPeriod.filter((p) => [p.id, p.from, p.to, p.method, p.reason]
      .join(' ').toLowerCase().includes(q));
  }, [query, payments, range]);

  const columns: Column<Payment>[] = [
    {
      key: 'id', header: t('Transaction'),
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
      key: 'date', header: t('Date'),
      render: (p) => <span className="mono" style={{ fontSize: 12 }}>{p.date}</span>,
    },
    { key: 'from', header: t('From'), render: (p) => p.from },
    { key: 'to', header: t('To'), render: (p) => p.to },
    { key: 'method', header: t('Method'), render: (p) => p.method },
    {
      key: 'amount', header: t('Amount'), align: 'right',
      render: (p) => <span className="mono" style={{ fontSize: 12 }}>{money(p.amount)}</span>,
    },
    { key: 'status', header: t('Status'), render: (p) => <Pill status={p.status} /> },
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

function RiderSettlements() {
  const { riders } = useAppState();
  const rates = useRates();

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
    <>
    <RateSource live={rates.live} error={rates.error} />
    <div
      style={{
        display: 'grid', gap: 14,
        gridTemplateColumns: 'repeat(auto-fit, minmax(268px, 1fr))',
      }}
    >
      {riders.map((r) => {
        const gross = Math.round(r.owed / (1 - rates.riderCut));
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
            <Deduction
              label={`Platform cut ${Math.round(rates.riderCut * 1000) / 10}%`}
              value={cut}
            />
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
    </>
  );
}

function Requests() {
  const t = useT();
  const { payouts, approvePayout, declinePayout } = useAppState();
  const [confirm, setConfirm] = useState<PayoutRequest | null>(null);
  const [declining, setDeclining] = useState<PayoutRequest | null>(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');

  const columns: Column<PayoutRequest>[] = [
    {
      key: 'id', header: t('Request'),
      render: (p) => (
        <div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--forest)', fontWeight: 600 }}>
            {p.id}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.kind}</div>
        </div>
      ),
    },
    { key: 'who', header: t('Who'), render: (p) => p.who },
    {
      key: 'date', header: t('Requested'),
      render: (p) => <span className="mono" style={{ fontSize: 12 }}>{p.date}</span>,
    },
    {
      key: 'method', header: t('Destination'),
      render: (p) => (
        <div>
          <div style={{ fontSize: 12.5 }}>{p.method}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.number}</div>
        </div>
      ),
    },
    {
      key: 'amount', header: t('Amount'), align: 'right',
      render: (p) => <span className="mono" style={{ fontSize: 12 }}>{money(p.amount)}</span>,
    },
    { key: 'status', header: t('Status'), render: (p) => <Pill status={p.status} /> },
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
  const t = useT();
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
      <PageTitle>{t('Payments')}</PageTitle>

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
            { value: 'ledger', label: t('Ledger') },
            { value: 'vendor', label: t('Vendor settlements') },
            { value: 'rider', label: t('Rider settlements') },
            { value: 'requests', label: t('Payout requests'), count: pending.length },
          ]}
        />
      </div>

      {tab === 'ledger' && <Ledger />}
      {tab === 'vendor' && <SettlementsTable />}
      {tab === 'rider' && <RiderSettlements />}
      {tab === 'requests' && <Requests />}
    </>
  );
}
