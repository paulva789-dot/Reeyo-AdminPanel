import { useState } from 'react';
import PageTitle from '../components/layout/PageTitle';
import Card from '../components/ui/Card';
import Segments from '../components/ui/Segments';
import MetricTile, { MetricRow } from '../components/ui/MetricTile';
import ColumnChart from '../components/charts/ColumnChart';
import BarList from '../components/charts/BarList';
import Donut from '../components/charts/Donut';
import { money } from '../lib/format';
import {
  gmv30Days, moneySplit, returningCustomers, topVendors, deliveryByZone,
  cancellationReasons, ratingDistribution, openComplaints, gmvSparkline,
} from '../data/seed';

const DAY_LABELS = Array.from({ length: 30 }, (_, i) => `${i + 1}`);
const WEEK_LABELS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];

/** Delivery time thresholds decide the bar colour, so it is never decorative. */
function deliveryToken(minutes: number): string {
  if (minutes > 32) return 'stop';
  if (minutes >= 26) return 'watch';
  return 'go';
}

function Money() {
  return (
    <>
      <MetricRow>
        <MetricTile label="GMV this month" value={money(13_240_000)} prefix="FCFA" delta={14} series={gmvSparkline} />
        <MetricTile label="Platform revenue" value={money(628_000)} prefix="FCFA" delta={9} />
        <MetricTile label="Average basket" value={money(6_930)} prefix="FCFA" delta={3} />
        <MetricTile label="Refunds" value={money(47_000)} prefix="FCFA" delta={-12} invertDelta />
      </MetricRow>

      <div className="reeyo-split-even" style={{ marginTop: 14 }}>
        <Card title="GMV, last 30 days">
          <ColumnChart data={gmv30Days} labels={DAY_LABELS} />
        </Card>
        <Card title="Where the money goes">
          <Donut
            slices={moneySplit.map((m) => ({ label: m.label, value: m.value, token: m.token }))}
            format={(v) => money(v)}
          />
        </Card>
      </div>
    </>
  );
}

function Growth() {
  return (
    <>
      <MetricRow>
        <MetricTile label="New customers" value="128" delta={22} />
        <MetricTile label="Returning rate" value="64%" delta={6} />
        <MetricTile label="Active vendors" value="7" note="one under review" />
        <MetricTile label="Orders per customer" value="3.4" delta={2} />
      </MetricRow>

      <div className="reeyo-split-even" style={{ marginTop: 14 }}>
        <Card title="Returning customers by week">
          <ColumnChart
            data={returningCustomers} labels={WEEK_LABELS} colour="var(--grocery-vivid)"
          />
        </Card>
        <Card title="Top vendors by revenue">
          <BarList items={topVendors} format={(v) => money(v)} />
        </Card>
      </div>
    </>
  );
}

function Operations() {
  return (
    <>
      <MetricRow>
        <MetricTile label="Average delivery" value="24 min" delta={-3} deltaSuffix=" min" invertDelta />
        <MetricTile label="Orders in flight" value="9" />
        <MetricTile label="Cancel rate" value="8%" delta={-1} invertDelta />
        <MetricTile label="Riders on shift" value="4" note="of six" />
      </MetricRow>

      <div className="reeyo-split-even" style={{ marginTop: 14 }}>
        <Card title="Delivery time by zone">
          <BarList
            items={deliveryByZone.map((z) => ({
              label: z.label, value: z.value, token: deliveryToken(z.value),
            }))}
            format={(v) => `${v} min`}
          />
        </Card>
        <Card title="Why orders get cancelled">
          <BarList items={cancellationReasons} format={(v) => `${v}%`} />
        </Card>
      </div>
    </>
  );
}

function Experience() {
  return (
    <>
      <MetricRow>
        <MetricTile label="Average rating" value="4.6" delta={1} />
        <MetricTile label="Ratings collected" value="1 056" delta={18} />
        <MetricTile label="Open complaints" value="30" delta={4} invertDelta />
        <MetricTile label="Resolved in 24h" value="82%" delta={5} />
      </MetricRow>

      <div className="reeyo-split-even" style={{ marginTop: 14 }}>
        <Card title="Rating distribution">
          <BarList items={ratingDistribution} />
        </Card>
        <Card title="Open complaints">
          <BarList items={openComplaints} />
        </Card>
      </div>
    </>
  );
}

export default function Analytics() {
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

      {tab === 'money' && <Money />}
      {tab === 'growth' && <Growth />}
      {tab === 'operations' && <Operations />}
      {tab === 'experience' && <Experience />}
    </>
  );
}
