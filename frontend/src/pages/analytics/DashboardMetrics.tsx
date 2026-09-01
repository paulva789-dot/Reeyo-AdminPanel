import { useMemo } from 'react';
import Card from '../../components/ui/Card';
import MetricTile, { MetricRow } from '../../components/ui/MetricTile';
import EmptyState from '../../components/ui/EmptyState';
import BarList from '../../components/charts/BarList';
import Donut from '../../components/charts/Donut';
import { money } from '../../lib/format';
import { useAppState } from '../../state/useAppState';
import { useDateRange, withinRange, describeRange } from '../../state/useDateRange';
import { usePreferences } from '../../state/usePreferences';
import { PAYMENT_METHOD_LIST } from '../../data/types';

/** The colour a payment method takes, so the split is never a rainbow. */
const METHOD_TOKEN: Record<string, string> = {
  'Cash on delivery': 'watch',
  MoMo: 'go',
  'Orange Money': 'food',
  'Pay online': 'parcel',
};

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

/**
 * The dashboard metrics of §9.3, every one of them computed from the orders in
 * the selected range rather than from a separate figure that could disagree
 * with the table beside it.
 */
export default function DashboardMetrics() {
  const { orders, customers } = useAppState();
  const { range } = useDateRange();
  const { language } = usePreferences();

  const inPeriod = useMemo(
    () => orders.filter((o) => withinRange(o.placedAt, range)),
    [orders, range],
  );

  const stats = useMemo(() => {
    const delivered = inPeriod.filter((o) => o.status === 'delivered');
    const ended = inPeriod.filter(
      (o) => o.status === 'cancelled' || o.status === 'failed',
    );
    const gross = delivered.reduce((sum, o) => sum + o.total, 0);
    const fees = delivered.reduce((sum, o) => sum + o.deliveryFee, 0);
    const commission = delivered.reduce((sum, o) => sum + o.commission, 0);
    const fulfilment = delivered
      .map((o) => o.fulfilmentMinutes)
      .filter((m): m is number => m !== null);

    return {
      total: inPeriod.length,
      delivered: delivered.length,
      ended: ended.length,
      gross,
      fees,
      commission,
      basket: delivered.length ? Math.round(gross / delivered.length) : 0,
      fulfilment: average(fulfilment),
      lateRate: inPeriod.length
        ? Math.round((inPeriod.filter((o) => o.isLate).length / inPeriod.length) * 1000) / 10
        : 0,
      cancelRate: inPeriod.length
        ? Math.round((ended.length / inPeriod.length) * 1000) / 10
        : 0,
    };
  }, [inPeriod]);

  const byService = useMemo(() => (['food', 'grocery', 'parcel'] as const).map((v) => {
    const rows = inPeriod.filter((o) => o.vertical === v);
    const delivered = rows.filter((o) => o.status === 'delivered');
    const gross = delivered.reduce((sum, o) => sum + o.total, 0);
    return {
      service: v,
      orders: rows.length,
      gross,
      basket: delivered.length ? Math.round(gross / delivered.length) : 0,
    };
  }), [inPeriod]);

  const byZone = useMemo(() => {
    const map = new Map<string, { orders: number; revenue: number }>();
    for (const o of inPeriod) {
      const row = map.get(o.zone) ?? { orders: 0, revenue: 0 };
      row.orders += 1;
      if (o.status === 'delivered') row.revenue += o.total;
      map.set(o.zone, row);
    }
    return [...map.entries()]
      .map(([zone, row]) => ({ zone, ...row }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [inPeriod]);

  const paymentSplit = useMemo(
    () => PAYMENT_METHOD_LIST
      .map((method) => ({
        label: method,
        value: inPeriod.filter((o) => o.payment === method).length,
        token: METHOD_TOKEN[method] ?? 'calm',
      }))
      .filter((s) => s.value > 0),
    [inPeriod],
  );

  const cancellations = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of inPeriod) {
      if (o.status !== 'cancelled' && o.status !== 'failed') continue;
      const reason = [...o.timeline].reverse().find((e) => e.reason)?.reason ?? 'Not recorded';
      map.set(reason, (map.get(reason) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([label, value]) => ({ label, value, token: 'stop' }))
      .sort((a, b) => b.value - a.value);
  }, [inPeriod]);

  const topRiders = useMemo(() => {
    const map = new Map<string, { count: number; minutes: number[] }>();
    for (const o of inPeriod) {
      if (!o.rider || o.status !== 'delivered') continue;
      const row = map.get(o.rider) ?? { count: 0, minutes: [] };
      row.count += 1;
      if (o.fulfilmentMinutes !== null) row.minutes.push(o.fulfilmentMinutes);
      map.set(o.rider, row);
    }
    return [...map.entries()]
      .map(([rider, row]) => ({ rider, count: row.count, avg: average(row.minutes) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [inPeriod]);

  const topVendors = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>();
    for (const o of inPeriod) {
      const row = map.get(o.vendor) ?? { count: 0, revenue: 0 };
      row.count += 1;
      if (o.status === 'delivered') row.revenue += o.total;
      map.set(o.vendor, row);
    }
    return [...map.entries()]
      .map(([vendor, row]) => ({ vendor, ...row }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [inPeriod]);

  // §9.3 asks for signups in the period. Customers carry no signup date, so
  // this is stated as unavailable rather than approximated from order counts.
  const newCustomers: number | null = null;

  const locale = language === 'fr' ? 'fr-FR' : 'en-GB';

  if (inPeriod.length === 0) {
    return (
      <Card>
        <EmptyState
          heading={`Nothing happened in ${describeRange(range, locale)}`}
          line="No order was placed inside the range you have chosen, so there is nothing to measure."
        />
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <MetricRow>
        <MetricTile
          label="Total orders"
          value={String(stats.total)}
          note={`${stats.delivered} delivered · ${stats.ended} ended`}
        />
        <MetricTile label="Gross sales" value={money(stats.gross)} prefix="FCFA" />
        <MetricTile label="Commission earned" value={money(stats.commission)} prefix="FCFA" />
        <MetricTile label="Delivery fees" value={money(stats.fees)} prefix="FCFA" />
      </MetricRow>

      <MetricRow>
        <MetricTile label="Average order" value={money(stats.basket)} prefix="FCFA" />
        <MetricTile
          label="Average fulfilment"
          value={stats.fulfilment ? `${stats.fulfilment} min` : '—'}
          note="placed to delivered"
        />
        <MetricTile label="Late rate" value={`${stats.lateRate}%`} />
        <MetricTile label="Cancel rate" value={`${stats.cancelRate}%`} />
      </MetricRow>

      <div className="reeyo-split-even">
        <Card title="Per service">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {byService.map((row) => (
              <div
                key={row.service}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                  borderBottom: '1px solid var(--line-soft)',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 9, height: 9, borderRadius: 3, flexShrink: 0,
                    background: `var(--${row.service})`,
                  }}
                />
                <span style={{ flex: 1, fontSize: 12.5, textTransform: 'capitalize' }}>
                  {row.service}
                </span>
                <span className="mono" style={{ fontSize: 12, color: 'var(--text-2)', width: 44, textAlign: 'right' }}>
                  {row.orders}
                </span>
                <span className="mono" style={{ fontSize: 12, width: 92, textAlign: 'right' }}>
                  {money(row.gross)}
                </span>
                <span className="mono" style={{ fontSize: 11.5, color: 'var(--text-3)', width: 78, textAlign: 'right' }}>
                  {money(row.basket)} avg
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Payment split">
          {paymentSplit.length === 0 ? (
            <EmptyState heading="Nothing paid yet" line="No order in this period carries a method." />
          ) : (
            <Donut
              slices={paymentSplit}
              centreValue={String(inPeriod.length)}
              centreLabel="orders"
            />
          )}
        </Card>
      </div>

      <div className="reeyo-split-even">
        <Card title="Zone performance">
          {byZone.length === 0 ? (
            <EmptyState heading="No zones" line="No order in this period carries a zone." />
          ) : (
            <BarList
              items={byZone.map((z) => ({ label: z.zone, value: z.revenue, token: 'go' }))}
              format={(v) => money(v)}
            />
          )}
        </Card>

        <Card title="Top vendors">
          {topVendors.length === 0 ? (
            <EmptyState heading="No vendors" line="Nothing was ordered in this period." />
          ) : (
            <BarList
              items={topVendors.map((v) => ({ label: v.vendor, value: v.revenue, token: 'food' }))}
              format={(v) => money(v)}
            />
          )}
        </Card>
      </div>

      <div className="reeyo-split-even">
        <Card title="Top riders">
          {topRiders.length === 0 ? (
            <EmptyState heading="No deliveries" line="Nobody completed a delivery in this period." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {topRiders.map((r) => (
                <div
                  key={r.rider}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0',
                    borderBottom: '1px solid var(--line-soft)',
                  }}
                >
                  <span style={{ flex: 1, fontSize: 12.5 }}>{r.rider}</span>
                  <span className="mono" style={{ fontSize: 12 }}>{r.count}</span>
                  <span className="mono" style={{ fontSize: 11.5, color: 'var(--text-3)', width: 66, textAlign: 'right' }}>
                    {r.avg ? `${r.avg} min` : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Why orders ended">
          {cancellations.length === 0 ? (
            <EmptyState
              heading="Nothing was cancelled"
              line="Every order in this period is still running or was delivered."
            />
          ) : (
            <BarList items={cancellations} />
          )}
        </Card>
      </div>

      <Card title="Customers">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 3 }}>On the platform</div>
            <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--forest)' }}>
              {customers.length}
            </div>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 3 }}>Ordered in this period</div>
            <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--forest)' }}>
              {new Set(inPeriod.map((o) => o.customer)).size}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div className="eyebrow" style={{ marginBottom: 3 }}>New signups</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {newCustomers ?? 'Customers carry no signup date, so this cannot be counted'}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
