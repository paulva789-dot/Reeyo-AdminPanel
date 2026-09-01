import Pill from '../ui/Pill';
import { money } from '../../lib/format';
import { partyWords, mapsUrl } from './orderVocabulary';
import type { Order, Party, BasketLine } from '../../data/types';

/* ---------------------------------------------------------------------- */
/* Shared furniture                                                        */
/* ---------------------------------------------------------------------- */

export function Block({ title, action, children }: {
  title: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 18 }}>
      <div
        style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          gap: 10, marginBottom: 9,
        }}
      >
        <div className="eyebrow">{title}</div>
        {action}
      </div>
      <div
        style={{
          background: 'var(--card)', border: '1px solid var(--line)',
          borderRadius: 'var(--r-card)', padding: '10px 14px',
        }}
      >
        {children}
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        gap: 12, padding: '6px 0',
      }}
    >
      <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{label}</span>
      <span style={{ fontSize: 12.5, color: 'var(--text)', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

const Divider = () => (
  <div style={{ height: 1, background: 'var(--line-soft)', margin: '5px 0' }} />
);

/* ---------------------------------------------------------------------- */
/* §3.3 Basket — in full, not a count and not behind a link                */
/* ---------------------------------------------------------------------- */

function Line({ line }: { line: BasketLine }) {
  const optionTotal = line.options.reduce((sum, o) => sum + o.price, 0);
  const lineTotal = line.quantity * line.unitPrice + optionTotal;

  return (
    <div style={{ padding: '9px 0', borderBottom: '1px solid var(--line-soft)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {line.imageUrl && (
          <img
            src={line.imageUrl}
            alt=""
            style={{ width: 34, height: 34, borderRadius: 7, objectFit: 'cover', flexShrink: 0 }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600 }}>
            <span className="mono" style={{ color: 'var(--text-3)' }}>{line.quantity}×</span>
            {' '}{line.name}
          </div>
          {line.options.map((option) => (
            <div
              key={option.label}
              style={{
                display: 'flex', justifyContent: 'space-between', gap: 10,
                fontSize: 11.5, color: 'var(--text-2)', marginTop: 3,
              }}
            >
              <span>+ {option.label}</span>
              <span className="mono">{money(option.price)}</span>
            </div>
          ))}
          {line.note && (
            <div style={{ fontSize: 11.5, color: 'var(--watch)', marginTop: 4 }}>
              “{line.note}”
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div className="mono" style={{ fontSize: 12.5 }}>{money(lineTotal)}</div>
          {line.quantity > 1 && (
            <div className="mono" style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2 }}>
              {money(line.unitPrice)} each
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function BasketBlock({ order }: { order: Order }) {
  const subtotal = order.basket.reduce(
    (sum, l) => sum + l.quantity * l.unitPrice + l.options.reduce((o, x) => o + x.price, 0),
    0,
  );

  return (
    <Block title="Basket">
      {order.basket.length === 0 ? (
        <p style={{ margin: '4px 0', fontSize: 12.5, color: 'var(--text-2)' }}>
          {order.items || 'No line items were recorded for this order.'}
        </p>
      ) : (
        order.basket.map((line) => <Line key={line.id} line={line} />)
      )}

      <div style={{ paddingTop: 8 }}>
        <Row label="Subtotal" value={<span className="mono">{money(subtotal)}</span>} />
        {order.packagingFee > 0 && (
          <Row label="Packaging fee" value={<span className="mono">{money(order.packagingFee)}</span>} />
        )}
        <Row
          label={`Delivery fee · ${order.distanceKm} km`}
          value={<span className="mono">{money(order.deliveryFee)}</span>}
        />
        {order.surcharges.map((surcharge) => (
          <Row
            key={surcharge.label}
            label={surcharge.label}
            value={<span className="mono">{money(surcharge.amount)}</span>}
          />
        ))}
        {order.discount && (
          <Row
            label={`${order.discount.campaign} · ${order.discount.code}`}
            value={(
              <span className="mono" style={{ color: 'var(--go)' }}>
                −{money(order.discount.amount)}
              </span>
            )}
          />
        )}
        <Divider />
        <Row
          label="Grand total"
          value={(
            <span className="mono" style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--forest)' }}>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>FCFA </span>
              {money(order.total)}
            </span>
          )}
        />
        <Divider />
        <Row
          label="Reeyo commission"
          value={(
            <span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>
              {money(order.commission)}
            </span>
          )}
        />
        <Row
          label="Payment"
          value={(
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 12.5 }}>{order.payment}</span>
              <Pill status={order.paymentStatus.toLowerCase()} />
            </span>
          )}
        />
        {order.paymentReference && (
          <Row
            label="Reference"
            value={<span className="mono" style={{ fontSize: 12 }}>{order.paymentReference}</span>}
          />
        )}
      </div>

      {order.orderNote && (
        <div
          style={{
            marginTop: 10, padding: '9px 11px', borderRadius: 'var(--r-ctrl)',
            background: 'var(--watch-soft)', fontSize: 12, color: 'var(--watch)',
          }}
        >
          {order.orderNote}
        </div>
      )}
    </Block>
  );
}

/* ---------------------------------------------------------------------- */
/* §3.4 Both parties, facing each other                                     */
/* ---------------------------------------------------------------------- */

function Phone({ number }: { number: string }) {
  if (!number) return <span style={{ color: 'var(--text-3)' }}>Not recorded</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
      <a
        href={`tel:${number.replace(/\s/g, '')}`}
        className="mono"
        style={{ fontSize: 12, color: 'var(--emerald-ink)', fontWeight: 600 }}
      >
        {number}
      </a>
      <button
        onClick={() => { void navigator.clipboard?.writeText(number); }}
        aria-label={`Copy ${number}`}
        title="Copy"
        style={{
          border: '1px solid var(--line)', background: 'var(--card)',
          borderRadius: 6, width: 20, height: 18, cursor: 'pointer',
          color: 'var(--text-3)', fontSize: 9, lineHeight: 1, padding: 0,
        }}
      >
        ⧉
      </button>
    </span>
  );
}

function PartyPanel({ role, party, extra }: {
  role: string; party: Party; extra?: React.ReactNode;
}) {
  return (
    <div
      style={{
        flex: 1, minWidth: 0,
        background: 'var(--card)', border: '1px solid var(--line)',
        borderRadius: 'var(--r-card)', padding: '12px 14px',
      }}
    >
      <div className="eyebrow" style={{ marginBottom: 8 }}>{role}</div>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--forest)' }}>{party.name}</div>
      <div style={{ marginTop: 7 }}><Phone number={party.phone} /></div>

      <div style={{ marginTop: 9, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
        {party.address || <span style={{ color: 'var(--text-3)' }}>Address not recorded</span>}
        {party.addressNote && (
          <div style={{ color: 'var(--text-3)', marginTop: 3 }}>{party.addressNote}</div>
        )}
      </div>

      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8, marginTop: 9,
          flexWrap: 'wrap',
        }}
      >
        <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>
          {party.zone} · {party.city}
        </span>
        <div style={{ flex: 1 }} />
        {party.address && (
          <a
            href={mapsUrl(party.lat, party.lng, party.address)}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 11.5, color: 'var(--emerald-ink)', fontWeight: 600 }}
          >
            Open in Google Maps
          </a>
        )}
      </div>

      {extra}
    </div>
  );
}

export function PartiesBlock({ order }: { order: Order }) {
  const words = partyWords(order);
  const parcel = order.parcel;
  const collector = parcel?.recipientName;

  return (
    <section style={{ marginBottom: 18 }}>
      <div className="eyebrow" style={{ marginBottom: 9 }}>Both parties</div>
      <div className="reeyo-parties" style={{ display: 'flex', gap: 12 }}>
        <PartyPanel role={words.from} party={order.from} />
        <PartyPanel
          role={words.to}
          party={order.to}
          extra={collector ? (
            <div
              style={{
                marginTop: 11, paddingTop: 10, borderTop: '1px solid var(--line-soft)',
              }}
            >
              <div className="eyebrow" style={{ marginBottom: 5 }}>
                {words.recipient} · collecting
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>{collector}</div>
              {parcel?.recipientPhone && (
                <div style={{ marginTop: 5 }}><Phone number={parcel.recipientPhone} /></div>
              )}
            </div>
          ) : undefined}
        />
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------- */
/* §3.6 Pickup and drop-off                                                 */
/* ---------------------------------------------------------------------- */

/** One end of the route. Defined here rather than inside RouteBlock: a
 *  component created during render is a new type every time, so React unmounts
 *  and remounts it on each keystroke elsewhere on the screen. */
function Stop({ label, party, index }: { label: string; party: Party; index: number }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span
        className="mono"
        style={{
          width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
          background: index === 1 ? 'var(--forest)' : 'var(--emerald)',
          color: 'var(--on-brand)', fontSize: 10, fontWeight: 700,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {index}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="eyebrow" style={{ marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{party.name}</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 2 }}>
          {party.address || 'Address not recorded'}
        </div>
        {party.addressNote && (
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>
            {party.addressNote}
          </div>
        )}
        {party.phone && <div style={{ marginTop: 5 }}><Phone number={party.phone} /></div>}
      </div>
    </div>
  );
}

export function RouteBlock({ order }: { order: Order }) {
  const words = partyWords(order);

  return (
    <Block
      title="Route"
      action={(
        <span className="mono" style={{ fontSize: 11.5, color: 'var(--forest)', fontWeight: 700 }}>
          {order.distanceKm} km
        </span>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Stop label={`Pickup · ${words.from}`} party={order.from} index={1} />
        <div
          aria-hidden="true"
          style={{
            marginLeft: 9, width: 2, height: 16,
            background: 'var(--line)', borderRadius: 1,
          }}
        />
        <Stop label={`Drop-off · ${words.to}`} party={order.to} index={2} />
      </div>
    </Block>
  );
}

/* ---------------------------------------------------------------------- */
/* §3.8 Parcel cargo                                                        */
/* ---------------------------------------------------------------------- */

export function ParcelBlock({ order }: { order: Order }) {
  const parcel = order.parcel;
  if (!parcel) return null;

  return (
    <Block
      title="Parcel"
      action={parcel.fragile ? <Pill status="fragile" token="watch" /> : undefined}
    >
      <Row label="Contents" value={parcel.description} />
      <Row
        label="Declared value"
        value={<span className="mono">{money(parcel.declaredValue)}</span>}
      />
      <Row
        label="Size"
        value={parcel.weightKg !== null
          ? `${parcel.sizeBand} · ${parcel.weightKg} kg`
          : parcel.sizeBand}
      />
      {parcel.signedBy && (
        <>
          <Divider />
          <Row
            label="Proof of delivery"
            value={<span style={{ color: 'var(--go)' }}>Signed by {parcel.signedBy}</span>}
          />
        </>
      )}
    </Block>
  );
}
