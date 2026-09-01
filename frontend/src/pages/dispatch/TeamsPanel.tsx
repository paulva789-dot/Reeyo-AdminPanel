import { useState, useMemo } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Pill from '../../components/ui/Pill';
import Field, { Select } from '../../components/ui/Field';
import EmptyState from '../../components/ui/EmptyState';
import { Modal, FooterSpacer } from '../../components/ui/Overlay';
import NoEndpoint from '../../components/ui/NoEndpoint';
import { useAppState } from '../../state/useAppState';
import { teams as seedTeams } from '../../data/seed';
import { ALL_REGIONS, regionOfZone, cityOfZone } from '../../data/geography';
import type { Team, Rider } from '../../data/types';

/**
 * Teams — specification §5.2.
 *
 * A team sits in exactly one zone and its riders move with it. Members are
 * added by ticking several at once, because adding eight riders one at a time
 * is the kind of task that makes an operator keep the roster in a notebook
 * instead.
 */
function TeamForm({
  initial, riders, zones, onSave, onClose,
}: {
  initial: Team | null;
  riders: Rider[];
  zones: string[];
  onSave: (team: Team, members: string[]) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [zone, setZone] = useState(initial?.zone ?? zones[0] ?? '');
  const [lead, setLead] = useState(initial?.lead ?? '');
  const [shift, setShift] = useState(initial?.shift ?? '08:00 – 17:00');
  const [picked, setPicked] = useState<string[]>(
    () => riders.filter((r) => r.zone === initial?.zone).map((r) => r.id),
  );
  const [error, setError] = useState('');

  const toggle = (id: string) => {
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setError('');
  };

  const submit = () => {
    if (!name.trim()) { setError('Give the team a name'); return; }
    if (!zone) { setError('A team has to sit in a zone'); return; }
    if (!lead.trim()) { setError('Name the team lead — someone has to answer for it'); return; }

    const region = regionOfZone(zone);
    const city = cityOfZone(zone);
    if (!region || !city) { setError('That zone is not in the geography table'); return; }

    onSave({
      id: initial?.id ?? `T-${Date.now()}`,
      name: name.trim(),
      lead: lead.trim(),
      size: picked.length,
      zone, city, region,
      shift,
      load: initial?.load ?? 0,
    }, picked);
  };

  return (
    <Modal
      title={initial ? 'Edit team' : 'Create team'}
      onClose={onClose}
      width={540}
      footer={(
        <>
          <FooterSpacer />
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>
            {initial ? 'Save team' : 'Create team'}
          </Button>
        </>
      )}
    >
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
        <Field
          label="Team name"
          value={name}
          onChange={(v) => { setName(v); setError(''); }}
          placeholder="Molyko Alpha"
        />
        <Select
          label="Zone"
          value={zone}
          onChange={(v) => { setZone(v); setError(''); }}
          options={zones.map((z) => ({ value: z, label: z }))}
        />
        <Field
          label="Team lead"
          value={lead}
          onChange={(v) => { setLead(v); setError(''); }}
          placeholder="Paul Ekema"
        />
        <Field label="Shift" value={shift} onChange={setShift} mono />
      </div>

      <div
        style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          margin: '16px 0 8px', gap: 10,
        }}
      >
        <div className="eyebrow">Members</div>
        <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>
          {picked.length} selected
        </span>
      </div>

      <div
        style={{
          maxHeight: 220, overflowY: 'auto',
          border: '1px solid var(--line)', borderRadius: 'var(--r-ctrl)',
        }}
      >
        {riders.length === 0 ? (
          <p style={{ margin: 0, padding: 14, fontSize: 12.5, color: 'var(--text-2)' }}>
            There are no riders to add yet.
          </p>
        ) : riders.map((rider, i) => (
          <label
            key={rider.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
              borderTop: i === 0 ? 'none' : '1px solid var(--line-soft)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={picked.includes(rider.id)}
              onChange={() => toggle(rider.id)}
              style={{ accentColor: 'var(--emerald)' }}
            />
            <span style={{ flex: 1, fontSize: 12.5 }}>{rider.name}</span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>
              {rider.zone}
            </span>
            <Pill status={rider.state} />
          </label>
        ))}
      </div>

      <p style={{ margin: '10px 0 0', fontSize: 11.5, color: 'var(--text-3)' }}>
        Riders added here take the team&rsquo;s zone. Moving the team to another
        zone later moves all of them with it.
      </p>

      {error && (
        <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--stop)' }}>{error}</p>
      )}
    </Modal>
  );
}

export default function TeamsPanel() {
  const { riders, region, pushToast } = useAppState();
  const [teams, setTeams] = useState<Team[]>(seedTeams);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [removing, setRemoving] = useState<Team | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const zones = useMemo(() => [...new Set(riders.map((r) => r.zone))].sort(), [riders]);
  const inScope = region === ALL_REGIONS ? teams : teams.filter((t) => t.region === region);

  const save = (team: Team, members: string[]) => {
    setTeams((prev) => {
      const exists = prev.some((t) => t.id === team.id);
      return exists ? prev.map((t) => (t.id === team.id ? team : t)) : [...prev, team];
    });
    pushToast(`${team.name} saved with ${members.length} rider${members.length === 1 ? '' : 's'}`);
    setCreating(false);
    setEditing(null);
  };

  const allSelected = inScope.length > 0 && selected.length === inScope.length;

  return (
    <NoEndpoint
      what="Delivery teams"
      consequence="Riders cannot be grouped into teams or given a shift from here."
    >
      <Card
        title="Delivery teams"
        action={(
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {selected.length > 0 && (
              <>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                  {selected.length} selected
                </span>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setTeams((prev) => prev.filter((t) => !selected.includes(t.id)));
                    pushToast(`${selected.length} teams removed`);
                    setSelected([]);
                  }}
                >
                  Delete
                </Button>
              </>
            )}
            <Button variant="primary" onClick={() => setCreating(true)}>Create team</Button>
          </div>
        )}
      >
        {inScope.length === 0 ? (
          <EmptyState
            heading="No teams here"
            line="Riders in this region are not grouped, so there is no shift or lead to see."
          />
        ) : (
          <>
            <label
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0 10px',
                borderBottom: '1px solid var(--line-soft)', cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => setSelected(allSelected ? [] : inScope.map((t) => t.id))}
                style={{ accentColor: 'var(--emerald)' }}
              />
              <span className="eyebrow">Select all</span>
            </label>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {inScope.map((team) => (
                <div
                  key={team.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0',
                    borderBottom: '1px solid var(--line-soft)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(team.id)}
                    onChange={() => setSelected((prev) => (prev.includes(team.id)
                      ? prev.filter((x) => x !== team.id)
                      : [...prev, team.id]))}
                    aria-label={`Select ${team.name}`}
                    style={{ accentColor: 'var(--emerald)' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{team.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                      {team.lead} · {team.zone} · {team.city}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="mono" style={{ fontSize: 12, color: 'var(--forest)' }}>
                      {team.size}
                    </div>
                    <div className="eyebrow">riders</div>
                  </div>
                  <span className="mono" style={{ fontSize: 11.5, color: 'var(--text-2)', width: 96 }}>
                    {team.shift}
                  </span>
                  <Button variant="soft" onClick={() => setEditing(team)}>Edit</Button>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {(creating || editing) && (
        <TeamForm
          initial={editing}
          riders={riders}
          zones={zones}
          onSave={save}
          onClose={() => { setCreating(false); setEditing(null); }}
        />
      )}

      {removing && (
        <Modal
          title="Delete this team"
          subtitle={removing.name}
          onClose={() => setRemoving(null)}
          width={430}
          footer={(
            <>
              <FooterSpacer />
              <Button variant="outline" onClick={() => setRemoving(null)}>Keep it</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setTeams((prev) => prev.filter((t) => t.id !== removing.id));
                  setRemoving(null);
                }}
              >
                Delete team
              </Button>
            </>
          )}
        >
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-2)' }}>
            Its riders keep their zone but lose their team and their shift.
          </p>
        </Modal>
      )}
    </NoEndpoint>
  );
}
