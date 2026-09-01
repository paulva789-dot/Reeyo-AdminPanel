import { useState, useCallback } from 'react';
import { useT } from '../../i18n/useT';
import Button from '../../components/ui/Button';
import Pill from '../../components/ui/Pill';
import Segments from '../../components/ui/Segments';
import Field, { Select } from '../../components/ui/Field';
import ImageField from '../../components/ui/ImageField';
import { Drawer, FooterSpacer } from '../../components/ui/Overlay';
import HoursEditor from './HoursEditor';
import WalletPanel from './WalletPanel';
import { mapsUrl } from '../../components/domain/orderVocabulary';
import OrderHistory from '../../components/domain/OrderHistory';
import { useAppState } from '../../state/useAppState';
import { useDetail } from '../../state/useDetail';
import { platform } from '../../services/platformResources';
import { money } from '../../lib/format';
import { isOpenNow } from '../../data/vendorSeed';
import { ZONES } from '../../data/geography';
import type { VendorProfile, CommissionRule, Vertical } from '../../data/types';
import type { WalletMove } from '../../state/useVendorProfiles';

interface Props {
  profile: VendorProfile;
  onSave: (profile: VendorProfile) => void;
  onCredit: (move: WalletMove) => void;
  onDebit: (move: WalletMove) => string | null;
  onReverse: (entryId: string) => void;
  onClose: () => void;
}

const CATEGORIES = [
  'Restaurant', 'Supermarket', 'Pharmacy', 'Bakery', 'Health food',
  'Provisions', 'Courier agent', 'Drinks',
];

/** §4.3 — percentage or flat, chosen with a toggle, never both at once. */
function CommissionField({
  value, onChange,
}: { value: CommissionRule; onChange: (rule: CommissionRule) => void }) {
  return (
    <div>
      <span
        style={{
          display: 'block', fontSize: 11.5, fontWeight: 700,
          color: 'var(--text-2)', marginBottom: 6,
        }}
      >
        Commission
      </span>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {(['percentage', 'flat'] as const).map((kind) => {
          const active = value.kind === kind;
          return (
            <button
              key={kind}
              onClick={() => onChange({ kind, value: value.value })}
              aria-pressed={active}
              style={{
                flex: 1, height: 30, borderRadius: 'var(--r-ctrl)', cursor: 'pointer',
                border: `1px solid ${active ? 'var(--emerald)' : 'var(--line)'}`,
                background: active ? 'var(--go-soft)' : 'transparent',
                color: active ? 'var(--emerald-ink)' : 'var(--text-2)',
                fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 700,
              }}
            >
              {kind === 'percentage' ? 'Percentage' : 'Flat per order'}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          value={String(value.value)}
          onChange={(e) => onChange({ kind: value.kind, value: Number(e.target.value) || 0 })}
          aria-label={value.kind === 'percentage' ? 'Commission percentage' : 'Flat commission'}
          className="mono"
          style={{
            flex: 1, height: 34, borderRadius: 'var(--r-ctrl)',
            border: '1px solid var(--line)', background: 'var(--card)',
            color: 'var(--text)', padding: '0 10px', fontSize: 12.5, outline: 'none',
          }}
        />
        <span className="mono" style={{ fontSize: 12, color: 'var(--text-3)', width: 52 }}>
          {value.kind === 'percentage' ? '% of subtotal' : 'FCFA'}
        </span>
      </div>
      <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--text-3)' }}>
        The rule in force when an order is placed is stored on that order, so
        changing this never rewrites a settlement already made.
      </p>
    </div>
  );
}

export default function VendorProfileDrawer({
  profile, onSave, onCredit, onDebit, onReverse, onClose,
}: Props) {
  const t = useT();
  const [tab, setTab] = useState('profile');
  const [draft, setDraft] = useState<VendorProfile>(profile);
  const [error, setError] = useState('');
  const { orders } = useAppState();

  const fetcher = useCallback(() => platform.vendorOrders(profile.id), [profile.id]);
  const history = useDetail(tab === 'orders' ? profile.id : null, fetcher);
  const theirs = orders.filter((o) => o.vendor === profile.businessName);

  const dirty = JSON.stringify(draft) !== JSON.stringify(profile);
  const open = isOpenNow(profile);

  const set = <K extends keyof VendorProfile>(key: K, value: VendorProfile[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setError('');
  };

  const save = () => {
    if (!draft.businessName.trim()) { setError('The business name is what customers see'); return; }
    if (!draft.adminName.trim()) { setError('Name the person reeyo deals with'); return; }
    if (!draft.adminNumber.trim()) { setError('An admin number is required'); return; }
    if (!draft.shortAddress.trim()) { setError('A short address is how a rider finds them'); return; }
    if (!draft.paymentName.trim() || !draft.paymentNumber.trim()) {
      setError('Payment name and number are needed to settle this vendor');
      return;
    }
    onSave(draft);

    // Two of these fields have routes on admin-api. Sending them keeps the
    // platform in step with what this screen now shows; everything else in
    // section 4 has nowhere to go yet.
    if (draft.commission.value !== profile.commission.value
      || draft.commission.kind !== profile.commission.kind) {
      if (draft.commission.kind === 'percentage') {
        void platform.setVendorCommission(profile.id, draft.commission.value).catch(() => {});
      }
    }
    if (draft.status !== profile.status && draft.status === 'suspended') {
      void platform.suspendVendor(profile.id, 'Suspended from the vendor profile').catch(() => {});
    }
  };

  return (
    <Drawer
      title={profile.businessName}
      subtitle={<>{profile.category} · {profile.zone} · joined {profile.joined}</>}
      onClose={onClose}
      footer={(
        <>
          <FooterSpacer />
          {dirty && (
            <Button variant="outline" onClick={() => { setDraft(profile); setError(''); }}>
              Discard
            </Button>
          )}
          <Button variant="primary" disabled={!dirty} onClick={save}>Save vendor</Button>
        </>
      )}
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <Pill status={profile.status} />
        <Pill status={profile.service} token={profile.service} />
        <Pill status={open ? 'open now' : 'closed now'} token={open ? 'go' : 'calm'} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <Segments
          ariaLabel="Vendor sections"
          value={tab}
          onChange={setTab}
          segments={[
            { value: 'profile', label: t('Profile') },
            { value: 'hours', label: t('Hours') },
            { value: 'money', label: t('Money') },
            { value: 'wallet', label: t('Wallet') },
            { value: 'orders', label: t('Orders') },
          ]}
        />
      </div>

      {tab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field
            label="Business name"
            value={draft.businessName}
            onChange={(v) => set('businessName', v)}
          />
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
            <Field label="Admin name" value={draft.adminName} onChange={(v) => set('adminName', v)} />
            <Field
              label="Admin number"
              value={draft.adminNumber}
              onChange={(v) => set('adminNumber', v)}
              mono
            />
          </div>
          <Field
            label="Short address"
            value={draft.shortAddress}
            onChange={(v) => set('shortAddress', v)}
            placeholder="Carrefour Obili, behind the pharmacy"
          />
          <div>
            <Field
              label="Google Maps address"
              value={draft.mapsAddress}
              onChange={(v) => set('mapsAddress', v)}
              mono
            />
            <a
              href={mapsUrl(draft.lat, draft.lng, draft.shortAddress)}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-block', marginTop: 5,
                fontSize: 11.5, color: 'var(--emerald-ink)', fontWeight: 600,
              }}
            >
              Check the pin
            </a>
          </div>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
            <Select
              label="Zone"
              value={draft.zone}
              onChange={(v) => set('zone', v)}
              options={ZONES.map((z) => ({ value: z, label: z }))}
            />
            <Select
              label="Category"
              value={draft.category}
              onChange={(v) => set('category', v)}
              options={CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
            <Select
              label="Service"
              value={draft.service}
              onChange={(v) => set('service', v as Vertical)}
              options={[
                { value: 'food', label: t('Food') },
                { value: 'grocery', label: t('Grocery') },
                { value: 'parcel', label: t('Parcel') },
              ]}
            />
            <Select
              label="Status"
              value={draft.status}
              onChange={(v) => set('status', v as VendorProfile['status'])}
              options={[
                { value: 'active', label: t('Active') },
                { value: 'paused', label: t('Paused — stays visible, takes no orders') },
                { value: 'suspended', label: t('Suspended') },
              ]}
            />
          </div>
          <ImageField
            label="Vendor image"
            value={draft.imageUrl}
            onChange={(v) => set('imageUrl', v)}
          />
        </div>
      )}

      {tab === 'hours' && (
        <HoursEditor hours={draft.hours} onChange={(h) => set('hours', h)} />
      )}

      {tab === 'money' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <CommissionField
            value={draft.commission}
            onChange={(rule) => set('commission', rule)}
          />
          <Field
            label="Packaging fee (FCFA, optional)"
            value={draft.packagingFee === null ? '' : String(draft.packagingFee)}
            onChange={(v) => set('packagingFee', v.trim() === '' ? null : Number(v) || 0)}
            placeholder="Leave empty if none"
            mono
          />
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
            <Field
              label="Payment name"
              value={draft.paymentName}
              onChange={(v) => set('paymentName', v)}
            />
            <Field
              label="Payment number"
              value={draft.paymentNumber}
              onChange={(v) => set('paymentNumber', v)}
              mono
            />
          </div>
          <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-3)' }}>
            Payouts go to this MoMo or Orange Money account. Current balance:{' '}
            <span className="mono">{money(profile.walletBalance)}</span>.
          </p>
        </div>
      )}

      {tab === 'wallet' && (
        <WalletPanel
          profile={profile}
          onCredit={onCredit}
          onDebit={onDebit}
          onReverse={onReverse}
        />
      )}

      {tab === 'orders' && (
        <OrderHistory
          history={history}
          fallback={theirs}
          emptyLine={`${profile.businessName} has taken no orders.`}
        />
      )}

      {error && (
        <p style={{ margin: '14px 0 0', fontSize: 12, color: 'var(--stop)' }}>{error}</p>
      )}
    </Drawer>
  );
}
