import { useState } from 'react';
import PageTitle from '../components/layout/PageTitle';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Pill from '../components/ui/Pill';
import Toggle from '../components/ui/Toggle';
import Field from '../components/ui/Field';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import LocalOnly from '../components/ui/LocalOnly';
import ApiKeysCard from './settings/ApiKeysCard';
import { useAppState } from '../state/useAppState';
import { PAYMENT_METHODS, adminTeam } from '../data/seed';
import { initials } from '../lib/format';

type Admin = (typeof adminTeam)[number];

/** Each switch states its consequence in one line — section 8.11. */
const SWITCHES = [
  {
    id: 'accept',
    name: 'Accept new orders',
    consequence: 'Turning this off stops every vertical taking orders immediately.',
    on: true,
  },
  {
    id: 'scheduled',
    name: 'Scheduled orders',
    consequence: 'Customers can pick a delivery slot up to 48 hours ahead.',
    on: true,
  },
  {
    id: 'autoassign',
    name: 'Auto-assign riders',
    consequence: 'Orders go to the nearest idle rider without an admin picking one.',
    on: true,
  },
  {
    id: 'surge',
    name: 'Surge pricing',
    consequence: 'Delivery fees rise automatically when demand outruns riders on shift.',
    on: false,
  },
  {
    id: 'selfsignup',
    name: 'Vendor self-signup',
    consequence: 'New vendors can register without an invite and wait under review.',
    on: false,
  },
];

export default function Settings() {
  const { pushToast } = useAppState();
  const [commission, setCommission] = useState('15');
  const [serviceFee, setServiceFee] = useState('2.5');
  const [riderCut, setRiderCut] = useState('10');
  const [baseFare, setBaseFare] = useState('500');
  const [methods, setMethods] = useState<string[]>(PAYMENT_METHODS.slice(0, 4));
  const [switches, setSwitches] = useState(
    Object.fromEntries(SWITCHES.map((s) => [s.id, s.on])) as Record<string, boolean>,
  );

  const columns: Column<Admin>[] = [
    {
      key: 'name', header: 'Admin',
      render: (a) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span
            aria-hidden="true"
            className="mono"
            style={{
              width: 28, height: 28, borderRadius: 'var(--r-pill)', flexShrink: 0,
              background: 'var(--calm-soft)', color: 'var(--text-2)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10,
            }}
          >
            {initials(a.name)}
          </span>
          <span style={{ fontWeight: 600 }}>{a.name}</span>
        </div>
      ),
    },
    { key: 'role', header: 'Role', render: (a) => a.role },
    { key: 'zone', header: 'Based in', render: (a) => a.zone },
    {
      key: 'status', header: 'Status',
      render: (a) => <Pill status={a.active ? 'active' : 'archived'} />,
    },
  ];

  return (
    <>
      <PageTitle
        actions={(
          <Button variant="primary" onClick={() => pushToast('Settings saved')}>
            Save changes
          </Button>
        )}
      >
        Settings
      </PageTitle>

      <LocalOnly what="Platform configuration" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="reeyo-split-even">
          <Card title="Commission and fees">
            <div
              style={{
                display: 'grid', gap: 13,
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              }}
            >
              <Field label="Vendor commission %" value={commission} onChange={setCommission} mono />
              <Field label="Service fee %" value={serviceFee} onChange={setServiceFee} mono />
              <Field label="Rider platform cut %" value={riderCut} onChange={setRiderCut} mono />
              <Field label="Base delivery fare" value={baseFare} onChange={setBaseFare} mono />
            </div>
          </Card>

          <Card title="Payment methods">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {PAYMENT_METHODS.map((m) => (
                <div
                  key={m}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '8px 0',
                  }}
                >
                  <span style={{ flex: 1, fontSize: 12.5 }}>{m}</span>
                  <Toggle
                    checked={methods.includes(m)}
                    onChange={(next) => setMethods((prev) => (next
                      ? [...prev, m]
                      : prev.filter((x) => x !== m)))}
                    label={m}
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card title="Platform switches">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {SWITCHES.map((s, i) => (
              <div
                key={s.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  padding: '12px 0',
                  borderBottom: i === SWITCHES.length - 1
                    ? 'none' : '1px solid var(--line-soft)',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                  <p style={{ margin: '3px 0 0', fontSize: 11.5, color: 'var(--text-2)' }}>
                    {s.consequence}
                  </p>
                </div>
                <Toggle
                  checked={switches[s.id]}
                  onChange={(next) => setSwitches((prev) => ({ ...prev, [s.id]: next }))}
                  label={s.name}
                />
              </div>
            ))}
          </div>
        </Card>

        <ApiKeysCard />

        <Card
          title="Admin team"
          action={<Button variant="outline">Invite admin</Button>}
        >
          <DataTable
            columns={columns}
            rows={adminTeam}
            rowKey={(a) => a.id}
            minWidth={520}
          />
        </Card>
      </div>
    </>
  );
}
