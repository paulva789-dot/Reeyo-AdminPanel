import { useState, useMemo, useCallback } from 'react';
import { useT } from '../i18n/useT';
import PageTitle from '../components/layout/PageTitle';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Pill from '../components/ui/Pill';
import Toggle from '../components/ui/Toggle';
import Segments from '../components/ui/Segments';
import DataTable, { TableToolbar } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { FilterInput } from '../components/ui/Field';
import EmptyState from '../components/ui/EmptyState';
import { Modal, FooterSpacer } from '../components/ui/Overlay';
import { useAuth } from '../state/useAuth';
import { useDetail } from '../state/useDetail';
import { platform } from '../services/platformResources';
import { useAppState } from '../state/useAppState';
import { useVendorProfiles } from '../state/useVendorProfiles';
import VendorProfileDrawer from './vendors/VendorProfileDrawer';
import VendorEditModal from './vendors/VendorEditModal';
import { money, initials } from '../lib/format';
import { menus } from '../data/seed';
import type { Vendor, MenuCategory } from '../data/types';

function Avatar({ name, token }: { name: string; token: string }) {
  return (
    <span
      aria-hidden="true"
      className="mono"
      style={{
        width: 30, height: 30, borderRadius: 'var(--r-pill)', flexShrink: 0,
        background: `var(--${token}-soft)`, color: `var(--${token})`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10.5, fontWeight: 600,
      }}
    >
      {initials(name)}
    </span>
  );
}


/**
 * `PATCH /engagement/menu-items/:id/upsell` — SuperAdmin.
 *
 * The menu list does not report whether an item is already an upsell, so this
 * starts off and says what it does rather than showing a state it cannot know.
 */
function UpsellToggle({ itemId, name }: { itemId: string; name: string }) {
  const { isSuperAdmin } = useAuth();
  const { pushToast } = useAppState();
  const [on, setOn] = useState(false);

  if (!isSuperAdmin) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
      <span style={{ fontSize: 10.5, color: 'var(--text-3)' }}>upsell</span>
      <Toggle
        checked={on}
        onChange={(next) => {
          setOn(next);
          pushToast(next ? `${name} set as an upsell` : `${name} no longer an upsell`);
          platform.setMenuItemUpsell(itemId, next).catch(() => {
            setOn(!next);
            pushToast(`${name} did not save`);
          });
        }}
        label={`${name} upsell`}
      />
    </div>
  );
}

/**
 * A vendor's menu.
 *
 * `GET /vendors/:id/menu-items` returns a flat list of items and no write
 * route, so in live mode this reads and does not edit. The seeded view keeps
 * its categories and toggles because sample mode is explicitly a rehearsal —
 * but nothing here claims a change reaches the platform.
 */
function MenuModal({ vendor, onClose }: { vendor: Vendor; onClose: () => void }) {
  const [categories, setCategories] = useState<MenuCategory[]>(menus[vendor.id] ?? []);
  const { isSample } = useAppState();
  const fetcher = useCallback(() => platform.vendorMenuItems(vendor.id), [vendor.id]);
  const live = useDetail(vendor.id, fetcher);

  const toggleCategory = (id: string) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c)));
  };

  const toggleItem = (catId: string, itemId: string) => {
    setCategories((prev) => prev.map((c) => (c.id === catId
      ? {
        ...c,
        items: c.items.map((i) => (i.id === itemId ? { ...i, available: !i.available } : i)),
      }
      : c)));
  };

  const body = () => {
    if (!isSample) {
      if (live.loading) {
        return <EmptyState heading="Loading…" line="Fetching the menu from the platform." />;
      }
      if (live.error) {
        return <EmptyState heading="Could not load the menu" line={live.error} />;
      }
      const items = live.value ?? [];
      if (items.length === 0) {
        return (
          <EmptyState
            heading="No items on this menu"
            line={`${vendor.name} cannot receive orders until at least one available item exists.`}
          />
        );
      }
      return (
        <>
          <div
            style={{
              background: 'var(--card)', border: '1px solid var(--line)',
              borderRadius: 'var(--r-card)', overflow: 'hidden',
            }}
          >
            {items.map((item, i) => (
              <div
                key={item.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                  borderBottom: i === items.length - 1 ? 'none' : '1px solid var(--line-soft)',
                  opacity: item.available ? 1 : 0.65,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5 }}>{item.name}</div>
                  <div
                    style={{
                      display: 'flex', alignItems: 'baseline', gap: 7,
                      marginTop: 3, flexWrap: 'wrap',
                    }}
                  >
                    <span className="mono" style={{ fontSize: 12, color: 'var(--forest)' }}>
                      {money(item.price)}
                    </span>
                    {item.wasPrice && (
                      <span
                        className="mono"
                        style={{
                          fontSize: 11, color: 'var(--text-3)',
                          textDecoration: 'line-through',
                        }}
                      >
                        {money(item.wasPrice)}
                      </span>
                    )}
                    <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      {item.stock} in stock · {item.addOns} add-ons
                    </span>
                  </div>
                </div>
                {item.stock === 0 && <Pill status="out of stock" token="stop" />}
                {!item.available && <Pill status="hidden" token="calm" />}
                {/* The one write the API does offer on a menu item. */}
                <UpsellToggle itemId={item.id} name={item.name} />
              </div>
            ))}
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 11.5, color: 'var(--text-3)' }}>
            Read-only. The admin API serves this menu but exposes no write on it —
            a vendor edits their own, and price changes arrive here as menu
            approvals.
          </p>
        </>
      );
    }

    if (categories.length === 0) {
      return (
        <EmptyState
          heading="This vendor has not published a menu"
          line={`${vendor.name} cannot receive orders until at least one category with one available item exists.`}
        />
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {categories.map((c) => (
            <div
              key={c.id}
              style={{
                background: 'var(--card)', border: '1px solid var(--line)',
                borderRadius: 'var(--r-card)', overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 14px', borderBottom: '1px solid var(--line-soft)',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--forest)' }}>
                    {c.name}
                  </div>
                  <div
                    className="mono"
                    style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}
                  >
                    {c.opens}–{c.closes} · {c.days.join(' ')}
                  </div>
                </div>
                <Toggle
                  checked={c.visible}
                  onChange={() => toggleCategory(c.id)}
                  label={`${c.name} visibility`}
                />
              </div>

              {c.items.map((item, i) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px',
                    borderBottom: i === c.items.length - 1
                      ? 'none' : '1px solid var(--line-soft)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5 }}>{item.name}</div>
                    <div
                      style={{
                        display: 'flex', alignItems: 'baseline', gap: 7,
                        marginTop: 3, flexWrap: 'wrap',
                      }}
                    >
                      <span className="mono" style={{ fontSize: 12, color: 'var(--forest)' }}>
                        {money(item.price)}
                      </span>
                      {item.wasPrice && (
                        <span
                          className="mono"
                          style={{
                            fontSize: 11, color: 'var(--text-3)',
                            textDecoration: 'line-through',
                          }}
                        >
                          {money(item.wasPrice)}
                        </span>
                      )}
                      <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                        {item.stock} in stock · {item.addOns} add-ons
                      </span>
                    </div>
                  </div>
                  {item.stock === 0 && <Pill status="out of stock" token="stop" />}
                  <Toggle
                    checked={item.available}
                    onChange={() => toggleItem(c.id, item.id)}
                    label={`${item.name} availability`}
                  />
                </div>
              ))}
            </div>
          ))}
      </div>
    );
  };

  return (
    <Modal
      title={`${vendor.name} menu`}
      subtitle={`${vendor.category} · ${vendor.zone}`}
      onClose={onClose}
      footer={(
        <>
          <FooterSpacer />
          <Button variant="outline" onClick={onClose}>Close</Button>
        </>
      )}
    >
      {body()}
    </Modal>
  );
}

export default function Vendors() {
  const t = useT();
  const { profiles, save, credit, debit, reverse } = useVendorProfiles();
  const [editing, setEditing] = useState<Vendor | null>(null);
  const { vendors } = useAppState();
  const [vertical, setVertical] = useState('all');
  const [query, setQuery] = useState('');
  const [menuFor, setMenuFor] = useState<Vendor | null>(null);
  const [openFor, setOpenFor] = useState<Vendor | null>(null);

  const rows = useMemo(() => {
    const byVertical = vertical === 'all'
      ? vendors : vendors.filter((v) => v.vertical === vertical);
    const q = query.trim().toLowerCase();
    if (!q) return byVertical;
    return byVertical.filter((v) => [v.name, v.category, v.zone, v.id]
      .join(' ').toLowerCase().includes(q));
  }, [vertical, query, vendors]);

  const columns: Column<Vendor>[] = [
    {
      key: 'name',
      header: t('Vendor'),
      render: (v) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Avatar name={v.name} token={v.vertical} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>{v.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{v.category}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'zone', header: t('Zone'),
      render: (v) => (
        <div>
          <div>{v.zone}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {v.city} · {v.region}
          </div>
        </div>
      ),
    },
    {
      key: 'joined', header: t('Joined'),
      render: (v) => <span className="mono" style={{ fontSize: 12 }}>{v.joined}</span>,
    },
    {
      key: 'orders', header: t('Orders'), align: 'right',
      render: (v) => <span className="mono" style={{ fontSize: 12 }}>{v.orders}</span>,
    },
    {
      key: 'revenue', header: t('Revenue'), align: 'right',
      render: (v) => <span className="mono" style={{ fontSize: 12 }}>{money(v.revenue)}</span>,
    },
    {
      key: 'prep', header: t('Prep'), align: 'right',
      render: (v) => <span className="mono" style={{ fontSize: 12 }}>{v.prepMinutes}m</span>,
    },
    {
      key: 'rating', header: t('Rating'), align: 'right',
      render: (v) => (
        <span
          className="mono"
          style={{ fontSize: 12, color: v.rating < 4.2 ? 'var(--stop)' : 'var(--text-2)' }}
        >
          {v.rating}
        </span>
      ),
    },
    { key: 'status', header: t('Status'), render: (v) => <Pill status={v.status} /> },
    {
      key: 'actions', header: '', align: 'right',
      render: (v) => (
        <div style={{ display: 'inline-flex', gap: 6 }}>
          <Button variant="soft" onClick={() => setMenuFor(v)}>Menu</Button>
          <Button variant="soft" onClick={() => setEditing(v)}>Edit</Button>
          <Button variant="outline" onClick={() => setOpenFor(v)}>Open</Button>
        </div>
      ),
    },
  ];

  const count = (v: string) => (v === 'all'
    ? vendors.length : vendors.filter((x) => x.vertical === v).length);

  return (
    <>
      <PageTitle actions={<Button variant="command">Add vendor</Button>}>Vendors</PageTitle>

      <div style={{ marginBottom: 14 }}>
        <Segments
          ariaLabel="Filter vendors by service"
          value={vertical}
          onChange={setVertical}
          segments={[
            { value: 'all', label: t('All'), count: count('all') },
            { value: 'food', label: t('Food'), count: count('food') },
            { value: 'grocery', label: t('Grocery'), count: count('grocery') },
            { value: 'parcel', label: t('Parcel'), count: count('parcel') },
          ]}
        />
      </div>

      <Card>
        <TableToolbar title="All vendors" count={rows.length}>
          <FilterInput value={query} onChange={setQuery} placeholder="Filter by name or zone" />
        </TableToolbar>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(v) => v.id}
          minWidth={1000}
          empty={{
            heading: 'No vendor matches that filter',
            line: 'Nothing here matches what you typed, so there is nothing to act on.',
            action: <Button variant="primary" onClick={() => setQuery('')}>Clear filter</Button>,
          }}
        />
      </Card>

      {menuFor && <MenuModal vendor={menuFor} onClose={() => setMenuFor(null)} />}
      {editing && (
        <VendorEditModal vendor={editing} onClose={() => setEditing(null)} />
      )}

      {openFor && (() => {
        const profile = profiles.find(
          (p) => p.businessName === openFor.name || p.id === openFor.id,
        );
        if (!profile) return null;
        return (
          <VendorProfileDrawer
            profile={profile}
            onSave={save}
            onCredit={(move) => credit(profile.id, move)}
            onDebit={(move) => debit(profile.id, move)}
            onReverse={(entryId) => reverse(profile.id, entryId)}
            onClose={() => setOpenFor(null)}
          />
        );
      })()}
    </>
  );
}
