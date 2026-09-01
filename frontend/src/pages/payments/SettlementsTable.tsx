import { useState, useMemo } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Pill from '../../components/ui/Pill';
import DataTable, { TableToolbar } from '../../components/ui/DataTable';
import type { Column } from '../../components/ui/DataTable';
import { FilterInput } from '../../components/ui/Field';
import EmptyState from '../../components/ui/EmptyState';
import { Modal, FooterSpacer } from '../../components/ui/Overlay';
import { money, initials } from '../../lib/format';
import { useAppState } from '../../state/useAppState';
import { useDateRange, withinRange } from '../../state/useDateRange';
import { useVendorProfiles } from '../../state/useVendorProfiles';
import type { Order, VendorProfile } from '../../data/types';

/** What a vendor is owed for the orders in the period — spec §8.3. */
interface SettlementRow {
  profile: VendorProfile;
  orders: Order[];
  gross: number;
  commission: number;
  packaging: number;
  net: number;
  status: 'Pending' | 'Paid' | 'Partially paid';
  lastSettled: string | null;
}

function commissionFor(profile: VendorProfile, order: Order): number {
  return profile.commission.kind === 'percentage'
    ? Math.round(order.total * (profile.commission.value / 100))
    : profile.commission.value;
}

/**
 * Vendor settlements — specification §8.3.
 *
 * A table rather than cards, because the question is comparative: which of
 * thirty vendors is owed most, and which have been waiting longest. Cards make
 * that a scrolling exercise.
 */
export default function SettlementsTable() {
  const { orders } = useAppState();
  const { profiles } = useVendorProfiles();
  const { range } = useDateRange();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [settled, setSettled] = useState<Record<string, string>>({});

  const rows = useMemo<SettlementRow[]>(() => {
    const inPeriod = orders.filter(
      (o) => withinRange(o.placedAt, range) && o.status === 'delivered',
    );

    return profiles.map((profile) => {
      const theirs = inPeriod.filter((o) => o.vendor === profile.businessName);
      const gross = theirs.reduce((sum, o) => sum + o.total, 0);
      const commission = theirs.reduce((sum, o) => sum + commissionFor(profile, o), 0);
      const packaging = theirs.reduce((sum, o) => sum + o.packagingFee, 0);
      return {
        profile,
        orders: theirs,
        gross,
        commission,
        packaging,
        net: gross - commission,
        status: settled[profile.id] ? 'Paid' as const : 'Pending' as const,
        lastSettled: settled[profile.id]
          ?? profile.wallet.find((e) => e.source === 'settlement')?.at.slice(0, 10)
          ?? null,
      };
    });
  }, [orders, profiles, range, settled]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const withOrders = rows.filter((r) => r.orders.length > 0);
    if (!q) return withOrders;
    return withOrders.filter(
      (r) => [r.profile.businessName, r.profile.zone, r.profile.city]
        .join(' ').toLowerCase().includes(q),
    );
  }, [rows, query]);

  const totalOwed = visible.reduce((sum, r) => sum + (r.status === 'Paid' ? 0 : r.net), 0);

  const columns: Column<SettlementRow>[] = [
    {
      key: 'select', header: '',
      render: (r) => (
        <div onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected.includes(r.profile.id)}
            onChange={() => setSelected((prev) => (prev.includes(r.profile.id)
              ? prev.filter((x) => x !== r.profile.id)
              : [...prev, r.profile.id]))}
            aria-label={`Select ${r.profile.businessName}`}
            style={{ accentColor: 'var(--emerald)' }}
          />
        </div>
      ),
    },
    {
      key: 'vendor', header: 'Vendor',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span
            aria-hidden="true"
            className="mono"
            style={{
              width: 28, height: 28, borderRadius: 'var(--r-pill)', flexShrink: 0,
              background: `var(--${r.profile.service}-soft)`,
              color: `var(--${r.profile.service})`,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 600,
            }}
          >
            {initials(r.profile.businessName)}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>{r.profile.businessName}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.profile.zone}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'orders', header: 'Orders', align: 'right',
      render: (r) => <span className="mono" style={{ fontSize: 12 }}>{r.orders.length}</span>,
    },
    {
      key: 'gross', header: 'Gross sales', align: 'right',
      render: (r) => <span className="mono" style={{ fontSize: 12 }}>{money(r.gross)}</span>,
    },
    {
      key: 'commission', header: 'Commission', align: 'right',
      render: (r) => (
        <div>
          <span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>
            −{money(r.commission)}
          </span>
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--text-3)' }}>
            {r.profile.commission.kind === 'percentage'
              ? `${r.profile.commission.value}%`
              : `${money(r.profile.commission.value)}/order`}
          </div>
        </div>
      ),
    },
    {
      key: 'packaging', header: 'Packaging', align: 'right',
      render: (r) => (
        <span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>
          {r.packaging > 0 ? money(r.packaging) : '—'}
        </span>
      ),
    },
    {
      key: 'net', header: 'Net payable', align: 'right',
      render: (r) => (
        <span className="mono" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--forest)' }}>
          {money(r.net)}
        </span>
      ),
    },
    {
      key: 'wallet', header: 'Wallet', align: 'right',
      render: (r) => (
        <span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>
          {money(r.profile.walletBalance)}
        </span>
      ),
    },
    {
      key: 'payTo', header: 'Pay to',
      render: (r) => (
        <div>
          <div style={{ fontSize: 12 }}>{r.profile.paymentName}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {r.profile.paymentNumber}
          </div>
        </div>
      ),
    },
    {
      key: 'status', header: 'Status',
      render: (r) => <Pill status={r.status.toLowerCase()} />,
    },
    {
      key: 'last', header: 'Last settled', align: 'right',
      render: (r) => (
        <span className="mono" style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
          {r.lastSettled ?? 'never'}
        </span>
      ),
    },
    {
      key: 'actions', header: '', align: 'right',
      render: (r) => (
        <div onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', gap: 6 }}>
          <Button
            variant="soft"
            onClick={() => setExpanded(expanded === r.profile.id ? null : r.profile.id)}
          >
            {expanded === r.profile.id ? 'Hide' : 'Breakdown'}
          </Button>
          <Button
            variant="primary"
            disabled={r.status === 'Paid'}
            onClick={() => { setSelected([r.profile.id]); setConfirming(true); }}
          >
            Mark paid
          </Button>
        </div>
      ),
    },
  ];

  const openRow = visible.find((r) => r.profile.id === expanded);

  return (
    <>
      <Card>
        <TableToolbar title="Vendor settlements" count={visible.length}>
          {selected.length > 0 && (
            <>
              <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                {selected.length} selected
              </span>
              <Button variant="primary" onClick={() => setConfirming(true)}>
                Mark {selected.length} paid
              </Button>
            </>
          )}
          <FilterInput value={query} onChange={setQuery} placeholder="Filter by vendor or zone" />
        </TableToolbar>

        <DataTable
          columns={columns}
          rows={visible}
          rowKey={(r) => r.profile.id}
          minWidth={1320}
          empty={{
            heading: 'Nothing to settle in this period',
            line: 'No vendor completed an order inside the date range you have chosen.',
          }}
        />

        <div
          style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            gap: 12, marginTop: 12, paddingTop: 12,
            borderTop: '1px solid var(--line-soft)',
          }}
        >
          <span className="eyebrow">Outstanding across this period</span>
          <span
            className="mono"
            style={{ fontSize: 15, fontWeight: 700, color: 'var(--forest)' }}
          >
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>FCFA </span>
            {money(totalOwed)}
          </span>
        </div>
      </Card>

      {/* §8.3 — every figure traces back to the orders that produced it. */}
      {openRow && (
        <Card
          title={`${openRow.profile.businessName} · ${openRow.orders.length} orders`}
          style={{ marginTop: 14 }}
        >
          {openRow.orders.length === 0 ? (
            <EmptyState heading="No orders" line="Nothing was delivered in this period." />
          ) : (
            <div>
              {openRow.orders.map((o) => (
                <div
                  key={o.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0',
                    borderBottom: '1px solid var(--line-soft)',
                  }}
                >
                  <span className="mono" style={{ fontSize: 12, color: 'var(--forest)', width: 78 }}>
                    {o.id}
                  </span>
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--text-2)', minWidth: 0 }}>
                    {o.customer}
                  </span>
                  <span className="mono" style={{ fontSize: 12 }}>{money(o.total)}</span>
                  <span className="mono" style={{ fontSize: 11.5, color: 'var(--text-3)', width: 90, textAlign: 'right' }}>
                    −{money(commissionFor(openRow.profile, o))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {confirming && (
        <Modal
          title={selected.length === 1 ? 'Mark this settlement paid' : `Mark ${selected.length} settlements paid`}
          onClose={() => setConfirming(false)}
          width={460}
          footer={(
            <>
              <FooterSpacer />
              <Button variant="outline" onClick={() => setConfirming(false)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={() => {
                  const today = new Date().toISOString().slice(0, 10);
                  setSettled((prev) => ({
                    ...prev,
                    ...Object.fromEntries(selected.map((id) => [id, today])),
                  }));
                  setSelected([]);
                  setConfirming(false);
                }}
              >
                Mark paid
              </Button>
            </>
          )}
        >
          <p style={{ margin: '0 0 12px', fontSize: 12.5, color: 'var(--text-2)' }}>
            This records the payout as made. It does not move any money — the
            transfer happens on MoMo or Orange Money, and this is the note that
            says it was done.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {selected.map((id) => {
              const row = rows.find((r) => r.profile.id === id);
              if (!row) return null;
              return (
                <div
                  key={id}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5 }}
                >
                  <span style={{ flex: 1 }}>{row.profile.businessName}</span>
                  <span className="mono" style={{ color: 'var(--text-3)' }}>
                    {row.profile.paymentNumber}
                  </span>
                  <span className="mono" style={{ fontWeight: 700, color: 'var(--forest)' }}>
                    {money(row.net)}
                  </span>
                </div>
              );
            })}
          </div>
        </Modal>
      )}
    </>
  );
}
