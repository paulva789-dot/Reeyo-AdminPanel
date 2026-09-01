import { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Pill from '../../components/ui/Pill';
import Toggle from '../../components/ui/Toggle';
import Segments from '../../components/ui/Segments';
import Field, { Select } from '../../components/ui/Field';
import EmptyState from '../../components/ui/EmptyState';
import ZonePicker from '../../components/ui/ZonePicker';
import BarList from '../../components/charts/BarList';
import { money } from '../../lib/format';
import { spinCampaigns as seed } from '../../data/campaignSeed';
import {
  CAMPAIGN_TOKENS, probabilityTotal, describeZones,
} from '../../data/campaignTypes';
import type {
  SpinCampaign, WheelSegment, PrizeType, Eligibility,
} from '../../data/campaignTypes';

const PRIZE_TYPES: PrizeType[] = [
  'Discount', 'Free delivery', 'Wallet credit', 'Item', 'No win',
];

const ELIGIBILITY: Eligibility[] = [
  'All customers', 'New customers only', 'Minimum order count',
];

/** The wheel itself, sized by the configured odds — §7.4's live preview. */
function Wheel({ segments, size = 240 }: { segments: WheelSegment[]; size?: number }) {
  const total = segments.reduce((sum, s) => sum + s.probability, 0);
  const r = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;

  if (segments.length === 0 || total <= 0) {
    return (
      <EmptyState
        heading="Nothing to spin"
        line="A wheel with no weighted segments can never pick a prize."
      />
    );
  }

  const slices = segments.reduce<{ seg: WheelSegment; from: number; sweep: number }[]>(
    (acc, seg) => {
      const sweep = (seg.probability / total) * Math.PI * 2;
      const from = acc.length ? acc[acc.length - 1].from + acc[acc.length - 1].sweep : -Math.PI / 2;
      return [...acc, { seg, from, sweep }];
    },
    [],
  );

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <svg
        width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={segments
          .map((s) => `${s.label} ${Math.round((s.probability / total) * 100)}%`)
          .join(', ')}
      >
        {slices.map(({ seg, from, sweep }) => {
          const to = from + sweep;
          const x1 = cx + r * Math.cos(from);
          const y1 = cy + r * Math.sin(from);
          const x2 = cx + r * Math.cos(to);
          const y2 = cy + r * Math.sin(to);
          const large = sweep > Math.PI ? 1 : 0;
          // The label sits at the middle of the slice, pushed out from the hub.
          const mid = from + sweep / 2;
          const lx = cx + r * 0.62 * Math.cos(mid);
          const ly = cy + r * 0.62 * Math.sin(mid);

          return (
            <g key={seg.id}>
              <path
                d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`}
                fill={`var(--${seg.colourToken})`}
                stroke="var(--card)"
                strokeWidth="2"
              />
              {sweep > 0.35 && (
                <text
                  x={lx} y={ly}
                  textAnchor="middle"
                  style={{
                    fontSize: 9.5, fill: 'var(--on-brand)', fontWeight: 700,
                    fontFamily: 'var(--sans)',
                  }}
                >
                  {Math.round((seg.probability / total) * 100)}%
                </text>
              )}
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r="28" fill="var(--card)" stroke="var(--line)" strokeWidth="2" />
      </svg>
    </div>
  );
}

function SegmentRow({
  segment, onChange, onRemove,
}: {
  segment: WheelSegment;
  onChange: (next: WheelSegment) => void;
  onRemove: () => void;
}) {
  return (
    <div
      style={{
        display: 'grid', gap: 8, alignItems: 'end',
        gridTemplateColumns: '1.4fr 1fr 0.8fr 0.9fr 0.7fr auto',
        padding: '9px 0', borderBottom: '1px solid var(--line-soft)',
      }}
    >
      <Field
        label="Label"
        value={segment.label}
        onChange={(v) => onChange({ ...segment, label: v })}
      />
      <Select
        label="Prize"
        value={segment.prizeType}
        onChange={(v) => onChange({ ...segment, prizeType: v as PrizeType })}
        options={PRIZE_TYPES.map((p) => ({ value: p, label: p }))}
      />
      <Field
        label="Value"
        value={String(segment.value)}
        onChange={(v) => onChange({ ...segment, value: Number(v) || 0 })}
        mono
      />
      <Select
        label="Colour"
        value={segment.colourToken}
        onChange={(v) => onChange({ ...segment, colourToken: v })}
        options={CAMPAIGN_TOKENS.map((t) => ({ value: t, label: t }))}
      />
      <Field
        label="Odds %"
        value={String(segment.probability)}
        onChange={(v) => onChange({ ...segment, probability: Number(v) || 0 })}
        mono
      />
      <Button variant="destructive" onClick={onRemove}>Remove</Button>
    </div>
  );
}

let segSeq = 0;

/** The spin wheel campaign builder — specification §7.4. */
export default function SpinWheelBuilder() {
  const [campaigns, setCampaigns] = useState<SpinCampaign[]>(seed);
  const [activeId, setActiveId] = useState(seed[0]?.id ?? '');
  const [tab, setTab] = useState('build');

  const campaign = campaigns.find((c) => c.id === activeId) ?? campaigns[0];

  const update = (next: Partial<SpinCampaign>) => {
    setCampaigns((prev) => prev.map((c) => (c.id === campaign.id ? { ...c, ...next } : c)));
  };

  if (!campaign) {
    return (
      <Card>
        <EmptyState heading="No wheels" line="Nothing has been built yet." />
      </Card>
    );
  }

  const total = probabilityTotal(campaign.segments);
  const balanced = total === 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Segments
        ariaLabel="Choose a wheel"
        value={campaign.id}
        onChange={setActiveId}
        segments={campaigns.map((c) => ({
          value: c.id,
          label: c.active ? c.name : `${c.name} (off)`,
        }))}
      />

      <div style={{ marginBottom: -4 }}>
        <Segments
          ariaLabel="Wheel view"
          value={tab}
          onChange={setTab}
          segments={[
            { value: 'build', label: 'Segments' },
            { value: 'rules', label: 'Limits and eligibility' },
            { value: 'report', label: 'Reporting' },
          ]}
        />
      </div>

      <div className="reeyo-split">
        <Card
          title={tab === 'report' ? 'Results' : 'Wheel'}
          action={(
            <Toggle
              checked={campaign.active}
              onChange={(next) => {
                if (next && !balanced) return;
                update({ active: next });
              }}
              label={`${campaign.name} live`}
            />
          )}
        >
          {tab === 'build' && (
            <>
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
                  padding: '9px 12px', borderRadius: 'var(--r-ctrl)',
                  background: balanced ? 'var(--go-soft)' : 'var(--watch-soft)',
                }}
              >
                <span
                  style={{
                    flex: 1, fontSize: 12.5,
                    color: balanced ? 'var(--go)' : 'var(--watch)',
                  }}
                >
                  {balanced
                    ? 'The odds total 100% and the wheel can go live.'
                    : `The odds total ${total}%. A wheel cannot go live until they make 100%.`}
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: 15, fontWeight: 700,
                    color: balanced ? 'var(--go)' : 'var(--watch)',
                  }}
                >
                  {total}%
                </span>
              </div>
              <Wheel segments={campaign.segments} />
            </>
          )}

          {tab === 'rules' && <Wheel segments={campaign.segments} />}

          {tab === 'report' && (
            campaign.spins === 0 ? (
              <EmptyState
                heading="Nobody has spun yet"
                line="Results appear once the campaign is live and customers start spinning."
              />
            ) : (
              <BarList
                items={campaign.segments.map((s) => ({
                  label: s.label,
                  value: campaign.winsBySegment[s.id] ?? 0,
                  token: s.colourToken,
                }))}
              />
            )
          )}
        </Card>

        <Card title={tab === 'report' ? 'Campaign cost' : 'Setup'}>
          {tab === 'build' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field
                label="Campaign name"
                value={campaign.name}
                onChange={(v) => update({ name: v })}
              />
              <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
                <Field
                  label="Starts"
                  value={campaign.startsOn ?? ''}
                  onChange={(v) => update({ startsOn: v || null })}
                  type="date"
                  mono
                />
                <Field
                  label="Ends"
                  value={campaign.endsOn ?? ''}
                  onChange={(v) => update({ endsOn: v || null })}
                  type="date"
                  mono
                />
              </div>
              <ZonePicker
                label="Zones"
                value={campaign.zones}
                onChange={(zones) => update({ zones })}
              />
            </div>
          )}

          {tab === 'rules' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
                <Field
                  label="Max spins per user"
                  value={String(campaign.maxSpinsPerUser)}
                  onChange={(v) => update({ maxSpinsPerUser: Number(v) || 0 })}
                  mono
                />
                <Field
                  label="Max spins per day"
                  value={String(campaign.maxSpinsPerDay)}
                  onChange={(v) => update({ maxSpinsPerDay: Number(v) || 0 })}
                  mono
                />
              </div>
              <Field
                label="Total prizes available"
                value={String(campaign.totalPrizes)}
                onChange={(v) => update({ totalPrizes: Number(v) || 0 })}
                mono
              />
              <Select
                label="Who can spin"
                value={campaign.eligibility}
                onChange={(v) => update({ eligibility: v as Eligibility })}
                options={ELIGIBILITY.map((e) => ({ value: e, label: e }))}
              />
              {campaign.eligibility === 'Minimum order count' && (
                <Field
                  label="Minimum orders"
                  value={String(campaign.minimumOrders)}
                  onChange={(v) => update({ minimumOrders: Number(v) || 0 })}
                  mono
                />
              )}
              <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-3)' }}>
                A win drops into the customer wallet or applies as a voucher
                automatically — there is no step where somebody has to hand it out.
              </p>
            </div>
          )}

          {tab === 'report' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                ['Spins', String(campaign.spins)],
                ['Prizes redeemed', String(campaign.prizesRedeemed)],
                ['Cost so far', money(campaign.cost)],
                ['Prizes left', String(Math.max(0, campaign.totalPrizes - campaign.prizesRedeemed))],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: 'flex', alignItems: 'baseline',
                    justifyContent: 'space-between', gap: 12,
                  }}
                >
                  <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{label}</span>
                  <span
                    className="mono"
                    style={{ fontSize: 14, fontWeight: 700, color: 'var(--forest)' }}
                  >
                    {value}
                  </span>
                </div>
              ))}
              <div style={{ marginTop: 4 }}>
                <Pill status={describeZones(campaign.zones)} token="calm" />
              </div>
            </div>
          )}
        </Card>
      </div>

      {tab === 'build' && (
        <Card
          title="Segments"
          action={(
            <Button
              variant="primary"
              onClick={() => update({
                segments: [...campaign.segments, {
                  id: `WS-new-${++segSeq}`,
                  label: 'New prize',
                  prizeType: 'Discount',
                  value: 500,
                  colourToken: 'calm',
                  probability: 0,
                }],
              })}
            >
              Add segment
            </Button>
          )}
        >
          {campaign.segments.length === 0 ? (
            <EmptyState
              heading="No segments"
              line="Add at least two, or there is nothing to win and nothing to lose."
            />
          ) : (
            campaign.segments.map((segment) => (
              <SegmentRow
                key={segment.id}
                segment={segment}
                onChange={(next) => update({
                  segments: campaign.segments.map((s) => (s.id === next.id ? next : s)),
                })}
                onRemove={() => update({
                  segments: campaign.segments.filter((s) => s.id !== segment.id),
                })}
              />
            ))
          )}

          <p style={{ margin: '12px 0 0', fontSize: 11.5, color: 'var(--text-3)' }}>
            Odds are entered as percentages and have to total exactly 100 before
            the wheel can be switched on. The running total is shown above the
            wheel as segments are edited.
          </p>
        </Card>
      )}
    </div>
  );
}
