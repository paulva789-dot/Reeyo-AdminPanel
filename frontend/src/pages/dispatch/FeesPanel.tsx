import { useState, useMemo } from 'react';
import { useT } from '../../i18n/useT';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Pill from '../../components/ui/Pill';
import Toggle from '../../components/ui/Toggle';
import Field, { Select } from '../../components/ui/Field';
import EmptyState from '../../components/ui/EmptyState';
import { Modal, FooterSpacer } from '../../components/ui/Overlay';
import NoEndpoint from '../../components/ui/NoEndpoint';
import { useAppState } from '../../state/useAppState';
import { money } from '../../lib/format';
import {
  feeRuleSets as seedRules, BAND_COUNT, bandFor, feeFor, ruleFor, isOverflow,
} from '../../data/deliveryFees';
import type { FeeRuleSet } from '../../data/deliveryFees';
import type { Vertical } from '../../data/types';

const GLOBAL = '__global__';
const EVERY = '__every__';

/** §6.2 — enter a test distance and see the fee before saving. */
function Preview({ rules }: { rules: FeeRuleSet[] }) {
  const t = useT();
  const [km, setKm] = useState('2.4');
  const [zone, setZone] = useState(GLOBAL);
  const [service, setService] = useState<string>(EVERY);

  const zones = [...new Set(rules.map((r) => r.zone).filter((z): z is string => Boolean(z)))];
  const distance = Number(km);
  const valid = Number.isFinite(distance) && distance >= 0;

  const rule = valid
    ? ruleFor(rules, zone === GLOBAL ? '' : zone, (service === EVERY ? 'food' : service) as Vertical)
    : null;
  const fee = rule && valid ? feeFor(distance, rule) : null;

  return (
    <Card title="Try a distance">
      <div
        style={{
          display: 'grid', gap: 10,
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        }}
      >
        <Field label="Distance (km)" value={km} onChange={setKm} mono />
        <Select
          label="Zone"
          value={zone}
          onChange={setZone}
          options={[
            { value: GLOBAL, label: t('Anywhere') },
            ...zones.map((z) => ({ value: z, label: z })),
          ]}
        />
        <Select
          label="Service"
          value={service}
          onChange={setService}
          options={[
            { value: EVERY, label: t('Food') },
            { value: 'grocery', label: t('Grocery') },
            { value: 'parcel', label: t('Parcel') },
          ]}
        />
      </div>

      <div
        style={{
          marginTop: 14, padding: '12px 14px', borderRadius: 'var(--r-ctrl)',
          background: 'var(--canvas)', border: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        {!valid ? (
          <span style={{ fontSize: 12.5, color: 'var(--stop)' }}>
            Enter a distance in kilometres.
          </span>
        ) : fee === null ? (
          <span style={{ fontSize: 12.5, color: 'var(--stop)' }}>
            No active rule covers that combination, so the order could not be priced.
          </span>
        ) : (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="eyebrow" style={{ marginBottom: 3 }}>
                {isOverflow(distance)
                  ? `Beyond ${BAND_COUNT} km · band ${BAND_COUNT} plus ${money(rule!.perKmBeyond)}/km`
                  : `Band ${bandFor(distance)} · ${bandFor(distance) - 1}–${bandFor(distance)} km`}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                {rule!.zone ?? 'Anywhere'} · {rule!.service ?? 'every service'}
              </div>
            </div>
            <div
              className="mono"
              style={{ fontSize: 20, fontWeight: 700, color: 'var(--forest)' }}
            >
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>FCFA </span>
              {money(fee)}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

function RuleForm({
  initial, zones, onSave, onClose,
}: {
  initial: FeeRuleSet | null;
  zones: string[];
  onSave: (rule: FeeRuleSet) => void;
  onClose: () => void;
}) {
  const t = useT();
  const [zone, setZone] = useState(initial?.zone ?? GLOBAL);
  const [service, setService] = useState<string>(initial?.service ?? EVERY);
  const [amounts, setAmounts] = useState<string[]>(
    () => Array.from({ length: BAND_COUNT }, (_, i) => {
      const found = initial?.bands.find((b) => b.band === i + 1);
      return found ? String(found.amount) : '';
    }),
  );
  const [perKm, setPerKm] = useState(String(initial?.perKmBeyond ?? 250));
  const [error, setError] = useState('');

  const submit = () => {
    const parsed = amounts.map(Number);
    if (parsed.some((a) => !Number.isFinite(a) || a < 0)) {
      setError('Every band needs an amount, and none can be negative');
      return;
    }
    const beyond = Number(perKm);
    if (!Number.isFinite(beyond) || beyond < 0) {
      setError('The per-kilometre rate has to be a number');
      return;
    }
    onSave({
      id: initial?.id ?? `FR-${Date.now()}`,
      zone: zone === GLOBAL ? null : zone,
      service: service === EVERY ? null : (service as Vertical),
      bands: parsed.map((amount, i) => ({ band: i + 1, amount })),
      perKmBeyond: beyond,
      activeFrom: initial?.activeFrom ?? null,
      activeTo: initial?.activeTo ?? null,
      active: initial?.active ?? true,
    });
  };

  return (
    <Modal
      title={initial ? 'Edit delivery fee' : 'Add delivery fee'}
      onClose={onClose}
      width={520}
      footer={(
        <>
          <FooterSpacer />
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>Save fee</Button>
        </>
      )}
    >
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
        <Select
          label="Zone"
          value={zone}
          onChange={setZone}
          options={[
            { value: GLOBAL, label: t('Everywhere (default)') },
            ...zones.map((z) => ({ value: z, label: z })),
          ]}
        />
        <Select
          label="Service"
          value={service}
          onChange={setService}
          options={[
            { value: EVERY, label: t('Every service') },
            { value: 'food', label: t('Food') },
            { value: 'grocery', label: t('Grocery') },
            { value: 'parcel', label: t('Parcel') },
          ]}
        />
      </div>

      <div className="eyebrow" style={{ margin: '16px 0 8px' }}>Bands</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {amounts.map((amount, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              className="mono"
              style={{ width: 74, fontSize: 11.5, color: 'var(--text-2)', flexShrink: 0 }}
            >
              {i} – {i + 1} km
            </span>
            <input
              value={amount}
              onChange={(e) => {
                const next = [...amounts];
                next[i] = e.target.value;
                setAmounts(next);
                setError('');
              }}
              aria-label={`Band ${i + 1} amount`}
              className="mono"
              style={{
                flex: 1, height: 34, borderRadius: 'var(--r-ctrl)',
                border: '1px solid var(--line)', background: 'var(--card)',
                color: 'var(--text)', padding: '0 10px', fontSize: 12.5, outline: 'none',
              }}
            />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 14 }}>
        <Field
          label={`Per kilometre beyond ${BAND_COUNT} km`}
          value={perKm}
          onChange={(v) => { setPerKm(v); setError(''); }}
          mono
        />
      </div>

      <p style={{ margin: '12px 0 0', fontSize: 11.5, color: 'var(--text-3)' }}>
        Bands are inclusive at the lower end and exclusive at the upper, so a
        2.0 km trip falls in band 3. The fee is frozen onto an order when it is
        placed — changing this table never re-prices an order already taken.
      </p>

      {error && (
        <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--stop)' }}>{error}</p>
      )}
    </Modal>
  );
}

/** Delivery pricing — specification §6. */
export default function FeesPanel() {
  const { orders, pushToast } = useAppState();
  const [rules, setRules] = useState<FeeRuleSet[]>(seedRules);
  const [editing, setEditing] = useState<FeeRuleSet | null>(null);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<FeeRuleSet | null>(null);

  const zones = useMemo(() => [...new Set(orders.map((o) => o.zone))].sort(), [orders]);

  const save = (rule: FeeRuleSet) => {
    setRules((prev) => {
      const exists = prev.some((r) => r.id === rule.id);
      return exists ? prev.map((r) => (r.id === rule.id ? rule : r)) : [...prev, rule];
    });
    pushToast(editing ? 'Delivery fee updated' : 'Delivery fee added');
    setEditing(null);
    setAdding(false);
  };

  return (
    <NoEndpoint
      what="Delivery fee rules"
      consequence="Band amounts cannot be read from or written to the platform."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Preview rules={rules} />

        <Card
          title="Distance bands"
          action={<Button variant="primary" onClick={() => setAdding(true)}>Add delivery fee</Button>}
        >
          {rules.length === 0 ? (
            <EmptyState
              heading="No delivery fees"
              line="Nothing can be priced, so no order can be placed."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  style={{
                    border: '1px solid var(--line)', borderRadius: 'var(--r-card)',
                    padding: '12px 14px', opacity: rule.active ? 1 : 0.65,
                  }}
                >
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--forest)' }}>
                        {rule.zone ?? 'Everywhere'}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>
                        {rule.service
                          ? `${rule.service} only`
                          : 'every service'}
                        {' · '}
                        <span className="mono">{money(rule.perKmBeyond)}/km</span> beyond {BAND_COUNT} km
                      </div>
                    </div>
                    {rule.zone === null && rule.service === null && (
                      <Pill status="default" token="calm" />
                    )}
                    <Button variant="soft" onClick={() => setEditing(rule)}>Edit</Button>
                    <Button variant="destructive" onClick={() => setRemoving(rule)}>Delete</Button>
                    <Toggle
                      checked={rule.active}
                      onChange={(next) => setRules((prev) => prev.map(
                        (r) => (r.id === rule.id ? { ...r, active: next } : r),
                      ))}
                      label={`${rule.zone ?? 'Everywhere'} fees active`}
                    />
                  </div>

                  <div
                    style={{
                      display: 'grid', gap: 8,
                      gridTemplateColumns: `repeat(${BAND_COUNT}, 1fr)`,
                    }}
                  >
                    {rule.bands.map((band) => (
                      <div
                        key={band.band}
                        style={{
                          padding: '9px 10px', borderRadius: 'var(--r-ctrl)',
                          background: 'var(--canvas)', textAlign: 'center',
                        }}
                      >
                        <div className="eyebrow" style={{ marginBottom: 4 }}>
                          {band.band - 1}–{band.band} km
                        </div>
                        <div className="mono" style={{ fontSize: 13, color: 'var(--forest)', fontWeight: 700 }}>
                          {money(band.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <p style={{ margin: '14px 0 0', fontSize: 11.5, color: 'var(--text-3)' }}>
            The long-distance rate is retired. A trip is priced by the band its
            routing distance falls in, and anything past {BAND_COUNT} km adds the
            per-kilometre rate on top of the last band. Surcharges — peak hour,
            weather, priority — stay separate basket lines and are never folded
            into the base fee.
          </p>
        </Card>
      </div>

      {(adding || editing) && (
        <RuleForm
          initial={editing}
          zones={zones}
          onSave={save}
          onClose={() => { setAdding(false); setEditing(null); }}
        />
      )}

      {removing && (
        <Modal
          title="Delete this fee rule"
          subtitle={`${removing.zone ?? 'Everywhere'} · ${removing.service ?? 'every service'}`}
          onClose={() => setRemoving(null)}
          width={440}
          footer={(
            <>
              <FooterSpacer />
              <Button variant="outline" onClick={() => setRemoving(null)}>Keep it</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setRules((prev) => prev.filter((r) => r.id !== removing.id));
                  pushToast('Delivery fee deleted');
                  setRemoving(null);
                }}
              >
                Delete fee
              </Button>
            </>
          )}
        >
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-2)' }}>
            Deliveries this rule was pricing fall back to a less specific rule.
            If none covers them, they cannot be priced at all — switching it off
            has the same effect and can be undone.
          </p>
        </Modal>
      )}
    </NoEndpoint>
  );
}
