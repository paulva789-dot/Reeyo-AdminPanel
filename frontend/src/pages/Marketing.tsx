import { useState } from 'react';
import PageTitle from '../components/layout/PageTitle';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Toggle from '../components/ui/Toggle';
import Segments from '../components/ui/Segments';
import MetricTile, { MetricRow } from '../components/ui/MetricTile';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import NoEndpoint from '../components/ui/NoEndpoint';
import { useAppState } from '../state/useAppState';
import { useEngagement } from '../state/useEngagement';
import { money } from '../lib/format';
import BroadcastPanel from './marketing/BroadcastPanel';
import SpinWheelPanel from './engagement/SpinWheelPanel';
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

export default function Marketing() {
  const [tab, setTab] = useState('offers');
  const engagement = useEngagement(['spinWheels']);

  return (
    <>
      <PageTitle
        actions={tab === 'offers' ? <Button variant="primary">Create offer</Button> : undefined}
      >
        Marketing
      </PageTitle>


      <div style={{ marginBottom: 14 }}>
        <Segments
          ariaLabel="Marketing view"
          value={tab}
          onChange={setTab}
          segments={[
            { value: 'offers', label: 'Offers' },
            { value: 'broadcast', label: 'Push' },
            { value: 'wheel', label: 'Spin wheel' },
          ]}
        />
      </div>

      {tab === 'offers' && (
        <NoEndpoint
          what="Promo codes and offers"
          consequence="Discount codes, who absorbs their cost and what they have spent are not exposed."
        >
          <Offers />
        </NoEndpoint>
      )}
      {tab === 'broadcast' && <BroadcastPanel />}
      {tab === 'wheel' && <SpinWheelPanel engagement={engagement} />}
    </>
  );
}
