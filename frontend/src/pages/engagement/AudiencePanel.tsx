import { useState } from 'react';
import Button from '../../components/ui/Button';
import Pill from '../../components/ui/Pill';
import Toggle from '../../components/ui/Toggle';
import DataTable from '../../components/ui/DataTable';
import type { Column } from '../../components/ui/DataTable';
import { TextArea } from '../../components/ui/Field';
import { Modal, FooterSpacer } from '../../components/ui/Overlay';
import { CollectionCard, WriteGate } from './shared';
import { money } from '../../lib/format';
import { useAuth } from '../../state/useAuth';
import type { EngagementState } from '../../state/useEngagement';
import type { SharedCart, TrackingFact } from '../../data/types';

/** Tags are their own identifier, so a new one is just a word. */
function AddTag({ onAdd }: { onAdd: (tag: string) => void }) {
  const { isSuperAdmin } = useAuth();
  const [value, setValue] = useState('');
  if (!isSuperAdmin) return null;

  const submit = () => {
    const tag = value.trim().toLowerCase().replace(/\s+/g, '-');
    if (!tag) return;
    onAdd(tag);
    setValue('');
  };

  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        placeholder="New tag"
        aria-label="New preference tag"
        style={{
          height: 32, flex: 1, minWidth: 0,
          borderRadius: 'var(--r-ctrl)', border: '1px solid var(--line)',
          background: 'var(--card)', color: 'var(--text)',
          padding: '0 11px', fontSize: 12, fontFamily: 'var(--sans)',
        }}
      />
      <Button variant="soft" onClick={submit}>Add</Button>
    </div>
  );
}

export default function AudiencePanel({ engagement }: { engagement: EngagementState }) {
  const {
    preferenceTags, trackingFacts, sharedCarts,
    createPreferenceTag, deletePreferenceTag,
    createTrackingFact, updateTrackingFact, deleteTrackingFact,
  } = engagement;

  const [newFact, setNewFact] = useState(false);
  const [factText, setFactText] = useState('');
  const [factError, setFactError] = useState('');
  const [removingFact, setRemovingFact] = useState<TrackingFact | null>(null);
  const [removingTag, setRemovingTag] = useState<string | null>(null);

  const cartColumns: Column<SharedCart>[] = [
    { key: 'owner', header: 'Started by', render: (c) => c.owner },
    {
      key: 'participants', header: 'People', align: 'right',
      render: (c) => <span className="mono" style={{ fontSize: 12 }}>{c.participants}</span>,
    },
    {
      key: 'total', header: 'Basket', align: 'right',
      render: (c) => (
        <span className="mono" style={{ fontSize: 12, color: 'var(--forest)' }}>
          {money(c.total)}
        </span>
      ),
    },
    {
      key: 'created', header: 'Started', align: 'right',
      render: (c) => (
        <span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>
          {c.createdAgo}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="reeyo-split-even">
        <CollectionCard
          title="Preference tags"
          source={preferenceTags}
          empty={{
            heading: 'No tags yet',
            line: 'Customers have not told the app anything about what they like.',
          }}
        >
          {(rows) => (
            <>
              <AddTag onAdd={createPreferenceTag} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {[...rows]
                  .sort((a, b) => b.usageCount - a.usageCount)
                  .map((t) => (
                    <span
                      key={t.tag}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '5px 8px 5px 11px', borderRadius: 'var(--r-pill)',
                        background: 'var(--olive)', color: 'var(--forest)',
                        fontSize: 12, fontWeight: 600,
                      }}
                    >
                      {t.tag}
                      <span className="mono" style={{ fontSize: 10.5, opacity: 0.7 }}>
                        {t.usageCount.toLocaleString('fr-FR')}
                      </span>
                      <WriteGate>
                        <button
                          onClick={() => setRemovingTag(t.tag)}
                          aria-label={`Remove ${t.tag}`}
                          style={{
                            width: 16, height: 16, borderRadius: '50%', border: 'none',
                            background: 'transparent', color: 'var(--forest)',
                            cursor: 'pointer', fontSize: 13, lineHeight: 1,
                            display: 'inline-flex', alignItems: 'center',
                            justifyContent: 'center', padding: 0,
                          }}
                        >
                          ×
                        </button>
                      </WriteGate>
                    </span>
                  ))}
              </div>
            </>
          )}
        </CollectionCard>

        <CollectionCard
          title="Tracking screen facts"
          action={(
            <WriteGate>
              <Button variant="soft" onClick={() => setNewFact(true)}>Add fact</Button>
            </WriteGate>
          )}
          source={trackingFacts}
          empty={{
            heading: 'No facts',
            line: 'The tracking screen shows nothing while a customer waits.',
          }}
        >
          {(rows) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rows.map((f) => (
                <div
                  key={f.id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '9px 11px', borderRadius: 'var(--r-ctrl)',
                    border: '1px solid var(--line)',
                    opacity: f.isActive ? 1 : 0.7,
                  }}
                >
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--text-2)' }}>
                    {f.text}
                  </span>
                  {!f.isActive && <Pill status="paused" />}
                  <WriteGate>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Toggle
                        checked={f.isActive}
                        onChange={() => updateTrackingFact(f.id, { isActive: !f.isActive })}
                        label={`${f.text.slice(0, 30)} shown`}
                      />
                      <Button variant="destructive" onClick={() => setRemovingFact(f)}>
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

      <CollectionCard
        title="Shared carts"
        source={sharedCarts}
        empty={{
          heading: 'Nobody is shopping together',
          line: 'Shared carts appear here while they are open.',
        }}
      >
        {(rows) => (
          <DataTable
            columns={cartColumns}
            rows={rows}
            rowKey={(c) => c.id}
            minWidth={560}
          />
        )}
      </CollectionCard>

      {newFact && (
        <Modal
          title="New tracking fact"
          subtitle="Shown to a customer while they wait for a delivery"
          onClose={() => { setNewFact(false); setFactText(''); setFactError(''); }}
          width={460}
          footer={(
            <>
              <FooterSpacer />
              <Button
                variant="outline"
                onClick={() => { setNewFact(false); setFactText(''); setFactError(''); }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  if (!factText.trim()) {
                    setFactError('Write the line the customer will read');
                    return;
                  }
                  createTrackingFact(factText.trim());
                  setNewFact(false);
                  setFactText('');
                  setFactError('');
                }}
              >
                Add fact
              </Button>
            </>
          )}
        >
          <TextArea
            label="Fact"
            value={factText}
            onChange={(v) => { setFactText(v); setFactError(''); }}
            placeholder="Ndolé takes about 4 hours to cook properly."
            rows={3}
          />
          {factError && (
            <p style={{ margin: '9px 0 0', fontSize: 12, color: 'var(--stop)' }}>{factError}</p>
          )}
        </Modal>
      )}

      {removingFact && (
        <Modal
          title="Delete this fact"
          onClose={() => setRemovingFact(null)}
          width={440}
          footer={(
            <>
              <FooterSpacer />
              <Button variant="outline" onClick={() => setRemovingFact(null)}>Keep it</Button>
              <Button
                variant="destructive"
                onClick={() => { deleteTrackingFact(removingFact.id); setRemovingFact(null); }}
              >
                Delete fact
              </Button>
            </>
          )}
        >
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-2)' }}>
            “{removingFact.text}” stops appearing on the tracking screen. Switching
            it off instead keeps it for later.
          </p>
        </Modal>
      )}

      {removingTag && (
        <Modal
          title="Remove this tag"
          subtitle={removingTag}
          onClose={() => setRemovingTag(null)}
          width={440}
          footer={(
            <>
              <FooterSpacer />
              <Button variant="outline" onClick={() => setRemovingTag(null)}>Keep it</Button>
              <Button
                variant="destructive"
                onClick={() => { deletePreferenceTag(removingTag); setRemovingTag(null); }}
              >
                Remove tag
              </Button>
            </>
          )}
        >
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-2)' }}>
            Customers can no longer pick this preference, and vendors stop seeing
            it on orders. Existing orders keep whatever they already carry.
          </p>
        </Modal>
      )}
    </div>
  );
}
