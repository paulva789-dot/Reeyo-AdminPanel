import { useState } from 'react';
import Button from '../../components/ui/Button';
import Toggle from '../../components/ui/Toggle';
import Field from '../../components/ui/Field';
import { Modal, FooterSpacer } from '../../components/ui/Overlay';
import { SuperAdminBadge } from '../../components/ui/SuperAdminOnly';
import { platform } from '../../services/platformResources';
import { ApiError } from '../../services/apiClient';
import { useAuth } from '../../state/useAuth';
import { useAppState } from '../../state/useAppState';
import type { Vendor } from '../../data/types';

/** The badges the engagement service recognises. */
const BADGES = [
  { key: 'TOP_RATED', label: 'Top rated' },
  { key: 'FAST_DELIVERY', label: 'Fast delivery' },
  { key: 'NEW', label: 'New on reeyo' },
  { key: 'POPULAR', label: 'Popular' },
];

/**
 * Everything about a vendor an admin can change, gathered into one place.
 *
 * These are four separate endpoints, deliberately saved separately: the details
 * go to `PATCH /vendors/:id`, commission to `/commission`, featuring to
 * `/feature`, and badges to `PATCH /engagement/vendors/:id/badges`. A single
 * Save button would have to claim all four succeeded when one might not have.
 */
export default function VendorEditModal({
  vendor, onClose,
}: { vendor: Vendor; onClose: () => void }) {
  const { isSuperAdmin } = useAuth();
  const { pushToast } = useAppState();

  const [name, setName] = useState(vendor.name);
  const [category, setCategory] = useState(vendor.category);
  const [commission, setCommission] = useState('');
  const [featured, setFeatured] = useState(false);
  const [badges, setBadges] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const detailsDirty = name.trim() !== vendor.name || category.trim() !== vendor.category;

  const run = async (label: string, call: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await call();
      pushToast(`${vendor.name}: ${label}`);
    } catch (err) {
      setError(err instanceof ApiError ? `${label} failed — ${err.message}` : `${label} failed.`);
    } finally {
      setBusy(false);
    }
  };

  const toggleBadge = (key: string) => {
    setBadges((prev) => (prev.includes(key)
      ? prev.filter((b) => b !== key)
      : [...prev, key]));
  };

  return (
    <Modal
      title={`Edit ${vendor.name}`}
      subtitle={`${vendor.zone} · ${vendor.city}`}
      onClose={onClose}
      width={520}
      footer={(
        <>
          <FooterSpacer />
          <Button variant="outline" onClick={onClose}>Done</Button>
        </>
      )}
    >
      {error && (
        <p
          style={{
            margin: '0 0 13px', fontSize: 12, color: 'var(--stop)',
            background: 'var(--stop-soft)', padding: '8px 11px',
            borderRadius: 'var(--r-ctrl)',
          }}
        >
          {error}
        </p>
      )}

      <section style={{ marginBottom: 20 }}>
        <div className="eyebrow" style={{ marginBottom: 9 }}>Details</div>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
          <Field label="Name" value={name} onChange={setName} />
          <Field label="Category" value={category} onChange={setCategory} />
        </div>
        <div style={{ display: 'flex', marginTop: 10 }}>
          <FooterSpacer />
          <Button
            variant="primary"
            disabled={busy || !detailsDirty}
            title={detailsDirty ? undefined : 'Nothing has changed'}
            onClick={() => void run('details saved', () => platform.updateVendor(vendor.id, {
              name: name.trim(),
              category: category.trim(),
            }))}
          >
            Save details
          </Button>
        </div>
      </section>

      <section style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9,
          }}
        >
          <span className="eyebrow">Commission</span>
          {!isSuperAdmin && <SuperAdminBadge />}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <Field
            label="Rate %"
            value={commission}
            onChange={(v) => { setCommission(v); setError(''); }}
            placeholder="15"
            mono
            style={{ flex: 1 }}
          />
          <Button
            variant="primary"
            disabled={busy || !isSuperAdmin || !commission.trim()}
            onClick={() => {
              const parsed = Number(commission);
              if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
                setError('Commission has to be a number between 0 and 100');
                return;
              }
              void run('commission set', () => platform.setVendorCommission(vendor.id, parsed));
            }}
          >
            Set rate
          </Button>
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 10.5, color: 'var(--text-3)' }}>
          Overrides the platform default for this vendor only. The current rate is
          not returned by the vendors list, so this field starts empty rather than
          showing a guess.
        </p>
      </section>

      <section style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="eyebrow" style={{ marginBottom: 3 }}>Featured</div>
            <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-2)' }}>
              Puts them at the top of the customer home screen.
            </p>
          </div>
          <Toggle
            checked={featured}
            onChange={(nextValue) => {
              setFeatured(nextValue);
              void run(
                nextValue ? 'featured' : 'no longer featured',
                () => platform.featureVendor(vendor.id, nextValue),
              );
            }}
            label={`${vendor.name} featured`}
          />
        </div>
      </section>

      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
          <span className="eyebrow">Badges</span>
          {!isSuperAdmin && <SuperAdminBadge />}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 10 }}>
          {BADGES.map((b) => {
            const on = badges.includes(b.key);
            return (
              <button
                key={b.key}
                onClick={() => toggleBadge(b.key)}
                disabled={!isSuperAdmin}
                aria-pressed={on}
                style={{
                  padding: '5px 12px', borderRadius: 'var(--r-pill)',
                  border: `1px solid ${on ? 'var(--emerald)' : 'var(--line)'}`,
                  background: on ? 'var(--go-soft)' : 'var(--card)',
                  color: on ? 'var(--emerald-ink)' : 'var(--text-2)',
                  fontSize: 12, fontWeight: 600, cursor: isSuperAdmin ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--sans)',
                }}
              >
                {b.label}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex' }}>
          <FooterSpacer />
          <Button
            variant="primary"
            disabled={busy || !isSuperAdmin}
            onClick={() => void run('badges saved', () => platform.setVendorBadges(vendor.id, badges))}
          >
            Save badges
          </Button>
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 10.5, color: 'var(--text-3)' }}>
          Saving replaces the whole set, so this sends exactly what is selected
          above. The vendors list does not return current badges, so nothing is
          pre-selected.
        </p>
      </section>
    </Modal>
  );
}
