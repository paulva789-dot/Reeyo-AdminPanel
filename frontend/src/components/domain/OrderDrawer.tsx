import { useState } from 'react';
import type { Order } from '../../data/types';
import { money, ORDER_STAGES, isLate } from '../../lib/format';
import { useAppState } from '../../state/useAppState';
import { Drawer, Modal, FooterSpacer } from '../ui/Overlay';
import Button from '../ui/Button';
import Pill from '../ui/Pill';
import { Select } from '../ui/Field';

const DELIVERY_FEE = 700;

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        gap: 12, padding: '7px 0',
      }}
    >
      <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{label}</span>
      <span style={{ fontSize: 12.5, color: 'var(--text)', textAlign: 'right' }}>
        {value}
      </span>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 18 }}>
      <div className="eyebrow" style={{ marginBottom: 9 }}>{title}</div>
      <div
        style={{
          background: 'var(--card)', border: '1px solid var(--line)',
          borderRadius: 'var(--r-card)', padding: '10px 14px',
        }}
      >
        {children}
      </div>
    </section>
  );
}

export default function OrderDrawer({ order, onClose }: { order: Order; onClose: () => void }) {
  const { setOrderStatus, assignRider, riders } = useAppState();
  const [reassigning, setReassigning] = useState(false);
  const [pick, setPick] = useState(riders[0]?.name ?? '');

  // The journey stops at the current stage; a cancelled order never advanced.
  const reached = order.status === 'cancelled'
    ? -1
    : ORDER_STAGES.indexOf(order.status === 'delayed' ? 'on the way' : order.status);

  const basket = order.total - DELIVERY_FEE;

  return (
    <>
      <Drawer
        title={order.id}
        subtitle={<>{order.vendor} · {order.zone} · placed {order.placedAgo}</>}
        onClose={onClose}
        footer={(
          <>
            <Button
              variant="destructive"
              onClick={() => { setOrderStatus(order.id, 'cancelled'); onClose(); }}
            >
              Cancel order
            </Button>
            <Button variant="outline" onClick={() => setReassigning(true)}>
              Reassign rider
            </Button>
            <FooterSpacer />
            <Button
              variant="primary"
              onClick={() => { setOrderStatus(order.id, 'delivered'); onClose(); }}
            >
              Mark delivered
            </Button>
          </>
        )}
      >
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          <Pill status={order.status} />
          <Pill status={order.vertical} token={order.vertical} />
          {isLate(order.eta) && <Pill status={order.eta} token="stop" />}
        </div>

        <Block title="Journey">
          {ORDER_STAGES.map((stage, i) => {
            const done = i <= reached;
            return (
              <div
                key={stage}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
                    background: done ? 'var(--emerald)' : 'var(--line)',
                  }}
                />
                <span
                  style={{
                    fontSize: 12.5, textTransform: 'capitalize',
                    color: done ? 'var(--text)' : 'var(--text-3)',
                    fontWeight: done ? 600 : 400,
                  }}
                >
                  {stage}
                </span>
              </div>
            );
          })}
          {order.status === 'cancelled' && (
            <p style={{ margin: '8px 0 4px', fontSize: 12, color: 'var(--stop)' }}>
              This order was cancelled before it moved.
            </p>
          )}
        </Block>

        <Block title="Basket">
          <Row label={order.items} value={<span className="mono">{money(basket)}</span>} />
          <div style={{ height: 1, background: 'var(--line-soft)', margin: '4px 0' }} />
          <Row label="Delivery fee" value={<span className="mono">{money(DELIVERY_FEE)}</span>} />
          <div style={{ height: 1, background: 'var(--line-soft)', margin: '4px 0' }} />
          <Row
            label="Total"
            value={(
              <span className="mono" style={{ fontWeight: 700, color: 'var(--forest)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>FCFA </span>
                {money(order.total)}
              </span>
            )}
          />
        </Block>

        <Block title="People">
          <Row label="Customer" value={order.customer} />
          <Row label="Vendor" value={order.vendor} />
          <Row
            label="Rider"
            value={order.rider ?? (
              <span style={{ color: 'var(--text-3)' }}>Unassigned</span>
            )}
          />
          <Row label="Payment" value={order.payment} />
        </Block>
      </Drawer>

      {reassigning && (
        <Modal
          title="Reassign rider"
          subtitle={`${order.id} · currently ${order.rider ?? 'unassigned'}`}
          onClose={() => setReassigning(false)}
          width={430}
          footer={(
            <>
              <FooterSpacer />
              <Button variant="outline" onClick={() => setReassigning(false)}>
                Keep current
              </Button>
              <Button
                variant="primary"
                onClick={() => { assignRider(order.id, pick); setReassigning(false); }}
              >
                Assign {pick.split(' ')[0]}
              </Button>
            </>
          )}
        >
          <Select
            label="Rider"
            value={pick}
            onChange={setPick}
            options={riders.map((r) => ({
              value: r.name,
              label: `${r.name} · ${r.zone} · ${r.state}`,
            }))}
          />
        </Modal>
      )}
    </>
  );
}
