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
import OrderFlowRail from '../components/domain/OrderFlowRail';
import { matchesStage } from '../components/domain/orderStages';
import type { Stage } from '../components/domain/orderStages';
import ServiceGrid from '../components/domain/ServiceGrid';
import OrderDrawer from '../components/domain/OrderDrawer';
import EmptyState from '../components/ui/EmptyState';
import { useAppState } from '../state/useAppState';
import { useAnalytics } from '../state/useAnalytics';
import { money, isLate } from '../lib/format';
import {
  deriveAlerts, grossValue, cancelRate, averageEta, revenueByVertical,
} from '../lib/insights';
import {
  ordersSparkline, gmvSparkline, deliverySparkline, cancelSparkline,
} from '../data/seed';
import type { Order } from '../data/types';

/**
 * The platform as it stands this second, from /analytics/live.
 *
 * It sits apart from the tiles below because it answers a different question:
 * those are today's totals worked out from the rows loaded into the console,
 * this is what the platform itself reports right now, across every region. It
 * appears only in live mode — there is nothing to snapshot in sample mode.
 */
function RightNow() {
  const { live, sample } = useAnalytics(['live']);
  if (sample) return null;

  if (live.error) {
    return (
      <Card title="Right now">
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--stop)' }}>{live.error}</p>
      </Card>
    );
  }
  if (!live.value) return null;

  const s = live.value;
  const figures: { label: string; value: string }[] = [
    { label: 'Active orders', value: String(s.activeOrders) },
    { label: 'Riders online', value: String(s.onlineRiders) },
    { label: 'Vendors open', value: String(s.onlineVendors) },
    { label: 'Orders today', value: String(s.ordersToday) },
    { label: 'Revenue today', value: money(s.revenueToday) },
    { label: 'Awaiting approval', value: String(s.pendingApprovals) },
  ];

  return (
    <Card
      title="Right now"
      action={(
        <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
          platform-wide, all regions
        </span>
      )}
    >
      <div
        style={{
          display: 'grid', gap: 14,
          gridTemplateColumns: 'repeat(auto-fit, minmax(118px, 1fr))',
        }}
      >
        {figures.map((f) => (
          <div key={f.label}>
            <div
              className="mono"
              style={{ fontSize: 19, fontWeight: 700, color: 'var(--forest)' }}
            >
              {f.value}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>
              {f.label}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/** Orders an admin has to decide about: unassigned, late, or already in trouble. */
function needsDecision(o: Order): boolean {
  return o.isLate
    || o.status === 'pending'
    || isLate(o.eta)
    || (o.rider === null && o.status !== 'cancelled' && o.status !== 'failed'
      && o.status !== 'delivered');
}

export default function Overview() {
  const navigate = useNavigate();
  const {
    orders, payouts, vendors, riders, sampleOnly,
  } = useAppState();
  const [stage, setStage] = useState<Stage | null>(null);
  const [open, setOpen] = useState<Order | null>(null);

  // The rail filters everything below it — section 8.1a
  const scoped = useMemo(
    () => (stage ? orders.filter((o) => matchesStage(o, stage)) : orders),
    [orders, stage],
  );

  const attention = useMemo(() => scoped.filter(needsDecision), [scoped]);

  const gross = grossValue(scoped);
  const rate = cancelRate(scoped);
  const avgEta = averageEta(scoped);

  // Derived from the rows actually loaded — see lib/insights.ts for why none of
  // this may be hardcoded.
  const alerts = useMemo(
    () => deriveAlerts(orders, vendors, riders, payouts),
    [orders, vendors, riders, payouts],
  );

  const revenue = useMemo(() => revenueByVertical(scoped), [scoped]);

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

        {/* Values come from the loaded rows. Trends and sparklines need history
            the API does not expose, so they appear only in sample mode. */}
        <MetricRow>
          <MetricTile
            label="Orders today" value={String(scoped.length)}
            delta={sampleOnly(12)} note={sampleOnly('vs yesterday')}
            series={sampleOnly(ordersSparkline)}
          />
          <MetricTile
            label="Gross value" value={money(gross)} prefix="FCFA"
            delta={sampleOnly(8)} note={sampleOnly('vs yesterday')}
            series={sampleOnly(gmvSparkline)}
          />
          <MetricTile
            label="Avg delivery" value={avgEta === null ? '—' : `${avgEta} min`}
            delta={sampleOnly(-3)} deltaSuffix=" min" invertDelta
            note={sampleOnly('faster this week')}
            series={sampleOnly(deliverySparkline)} seriesColour="var(--parcel)"
          />
          <MetricTile
            label="Cancel rate" value={`${rate}%`}
            delta={sampleOnly(-1)} invertDelta note={sampleOnly('vs last week')}
            series={sampleOnly(cancelSparkline)} seriesColour="var(--stop)"
          />
        </MetricRow>

        <RightNow />

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
              {revenue.length === 0 ? (
                <EmptyState
                  heading="No revenue to split yet"
                  line="Once orders start completing, the share each service takes shows here."
                />
              ) : (
                <Donut slices={revenue} format={(v) => money(v)} />
              )}
            </Card>

            <Card title="Needs attention">
              {alerts.length === 0 ? (
                <EmptyState
                  heading="Nothing needs attention"
                  line="No late orders, unassigned riders, suspended vendors or payouts waiting."
                />
              ) : (
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
              )}
            </Card>
          </div>
        </div>
      </div>

      {open && <OrderDrawer order={open} onClose={() => setOpen(null)} />}
    </>
  );
}
