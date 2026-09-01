import { useState, useMemo } from 'react';
import Button from '../../components/ui/Button';
import Pill from '../../components/ui/Pill';
import Field, { TextArea } from '../../components/ui/Field';
import EmptyState from '../../components/ui/EmptyState';
import { Modal, FooterSpacer } from '../../components/ui/Overlay';
import { money } from '../../lib/format';
import { useDateRange, withinRange } from '../../state/useDateRange';
import { WALLET_FLOOR } from '../../state/useVendorProfiles';
import type { WalletMove } from '../../state/useVendorProfiles';
import type { VendorProfile, WalletEntry } from '../../data/types';

interface WalletPanelProps {
  profile: VendorProfile;
  onCredit: (move: WalletMove) => void;
  onDebit: (move: WalletMove) => string | null;
  onReverse: (entryId: string) => void;
}

function MoveModal({
  kind, profile, onSubmit, onClose,
}: {
  kind: 'add' | 'remove';
  profile: VendorProfile;
  onSubmit: (move: WalletMove) => string | null;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const parsed = Number(amount);
  const removable = profile.walletBalance - WALLET_FLOOR;

  return (
    <Modal
      title={kind === 'add' ? 'Add funds' : 'Remove funds'}
      subtitle={`${profile.businessName} · balance ${money(profile.walletBalance)}`}
      onClose={onClose}
      width={460}
      footer={(
        <>
          <FooterSpacer />
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant={kind === 'add' ? 'primary' : 'destructive'}
            onClick={() => {
              if (!Number.isFinite(parsed) || parsed <= 0) {
                setError('Enter an amount greater than zero');
                return;
              }
              if (!reason.trim()) {
                setError('Say why — this cannot be edited afterwards, only reversed');
                return;
              }
              const failure = onSubmit({
                amount: parsed, reason: reason.trim(), reference: reference.trim(), note: note.trim(),
              });
              if (failure) { setError(failure); return; }
              onClose();
            }}
          >
            {kind === 'add' ? 'Add funds' : 'Remove funds'}
          </Button>
        </>
      )}
    >
      <Field
        label="Amount (FCFA)"
        value={amount}
        onChange={(v) => { setAmount(v); setError(''); }}
        placeholder="25000"
        mono
      />
      {kind === 'remove' && (
        <p style={{ margin: '6px 0 0', fontSize: 11.5, color: 'var(--text-3)' }}>
          At most {money(removable)} can be removed without taking the balance
          below {WALLET_FLOOR}.
        </p>
      )}

      <div style={{ marginTop: 12 }}>
        <Field
          label="Reason"
          value={reason}
          onChange={(v) => { setReason(v); setError(''); }}
          placeholder="Refund for a disputed order"
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <Field
          label="Reference (optional)"
          value={reference}
          onChange={setReference}
          placeholder="DSP-1182"
          mono
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <TextArea label="Note (optional)" value={note} onChange={setNote} rows={2} />
      </div>

      <p style={{ margin: '12px 0 0', fontSize: 11.5, color: 'var(--text-3)' }}>
        Recorded against your name and the time. Nothing in the ledger can be
        edited or deleted afterwards — a mistake is corrected by reversing it,
        which leaves both entries visible.
      </p>

      {error && (
        <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--stop)' }}>{error}</p>
      )}
    </Modal>
  );
}

function Entry({ entry, onReverse }: { entry: WalletEntry; onReverse: () => void }) {
  const credit = entry.amount >= 0;
  const at = new Date(entry.at);

  return (
    <div
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0',
        borderBottom: '1px solid var(--line-soft)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{entry.reason}</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
          {Number.isNaN(at.getTime()) ? '—' : at.toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
          })}
          {' · '}{entry.by}
          {entry.reference && <span className="mono"> · {entry.reference}</span>}
        </div>
        {entry.note && (
          <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 3 }}>{entry.note}</div>
        )}
        {entry.reverses && (
          <div style={{ marginTop: 5 }}><Pill status="reversal" token="calm" /></div>
        )}
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div
          className="mono"
          style={{ fontSize: 12.5, fontWeight: 700, color: credit ? 'var(--go)' : 'var(--stop)' }}
        >
          {credit ? '+' : '−'}{money(Math.abs(entry.amount))}
        </div>
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2 }}>
          {money(entry.balanceAfter)}
        </div>
      </div>

      {entry.source === 'manual adjustment' && !entry.reverses && (
        <Button variant="soft" onClick={onReverse}>Reverse</Button>
      )}
    </div>
  );
}

/** The vendor wallet — specification §4.4. */
export default function WalletPanel({
  profile, onCredit, onDebit, onReverse,
}: WalletPanelProps) {
  const { range } = useDateRange();
  const [moving, setMoving] = useState<'add' | 'remove' | null>(null);
  const [reversing, setReversing] = useState<WalletEntry | null>(null);
  const [allTime, setAllTime] = useState(true);

  const rows = useMemo(
    () => (allTime ? profile.wallet : profile.wallet.filter((e) => withinRange(e.at, range))),
    [profile.wallet, range, allTime],
  );

  return (
    <>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
          padding: '13px 15px', marginBottom: 14,
          borderRadius: 'var(--r-card)', border: '1px solid var(--line)',
          background: 'var(--canvas)',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Wallet balance</div>
          <div
            className="mono"
            style={{
              fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em',
              color: profile.walletBalance < 0 ? 'var(--stop)' : 'var(--forest)',
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>FCFA </span>
            {money(profile.walletBalance)}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 3 }}>
            Joined <span className="mono">{profile.joined}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button variant="outline" onClick={() => setMoving('remove')}>Remove funds</Button>
          <Button variant="primary" onClick={() => setMoving('add')}>Add funds</Button>
        </div>
      </div>

      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6,
        }}
      >
        <div className="eyebrow" style={{ flex: 1 }}>Transaction history</div>
        <button
          onClick={() => setAllTime((now) => !now)}
          style={{
            border: 'none', background: 'transparent', cursor: 'pointer', padding: 0,
            color: 'var(--emerald-ink)', fontFamily: 'var(--sans)',
            fontSize: 11.5, fontWeight: 600,
          }}
        >
          {allTime ? 'Apply the date filter' : 'Show all time'}
        </button>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          heading="Nothing in this period"
          line="No credit or debit was recorded in the range you have chosen."
        />
      ) : (
        <div>
          {rows.map((entry) => (
            <Entry
              key={entry.id}
              entry={entry}
              onReverse={() => setReversing(entry)}
            />
          ))}
        </div>
      )}

      {moving && (
        <MoveModal
          kind={moving}
          profile={profile}
          onSubmit={(move) => {
            if (moving === 'add') { onCredit(move); return null; }
            return onDebit(move);
          }}
          onClose={() => setMoving(null)}
        />
      )}

      {reversing && (
        <Modal
          title="Reverse this entry"
          subtitle={reversing.reason}
          onClose={() => setReversing(null)}
          width={440}
          footer={(
            <>
              <FooterSpacer />
              <Button variant="outline" onClick={() => setReversing(null)}>Keep it</Button>
              <Button
                variant="destructive"
                onClick={() => { onReverse(reversing.id); setReversing(null); }}
              >
                Reverse entry
              </Button>
            </>
          )}
        >
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-2)' }}>
            This writes an opposite entry of{' '}
            <span className="mono">{money(Math.abs(reversing.amount))}</span> against
            your name. The original stays in the ledger — that is the point of a
            reversal, and why nothing here is ever deleted.
          </p>
        </Modal>
      )}
    </>
  );
}
