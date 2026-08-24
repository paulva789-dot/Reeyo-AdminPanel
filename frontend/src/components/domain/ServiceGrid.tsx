import { useNavigate } from 'react-router-dom';
import type { Order, Vertical } from '../../data/types';
import { money } from '../../lib/format';
import Button from '../ui/Button';
import Pill from '../ui/Pill';
import { useAppState } from '../../state/useAppState';
import { ALL_REGIONS, REGIONS, zonesInRegion } from '../../data/geography';

interface ServiceGridProps {
  orders: Order[];
}

const IN_FLIGHT = ['accepted', 'preparing', 'ready', 'on the way'];

function summarise(orders: Order[], vertical: Vertical) {
  const rows = orders.filter((o) => o.vertical === vertical);
  return {
    orders: rows.length,
    value: rows.reduce((sum, o) => sum + o.total, 0),
    inFlight: rows.filter((o) => IN_FLIGHT.includes(o.status)).length,
    problems: rows.filter((o) => o.status === 'delayed' || o.status === 'cancelled').length,
  };
}

function Figure({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div className="eyebrow" style={{ marginBottom: 3 }}>{label}</div>
      <div
        className={mono ? 'mono' : undefined}
        style={{ fontSize: 15, fontWeight: 600, color: 'var(--forest)' }}
      >
        {value}
      </div>
    </div>
  );
}

function ServiceTile({
  name, token, stats, onOpen,
}: {
  name: string;
  token: Vertical;
  stats: ReturnType<typeof summarise>;
  onOpen: () => void;
}) {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1.5px solid var(--pastel)',
        borderRadius: 'var(--r-card)',
        padding: 16, display: 'flex', flexDirection: 'column', gap: 13,
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          aria-hidden="true"
          style={{
            width: 9, height: 9, borderRadius: '50%',
            background: `var(--${token})`, flexShrink: 0,
          }}
        />
        <h3
          style={{
            margin: 0, fontSize: 14, fontWeight: 800,
            letterSpacing: '-0.02em', color: 'var(--forest)',
          }}
        >
          {name}
        </h3>
        <div style={{ flex: 1 }} />
        {stats.problems > 0
          ? <Pill status={`${stats.problems} needs attention`} token="stop" />
          : <Pill status="healthy" token="go" />}
      </div>

      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        <Figure label="Orders" value={String(stats.orders)} />
        <Figure label="Value" value={`FCFA ${money(stats.value)}`} />
        <Figure label="In flight" value={String(stats.inFlight)} />
      </div>

      <div>
        <Button variant="soft" onClick={onOpen}>View {name.toLowerCase()} orders</Button>
      </div>
    </div>
  );
}

/** Section 8.1c — two equal tiles above one full-width parcel banner. */
export default function ServiceGrid({ orders }: ServiceGridProps) {
  const navigate = useNavigate();
  const { region } = useAppState();

  // Says where parcel actually runs rather than a number that goes stale the
  // moment coverage changes.
  const parcelZones = new Set(
    orders.filter((o) => o.vertical === 'parcel').map((o) => o.zone),
  ).size;
  const parcelReach = region === ALL_REGIONS
    ? `Same-day courier across ${REGIONS.length} regions`
    : `Same-day courier across ${parcelZones || zonesInRegion(region).length} ${
      (parcelZones || zonesInRegion(region).length) === 1 ? 'zone' : 'zones'} in ${region}`;
  const food = summarise(orders, 'food');
  const grocery = summarise(orders, 'grocery');
  const parcel = summarise(orders, 'parcel');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="reeyo-service-tiles">
        <ServiceTile
          name="Food" token="food" stats={food}
          onOpen={() => navigate('/orders?vertical=food')}
        />
        <ServiceTile
          name="Grocery" token="grocery" stats={grocery}
          onOpen={() => navigate('/orders?vertical=grocery')}
        />
      </div>

      <div
        style={{
          background: 'linear-gradient(135deg, var(--pastel) 0%, var(--mint) 100%)',
          border: '1.5px solid var(--mint)',
          borderRadius: 'var(--r-card)',
          padding: 16,
          display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap',
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              aria-hidden="true"
              style={{
                width: 9, height: 9, borderRadius: '50%',
                background: 'var(--parcel)', flexShrink: 0,
              }}
            />
            <h3
              style={{
                margin: 0, fontSize: 14, fontWeight: 800,
                letterSpacing: '-0.02em', color: 'var(--forest)',
              }}
            >
              Parcel
            </h3>
          </div>
          <p style={{ margin: '5px 0 0', fontSize: 12.5, color: 'var(--forest-600)' }}>
            {parcelReach}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <Figure label="Orders" value={String(parcel.orders)} />
          <Figure label="Value" value={`FCFA ${money(parcel.value)}`} />
          <Figure label="In flight" value={String(parcel.inFlight)} />
        </div>

        <Button variant="command" onClick={() => navigate('/dispatch')}>
          Track live
        </Button>
      </div>
    </div>
  );
}
