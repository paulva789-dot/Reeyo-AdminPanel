import { useState } from 'react';
import PageTitle from '../components/layout/PageTitle';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Toggle from '../components/ui/Toggle';
import Segments from '../components/ui/Segments';
import MetricTile, { MetricRow } from '../components/ui/MetricTile';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import Field, { TextArea, Select } from '../components/ui/Field';
import BarList from '../components/charts/BarList';
import LocalOnly from '../components/ui/LocalOnly';
import { useAppState } from '../state/useAppState';
import { money } from '../lib/format';
import { announcements, spinPrizes } from '../data/seed';
import type { Offer } from '../data/types';

function Offers() {
  const { offers, toggleOffer, sampleOnly } = useAppState();

  const live = offers.filter((o) => o.active).length;
  const redemptions = offers.reduce((s, o) => s + o.uses, 0);
  const spent = offers.reduce((s, o) => s + o.spent, 0);

  const columns: Column<Offer>[] = [
    {
      key: 'name', header: 'Offer',
      render: (o) => (
        <div>
          <div style={{ fontWeight: 600 }}>{o.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{o.vertical} · {o.zone}</div>
        </div>
      ),
    },
    {
      key: 'code', header: 'Code',
      render: (o) => (
        <span className="mono" style={{ fontSize: 12, color: 'var(--forest)' }}>{o.code}</span>
      ),
    },
    {
      key: 'reward', header: 'Reward',
      render: (o) => (
        <div>
          <div className="mono" style={{ fontSize: 12 }}>{o.value}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{o.type}</div>
        </div>
      ),
    },
    { key: 'payer', header: 'Absorbed by', render: (o) => o.payer },
    {
      key: 'uses', header: 'Redemptions', align: 'right',
      render: (o) => <span className="mono" style={{ fontSize: 12 }}>{o.uses}</span>,
    },
    {
      key: 'spent', header: 'Spend', align: 'right',
      render: (o) => <span className="mono" style={{ fontSize: 12 }}>{money(o.spent)}</span>,
    },
    {
      key: 'ends', header: 'Ends', align: 'right',
      render: (o) => (
        <span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{o.ends}</span>
      ),
    },
    {
      key: 'live', header: 'Live', align: 'right',
      render: (o) => (
        <Toggle checked={o.active} onChange={() => toggleOffer(o.id)} label={`${o.name} live`} />
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <MetricRow>
          <MetricTile label="Live offers" value={String(live)} note={`of ${offers.length}`} />
          <MetricTile label="Redemptions" value={String(redemptions)} delta={sampleOnly(18)} />
          <MetricTile label="Campaign spend" value={money(spent)} prefix="FCFA" delta={sampleOnly(6)} invertDelta />
          <MetricTile
            label="Cost per redemption"
            value={redemptions > 0 ? money(Math.round(spent / redemptions)) : '—'}
            prefix={redemptions > 0 ? 'FCFA' : undefined}
          />
        </MetricRow>
      </div>

      <Card>
        <DataTable columns={columns} rows={offers} rowKey={(o) => String(o.id)} minWidth={940} />
      </Card>
    </>
  );
}

function Announcements() {
  const { pushToast } = useAppState();
  const [headline, setHeadline] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('Customers · All zones');
  const [channel, setChannel] = useState('Push notification');
  const [error, setError] = useState('');

  const send = () => {
    if (!headline.trim()) {
      setError('Give the announcement a headline first');
      return;
    }
    setError('');
    pushToast(`Announcement sent to ${audience}`);
    setHeadline('');
    setMessage('');
  };

  return (
    <div className="reeyo-split-even">
      <Card title="Compose">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <Field label="Headline" value={headline} onChange={setHeadline} placeholder="Free delivery this Friday" />
          <TextArea label="Message" value={message} onChange={setMessage} placeholder="What should people know?" />
          <Select
            label="Audience" value={audience} onChange={setAudience}
            options={[
              'Customers · All zones', 'Customers · Molyko', 'Riders · All zones',
              'Vendors · All zones',
            ].map((v) => ({ value: v, label: v }))}
          />
          <Select
            label="Channel" value={channel} onChange={setChannel}
            options={['Push notification', 'In-app message', 'Email', 'SMS']
              .map((v) => ({ value: v, label: v }))}
          />

          {error && (
            <p style={{ margin: 0, fontSize: 12, color: 'var(--stop)' }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: 9 }}>
            <div style={{ flex: 1 }} />
            <Button variant="primary" onClick={send}>Send announcement</Button>
          </div>
        </div>
      </Card>

      <Card title="Sent history">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {announcements.map((a) => (
            <div
              key={a.id}
              style={{
                background: 'var(--card)', border: '1px solid var(--line)',
                borderRadius: 'var(--r-card)', padding: '11px 13px',
              }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--forest)' }}>
                {a.headline}
              </div>
              <p style={{ margin: '4px 0 8px', fontSize: 12, color: 'var(--text-2)' }}>
                {a.message}
              </p>
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  flexWrap: 'wrap', fontSize: 11, color: 'var(--text-3)',
                }}
              >
                <span>{a.audience}</span>
                <span>{a.channel}</span>
                <span className="mono">{a.sent}</span>
                <div style={{ flex: 1 }} />
                <span className="mono">{a.reach.toLocaleString('fr-FR')} reached</span>
                <span className="mono" style={{ color: 'var(--emerald-ink)' }}>
                  {a.openRate}% opened
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/** Hand-drawn SVG wheel — each slice sized by its weight (section 8.8). */
function SpinWheel() {
  const total = spinPrizes.reduce((s, p) => s + p.weight, 0);
  const size = 236;
  const r = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;

  // Each slice's start angle is derived from the ones before it rather than by
  // mutating a running value while rendering.
  const slices = spinPrizes.reduce<{ prize: typeof spinPrizes[number]; from: number; sweep: number }[]>(
    (acc, prize) => {
      const sweep = (prize.weight / total) * Math.PI * 2;
      const from = acc.length ? acc[acc.length - 1].from + acc[acc.length - 1].sweep : -Math.PI / 2;
      return [...acc, { prize, from, sweep }];
    },
    [],
  );

  return (
    <div className="reeyo-split-even">
      <Card title="Prize weights">
        <BarList
          items={spinPrizes.map((p) => ({
            label: p.name, value: p.weight, token: p.colourToken,
          }))}
          format={(v) => `${v}%`}
        />
      </Card>

      <Card title="Wheel">
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <svg
            width={size} height={size} viewBox={`0 0 ${size} ${size}`}
            role="img"
            aria-label={spinPrizes.map((p) => `${p.name} ${p.weight}%`).join(', ')}
          >
            {slices.map(({ prize, from, sweep }) => {
              const to = from + sweep;
              const x1 = cx + r * Math.cos(from);
              const y1 = cy + r * Math.sin(from);
              const x2 = cx + r * Math.cos(to);
              const y2 = cy + r * Math.sin(to);
              const large = sweep > Math.PI ? 1 : 0;
              return (
                <path
                  key={prize.id}
                  d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`}
                  fill={`var(--${prize.colourToken})`}
                  stroke="var(--card)"
                  strokeWidth="2"
                />
              );
            })}
            <circle cx={cx} cy={cy} r="26" fill="var(--card)" stroke="var(--line)" strokeWidth="2" />
          </svg>
        </div>
      </Card>
    </div>
  );
}

export default function Marketing() {
  const [tab, setTab] = useState('offers');

  return (
    <>
      <PageTitle
        actions={tab === 'offers' ? <Button variant="primary">Create offer</Button> : undefined}
      >
        Marketing
      </PageTitle>

      <LocalOnly
        what="Announcements, the spin wheel and loyalty"
        endpoint="/broadcast/* and /engagement/*"
      />

      <div style={{ marginBottom: 14 }}>
        <Segments
          ariaLabel="Marketing view"
          value={tab}
          onChange={setTab}
          segments={[
            { value: 'offers', label: 'Offers' },
            { value: 'announcements', label: 'Announcements' },
            { value: 'wheel', label: 'Spin wheel' },
          ]}
        />
      </div>

      {tab === 'offers' && <Offers />}
      {tab === 'announcements' && <Announcements />}
      {tab === 'wheel' && <SpinWheel />}
    </>
  );
}
