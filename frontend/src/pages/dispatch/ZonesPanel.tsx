import { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Toggle from '../../components/ui/Toggle';
import EmptyState from '../../components/ui/EmptyState';
import Field from '../../components/ui/Field';
import { Modal, FooterSpacer } from '../../components/ui/Overlay';
import ZoneMap from '../../components/domain/ZoneMap';
import { useZones } from '../../state/useZones';
import { money } from '../../lib/format';
import type { DeliveryZone } from '../../data/types';

/** A polygon needs three points before it encloses anything. */
const MIN_POINTS = 3;

function ZoneRow({
  zone, selected, onSelect, onToggle, onEdit, onDelete,
}: {
  zone: DeliveryZone;
  selected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      style={{
        padding: '11px 13px',
        borderRadius: 'var(--r-ctrl)',
        border: `1px solid ${selected ? 'var(--emerald)' : 'var(--line)'}`,
        background: selected ? 'var(--go-soft)' : 'var(--card)',
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{zone.name}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
            {zone.polygon.length} points
            {zone.deliveryFeeOverride !== null && ` · FCFA ${money(zone.deliveryFeeOverride)}`}
          </div>
        </div>
        <Toggle
          checked={zone.isActive}
          onChange={onToggle}
          label={`${zone.name} active`}
        />
      </div>
      {selected && (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button variant="soft" onClick={onEdit}>Rename</Button>
          <FooterSpacer />
          <Button variant="destructive" onClick={onDelete}>Delete</Button>
        </div>
      )}
    </div>
  );
}

/** Name and fee, used both for a new zone and for renaming one. */
function ZoneForm({
  title, initial, points, onSave, onClose,
}: {
  title: string;
  initial: { name: string; fee: string };
  /** How many points the polygon has — shown so a new zone says what was drawn. */
  points: number | null;
  onSave: (name: string, fee: number | null) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [fee, setFee] = useState(initial.fee);
  const [error, setError] = useState('');

  return (
    <Modal
      title={title}
      subtitle={points === null ? undefined : `${points} points drawn`}
      onClose={onClose}
      width={430}
      footer={(
        <>
          <FooterSpacer />
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!name.trim()) {
                setError('Give the zone a name riders will recognise');
                return;
              }
              const parsed = fee.trim() === '' ? null : Number(fee);
              if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0)) {
                setError('The fee override has to be a number, or left empty');
                return;
              }
              onSave(name.trim(), parsed);
            }}
          >
            Save zone
          </Button>
        </>
      )}
    >
      <Field
        label="Name"
        value={name}
        onChange={(v) => { setName(v); setError(''); }}
        placeholder="Douala — Bonapriso"
      />
      <div style={{ marginTop: 12 }}>
        <Field
          label="Delivery fee override (FCFA)"
          value={fee}
          onChange={(v) => { setFee(v); setError(''); }}
          placeholder="Leave empty to use the standard fee"
          mono
        />
      </div>
      {error && (
        <p style={{ margin: '9px 0 0', fontSize: 12, color: 'var(--stop)' }}>{error}</p>
      )}
    </Modal>
  );
}

export default function ZonesPanel() {
  const { zones, loading, error, sample, create, update, remove } = useZones();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<[number, number][] | null>(null);
  const [naming, setNaming] = useState(false);
  const [renaming, setRenaming] = useState<DeliveryZone | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DeliveryZone | null>(null);

  const selected = zones.find((z) => z.id === selectedId) ?? null;

  return (
    <>
      {error && (
        <Card style={{ marginBottom: 14 }}>
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--stop)' }}>
            {error} The polygons below are samples, not what the platform is serving.
          </p>
        </Card>
      )}

      <div className="reeyo-split">
        <Card
          title="Delivery zones"
          action={(
            <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
              {draft === null
                ? 'Click a zone to select it'
                : draft.length < MIN_POINTS
                  ? `Click the map — ${MIN_POINTS - draft.length} more point${
                    MIN_POINTS - draft.length === 1 ? '' : 's'} needed`
                  : `${draft.length} points — keep clicking or save`}
            </span>
          )}
        >
          <ZoneMap
            zones={zones}
            selectedId={selectedId}
            onSelect={setSelectedId}
            draft={draft}
            onAddPoint={(p) => setDraft((prev) => [...(prev ?? []), p])}
          />

          <div
            style={{
              display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap', alignItems: 'center',
            }}
          >
            {draft === null ? (
                <Button variant="primary" onClick={() => { setDraft([]); setSelectedId(null); }}>
                  Draw a zone
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    disabled={draft.length === 0}
                    onClick={() => setDraft(draft.slice(0, -1))}
                  >
                    Undo point
                  </Button>
                  <Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
                  <FooterSpacer />
                  <Button
                    variant="primary"
                    disabled={draft.length < MIN_POINTS}
                    title={draft.length < MIN_POINTS
                      ? 'A zone needs at least three points'
                      : undefined}
                    onClick={() => setNaming(true)}
                  >
                    Name and save
                  </Button>
              </>
            )}
          </div>
        </Card>

        <Card
          title="Zones"
          action={(
            <span className="mono" style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {zones.length}
            </span>
          )}
        >
          {loading ? (
            <EmptyState heading="Loading…" line="Fetching zones from the platform." />
          ) : zones.length === 0 ? (
            <EmptyState
              heading="No zones yet"
              line="Draw one on the map to open reeyo's first delivery area."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {zones.map((zone) => (
                <ZoneRow
                  key={zone.id}
                  zone={zone}
                  selected={zone.id === selectedId}
                  onSelect={() => setSelectedId(zone.id)}
                  onToggle={() => update(zone.id, { isActive: !zone.isActive })}
                  onEdit={() => setRenaming(zone)}
                  onDelete={() => setConfirmDelete(zone)}
                />
              ))}
            </div>
          )}
          {sample && !error && (
            <p style={{ margin: '12px 0 0', fontSize: 11.5, color: 'var(--text-3)' }}>
              Sample polygons. Sign in against the live API to see the real ones.
            </p>
          )}
        </Card>
      </div>

      {naming && draft && (
        <ZoneForm
          title="Name this zone"
          initial={{ name: '', fee: '' }}
          points={draft.length}
          onSave={(name, fee) => {
            create({
              name,
              countryCode: 'CM',
              polygon: draft,
              deliveryFeeOverride: fee,
              isActive: true,
            });
            setNaming(false);
            setDraft(null);
          }}
          onClose={() => setNaming(false)}
        />
      )}

      {renaming && (
        <ZoneForm
          title="Edit this zone"
          initial={{
            name: renaming.name,
            fee: renaming.deliveryFeeOverride === null ? '' : String(renaming.deliveryFeeOverride),
          }}
          points={null}
          onSave={(name, fee) => {
            update(renaming.id, { name, deliveryFeeOverride: fee });
            setRenaming(null);
          }}
          onClose={() => setRenaming(null)}
        />
      )}

      {confirmDelete && (
        <Modal
          title="Delete this zone"
          subtitle={confirmDelete.name}
          onClose={() => setConfirmDelete(null)}
          width={430}
          footer={(
            <>
              <FooterSpacer />
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>Keep it</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  remove(confirmDelete.id);
                  if (selectedId === confirmDelete.id) setSelectedId(null);
                  setConfirmDelete(null);
                }}
              >
                Delete zone
              </Button>
            </>
          )}
        >
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-2)' }}>
            Orders can no longer be placed inside this boundary, and the polygon
            cannot be recovered from here. If you only want to pause it, switch
            it off instead.
          </p>
        </Modal>
      )}

      {selected && (
        <p style={{ margin: '12px 0 0', fontSize: 11.5, color: 'var(--text-3)' }}>
          {selected.name} · {selected.countryCode} · {selected.polygon.length} points
        </p>
      )}
    </>
  );
}
