import { useState } from 'react';
import Button from '../ui/Button';
import Pill from '../ui/Pill';
import Field, { Select } from '../ui/Field';
import { Modal, FooterSpacer } from '../ui/Overlay';
import { Block } from './OrderDetailBlocks';
import { money, initials } from '../../lib/format';
import { useAppState } from '../../state/useAppState';
import type { Order } from '../../data/types';

/**
 * Assigning a rider — specification §3.5.
 *
 * Two ways in: the registered pool, filtered to the order's zone and showing
 * what each rider is already carrying, and a manual entry for an ad-hoc courier.
 * The manual path exists because the alternative is an operator writing the
 * courier's number on paper, which is what the console is meant to replace.
 */
function AssignModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const { riders, orders, assignRider, assignManualRider } = useAppState();
  const [tab, setTab] = useState<'pool' | 'manual'>('pool');
  const [pick, setPick] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicle, setVehicle] = useState('Moto');
  const [error, setError] = useState('');

  // How much each rider is already carrying, so the choice is informed.
  const load = new Map<string, number>();
  for (const o of orders) {
    if (!o.rider) continue;
    if (o.status === 'delivered' || o.status === 'cancelled' || o.status === 'failed') continue;
    load.set(o.rider, (load.get(o.rider) ?? 0) + 1);
  }

  // The order's own zone first — a rider two towns away is not a candidate.
  const inZone = riders.filter((r) => r.zone === order.to.zone);
  const others = riders.filter((r) => r.zone !== order.to.zone);
  const ordered = [...inZone, ...others];

  const submit = () => {
    if (tab === 'pool') {
      if (!pick) { setError('Choose a rider'); return; }
      assignRider(order.id, pick);
      onClose();
      return;
    }
    if (!name.trim()) { setError('Give the courier a name'); return; }
    if (!phone.trim()) { setError('A phone number is what makes this useful later'); return; }
    assignManualRider(order.id, { name: name.trim(), phone: phone.trim(), vehicle });
    onClose();
  };

  return (
    <Modal
      title={order.rider ? 'Reassign rider' : 'Assign rider'}
      subtitle={`${order.id} · ${order.to.zone}`}
      onClose={onClose}
      width={470}
      footer={(
        <>
          <FooterSpacer />
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>
            {tab === 'pool' ? 'Assign' : 'Assign courier'}
          </Button>
        </>
      )}
    >
      <div
        role="tablist"
        aria-label="How to assign"
        style={{ display: 'flex', gap: 6, marginBottom: 14 }}
      >
        {([['pool', 'From the fleet'], ['manual', 'Someone else']] as const).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => { setTab(key); setError(''); }}
            style={{
              padding: '7px 12px', borderRadius: 'var(--r-pill)', cursor: 'pointer',
              border: `1px solid ${tab === key ? 'var(--emerald)' : 'var(--line)'}`,
              background: tab === key ? 'var(--go-soft)' : 'transparent',
              color: tab === key ? 'var(--emerald-ink)' : 'var(--text-2)',
              fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 700,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'pool' ? (
        <Select
          label="Rider"
          value={pick}
          onChange={(v) => { setPick(v); setError(''); }}
          options={[
            { value: '', label: 'Choose a rider' },
            ...ordered.map((r) => ({
              value: r.name,
              label: `${r.name} · ${r.zone} · ${r.state}`
                + ` · carrying ${load.get(r.name) ?? 0}`
                + (r.zone === order.to.zone ? '' : ' · outside the zone'),
            })),
          ]}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field
            label="Name"
            value={name}
            onChange={(v) => { setName(v); setError(''); }}
            placeholder="Courier name"
          />
          <Field
            label="Phone"
            value={phone}
            onChange={(v) => { setPhone(v); setError(''); }}
            placeholder="6xx xx xx xx"
            mono
          />
          <Select
            label="Vehicle"
            value={vehicle}
            onChange={setVehicle}
            options={['Moto', 'Bicycle', 'Car', 'On foot'].map((v) => ({ value: v, label: v }))}
          />
          <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-3)' }}>
            A courier from outside the fleet is recorded on the order here, but
            the platform cannot track them — the assign endpoint takes a
            registered rider, and this one has no account.
          </p>
        </div>
      )}

      {error && (
        <p style={{ margin: '11px 0 0', fontSize: 12, color: 'var(--stop)' }}>{error}</p>
      )}
    </Modal>
  );
}

export default function RiderBlock({ order }: { order: Order }) {
  const [assigning, setAssigning] = useState(false);
  const rider = order.riderDetail;
  const settled = order.status === 'delivered'
    || order.status === 'cancelled' || order.status === 'failed';

  return (
    <>
      <Block
        title="Rider"
        action={!settled && (
          <Button variant="soft" onClick={() => setAssigning(true)}>
            {rider ? 'Reassign' : 'Assign'}
          </Button>
        )}
      >
        {!rider ? (
          <p style={{ margin: '4px 0', fontSize: 12.5, color: 'var(--text-3)' }}>
            Nobody is carrying this order yet.
          </p>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            {rider.photoUrl ? (
              <img
                src={rider.photoUrl}
                alt=""
                style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <span
                aria-hidden="true"
                className="mono"
                style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--go-soft)', color: 'var(--go)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 600,
                }}
              >
                {initials(rider.name)}
              </span>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--forest)' }}>
                {rider.name}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 2 }}>
                {rider.vehicle}
                {rider.plate && <span className="mono"> · {rider.plate}</span>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                {rider.team ?? 'No team'}{rider.zone ? ` · ${rider.zone}` : ''}
              </div>
              {rider.phone && (
                <a
                  href={`tel:${rider.phone.replace(/\s/g, '')}`}
                  className="mono"
                  style={{
                    display: 'inline-block', marginTop: 6, fontSize: 12,
                    color: 'var(--emerald-ink)', fontWeight: 600,
                  }}
                >
                  {rider.phone}
                </a>
              )}
              {rider.id === null && (
                <div style={{ marginTop: 7 }}>
                  <Pill status="off-fleet courier" token="watch" />
                </div>
              )}
            </div>

            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div className="eyebrow" style={{ marginBottom: 3 }}>Earns</div>
              <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--forest)' }}>
                {money(rider.earnings)}
              </div>
            </div>
          </div>
        )}
      </Block>

      {assigning && <AssignModal order={order} onClose={() => setAssigning(false)} />}
    </>
  );
}
