import { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Pill from '../../components/ui/Pill';
import Toggle from '../../components/ui/Toggle';
import Field from '../../components/ui/Field';
import EmptyState from '../../components/ui/EmptyState';
import { Modal, FooterSpacer } from '../../components/ui/Overlay';
import { CollectionCard, WriteGate, Stat } from './shared';
import { platform } from '../../services/platformResources';
import { ApiError } from '../../services/apiClient';
import { useAuth } from '../../state/useAuth';
import type { EngagementState } from '../../state/useEngagement';
import type { LoyaltyReward, LoyaltyAccount, LoyaltyEntry } from '../../data/types';

/** Create form shared by rules and rewards — same two fields, different nouns. */
function TwoFieldForm({
  title, nameLabel, namePlaceholder, numberLabel, numberHint,
  onSave, onClose,
}: {
  title: string;
  nameLabel: string;
  namePlaceholder: string;
  numberLabel: string;
  numberHint: string;
  onSave: (name: string, value: number) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  return (
    <Modal
      title={title}
      onClose={onClose}
      width={440}
      footer={(
        <>
          <FooterSpacer />
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!name.trim()) {
                setError(`${nameLabel} cannot be empty`);
                return;
              }
              const parsed = Number(value);
              if (!value.trim() || !Number.isFinite(parsed) || parsed <= 0) {
                setError(`${numberLabel} has to be a number above zero`);
                return;
              }
              onSave(name.trim(), parsed);
            }}
          >
            Save
          </Button>
        </>
      )}
    >
      <Field
        label={nameLabel}
        value={name}
        onChange={(v) => { setName(v); setError(''); }}
        placeholder={namePlaceholder}
      />
      <div style={{ marginTop: 12 }}>
        <Field
          label={numberLabel}
          value={value}
          onChange={(v) => { setValue(v); setError(''); }}
          placeholder={numberHint}
          mono
        />
      </div>
      {error && (
        <p style={{ margin: '9px 0 0', fontSize: 12, color: 'var(--stop)' }}>{error}</p>
      )}
    </Modal>
  );
}

/**
 * One customer's points balance and how they got there.
 *
 * `/engagement/loyalty/accounts/:userId` is keyed by user id rather than
 * searchable, so this is a lookup: paste an id, see the balance and the ledger.
 */
function AccountLookup() {
  const { mode } = useAuth();
  const isLive = mode === 'live';
  const [userId, setUserId] = useState('');
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [ledger, setLedger] = useState<LoyaltyEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const look = async () => {
    if (!userId.trim()) {
      setError('Paste a customer id to look up');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const [acct, entries] = await Promise.all([
        platform.loyaltyAccount(userId.trim()),
        platform.loyaltyLedger(userId.trim()).catch(() => [] as LoyaltyEntry[]),
      ]);
      setAccount(acct);
      setLedger(entries);
    } catch (err) {
      setAccount(null);
      setLedger([]);
      setError(err instanceof ApiError
        ? `No account found — ${err.message}`
        : 'Could not load that account.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Look up a balance">
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <input
          value={userId}
          onChange={(e) => { setUserId(e.target.value); setError(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') void look(); }}
          placeholder="Customer id"
          aria-label="Customer id"
          className="mono"
          style={{
            height: 34, flex: 1, minWidth: 0,
            borderRadius: 'var(--r-ctrl)', border: '1px solid var(--line)',
            background: 'var(--card)', color: 'var(--text)',
            padding: '0 11px', fontSize: 12,
          }}
        />
        <Button
          variant="outline"
          disabled={busy || !isLive}
          title={isLive ? undefined : 'Balances need a live session'}
          onClick={() => void look()}
        >
          {busy ? 'Looking…' : 'Look up'}
        </Button>
      </div>

      {error && (
        <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--stop)' }}>{error}</p>
      )}

      {!isLive ? (
        <EmptyState
          heading="Balances need a live session"
          line="This reads one customer's points straight from the platform, so there is
            nothing to show in sample mode."
        />
      ) : account ? (
        <>
          <div style={{ display: 'flex', gap: 22, marginBottom: 14 }}>
            <Stat label="points" value={account.points.toLocaleString('fr-FR')} />
            {account.tier && <Stat label="tier" value={account.tier} />}
          </div>
          {ledger.length === 0 ? (
            <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-3)' }}>
              No movements recorded on this balance.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {ledger.map((e, i) => (
                <div
                  key={e.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                    borderTop: i === 0 ? 'none' : '1px solid var(--line-soft)',
                  }}
                >
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--text-2)' }}>
                    {e.reason}
                  </span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    {e.at}
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: 12, fontWeight: 700, minWidth: 54, textAlign: 'right',
                      color: e.points < 0 ? 'var(--stop)' : 'var(--go)',
                    }}
                  >
                    {e.points > 0 ? '+' : ''}{e.points}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <EmptyState
          heading="Nothing looked up yet"
          line="Paste a customer id to see their points balance and every movement on it."
        />
      )}
    </Card>
  );
}

export default function LoyaltyPanel({ engagement }: { engagement: EngagementState }) {
  const {
    loyaltyRules, loyaltyRewards,
    createLoyaltyRule, deleteLoyaltyRule,
    createLoyaltyReward, updateLoyaltyReward, deleteLoyaltyReward,
  } = engagement;

  const [newRule, setNewRule] = useState(false);
  const [newReward, setNewReward] = useState(false);
  const [removing, setRemoving] = useState<
  { kind: 'rule' | 'reward'; id: string; name: string } | null
  >(null);

  const active = loyaltyRules.rows.filter((r) => r.isActive);
  const bestRate = active.reduce((max, r) => Math.max(max, r.pointsPerOrder), 0);

  return (
    <>
      <div className="reeyo-split-even">
        <CollectionCard
          title="Earning rules"
          action={(
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Stat label="best rate" value={bestRate ? `${bestRate} pts` : '—'} />
              <WriteGate>
                <Button variant="soft" onClick={() => setNewRule(true)}>Add rule</Button>
              </WriteGate>
            </div>
          )}
          source={loyaltyRules}
          empty={{
            heading: 'No earning rules',
            line: 'Customers collect no points on their orders.',
          }}
        >
          {(rows) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {rows.map((r) => (
                <div
                  key={r.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    border: '1px solid var(--line)', borderRadius: 'var(--r-card)',
                    opacity: r.isActive ? 1 : 0.7,
                  }}
                >
                  <span style={{ flex: 1, fontSize: 12.5, minWidth: 0 }}>{r.name}</span>
                  <span
                    className="mono"
                    style={{ fontSize: 12.5, color: 'var(--forest)', fontWeight: 700 }}
                  >
                    {r.pointsPerOrder} pts
                  </span>
                  <Pill status={r.isActive ? 'active' : 'paused'} />
                  <WriteGate>
                    <Button
                      variant="destructive"
                      onClick={() => setRemoving({ kind: 'rule', id: r.id, name: r.name })}
                    >
                      Delete
                    </Button>
                  </WriteGate>
                </div>
              ))}
            </div>
          )}
        </CollectionCard>

        <CollectionCard
          title="Rewards"
          action={(
            <WriteGate>
              <Button variant="soft" onClick={() => setNewReward(true)}>Add reward</Button>
            </WriteGate>
          )}
          source={loyaltyRewards}
          empty={{
            heading: 'Nothing to spend points on',
            line: 'Points accumulate with no way for a customer to use them.',
          }}
        >
          {(rows) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {rows.map((r: LoyaltyReward) => (
                <div
                  key={r.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    border: '1px solid var(--line)', borderRadius: 'var(--r-card)',
                    opacity: r.isActive ? 1 : 0.7,
                  }}
                >
                  <span style={{ flex: 1, fontSize: 12.5, minWidth: 0 }}>{r.name}</span>
                  <span
                    className="mono"
                    style={{ fontSize: 12.5, color: 'var(--forest)', fontWeight: 700 }}
                  >
                    {r.pointsCost.toLocaleString('fr-FR')} pts
                  </span>
                  <WriteGate>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Toggle
                        checked={r.isActive}
                        onChange={() => updateLoyaltyReward(r.id, { isActive: !r.isActive })}
                        label={`${r.name} redeemable`}
                      />
                      <Button
                        variant="destructive"
                        onClick={() => setRemoving({ kind: 'reward', id: r.id, name: r.name })}
                      >
                        Delete
                      </Button>
                    </div>
                  </WriteGate>
                </div>
              ))}
            </div>
          )}
        </CollectionCard>
      </div>

      <div style={{ marginTop: 14 }}>
        <AccountLookup />
      </div>

      {newRule && (
        <TwoFieldForm
          title="New earning rule"
          nameLabel="Name"
          namePlaceholder="Double points on groceries"
          numberLabel="Points per order"
          numberHint="20"
          onSave={(name, value) => { createLoyaltyRule(name, value); setNewRule(false); }}
          onClose={() => setNewRule(false)}
        />
      )}

      {newReward && (
        <TwoFieldForm
          title="New reward"
          nameLabel="Name"
          namePlaceholder="Free delivery"
          numberLabel="Points cost"
          numberHint="200"
          onSave={(name, value) => {
            createLoyaltyReward({ name, pointsCost: value });
            setNewReward(false);
          }}
          onClose={() => setNewReward(false)}
        />
      )}

      {removing && (
        <Modal
          title={removing.kind === 'rule' ? 'Delete this rule' : 'Delete this reward'}
          subtitle={removing.name}
          onClose={() => setRemoving(null)}
          width={440}
          footer={(
            <>
              <FooterSpacer />
              <Button variant="outline" onClick={() => setRemoving(null)}>Keep it</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (removing.kind === 'rule') deleteLoyaltyRule(removing.id);
                  else deleteLoyaltyReward(removing.id);
                  setRemoving(null);
                }}
              >
                Delete
              </Button>
            </>
          )}
        >
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-2)' }}>
            {removing.kind === 'rule'
              ? `Customers stop earning under this rule immediately. Points already
                 collected are not taken back.`
              : `Customers can no longer redeem this. Switching it off instead keeps
                 the reward and stops it being offered.`}
          </p>
        </Modal>
      )}
    </>
  );
}
