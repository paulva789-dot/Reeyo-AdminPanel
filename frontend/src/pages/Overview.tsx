import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTitle from '../components/layout/PageTitle';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Pill from '../components/ui/Pill';
import MetricTile, { MetricRow } from '../components/ui/MetricTile';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import Donut from '../components/charts/Donut';
import OrderFlowRail, { matchesStage } from '../components/domain/OrderFlowRail';
import type { Stage } from '../components/domain/OrderFlowRail';
import ServiceGrid from '../components/domain/ServiceGrid';
import OrderDrawer from '../components/domain/OrderDrawer';
import { useAppState } from '../state/AppState';
import { money, isLate } from '../lib/format';
import {
  ordersSparkline, gmvSparkline, deliverySparkline, cancelSparkline, revenueSplit,
} from '../data/seed';
import type { Order } from '../data/types';

/** Orders an admin has to decide about: unassigned, late, or already in trouble. */
function needsDecision(o: Order): boolean {
  return o.status === 'delayed'
    || o.status === 'new'
    || isLate(o.eta)
    || (o.rider === null && o.status !== 'cancelled' && o.status !== 'delivered');
}

export default function Overview() {
  const navigate = useNavigate();
  const { orders, payouts } = useAppState();
  const [stage, setStage] = useState<Stage | null>(null);
  const [open, setOpen] = useState<Order | null>(null);

  // The rail filters everything below it — section 8.1a
  const scoped = useMemo(
    () => (stage ? orders.filter((o) => matchesStage(o, stage)) : orders),
    [orders, stage],
  );

  const attention = useMemo(() => scoped.filter(needsDecision), [scoped]);

  const gross = scoped.reduce((sum, o) => sum + o.total, 0);
  const cancelled = scoped.filter((o) => o.status === 'cancelled').length;
  const cancelRate = scoped.length
    ? Math.round((cancelled / scoped.length) * 100) : 0;

  const pendingTotal = payouts
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const alerts = [
    {
      id: 'a1',
      text: `FCFA ${money(pendingTotal)} waiting, oldest is 2 days`,
      token: 'watch',
      to: '/payments',
    },
    {
      id: 'a2',
      text: `${orders.filter((o) => o.status === 'delayed').length} order running late in Muea`,
      token: 'stop',
      to: '/orders',
    },
    {
      id: 'a3',
      text: 'Fresh Corner is suspended and still listed',
      token: 'stop',
      to: '/vendors',
    },
    {
      id: 'a4',
      text: 'Mama Grill has been under review for 3 days',
      token: 'watch',
      to: '/vendors',
    },
    {
      id: 'a5',
      text: 'Blaise Fon is rated 3.9 across 156 trips',
      token: 'watch',
      to: '/riders',
    },
  ];

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
      key: 'status',
      header: 'Status',
      render: (o) => <Pill status={o.status} />,
    },
  ];

  return (
    <>
      <PageTitle
        actions={<Button variant="command" onClick={() => navigate('/orders')}>Export day</Button>}
      >
        Overview
      </PageTitle>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OrderFlowRail orders={orders} selected={stage} onSelect={setStage} />

        <MetricRow>
          <MetricTile
            label="Orders today" value={String(scoped.length)}
            delta={12} note="vs yesterday" series={ordersSparkline}
          />
          <MetricTile
            label="Gross value" value={money(gross)} prefix="FCFA"
            delta={8} note="vs yesterday" series={gmvSparkline}
          />
          <MetricTile
            label="Avg delivery" value="24 min"
            delta={-3} deltaSuffix=" min" invertDelta note="faster this week"
            series={deliverySparkline} seriesColour="var(--parcel)"
          />
          <MetricTile
            label="Cancel rate" value={`${cancelRate}%`}
            delta={-1} invertDelta note="vs last week"
            series={cancelSparkline} seriesColour="var(--stop)"
          />
        </MetricRow>

        <ServiceGrid orders={scoped} />

        <div className="reeyo-split">
          <Card
            title="Orders needing a decision"
            action={(
              <span className="mono" style={{ fontSize: 12, color: 'var(--text-3)' }}>
                {attention.length}
              </span>
            )}
          >
            <DataTable
              columns={columns}
              rows={attention}
              rowKey={(o) => o.id}
              onRowClick={setOpen}
              empty={{
                heading: 'Nothing is waiting on you',
                line: stage
                  ? 'No order in this stage needs a decision. Clear the stage filter to see the rest.'
                  : 'Every order has a rider and is running on time.',
                action: stage
                  ? <Button variant="primary" onClick={() => setStage(null)}>Clear filter</Button>
                  : undefined,
              }}
            />
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Card title="Revenue by service">
              <Donut
                slices={revenueSplit.map((r) => ({
                  label: r.label, value: r.value, token: r.token,
                }))}
                format={(v) => money(v)}
              />
            </Card>

            <Card title="Needs attention">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {alerts.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => navigate(a.to)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '9px 6px', textAlign: 'left', borderRadius: 'var(--r-ctrl)',
                      width: '100%',
                    }}
                    className="reeyo-alert"
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                        background: `var(--${a.token})`,
                      }}
                    />
                    <span style={{ fontSize: 12.5, color: 'var(--text)', flex: 1 }}>
                      {a.text}
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {open && <OrderDrawer order={open} onClose={() => setOpen(null)} />}
    </>
  );
}
