import { useState } from 'react';
import Button from '../../components/ui/Button';
import Toggle from '../../components/ui/Toggle';
import Field, { TextArea } from '../../components/ui/Field';
import { Modal, FooterSpacer } from '../../components/ui/Overlay';
import ImageField from '../../components/ui/ImageField';
import { CollectionCard, WriteGate, Stat } from './shared';
import type { EngagementState } from '../../state/useEngagement';
import type { Popup } from '../../data/types';

/** Clicks over impressions — the only figure that says whether a popup earns its interruption. */
function tapRate(p: Popup): string {
  if (p.impressions === 0) return '—';
  return `${Math.round((p.clicks / p.impressions) * 1000) / 10}%`;
}

function PopupForm({
  initial, onSave, onClose,
}: {
  initial: { title: string; body: string; imageUrl: string | null } | null;
  onSave: (body: { title: string; body: string; imageUrl: string | null }) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const [error, setError] = useState('');

  return (
    <Modal
      title={initial ? 'Edit this popup' : 'New popup'}
      onClose={onClose}
      width={470}
      footer={(
        <>
          <FooterSpacer />
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!title.trim()) {
                setError('A popup interrupts someone — give it a headline that earns it');
                return;
              }
              onSave({ title: title.trim(), body: body.trim(), imageUrl });
            }}
          >
            Save popup
          </Button>
        </>
      )}
    >
      <Field
        label="Headline"
        value={title}
        onChange={(v) => { setTitle(v); setError(''); }}
        placeholder="Your first order is on us"
      />
      <div style={{ marginTop: 12 }}>
        <TextArea
          label="Body"
          value={body}
          onChange={setBody}
          placeholder="New here? Use WELCOME to take FCFA 1 000 off your first delivery."
          rows={3}
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <ImageField label="Image" value={imageUrl} onChange={setImageUrl} />
      </div>
      {error && (
        <p style={{ margin: '9px 0 0', fontSize: 12, color: 'var(--stop)' }}>{error}</p>
      )}
    </Modal>
  );
}

export default function PopupsPanel({ engagement }: { engagement: EngagementState }) {
  const { popups, createPopup, updatePopup, deletePopup } = engagement;
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Popup | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Popup | null>(null);

  return (
    <>
      <CollectionCard
        title="Popups"
        action={(
          <WriteGate>
            <Button variant="primary" onClick={() => setCreating(true)}>New popup</Button>
          </WriteGate>
        )}
        source={popups}
        empty={{
          heading: 'No popups',
          line: 'Nothing interrupts a customer when they open the app.',
        }}
      >
        {(rows) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {rows.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12,
                  border: '1px solid var(--line)', borderRadius: 'var(--r-card)',
                  background: 'var(--card)',
                  opacity: p.isActive ? 1 : 0.72,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{p.title}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 3 }}>
                    {p.body}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                  <Stat label="shown" value={p.impressions.toLocaleString('fr-FR')} />
                  <Stat label="tapped" value={p.clicks.toLocaleString('fr-FR')} />
                  <Stat label="rate" value={tapRate(p)} />
                </div>
                <WriteGate>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <Button variant="soft" onClick={() => setEditing(p)}>Edit</Button>
                    <Button variant="destructive" onClick={() => setConfirmDelete(p)}>
                      Delete
                    </Button>
                    <Toggle
                      checked={p.isActive}
                      onChange={() => updatePopup(p.id, { isActive: !p.isActive })}
                      label={`${p.title} visibility`}
                    />
                  </div>
                </WriteGate>
              </div>
            ))}
          </div>
        )}
      </CollectionCard>

      {creating && (
        <PopupForm
          initial={null}
          onSave={(body) => { createPopup(body); setCreating(false); }}
          onClose={() => setCreating(false)}
        />
      )}

      {editing && (
        <PopupForm
          initial={editing}
          onSave={(body) => { updatePopup(editing.id, body); setEditing(null); }}
          onClose={() => setEditing(null)}
        />
      )}

      {confirmDelete && (
        <Modal
          title="Delete this popup"
          subtitle={confirmDelete.title}
          onClose={() => setConfirmDelete(null)}
          width={430}
          footer={(
            <>
              <FooterSpacer />
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>Keep it</Button>
              <Button
                variant="destructive"
                onClick={() => { deletePopup(confirmDelete.id); setConfirmDelete(null); }}
              >
                Delete popup
              </Button>
            </>
          )}
        >
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-2)' }}>
            Its impression and tap history goes with it. Switching it off keeps
            the record and stops showing it.
          </p>
        </Modal>
      )}
    </>
  );
}
