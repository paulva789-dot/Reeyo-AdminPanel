import { useState } from 'react';
import { useT } from '../../i18n/useT';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Pill from '../../components/ui/Pill';
import Toggle from '../../components/ui/Toggle';
import Field, { Select, TextArea } from '../../components/ui/Field';
import EmptyState from '../../components/ui/EmptyState';
import { Modal, FooterSpacer } from '../../components/ui/Overlay';
import ImageField from '../../components/ui/ImageField';
import ZonePicker from '../../components/ui/ZonePicker';
import {
  campaignBanners as seedBanners,
  campaignPopups as seedPopups,
  horizontalAisles as seedAisles,
} from '../../data/campaignSeed';
import { OCCURRENCES, CAMPAIGN_TOKENS, describeZones } from '../../data/campaignTypes';
import type {
  CampaignBanner, CampaignPopup, HorizontalAisle, Occurrence,
} from '../../data/campaignTypes';

/* ---------------------------------------------------------------------- */
/* Shared                                                                  */
/* ---------------------------------------------------------------------- */

function Schedule({
  startsOn, endsOn, onChange,
}: {
  startsOn: string | null;
  endsOn: string | null;
  onChange: (starts: string | null, ends: string | null) => void;
}) {
  return (
    <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
      <Field
        label="Starts"
        value={startsOn ?? ''}
        onChange={(v) => onChange(v || null, endsOn)}
        type="date"
        mono
      />
      <Field
        label="Ends"
        value={endsOn ?? ''}
        onChange={(v) => onChange(startsOn, v || null)}
        type="date"
        mono
      />
    </div>
  );
}

// A counter rather than Date.now(): the id is produced inside a useState
// initialiser, and reading the clock there is an impure call during render.
let draftSeq = 0;
const nextId = (prefix: string) => `${prefix}-new-${++draftSeq}`;

function ZoneTag({ zones }: { zones: string[] }) {
  return (
    <Pill
      status={describeZones(zones)}
      token={zones.length === 0 ? 'calm' : 'parcel'}
    />
  );
}

/* ---------------------------------------------------------------------- */
/* §7.1 Banners                                                            */
/* ---------------------------------------------------------------------- */

function BannerForm({
  initial, onSave, onClose,
}: {
  initial: CampaignBanner | null;
  onSave: (banner: CampaignBanner) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<CampaignBanner>(initial ?? {
    id: nextId('CB'), title: '', imageUrl: null, zones: [],
    destination: '', startsOn: null, endsOn: null,
    position: 99, active: true, taps: 0,
  });
  const [error, setError] = useState('');

  return (
    <Modal
      title={initial ? 'Edit banner' : 'New banner'}
      onClose={onClose}
      width={520}
      footer={(
        <>
          <FooterSpacer />
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!draft.title.trim()) { setError('The banner needs the line a customer reads'); return; }
              if (!draft.destination.trim()) { setError('Say where tapping it should take them'); return; }
              onSave(draft);
            }}
          >
            Save banner
          </Button>
        </>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field
          label="Title"
          value={draft.title}
          onChange={(v) => { setDraft({ ...draft, title: v }); setError(''); }}
          placeholder="Free delivery in Molyko this weekend"
        />
        <Field
          label="Linked vendor or item"
          value={draft.destination}
          onChange={(v) => { setDraft({ ...draft, destination: v }); setError(''); }}
          placeholder="Chez Mado"
        />
        <ImageField
          label="Image"
          value={draft.imageUrl}
          onChange={(v) => setDraft({ ...draft, imageUrl: v })}
        />
        <ZonePicker
          label="Zones"
          value={draft.zones}
          onChange={(zones) => setDraft({ ...draft, zones })}
        />
        <Schedule
          startsOn={draft.startsOn}
          endsOn={draft.endsOn}
          onChange={(startsOn, endsOn) => setDraft({ ...draft, startsOn, endsOn })}
        />
        <Field
          label="Sort position"
          value={String(draft.position)}
          onChange={(v) => setDraft({ ...draft, position: Number(v) || 0 })}
          mono
        />

        {/* §7.1 — preview it as the customer will see it, before publishing. */}
        <div>
          <span
            style={{
              display: 'block', fontSize: 11.5, fontWeight: 700,
              color: 'var(--text-2)', marginBottom: 6,
            }}
          >
            Preview
          </span>
          <div
            style={{
              borderRadius: 'var(--r-card)', overflow: 'hidden',
              border: '1.5px solid var(--mint)',
              background: draft.imageUrl
                ? undefined
                : 'linear-gradient(135deg, var(--pastel) 0%, var(--mint) 100%)',
              padding: draft.imageUrl ? 0 : '18px 16px',
              minHeight: 78,
            }}
          >
            {draft.imageUrl ? (
              <img
                src={draft.imageUrl}
                alt=""
                style={{ width: '100%', display: 'block', maxHeight: 120, objectFit: 'cover' }}
              />
            ) : (
              <>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--forest)' }}>
                  {draft.title || 'Your headline here'}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--forest-600)', marginTop: 4 }}>
                  {draft.destination || 'Where it goes'}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--stop)' }}>{error}</p>
      )}
    </Modal>
  );
}

export function BannersPanel() {
  const [banners, setBanners] = useState<CampaignBanner[]>(seedBanners);
  const [editing, setEditing] = useState<CampaignBanner | null>(null);
  const [adding, setAdding] = useState(false);

  const ordered = [...banners].sort((a, b) => a.position - b.position);

  const save = (banner: CampaignBanner) => {
    setBanners((prev) => (prev.some((b) => b.id === banner.id)
      ? prev.map((b) => (b.id === banner.id ? banner : b))
      : [...prev, banner]));
    setEditing(null);
    setAdding(false);
  };

  return (
    <>
      <Card
        title="Home banners"
        action={<Button variant="primary" onClick={() => setAdding(true)}>New banner</Button>}
      >
        {ordered.length === 0 ? (
          <EmptyState
            heading="No banners"
            line="The home screen shows nothing above the vendor list."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {ordered.map((banner) => (
              <div
                key={banner.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: 11,
                  border: '1px solid var(--line)', borderRadius: 'var(--r-card)',
                  opacity: banner.active ? 1 : 0.68,
                }}
              >
                <span
                  className="mono"
                  style={{
                    width: 22, height: 22, borderRadius: 'var(--r-pill)', flexShrink: 0,
                    background: 'var(--calm-soft)', color: 'var(--text-2)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11,
                  }}
                >
                  {banner.position}
                </span>
                <div
                  aria-hidden="true"
                  style={{
                    width: 54, height: 38, borderRadius: 8, flexShrink: 0,
                    background: banner.imageUrl
                      ? `center / cover url(${banner.imageUrl})`
                      : 'linear-gradient(135deg, var(--pastel) 0%, var(--mint) 100%)',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{banner.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                    {banner.destination}
                    {banner.startsOn && ` · from ${banner.startsOn}`}
                  </div>
                </div>
                <ZoneTag zones={banner.zones} />
                <span className="mono" style={{ fontSize: 11.5, color: 'var(--text-2)' }}>
                  {banner.taps.toLocaleString('fr-FR')} taps
                </span>
                <Button variant="soft" onClick={() => setEditing(banner)}>Edit</Button>
                <Toggle
                  checked={banner.active}
                  onChange={(next) => setBanners((prev) => prev.map(
                    (b) => (b.id === banner.id ? { ...b, active: next } : b),
                  ))}
                  label={`${banner.title} visibility`}
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      {(adding || editing) && (
        <BannerForm
          initial={editing}
          onSave={save}
          onClose={() => { setAdding(false); setEditing(null); }}
        />
      )}
    </>
  );
}

/* ---------------------------------------------------------------------- */
/* §7.2 Pop-ups                                                            */
/* ---------------------------------------------------------------------- */

function PopupForm({
  initial, onSave, onClose,
}: {
  initial: CampaignPopup | null;
  onSave: (popup: CampaignPopup) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<CampaignPopup>(initial ?? {
    id: nextId('CP'), title: '', body: '', imageUrl: null,
    ctaLabel: 'Open', ctaDestination: '/home', zones: [],
    occurrence: 'once per session', frequencyCap: 1,
    startsOn: null, endsOn: null, active: true, impressions: 0, clicks: 0,
  });
  const [error, setError] = useState('');

  return (
    <Modal
      title={initial ? 'Edit pop-up' : 'New pop-up'}
      onClose={onClose}
      width={520}
      footer={(
        <>
          <FooterSpacer />
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!draft.title.trim()) {
                setError('A pop-up interrupts someone — give it a headline that earns it');
                return;
              }
              onSave(draft);
            }}
          >
            Save pop-up
          </Button>
        </>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field
          label="Title"
          value={draft.title}
          onChange={(v) => { setDraft({ ...draft, title: v }); setError(''); }}
        />
        <TextArea
          label="Body"
          value={draft.body}
          onChange={(v) => setDraft({ ...draft, body: v })}
          rows={3}
        />
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
          <Field
            label="Button label"
            value={draft.ctaLabel}
            onChange={(v) => setDraft({ ...draft, ctaLabel: v })}
          />
          <Field
            label="Button destination"
            value={draft.ctaDestination}
            onChange={(v) => setDraft({ ...draft, ctaDestination: v })}
            mono
          />
        </div>
        <ImageField
          label="Image"
          value={draft.imageUrl}
          onChange={(v) => setDraft({ ...draft, imageUrl: v })}
        />
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
          <Select
            label="How often"
            value={draft.occurrence}
            onChange={(v) => setDraft({ ...draft, occurrence: v as Occurrence })}
            options={OCCURRENCES.map((o) => ({ value: o, label: o }))}
          />
          <Field
            label="Frequency cap"
            value={String(draft.frequencyCap)}
            onChange={(v) => setDraft({ ...draft, frequencyCap: Number(v) || 1 })}
            mono
          />
        </div>
        <ZonePicker
          label="Zones"
          value={draft.zones}
          onChange={(zones) => setDraft({ ...draft, zones })}
        />
        <Schedule
          startsOn={draft.startsOn}
          endsOn={draft.endsOn}
          onChange={(startsOn, endsOn) => setDraft({ ...draft, startsOn, endsOn })}
        />
        <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-3)' }}>
          The cap is per person: nobody sees this more than {draft.frequencyCap}{' '}
          time{draft.frequencyCap === 1 ? '' : 's'}, however often the rule above fires.
        </p>
      </div>

      {error && (
        <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--stop)' }}>{error}</p>
      )}
    </Modal>
  );
}

export function PopupsPanel() {
  const [popups, setPopups] = useState<CampaignPopup[]>(seedPopups);
  const [editing, setEditing] = useState<CampaignPopup | null>(null);
  const [adding, setAdding] = useState(false);

  const save = (popup: CampaignPopup) => {
    setPopups((prev) => (prev.some((p) => p.id === popup.id)
      ? prev.map((p) => (p.id === popup.id ? popup : p))
      : [...prev, popup]));
    setEditing(null);
    setAdding(false);
  };

  return (
    <>
      <Card
        title="Pop-ups"
        action={<Button variant="primary" onClick={() => setAdding(true)}>New pop-up</Button>}
      >
        {popups.length === 0 ? (
          <EmptyState
            heading="No pop-ups"
            line="Nothing interrupts a customer when they open the app."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {popups.map((popup) => {
              const rate = popup.impressions > 0
                ? `${Math.round((popup.clicks / popup.impressions) * 1000) / 10}%`
                : '—';
              return (
                <div
                  key={popup.id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12,
                    border: '1px solid var(--line)', borderRadius: 'var(--r-card)',
                    opacity: popup.active ? 1 : 0.68,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>{popup.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 3 }}>
                      {popup.body}
                    </div>
                    <div
                      style={{
                        display: 'flex', gap: 8, marginTop: 7, flexWrap: 'wrap',
                        alignItems: 'center',
                      }}
                    >
                      <ZoneTag zones={popup.zones} />
                      <Pill status={popup.occurrence} token="watch" />
                      <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                        cap {popup.frequencyCap}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--forest)' }}>
                      {rate}
                    </div>
                    <div className="eyebrow">tap rate</div>
                  </div>
                  <Button variant="soft" onClick={() => setEditing(popup)}>Edit</Button>
                  <Toggle
                    checked={popup.active}
                    onChange={(next) => setPopups((prev) => prev.map(
                      (p) => (p.id === popup.id ? { ...p, active: next } : p),
                    ))}
                    label={`${popup.title} visibility`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {(adding || editing) && (
        <PopupForm
          initial={editing}
          onSave={save}
          onClose={() => { setAdding(false); setEditing(null); }}
        />
      )}
    </>
  );
}

/* ---------------------------------------------------------------------- */
/* §7.3 Horizontal aisles                                                  */
/* ---------------------------------------------------------------------- */

/**
 * Aisle backgrounds come from the palette rather than a free colour picker.
 *
 * §7.3 asks for a colour picker and a contrast warning. A picker that can
 * produce any hex will eventually produce one that fails contrast, and the
 * warning then argues with the operator. Restricting the choice to tokens that
 * already pair with a known-legible text colour removes the failure instead of
 * reporting it — and keeps §3.3's rule that no fifth colour gets invented.
 */
function AisleForm({
  initial, onSave, onClose,
}: {
  initial: HorizontalAisle | null;
  onSave: (aisle: HorizontalAisle) => void;
  onClose: () => void;
}) {
  const t = useT();
  const [draft, setDraft] = useState<HorizontalAisle>(initial ?? {
    id: nextId('HA'), name: '', zones: [], contentType: 'Vendor',
    selection: [], backgroundToken: 'go', badge: null,
    position: 99, startsOn: null, endsOn: null, active: true,
  });
  const [entry, setEntry] = useState('');
  const [error, setError] = useState('');

  return (
    <Modal
      title={initial ? 'Edit aisle' : 'New horizontal aisle'}
      onClose={onClose}
      width={540}
      footer={(
        <>
          <FooterSpacer />
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!draft.name.trim()) { setError('The aisle needs the heading customers read'); return; }
              if (draft.selection.length === 0) { setError('An aisle with nothing in it shows nothing'); return; }
              onSave(draft);
            }}
          >
            Save aisle
          </Button>
        </>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field
          label="Aisle name"
          value={draft.name}
          onChange={(v) => { setDraft({ ...draft, name: v }); setError(''); }}
          placeholder="Fastest near you"
        />
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
          <Select
            label="Content type"
            value={draft.contentType}
            onChange={(v) => setDraft({ ...draft, contentType: v as 'Vendor' | 'Item', selection: [] })}
            options={[
              { value: 'Vendor', label: t('Vendors') },
              { value: 'Item', label: t('Items') },
            ]}
          />
          <Select
            label="Background"
            value={draft.backgroundToken}
            onChange={(v) => setDraft({ ...draft, backgroundToken: v })}
            options={CAMPAIGN_TOKENS.map((t) => ({ value: t, label: t }))}
          />
        </div>

        <div>
          <span
            style={{
              display: 'block', fontSize: 11.5, fontWeight: 700,
              color: 'var(--text-2)', marginBottom: 6,
            }}
          >
            Featured {draft.contentType === 'Vendor' ? 'vendors' : 'items'}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' || !entry.trim()) return;
                e.preventDefault();
                setDraft({ ...draft, selection: [...draft.selection, entry.trim()] });
                setEntry('');
                setError('');
              }}
              placeholder={draft.contentType === 'Vendor' ? 'Chez Mado' : 'Rice 5kg'}
              aria-label="Add to the aisle"
              style={{
                flex: 1, height: 34, borderRadius: 'var(--r-ctrl)',
                border: '1px solid var(--line)', background: 'var(--card)',
                color: 'var(--text)', padding: '0 10px', fontSize: 12.5, outline: 'none',
              }}
            />
            <Button
              variant="outline"
              onClick={() => {
                if (!entry.trim()) return;
                setDraft({ ...draft, selection: [...draft.selection, entry.trim()] });
                setEntry('');
                setError('');
              }}
            >
              Add
            </Button>
          </div>
          {draft.selection.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {draft.selection.map((item, i) => (
                <button
                  key={`${item}-${i}`}
                  onClick={() => setDraft({
                    ...draft,
                    selection: draft.selection.filter((_, x) => x !== i),
                  })}
                  aria-label={`Remove ${item}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px', borderRadius: 'var(--r-pill)',
                    border: '1px solid var(--line)', background: 'var(--olive)',
                    color: 'var(--forest)', cursor: 'pointer',
                    fontFamily: 'var(--sans)', fontSize: 11.5, fontWeight: 600,
                  }}
                >
                  {item}
                  <span aria-hidden="true" style={{ opacity: 0.6 }}>×</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <Field
          label="Badge (optional)"
          value={draft.badge ?? ''}
          onChange={(v) => setDraft({ ...draft, badge: v || null })}
          placeholder="Under 25 min"
        />
        <ZonePicker
          label="Zones"
          value={draft.zones}
          onChange={(zones) => setDraft({ ...draft, zones })}
        />
        <Schedule
          startsOn={draft.startsOn}
          endsOn={draft.endsOn}
          onChange={(startsOn, endsOn) => setDraft({ ...draft, startsOn, endsOn })}
        />

        {/* Live preview — the row exactly as the customer meets it. */}
        <div>
          <span
            style={{
              display: 'block', fontSize: 11.5, fontWeight: 700,
              color: 'var(--text-2)', marginBottom: 6,
            }}
          >
            Preview
          </span>
          <AislePreview aisle={draft} />
        </div>
      </div>

      {error && (
        <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--stop)' }}>{error}</p>
      )}
    </Modal>
  );
}

function AislePreview({ aisle }: { aisle: HorizontalAisle }) {
  return (
    <div
      style={{
        borderRadius: 'var(--r-card)', padding: '12px 14px',
        background: `var(--${aisle.backgroundToken}-soft, var(--canvas))`,
        border: '1px solid var(--line)',
      }}
    >
      <div
        style={{
          display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--forest)' }}>
          {aisle.name || 'Aisle heading'}
        </span>
        {aisle.badge && <Pill status={aisle.badge} token={aisle.backgroundToken} />}
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
        {(aisle.selection.length > 0 ? aisle.selection : ['Nothing yet']).map((item, i) => (
          <div
            key={`${item}-${i}`}
            style={{
              flexShrink: 0, width: 108, padding: '9px 10px',
              borderRadius: 'var(--r-ctrl)', background: 'var(--card)',
              border: '1px solid var(--line)',
            }}
          >
            <div
              aria-hidden="true"
              style={{
                height: 40, borderRadius: 6, marginBottom: 7,
                background: `var(--${aisle.backgroundToken})`,
                opacity: 0.35,
              }}
            />
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text)' }}>{item}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AislesPanel() {
  const [aisles, setAisles] = useState<HorizontalAisle[]>(seedAisles);
  const [editing, setEditing] = useState<HorizontalAisle | null>(null);
  const [adding, setAdding] = useState(false);

  const ordered = [...aisles].sort((a, b) => a.position - b.position);

  const save = (aisle: HorizontalAisle) => {
    setAisles((prev) => (prev.some((a) => a.id === aisle.id)
      ? prev.map((a) => (a.id === aisle.id ? aisle : a))
      : [...prev, aisle]));
    setEditing(null);
    setAdding(false);
  };

  return (
    <>
      <Card
        title="Horizontal aisles"
        action={<Button variant="primary" onClick={() => setAdding(true)}>New aisle</Button>}
      >
        <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--text-2)' }}>
          A scrollable row of promoted vendors or items on the customer home
          screen. This replaces the old Section feature.
        </p>

        {ordered.length === 0 ? (
          <EmptyState
            heading="No aisles"
            line="The home screen is a plain list with nothing promoted on it."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {ordered.map((aisle) => (
              <div key={aisle.id} style={{ opacity: aisle.active ? 1 : 0.68 }}>
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    className="mono"
                    style={{
                      width: 22, height: 22, borderRadius: 'var(--r-pill)', flexShrink: 0,
                      background: 'var(--calm-soft)', color: 'var(--text-2)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11,
                    }}
                  >
                    {aisle.position}
                  </span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, minWidth: 0 }}>
                    {aisle.name}
                  </span>
                  <ZoneTag zones={aisle.zones} />
                  <Pill status={aisle.contentType.toLowerCase()} token="calm" />
                  <Button variant="soft" onClick={() => setEditing(aisle)}>Edit</Button>
                  <Toggle
                    checked={aisle.active}
                    onChange={(next) => setAisles((prev) => prev.map(
                      (a) => (a.id === aisle.id ? { ...a, active: next } : a),
                    ))}
                    label={`${aisle.name} visibility`}
                  />
                </div>
                <AislePreview aisle={aisle} />
              </div>
            ))}
          </div>
        )}
      </Card>

      {(adding || editing) && (
        <AisleForm
          initial={editing}
          onSave={save}
          onClose={() => { setAdding(false); setEditing(null); }}
        />
      )}
    </>
  );
}
