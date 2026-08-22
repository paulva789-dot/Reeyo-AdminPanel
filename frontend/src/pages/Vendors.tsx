import { useState, useMemo } from 'react';
import PageTitle from '../components/layout/PageTitle';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Pill from '../components/ui/Pill';
import Toggle from '../components/ui/Toggle';
import Segments from '../components/ui/Segments';
import MetricTile, { MetricRow } from '../components/ui/MetricTile';
import DataTable, { TableToolbar } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { FilterInput } from '../components/ui/Field';
import EmptyState from '../components/ui/EmptyState';
import { Drawer, Modal, FooterSpacer } from '../components/ui/Overlay';
import { useAppState } from '../state/AppState';
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

function MenuModal({ vendor, onClose }: { vendor: Vendor; onClose: () => void }) {
  const [categories, setCategories] = useState<MenuCategory[]>(menus[vendor.id] ?? []);
  const { pushToast } = useAppState();

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

  return (
    <Modal
      title={`${vendor.name} menu`}
      subtitle={`${vendor.category} · ${vendor.zone}`}
      onClose={onClose}
      footer={(
        <>
          <FooterSpacer />
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button
            variant="primary"
            onClick={() => { pushToast(`${vendor.name} menu saved`); onClose(); }}
          >
            Save menu
          </Button>
        </>
      )}
    >
      {categories.length === 0 ? (
        <EmptyState
          heading="This vendor has not published a menu"
          line={`${vendor.name} cannot receive orders until at least one category with one available item exists.`}
          action={<Button variant="primary">Add first category</Button>}
        />
      ) : (
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
      )}
    </Modal>
  );
}

function VendorDrawer({ vendor, onClose }: { vendor: Vendor; onClose: () => void }) {
  const { pushToast } = useAppState();

  return (
    <Drawer
      title={vendor.name}
      subtitle={`${vendor.category} · ${vendor.zone} · joined ${vendor.joined}`}
      onClose={onClose}
      footer={(
        <>
          <Button
            variant="destructive"
            onClick={() => { pushToast(`${vendor.name} suspended`); onClose(); }}
          >
            Suspend
          </Button>
          <FooterSpacer />
          <Button
            variant="primary"
            onClick={() => { pushToast(`FCFA ${money(vendor.revenue)} released to ${vendor.name}`); onClose(); }}
          >
            Release payout
          </Button>
        </>
      )}
    >
      <div style={{ marginBottom: 16 }}>
        <Pill status={vendor.status} />
      </div>

      <MetricRow>
        <MetricTile label="Orders" value={String(vendor.orders)} />
        <MetricTile label="Revenue" value={money(vendor.revenue)} prefix="FCFA" />
      </MetricRow>

      <div style={{ marginTop: 18 }}>
        <div className="eyebrow" style={{ marginBottom: 9 }}>Performance</div>
        <div
          style={{
            background: 'var(--card)', border: '1px solid var(--line)',
            borderRadius: 'var(--r-card)', padding: '10px 14px',
          }}
        >
          {[
            ['Rating', `${vendor.rating} out of 5`],
            ['Average prep time', `${vendor.prepMinutes} min`],
            ['Service', vendor.vertical],
          ].map(([k, v]) => (
            <div
              key={k}
              style={{
                display: 'flex', justifyContent: 'space-between',
                gap: 12, padding: '7px 0',
              }}
            >
              <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{k}</span>
              <span style={{ fontSize: 12.5, textTransform: 'capitalize' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <div className="eyebrow" style={{ marginBottom: 9 }}>Account</div>
        <div
          style={{
            background: 'var(--card)', border: '1px solid var(--line)',
            borderRadius: 'var(--r-card)', padding: '10px 14px',
          }}
        >
          {[
            ['Vendor ID', vendor.id],
            ['Joined', vendor.joined],
            ['Zone', vendor.zone],
          ].map(([k, v]) => (
            <div
              key={k}
              style={{
                display: 'flex', justifyContent: 'space-between',
                gap: 12, padding: '7px 0',
              }}
            >
              <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{k}</span>
              <span className="mono" style={{ fontSize: 12 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </Drawer>
  );
}

export default function Vendors() {
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
      header: 'Vendor',
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
    { key: 'zone', header: 'Zone', render: (v) => v.zone },
    {
      key: 'joined', header: 'Joined',
      render: (v) => <span className="mono" style={{ fontSize: 12 }}>{v.joined}</span>,
    },
    {
      key: 'orders', header: 'Orders', align: 'right',
      render: (v) => <span className="mono" style={{ fontSize: 12 }}>{v.orders}</span>,
    },
    {
      key: 'revenue', header: 'Revenue', align: 'right',
      render: (v) => <span className="mono" style={{ fontSize: 12 }}>{money(v.revenue)}</span>,
    },
    {
      key: 'prep', header: 'Prep', align: 'right',
      render: (v) => <span className="mono" style={{ fontSize: 12 }}>{v.prepMinutes}m</span>,
    },
    {
      key: 'rating', header: 'Rating', align: 'right',
      render: (v) => (
        <span
          className="mono"
          style={{ fontSize: 12, color: v.rating < 4.2 ? 'var(--stop)' : 'var(--text-2)' }}
        >
          {v.rating}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (v) => <Pill status={v.status} /> },
    {
      key: 'actions', header: '', align: 'right',
      render: (v) => (
        <div style={{ display: 'inline-flex', gap: 6 }}>
          <Button variant="soft" onClick={() => setMenuFor(v)}>Menu</Button>
          <Button variant="soft" onClick={() => setOpenFor(v)}>Open</Button>
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
            { value: 'all', label: 'All', count: count('all') },
            { value: 'food', label: 'Food', count: count('food') },
            { value: 'grocery', label: 'Grocery', count: count('grocery') },
            { value: 'parcel', label: 'Parcel', count: count('parcel') },
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
      {openFor && <VendorDrawer vendor={openFor} onClose={() => setOpenFor(null)} />}
    </>
  );
}
