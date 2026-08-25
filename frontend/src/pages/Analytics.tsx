import { useState } from 'react';
import PageTitle from '../components/layout/PageTitle';
import Card from '../components/ui/Card';
import Segments from '../components/ui/Segments';
import MetricTile, { MetricRow } from '../components/ui/MetricTile';
import EmptyState from '../components/ui/EmptyState';
import ColumnChart from '../components/charts/ColumnChart';
import BarList from '../components/charts/BarList';
import Donut from '../components/charts/Donut';
import { useAppState } from '../state/useAppState';
import { useAnalytics } from '../state/useAnalytics';
import type { AnalyticsBundle, Loadable } from '../state/useAnalytics';
import { ALL_REGIONS } from '../data/geography';
import { money, statusToken } from '../lib/format';
import {
  grossValue, cancelRate, averageBasket, averageEta, ratingAverage,
  topVendorsByRevenue, revenueByVertical, segmentCounts, deliveryByZone,
  topRidersByTrips, orderStatusCounts,
} from '../lib/insights';
import {
  returningCustomers, ratingDistribution, openComplaints,
  gmvSparkline, gmv30Days,
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
 * Says where the numbers on a tab came from — and, when a region is selected,
 * that these particular numbers ignore it. The analytics endpoints take no
 * region parameter, so a figure from them covers the whole country however the
 * topbar is set. Saying nothing would let the filter take credit for a total
 * it did not produce.
 */
function SourceNote({ live, error }: { live: boolean; error: string | null }) {
  const { region } = useAppState();
  const scoped = region !== ALL_REGIONS;

  const text = error
    ? `${error} Showing figures worked out from the rows already loaded.`
    : live
      ? scoped
        ? `Platform analytics cover all ten regions — the ${region} filter does not
           apply to these figures.`
        : 'From the platform analytics endpoints.'
      : 'Worked out from the rows on screen.';

  return (
    <p
      style={{
        margin: '9px 0 0', fontSize: 11.5,
        color: error ? 'var(--stop)' : 'var(--text-3)',
      }}
    >
      {text.replace(/\s+/g, ' ')}
    </p>
  );
}

/**
 * A chart whose data now has a real endpoint. In live mode it plots what came
 * back; in sample mode it plots the seed shape. What it never does is plot
 * seed data while claiming to be live.
 */
function SeriesCard<T>({
  title, source, sample, children, emptyLine,
}: {
  title: string;
  source: Loadable<T[]>;
  /** The seeded stand-in, used only when the console is in sample mode. */
  sample: React.ReactNode;
  children: (rows: T[]) => React.ReactNode;
  emptyLine: string;
}) {
  const { isSample } = useAppState();

  if (isSample) return <Card title={title}>{sample}</Card>;

  return (
    <Card title={title}>
      {source.loading ? (
        <EmptyState heading="Loading…" line="Fetching this from the analytics API." />
      ) : source.error ? (
        <EmptyState heading="Could not load this" line={source.error} />
      ) : !source.value || source.value.length === 0 ? (
        <EmptyState heading="Nothing to plot yet" line={emptyLine} />
      ) : (
        children(source.value)
      )}
    </Card>
  );
}

/** In live mode a card with no endpoint behind it says so rather than inventing one. */
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

function Money({ analytics }: { analytics: AnalyticsBundle }) {
  const { orders, sampleOnly } = useAppState();
  const { stats, revenue } = analytics;
  const s = stats.value;
  const vertical = revenueByVertical(orders);

  return (
    <>
      <MetricRow>
        <MetricTile
          label="Gross value" value={money(s ? s.revenue : grossValue(orders))} prefix="FCFA"
          delta={sampleOnly(14)} series={sampleOnly(gmvSparkline)}
        />
        <MetricTile
          label="Average basket"
          value={money(s ? s.averageBasket : averageBasket(orders))} prefix="FCFA"
          delta={sampleOnly(3)}
        />
        <MetricTile
          label="Orders" value={String(s ? s.orders : orders.length)}
          note={s ? 'platform total' : 'loaded on screen'}
        />
        <MetricTile
          label="Cancel rate"
          value={`${s ? Math.round(s.cancelRate * 10) / 10 : cancelRate(orders)}%`}
          delta={sampleOnly(-1)} invertDelta
        />
      </MetricRow>
      <SourceNote live={s !== null} error={stats.error} />

      <div className="reeyo-split-even" style={{ marginTop: 14 }}>
        <SeriesCard
          title="Revenue over time"
          source={revenue}
          sample={<ColumnChart data={gmv30Days} labels={DAY_LABELS} />}
          emptyLine="No revenue has been recorded in the period the API reports on."
        >
          {(rows) => (
            <ColumnChart
              data={rows.map((r) => r.value)}
              labels={rows.map((r) => r.label)}
            />
          )}
        </SeriesCard>
        <Card title="Revenue by service">
          {vertical.length === 0 ? (
            <EmptyState
              heading="No revenue to split yet"
              line="Once orders complete, the share each service takes shows here."
            />
          ) : (
            <Donut slices={vertical} format={(v) => money(v)} />
          )}
        </Card>
      </div>
    </>
  );
}

function Growth({ analytics, isSample }: { analytics: AnalyticsBundle; isSample: boolean }) {
  const { customers, vendors, orders, sampleOnly } = useAppState();
  const { stats, topVendors } = analytics;
  const s = stats.value;
  const segments = segmentCounts(customers);

  const customerCount = s ? s.customers : customers.length;
  const orderCount = s ? s.orders : orders.length;
  const perCustomer = customerCount
    ? (orderCount / customerCount).toFixed(1) : '—';

  return (
    <>
      <MetricRow>
        <MetricTile label="Customers" value={String(customerCount)} delta={sampleOnly(22)} />
        <MetricTile label="Loyal" value={String(segments.loyal)} note="ordered 40+ times" />
        <MetricTile label="Lapsed" value={String(segments.lapsed)} note="worth a nudge" />
        <MetricTile label="Orders per customer" value={perCustomer} delta={sampleOnly(2)} />
      </MetricRow>
      <SourceNote live={s !== null} error={stats.error} />

      <div className="reeyo-split-even" style={{ marginTop: 14 }}>
        <HistoricalCard title="Returning customers by week" isSample={isSample}>
          <ColumnChart
            data={returningCustomers} labels={WEEK_LABELS} colour="var(--grocery-vivid)"
          />
        </HistoricalCard>
        <SeriesCard
          title="Top vendors by revenue"
          source={topVendors}
          sample={<BarList items={topVendorsByRevenue(vendors)} format={(v) => money(v)} />}
          emptyLine="Vendors appear here once they have taken their first orders."
        >
          {(rows) => (
            <BarList
              items={rows.map((r) => ({
                label: r.name, value: r.value, token: 'food',
              }))}
              format={(v) => money(v)}
            />
          )}
        </SeriesCard>
      </div>
    </>
  );
}

function Operations({ analytics }: { analytics: AnalyticsBundle }) {
  const { orders, riders, sampleOnly } = useAppState();
  const { stats, orderStatus, topRiders } = analytics;
  const s = stats.value;
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
          label="Cancel rate"
          value={`${s ? Math.round(s.cancelRate * 10) / 10 : cancelRate(orders)}%`}
          delta={sampleOnly(-1)} invertDelta
        />
        <MetricTile
          label="Riders" value={String(s ? s.riders : riders.length)}
          note={s ? 'platform total' : `${onShift} on shift`}
        />
      </MetricRow>
      <SourceNote live={s !== null} error={stats.error} />

      <div className="reeyo-split-even" style={{ marginTop: 14 }}>
        <SeriesCard
          title="Orders by status"
          source={orderStatus}
          sample={(
            <Donut
              slices={orderStatusCounts(orders).map((r) => ({
                label: r.status, value: r.count, token: statusToken(r.status),
              }))}
            />
          )}
          emptyLine="No orders have been placed in the period the API reports on."
        >
          {(rows) => (
            <Donut
              slices={rows.map((r) => ({
                label: r.status, value: r.count, token: statusToken(r.status),
              }))}
            />
          )}
        </SeriesCard>
        <SeriesCard
          title="Top riders by deliveries"
          source={topRiders}
          sample={<BarList items={topRidersByTrips(riders)} />}
          emptyLine="Riders appear here once they have completed deliveries."
        >
          {(rows) => (
            <BarList
              items={rows.map((r) => ({
                label: r.name, value: r.orders || r.value, token: 'parcel',
              }))}
            />
          )}
        </SeriesCard>
      </div>

      <div style={{ marginTop: 14 }}>
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
  // Every tab but Experience reads at least one of these, and the hook caches
  // per mount, so asking once here beats five hooks that refetch on each tab.
  const analytics = useAnalytics(['stats', 'revenue', 'topVendors', 'topRiders', 'orderStatus']);

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

      {tab === 'money' && <Money analytics={analytics} />}
      {tab === 'growth' && <Growth analytics={analytics} isSample={isSample} />}
      {tab === 'operations' && <Operations analytics={analytics} />}
      {tab === 'experience' && <Experience isSample={isSample} />}
    </>
  );
}
