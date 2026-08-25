import { useState } from 'react';
import type { Order } from '../../data/types';
import { money, isLate } from '../../lib/format';
import { useAppState } from '../../state/useAppState';
import { Drawer, Modal, FooterSpacer } from '../ui/Overlay';
import Button from '../ui/Button';
import Pill from '../ui/Pill';
import { Select, TextArea } from '../ui/Field';
import OrderTimeline from './OrderTimeline';

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
  const { cancelOrder, assignRider, riders } = useAppState();
  const [reassigning, setReassigning] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [pick, setPick] = useState(riders[0]?.name ?? '');

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
              disabled={order.status === 'cancelled'}
              onClick={() => setCancelling(true)}
            >
              Cancel order
            </Button>
            <FooterSpacer />
            {/* "Mark delivered" is gone: the platform moves an order through
                its stages and admin-api exposes no status write. Cancelling and
                reassigning are the only two things a console can actually do. */}
            <Button variant="outline" onClick={() => setReassigning(true)}>
              Reassign rider
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
          <OrderTimeline order={order} />
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


      {cancelling && (
        <Modal
          title="Cancel this order"
          subtitle={`${order.id} · ${order.customer}`}
          onClose={() => { setCancelling(false); setReason(''); setReasonError(''); }}
          width={460}
          footer={(
            <>
              <FooterSpacer />
              <Button
                variant="outline"
                onClick={() => { setCancelling(false); setReason(''); setReasonError(''); }}
              >
                Keep the order
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (!reason.trim()) {
                    setReasonError('Give a reason — the customer and vendor both see it');
                    return;
                  }
                  cancelOrder(order.id, reason.trim());
                  setCancelling(false);
                  onClose();
                }}
              >
                Cancel order
              </Button>
            </>
          )}
        >
          <p style={{ margin: '0 0 13px', fontSize: 12.5, color: 'var(--text-2)' }}>
            Cancelling cannot be undone from here, and any refund has to go
            through a dispute the customer files.
          </p>
          <TextArea
            label="Reason"
            value={reason}
            onChange={(v) => { setReason(v); setReasonError(''); }}
            placeholder="Vendor closed unexpectedly."
            rows={3}
          />
          {reasonError && (
            <p style={{ margin: '9px 0 0', fontSize: 12, color: 'var(--stop)' }}>{reasonError}</p>
          )}
        </Modal>
      )}

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
