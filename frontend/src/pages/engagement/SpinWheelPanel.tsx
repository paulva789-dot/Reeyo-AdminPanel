import { useState, useCallback } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Toggle from '../../components/ui/Toggle';
import Segments from '../../components/ui/Segments';
import BarList from '../../components/charts/BarList';
import EmptyState from '../../components/ui/EmptyState';
import Field, { Select } from '../../components/ui/Field';
import { Modal, FooterSpacer } from '../../components/ui/Overlay';
import { WriteGate } from './shared';
import { platform } from '../../services/platformResources';
import { useDetail } from '../../state/useDetail';
import type { EngagementState, SegmentDraft } from '../../state/useEngagement';
import type { SpinWheel } from '../../data/types';

const REWARD_TYPES = [
  { value: 'DELIVERY', label: 'Free delivery' },
  { value: 'DISCOUNT', label: 'Money off' },
  { value: 'POINTS', label: 'Loyalty points' },
  { value: 'NONE', label: 'Nothing — try again' },
];

/** What people have actually won, from /engagement/spin-wheels/:id/results. */
function Results({ wheelId }: { wheelId: string }) {
  const fetcher = useCallback(() => platform.spinWheelResults(wheelId), [wheelId]);
  const results = useDetail(wheelId, fetcher);

  if (results.sample) {
    return (
      <EmptyState
        heading="Spins need a live session"
        line="What people have won is recorded by the platform, so there is nothing
          to show in sample mode."
      />
    );
  }
  if (results.loading) {
    return <EmptyState heading="Loading…" line="Fetching recent spins." />;
  }
  if (results.error) {
    return <EmptyState heading="Could not load spins" line={results.error} />;
  }
  const rows = results.value ?? [];
  if (rows.length === 0) {
    return (
      <EmptyState
        heading="Nobody has spun this wheel"
        line="Results appear here as customers play."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {rows.map((r, i) => (
        <div
          key={r.id}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
            borderTop: i === 0 ? 'none' : '1px solid var(--line-soft)',
          }}
        >
          <span style={{ flex: 1, fontSize: 12.5, minWidth: 0 }}>{r.user}</span>
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{r.prize}</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.wonAt}</span>
        </div>
      ))}
    </div>
  );
}

function SegmentForm({
  onSave, onClose,
}: { onSave: (segment: SegmentDraft) => void; onClose: () => void }) {
  const [label, setLabel] = useState('');
  const [weight, setWeight] = useState('');
  const [rewardType, setRewardType] = useState('DISCOUNT');
  const [error, setError] = useState('');

  return (
    <Modal
      title="Add a slice"
      onClose={onClose}
      width={440}
      footer={(
        <>
          <FooterSpacer />
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!label.trim()) {
                setError('Give the slice the words a customer will see');
                return;
              }
              const parsed = Number(weight);
              if (!weight.trim() || !Number.isFinite(parsed) || parsed <= 0) {
                setError('Weight has to be a number above zero');
                return;
              }
              onSave({ label: label.trim(), weight: parsed, rewardType });
            }}
          >
            Add slice
          </Button>
        </>
      )}
    >
      <Field
        label="Label"
        value={label}
        onChange={(v) => { setLabel(v); setError(''); }}
        placeholder="Free delivery"
      />
      <div style={{ marginTop: 12 }}>
        <Field
          label="Weight"
          value={weight}
          onChange={(v) => { setWeight(v); setError(''); }}
          placeholder="25"
          mono
        />
        <p style={{ margin: '5px 0 0', fontSize: 10.5, color: 'var(--text-3)' }}>
          Relative, not a percentage — a slice weighing 25 against a total of 100
          comes up a quarter of the time.
        </p>
      </div>
      <div style={{ marginTop: 12 }}>
        <Select
          label="Reward type"
          value={rewardType}
          onChange={setRewardType}
          options={REWARD_TYPES}
        />
      </div>
      {error && (
        <p style={{ margin: '9px 0 0', fontSize: 12, color: 'var(--stop)' }}>{error}</p>
      )}
    </Modal>
  );
}

/** Reward types map onto the service palette so a slice's colour means something. */
const REWARD_TOKEN: Record<string, string> = {
  DELIVERY: 'parcel',
  DISCOUNT: 'food',
  POINTS: 'grocery',
  NONE: 'calm',
};

function tokenFor(rewardType: string): string {
  return REWARD_TOKEN[rewardType.toUpperCase()] ?? 'calm';
}

/** Hand-drawn SVG wheel — each slice sized by its weight (section 8.8). */
function Wheel({ wheel }: { wheel: SpinWheel }) {
  const total = wheel.segments.reduce((s, seg) => s + seg.weight, 0);
  const size = 236;
  const r = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;

  if (total === 0) {
    return (
      <EmptyState
        heading="Every slice weighs nothing"
        line="With no weights the wheel cannot pick a prize, so it will never spin."
      />
    );
  }

  // Each slice's start angle is derived from the ones before it rather than by
  // mutating a running value while rendering.
  const slices = wheel.segments.reduce<
  { id: string; label: string; token: string; from: number; sweep: number }[]
  >((acc, seg) => {
    const sweep = (seg.weight / total) * Math.PI * 2;
    const from = acc.length
      ? acc[acc.length - 1].from + acc[acc.length - 1].sweep
      : -Math.PI / 2;
    return [...acc, { id: seg.id, label: seg.label, token: tokenFor(seg.rewardType), from, sweep }];
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <svg
        width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={wheel.segments
          .map((s) => `${s.label} ${Math.round((s.weight / total) * 100)}%`)
          .join(', ')}
      >
        {slices.map(({ id, token, from, sweep }) => {
          const to = from + sweep;
          const x1 = cx + r * Math.cos(from);
          const y1 = cy + r * Math.sin(from);
          const x2 = cx + r * Math.cos(to);
          const y2 = cy + r * Math.sin(to);
          const large = sweep > Math.PI ? 1 : 0;
          return (
            <path
              key={id}
              d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`}
              fill={`var(--${token})`}
              stroke="var(--card)"
              strokeWidth="2"
            />
          );
        })}
        <circle cx={cx} cy={cy} r="26" fill="var(--card)" stroke="var(--line)" strokeWidth="2" />
      </svg>
    </div>
  );
}

export default function SpinWheelPanel({ engagement }: { engagement: EngagementState }) {
  const {
    spinWheels, toggleSpinWheel, createSpinWheel, deleteSpinWheel,
    addSegment, deleteSegment,
  } = engagement;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newWheel, setNewWheel] = useState(false);
  const [wheelName, setWheelName] = useState('');
  const [nameError, setNameError] = useState('');
  const [addingSlice, setAddingSlice] = useState(false);
  const [removingWheel, setRemovingWheel] = useState<SpinWheel | null>(null);

  if (spinWheels.loading) {
    return (
      <Card title="Spin wheels">
        <EmptyState heading="Loading…" line="Fetching the wheels from the platform." />
      </Card>
    );
  }

  if (spinWheels.rows.length === 0) {
    return (
      <Card title="Spin wheels">
        <EmptyState
          heading="No wheels"
          line="Customers have nothing to spin."
          action={<Button variant="primary" onClick={() => setNewWheel(true)}>New wheel</Button>}
        />
      </Card>
    );
  }

  const wheel = spinWheels.rows.find((w) => w.id === selectedId) ?? spinWheels.rows[0];
  const total = wheel.segments.reduce((s, seg) => s + seg.weight, 0);

  return (
    <>
      {spinWheels.error && (
        <p
          style={{
            margin: '0 0 14px', fontSize: 11.5, color: 'var(--stop)',
            background: 'var(--stop-soft)', padding: '9px 12px',
            borderRadius: 'var(--r-ctrl)',
          }}
        >
          {spinWheels.error} The wheel below is a sample, not what customers spin.
        </p>
      )}

      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 14, flexWrap: 'wrap',
        }}
      >
        {spinWheels.rows.length > 1 && (
          <Segments
            ariaLabel="Choose a wheel"
            value={wheel.id}
            onChange={setSelectedId}
            segments={spinWheels.rows.map((w) => ({
              value: w.id,
              label: w.isActive ? w.name : `${w.name} (off)`,
            }))}
          />
        )}
        <FooterSpacer />
        <WriteGate>
          <div style={{ display: 'flex', gap: 6 }}>
            <Button variant="soft" onClick={() => setNewWheel(true)}>New wheel</Button>
            <Button variant="destructive" onClick={() => setRemovingWheel(wheel)}>
              Delete wheel
            </Button>
          </div>
        </WriteGate>
      </div>

      <div className="reeyo-split-even">
        <Card
          title="Prize weights"
          action={(
            <WriteGate>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Button variant="soft" onClick={() => setAddingSlice(true)}>Add slice</Button>
                <Toggle
                  checked={wheel.isActive}
                  onChange={() => toggleSpinWheel(wheel.id, !wheel.isActive)}
                  label={`${wheel.name} live`}
                />
              </div>
            </WriteGate>
          )}
        >
          {wheel.segments.length === 0 ? (
            <EmptyState
              heading="No slices"
              line="This wheel has no prizes on it yet, so there is nothing to win."
              action={(
                <Button variant="primary" onClick={() => setAddingSlice(true)}>
                  Add a slice
                </Button>
              )}
            />
          ) : (
            <>
              <BarList
                items={wheel.segments.map((s) => ({
                  label: s.label,
                  value: total ? Math.round((s.weight / total) * 1000) / 10 : 0,
                  token: tokenFor(s.rewardType),
                }))}
                format={(v) => `${v}%`}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
                {wheel.segments.map((sg) => (
                  <div
                    key={sg.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      padding: '7px 10px', borderRadius: 'var(--r-ctrl)',
                      border: '1px solid var(--line-soft)',
                    }}
                  >
                    <span style={{ flex: 1, fontSize: 12, minWidth: 0 }}>{sg.label}</span>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      weight {sg.weight}
                    </span>
                    <WriteGate>
                      <Button
                        variant="destructive"
                        onClick={() => deleteSegment(wheel.id, sg.id)}
                      >
                        Remove
                      </Button>
                    </WriteGate>
                  </div>
                ))}
              </div>
              <p style={{ margin: '11px 0 0', fontSize: 11.5, color: 'var(--text-3)' }}>
                Percentages are each weight over {total}.
              </p>
            </>
          )}
        </Card>

        <Card title={wheel.name}>
          <Wheel wheel={wheel} />
        </Card>
      </div>

      <div style={{ marginTop: 14 }}>
        <Card title="Recent spins">
          <Results wheelId={wheel.id} />
        </Card>
      </div>

      {newWheel && (
        <Modal
          title="New spin wheel"
          onClose={() => { setNewWheel(false); setWheelName(''); setNameError(''); }}
          width={430}
          footer={(
            <>
              <FooterSpacer />
              <Button
                variant="outline"
                onClick={() => { setNewWheel(false); setWheelName(''); setNameError(''); }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  if (!wheelName.trim()) {
                    setNameError('Give the wheel a name the team will recognise');
                    return;
                  }
                  createSpinWheel(wheelName.trim());
                  setNewWheel(false);
                  setWheelName('');
                  setNameError('');
                }}
              >
                Create wheel
              </Button>
            </>
          )}
        >
          <Field
            label="Name"
            value={wheelName}
            onChange={(v) => { setWheelName(v); setNameError(''); }}
            placeholder="Weekend wheel"
          />
          <p style={{ margin: '9px 0 0', fontSize: 11.5, color: 'var(--text-2)' }}>
            It starts switched off with no slices. Add slices, then switch it on.
          </p>
          {nameError && (
            <p style={{ margin: '9px 0 0', fontSize: 12, color: 'var(--stop)' }}>{nameError}</p>
          )}
        </Modal>
      )}

      {addingSlice && (
        <SegmentForm
          onSave={(segment) => { addSegment(wheel.id, segment); setAddingSlice(false); }}
          onClose={() => setAddingSlice(false)}
        />
      )}

      {removingWheel && (
        <Modal
          title="Delete this wheel"
          subtitle={removingWheel.name}
          onClose={() => setRemovingWheel(null)}
          width={440}
          footer={(
            <>
              <FooterSpacer />
              <Button variant="outline" onClick={() => setRemovingWheel(null)}>Keep it</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteSpinWheel(removingWheel.id);
                  if (selectedId === removingWheel.id) setSelectedId(null);
                  setRemovingWheel(null);
                }}
              >
                Delete wheel
              </Button>
            </>
          )}
        >
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-2)' }}>
            Every slice goes with it, and the record of what people won on it may
            go too. Switching it off stops customers spinning without destroying
            anything.
          </p>
        </Modal>
      )}
    </>
  );
}
