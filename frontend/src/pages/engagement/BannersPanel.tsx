import { useState } from 'react';
import Button from '../../components/ui/Button';
import Toggle from '../../components/ui/Toggle';
import Field from '../../components/ui/Field';
import { Modal, FooterSpacer } from '../../components/ui/Overlay';
import ImageField from '../../components/ui/ImageField';
import { CollectionCard, WriteGate, Stat } from './shared';
import type { EngagementState } from '../../state/useEngagement';
import type { EngagementBanner } from '../../data/types';

function BannerForm({
  initial, onSave, onClose,
}: {
  initial: { title: string; destination: string; imageUrl: string | null } | null;
  onSave: (body: { title: string; destination: string; imageUrl: string | null }) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [destination, setDestination] = useState(initial?.destination ?? '');
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const [error, setError] = useState('');

  return (
    <Modal
      title={initial ? 'Edit this banner' : 'New banner'}
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
                setError('The banner needs the line a customer will read');
                return;
              }
              if (!destination.trim()) {
                setError('Say where tapping it should take them');
                return;
              }
              onSave({ title: title.trim(), destination: destination.trim(), imageUrl });
            }}
          >
            Save banner
          </Button>
        </>
      )}
    >
      <Field
        label="Headline"
        value={title}
        onChange={(v) => { setTitle(v); setError(''); }}
        placeholder="Free delivery in Molyko this weekend"
      />
      <div style={{ marginTop: 12 }}>
        <Field
          label="Destination"
          value={destination}
          onChange={(v) => { setDestination(v); setError(''); }}
          placeholder="/offers/molyko-weekend"
          mono
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

export default function BannersPanel({ engagement }: { engagement: EngagementState }) {
  const { banners, createBanner, updateBanner, deleteBanner } = engagement;
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<EngagementBanner | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<EngagementBanner | null>(null);

  return (
    <>
      <CollectionCard
        title="Home banners"
        action={(
          <WriteGate>
            <Button variant="primary" onClick={() => setCreating(true)}>New banner</Button>
          </WriteGate>
        )}
        source={banners}
        empty={{
          heading: 'No banners yet',
          line: 'The home screen shows nothing above the vendor list until you add one.',
        }}
      >
        {(rows) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {rows.map((b) => (
              <div
                key={b.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: 11,
                  border: '1px solid var(--line)', borderRadius: 'var(--r-card)',
                  background: 'var(--card)',
                  opacity: b.isActive ? 1 : 0.72,
                }}
              >
                {b.imageUrl ? (
                  <img
                    src={b.imageUrl}
                    alt=""
                    style={{
                      width: 58, height: 40, objectFit: 'cover',
                      borderRadius: 8, flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    style={{
                      width: 58, height: 40, borderRadius: 8, flexShrink: 0,
                      background: 'var(--calm-soft)',
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{b.title}</div>
                  <div
                    className="mono"
                    style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}
                  >
                    {b.destination}
                  </div>
                </div>
                <Stat label="taps" value={b.taps.toLocaleString('fr-FR')} />
                <WriteGate>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Button variant="soft" onClick={() => setEditing(b)}>Edit</Button>
                    <Button variant="destructive" onClick={() => setConfirmDelete(b)}>
                      Delete
                    </Button>
                    <Toggle
                      checked={b.isActive}
                      onChange={() => updateBanner(b.id, { isActive: !b.isActive })}
                      label={`${b.title} visibility`}
                    />
                  </div>
                </WriteGate>
              </div>
            ))}
          </div>
        )}
      </CollectionCard>

      {creating && (
        <BannerForm
          initial={null}
          onSave={(body) => { createBanner(body); setCreating(false); }}
          onClose={() => setCreating(false)}
        />
      )}

      {editing && (
        <BannerForm
          initial={editing}
          onSave={(body) => { updateBanner(editing.id, body); setEditing(null); }}
          onClose={() => setEditing(null)}
        />
      )}

      {confirmDelete && (
        <Modal
          title="Delete this banner"
          subtitle={confirmDelete.title}
          onClose={() => setConfirmDelete(null)}
          width={430}
          footer={(
            <>
              <FooterSpacer />
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>Keep it</Button>
              <Button
                variant="destructive"
                onClick={() => { deleteBanner(confirmDelete.id); setConfirmDelete(null); }}
              >
                Delete banner
              </Button>
            </>
          )}
        >
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-2)' }}>
            It disappears from the home screen and cannot be brought back from
            here. If you only want to hide it, switch it off instead.
          </p>
        </Modal>
      )}
    </>
  );
}
