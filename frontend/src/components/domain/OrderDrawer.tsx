import { useState, useEffect } from 'react';
import type { Order, OrderStage } from '../../data/types';
import { isLate } from '../../lib/format';
import { useAppState } from '../../state/useAppState';
import { Drawer, FooterSpacer } from '../ui/Overlay';
import Button from '../ui/Button';
import Pill from '../ui/Pill';
import OrderTimeline from './OrderTimeline';
import EditStatusModal from './EditStatusModal';
import RiderBlock from './RiderBlock';
import {
  Block, BasketBlock, PartiesBlock, RouteBlock, ParcelBlock,
} from './OrderDetailBlocks';

/**
 * The order detail — specification §3.
 *
 * Reading order follows the questions an operator actually asks, in the order
 * they ask them: what state is it in, who are the two parties, what is in the
 * basket, where is it going, who is carrying it, and how long each step took.
 */
export default function OrderDrawer({ order, onClose }: { order: Order; onClose: () => void }) {
  const { setOrderStage, acknowledgeOrder } = useAppState();
  const [editing, setEditing] = useState(false);

  // Opening an order is what acknowledges it: it stops being pinned to the top
  // of the list, and the incoming-order alert stops repeating.
  useEffect(() => {
    if (!order.acknowledged) acknowledgeOrder(order.id);
  }, [order.id, order.acknowledged, acknowledgeOrder]);

  const settled = order.status === 'delivered'
    || order.status === 'cancelled' || order.status === 'failed';

  return (
    <>
      <Drawer
        title={order.id}
        subtitle={<>{order.vendor} · {order.to.zone} · placed {order.placedAgo}</>}
        onClose={onClose}
        footer={(
          <>
            <FooterSpacer />
            <Button
              variant={settled ? 'outline' : 'primary'}
              onClick={() => setEditing(true)}
            >
              Edit status
            </Button>
          </>
        )}
      >
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          <Pill status={order.status} />
          <Pill status={order.vertical} token={order.vertical} />
          <Pill status={order.paymentStatus.toLowerCase()} />
          {(order.isLate || isLate(order.eta)) && <Pill status={order.eta} token="stop" />}
        </div>

        <PartiesBlock order={order} />
        <BasketBlock order={order} />
        <RouteBlock order={order} />
        <ParcelBlock order={order} />
        <RiderBlock order={order} />

        <Block title="Timeline">
          <OrderTimeline order={order} />
        </Block>
      </Drawer>

      {editing && (
        <EditStatusModal
          order={order}
          onApply={(stage: OrderStage, detail) => {
            setOrderStage(order.id, stage, detail);
            setEditing(false);
            // A terminated order has nothing left to act on here.
            if (stage === 'cancelled' || stage === 'failed') onClose();
          }}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}
