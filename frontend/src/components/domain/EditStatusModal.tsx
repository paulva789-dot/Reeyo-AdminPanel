import { useState } from 'react';
import Button from '../ui/Button';
import Pill from '../ui/Pill';
import { Select, TextArea } from '../ui/Field';
import { Modal, FooterSpacer } from '../ui/Overlay';
import { ORDER_FLOW, CANCEL_REASONS, FAILURE_REASONS } from '../../data/types';
import type { Order, OrderStage } from '../../data/types';

interface EditStatusModalProps {
  order: Order;
  onApply: (stage: OrderStage, detail: { reason?: string; note?: string }) => void;
  onClose: () => void;
}

/** Reasons are required for the three moves §3.2 says must carry one. */
function reasonsFor(stage: OrderStage): readonly string[] | null {
  if (stage === 'cancelled') return CANCEL_REASONS;
  if (stage === 'failed') return FAILURE_REASONS;
  return null;
}

/**
 * The Edit Status control — specification §3.2.
 *
 * Forward moves are offered plainly. Going backwards is possible but not
 * casual: it needs an explicit confirmation and a reason, because an order
 * moved back a stage by a mis-click looks exactly like one that genuinely
 * regressed, and the difference matters to everyone downstream.
 */
export default function EditStatusModal({ order, onApply, onClose }: EditStatusModalProps) {
  const current = ORDER_FLOW.indexOf(order.status);
  const [stage, setStage] = useState<OrderStage>(() => {
    const next = ORDER_FLOW[current + 1];
    return next ?? order.status;
  });
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [confirmedBackwards, setConfirmedBackwards] = useState(false);

  const target = ORDER_FLOW.indexOf(stage);
  const backwards = current !== -1 && target !== -1 && target < current;
  const reasons = reasonsFor(stage);
  const needsReason = backwards || reasons !== null;

  const options = [
    ...ORDER_FLOW.map((s) => ({
      value: s,
      label: ORDER_FLOW.indexOf(s) < current ? `${s} (back a stage)` : s,
    })),
    { value: 'cancelled', label: 'cancelled' },
    { value: 'failed', label: 'failed / returned' },
  ].filter((o) => o.value !== order.status);

  const apply = () => {
    if (needsReason && !reason.trim()) {
      setError(reasons
        ? 'Choose a reason — the customer and vendor both see it'
        : 'Say why the order is going backwards');
      return;
    }
    if (backwards && !confirmedBackwards) {
      setError('Confirm the backwards move before applying it');
      return;
    }
    onApply(stage, { reason: reason.trim() || undefined, note: note.trim() || undefined });
  };

  return (
    <Modal
      title="Edit status"
      subtitle={`${order.id} · ${order.customer}`}
      onClose={onClose}
      width={470}
      footer={(
        <>
          <FooterSpacer />
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant={stage === 'cancelled' || stage === 'failed' ? 'destructive' : 'primary'}
            onClick={apply}
          >
            {stage === 'cancelled' ? 'Cancel order'
              : stage === 'failed' ? 'Mark failed' : `Move to ${stage}`}
          </Button>
        </>
      )}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
        <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>Now</span>
        <Pill status={order.status} />
        <span aria-hidden="true" style={{ color: 'var(--text-3)' }}>→</span>
        <Pill status={stage} />
      </div>

      <Select
        label="Move to"
        value={stage}
        onChange={(v) => {
          setStage(v as OrderStage);
          setReason('');
          setError('');
          setConfirmedBackwards(false);
        }}
        options={options}
      />

      {reasons && (
        <div style={{ marginTop: 12 }}>
          <Select
            label="Reason"
            value={reason}
            onChange={(v) => { setReason(v); setError(''); }}
            options={[
              { value: '', label: 'Choose a reason' },
              ...reasons.map((r) => ({ value: r, label: r })),
            ]}
          />
        </div>
      )}

      {backwards && (
        <div
          style={{
            marginTop: 12, padding: '11px 13px', borderRadius: 'var(--r-ctrl)',
            background: 'var(--watch-soft)', border: '1px solid var(--olive)',
          }}
        >
          <p style={{ margin: '0 0 9px', fontSize: 12.5, color: 'var(--watch)' }}>
            This moves {order.id} back a stage. Everyone following the order —
            the customer, the vendor and the rider — is told it has regressed.
          </p>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
            <input
              type="checkbox"
              checked={confirmedBackwards}
              onChange={(e) => { setConfirmedBackwards(e.target.checked); setError(''); }}
              style={{ accentColor: 'var(--emerald)' }}
            />
            I mean to move this order backwards
          </label>
          <div style={{ marginTop: 10 }}>
            <TextArea
              label="Why"
              value={reason}
              onChange={(v) => { setReason(v); setError(''); }}
              placeholder="The rider handed it back; the vendor is remaking it."
              rows={2}
            />
          </div>
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <TextArea
          label="Note (optional)"
          value={note}
          onChange={setNote}
          placeholder="Anything the next person reading this order should know."
          rows={2}
        />
      </div>

      <p style={{ margin: '12px 0 0', fontSize: 11.5, color: 'var(--text-3)' }}>
        The change is written to the timeline with the time and your name, and
        the matching notification goes to the customer, the vendor and the rider.
      </p>

      {error && (
        <p style={{ margin: '9px 0 0', fontSize: 12, color: 'var(--stop)' }}>{error}</p>
      )}
    </Modal>
  );
}
