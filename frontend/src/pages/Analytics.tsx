import { useState } from 'react';
import PageTitle from '../components/layout/PageTitle';
import Card from '../components/ui/Card';
import Segments from '../components/ui/Segments';
import MetricTile, { MetricRow } from '../components/ui/MetricTile';
import EmptyState from '../components/ui/EmptyState';
import ColumnChart from '../components/charts/ColumnChart';
import BarList from '../components/charts/BarList';
import Donut from '../components/charts/Donut';
import { useAppState } from '../state/AppState';
import { money } from '../lib/format';
import {
  grossValue, cancelRate, averageBasket, averageEta, ratingAverage,
  topVendorsByRevenue, revenueByVertical, segmentCounts, deliveryByZone,
} from '../lib/insights';
import {
  gmv30Days, returningCustomers, cancellationReasons, ratingDistribution,
  openComplaints, gmvSparkline,
} from '../data/seed';

const DAY_LABELS = Array.from({ length: 30 }, (_, i) => `${i + 1}`);
const WEEK_LABELS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];

/** Delivery time thresholds decide the bar colour, so it is never decorative. */
function deliveryToken(minutes: number): string {
  if (minutes > 32) return 'stop';
  if (minutes >= 26) return 'watch';
  return 'go';
}

/**
 * Wraps a card whose content the API gives us no way to compute. In live mode
 * it says so instead of showing a seeded shape that would read as real.
 */
function HistoricalCard({
  title, isSample, children,
}: { title: string; isSample: boolean; children: React.ReactNode }) {
  return (
    <Card title={title}>
      {isSample ? children : (
        <EmptyState
          heading="No history available"
          line="The admin API does not expose the past figures this chart needs, so there is nothing to plot."
        />
      )}
    </Card>
  );
}

function Money({ isSample }: { isSample: boolean }) {
  const { orders, sampleOnly } = useAppState();
  const gross = grossValue(orders);
  const revenue = revenueByVertical(orders);

  return (
    <>
      <MetricRow>
        <MetricTile
          label="Gross value" value={money(gross)} prefix="FCFA"
          delta={sampleOnly(14)} series={sampleOnly(gmvSparkline)}
        />
        <MetricTile
          label="Average basket" value={money(averageBasket(orders))} prefix="FCFA"
          delta={sampleOnly(3)}
        />
        <MetricTile label="Orders counted" value={String(orders.length)} />
        <MetricTile
          label="Cancel rate" value={`${cancelRate(orders)}%`}
          delta={sampleOnly(-1)} invertDelta
        />
      </MetricRow>

      <div className="reeyo-split-even" style={{ marginTop: 14 }}>
        <HistoricalCard title="Gross value, last 30 days" isSample={isSample}>
          <ColumnChart data={gmv30Days} labels={DAY_LABELS} />
        </HistoricalCard>
        <Card title="Revenue by service">
          {revenue.length === 0 ? (
            <EmptyState
              heading="No revenue to split yet"
              line="Once orders complete, the share each service takes shows here."
            />
          ) : (
            <Donut slices={revenue} format={(v) => money(v)} />
          )}
        </Card>
      </div>
    </>
  );
}

function Growth({ isSample }: { isSample: boolean }) {
  const { customers, vendors, orders, sampleOnly } = useAppState();
  const segments = segmentCounts(customers);
  const top = topVendorsByRevenue(vendors);
  const perCustomer = customers.length
    ? (orders.length / customers.length).toFixed(1) : '—';

  return (
    <>
      <MetricRow>
        <MetricTile label="Customers" value={String(customers.length)} delta={sampleOnly(22)} />
        <MetricTile label="Loyal" value={String(segments.loyal)} note="ordered 40+ times" />
        <MetricTile label="Lapsed" value={String(segments.lapsed)} note="worth a nudge" />
        <MetricTile label="Orders per customer" value={perCustomer} delta={sampleOnly(2)} />
      </MetricRow>

      <div className="reeyo-split-even" style={{ marginTop: 14 }}>
        <HistoricalCard title="Returning customers by week" isSample={isSample}>
          <ColumnChart
            data={returningCustomers} labels={WEEK_LABELS} colour="var(--grocery-vivid)"
          />
        </HistoricalCard>
        <Card title="Top vendors by revenue">
          {top.length === 0 ? (
            <EmptyState
              heading="No vendor revenue yet"
              line="Vendors appear here once they have taken their first orders."
            />
          ) : (
            <BarList items={top} format={(v) => money(v)} />
          )}
        </Card>
      </div>
    </>
  );
}

function Operations({ isSample }: { isSample: boolean }) {
  const { orders, riders, sampleOnly } = useAppState();
  const avgEta = averageEta(orders);
  const inFlight = orders.filter(
    (o) => o.status !== 'delivered' && o.status !== 'cancelled',
  ).length;
  const onShift = riders.filter((r) => r.state !== 'idle').length;
  const zones = deliveryByZone(orders);

  return (
    <>
      <MetricRow>
        <MetricTile
          label="Average delivery" value={avgEta === null ? '—' : `${avgEta} min`}
          delta={sampleOnly(-3)} deltaSuffix=" min" invertDelta
        />
        <MetricTile label="Orders in flight" value={String(inFlight)} />
        <MetricTile
          label="Cancel rate" value={`${cancelRate(orders)}%`}
          delta={sampleOnly(-1)} invertDelta
        />
        <MetricTile
          label="Riders on shift" value={String(onShift)}
          note={`of ${riders.length}`}
        />
      </MetricRow>

      <div className="reeyo-split-even" style={{ marginTop: 14 }}>
        <Card title="Delivery time by zone">
          {zones.length === 0 ? (
            <EmptyState
              heading="No delivery times to compare"
              line="Zones appear here once orders carry an estimated time."
            />
          ) : (
            <BarList
              items={zones.map((z) => ({
                label: z.label, value: z.value, token: deliveryToken(z.value),
              }))}
              format={(v) => `${v} min`}
            />
          )}
        </Card>
        <HistoricalCard title="Why orders get cancelled" isSample={isSample}>
          <BarList items={cancellationReasons} format={(v) => `${v}%`} />
        </HistoricalCard>
      </div>
    </>
  );
}

function Experience({ isSample }: { isSample: boolean }) {
  const { vendors, riders, customers, sampleOnly } = useAppState();
  const vendorRating = ratingAverage(vendors);
  const riderRating = ratingAverage(riders);
  const lowRated = [...vendors, ...riders].filter((r) => r.rating > 0 && r.rating < 4.2).length;

  return (
    <>
      <MetricRow>
        <MetricTile
          label="Vendor rating" value={vendorRating === null ? '—' : String(vendorRating)}
          delta={sampleOnly(1)}
        />
        <MetricTile
          label="Rider rating" value={riderRating === null ? '—' : String(riderRating)}
        />
        <MetricTile label="Rated below 4.2" value={String(lowRated)} note="vendors and riders" />
        <MetricTile label="Customers rated" value={String(customers.filter((c) => c.rating > 0).length)} />
      </MetricRow>

      <div className="reeyo-split-even" style={{ marginTop: 14 }}>
        <HistoricalCard title="Rating distribution" isSample={isSample}>
          <BarList items={ratingDistribution} />
        </HistoricalCard>
        <HistoricalCard title="Open complaints" isSample={isSample}>
          <BarList items={openComplaints} />
        </HistoricalCard>
      </div>
    </>
  );
}

export default function Analytics() {
  const { isSample } = useAppState();
  const [tab, setTab] = useState('money');

  return (
    <>
      <PageTitle>Analytics</PageTitle>

      <div style={{ marginBottom: 14 }}>
        <Segments
          ariaLabel="Analytics view"
          value={tab}
          onChange={setTab}
          segments={[
            { value: 'money', label: 'Money' },
            { value: 'growth', label: 'Growth' },
            { value: 'operations', label: 'Operations' },
            { value: 'experience', label: 'Experience' },
          ]}
        />
      </div>

      {tab === 'money' && <Money isSample={isSample} />}
      {tab === 'growth' && <Growth isSample={isSample} />}
      {tab === 'operations' && <Operations isSample={isSample} />}
      {tab === 'experience' && <Experience isSample={isSample} />}
    </>
  );
}
