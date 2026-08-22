import { NavLink } from 'react-router-dom';
import {
  OverviewIcon, OrdersIcon, DispatchIcon, VendorsIcon, RidersIcon,
  CustomersIcon, StorefrontIcon, MarketingIcon, PaymentsIcon,
  AnalyticsIcon, SettingsIcon, CloseIcon,
} from './icons';
import { initials } from '../../lib/format';

type IconComponent = (props: { size?: number }) => React.ReactElement;

interface NavItem {
  label: string;
  to: string;
  Icon: IconComponent;
  badge?: number;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

interface RailProps {
  openOrders: number;
  pendingPayouts: number;
  mobileOpen: boolean;
  onClose: () => void;
}

const ADMIN = { name: 'Adrian Nkeng', role: 'Platform admin', city: 'Buea' };

export default function Rail({ openOrders, pendingPayouts, mobileOpen, onClose }: RailProps) {
  const nav: NavGroup[] = [
    {
      group: 'Operate',
      items: [
        { label: 'Overview', to: '/', Icon: OverviewIcon },
        { label: 'Orders', to: '/orders', Icon: OrdersIcon, badge: openOrders },
        { label: 'Dispatch', to: '/dispatch', Icon: DispatchIcon },
      ],
    },
    {
      group: 'Supply',
      items: [
        { label: 'Vendors', to: '/vendors', Icon: VendorsIcon },
        { label: 'Riders', to: '/riders', Icon: RidersIcon },
        { label: 'Customers', to: '/customers', Icon: CustomersIcon },
      ],
    },
    {
      group: 'Growth',
      items: [
        { label: 'Storefront', to: '/storefront', Icon: StorefrontIcon },
        { label: 'Marketing', to: '/marketing', Icon: MarketingIcon },
      ],
    },
    {
      group: 'Money',
      items: [
        { label: 'Payments', to: '/payments', Icon: PaymentsIcon, badge: pendingPayouts },
        { label: 'Analytics', to: '/analytics', Icon: AnalyticsIcon },
      ],
    },
    {
      group: 'Configure',
      items: [{ label: 'Settings', to: '/settings', Icon: SettingsIcon }],
    },
  ];

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            background: 'var(--veil)', backdropFilter: 'blur(3px)',
          }}
        />
      )}

      <aside
        style={{
          width: 'var(--rail-w)',
          background: 'linear-gradient(180deg, var(--forest) 0%, var(--forest-900) 100%)',
          display: 'flex', flexDirection: 'column',
          position: 'fixed', insetBlock: 0, left: 0, zIndex: 50,
          transform: mobileOpen ? 'translateX(0)' : undefined,
          transition: 'transform 240ms cubic-bezier(.3,.9,.3,1)',
        }}
        className={`reeyo-rail${mobileOpen ? ' is-open' : ''}`}
      >
        <div
          style={{
            height: 'var(--topbar-h)', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', padding: '0 18px', flexShrink: 0,
          }}
        >
          <span
            style={{
              color: 'var(--on-brand)', fontSize: 19, fontWeight: 800,
              letterSpacing: '-0.03em',
            }}
          >
            reeyo
          </span>
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="reeyo-rail-close"
            style={{
              background: 'none', border: 'none', color: 'var(--on-brand)',
              opacity: 0.7, cursor: 'pointer', padding: 4, display: 'none',
            }}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div style={{ height: 1, background: 'var(--dark-line)', margin: '0 18px 12px' }} />

        <nav style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
          {nav.map(({ group, items }) => (
            <div key={group} style={{ marginBottom: 16 }}>
              <div
                className="eyebrow"
                style={{ color: 'var(--on-dark-3)', padding: '0 10px', marginBottom: 6 }}
              >
                {group}
              </div>
              {items.map(({ label, to, Icon, badge }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={onClose}
                  className="reeyo-nav-item"
                  style={({ isActive }) => ({
                    position: 'relative',
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', marginBottom: 2,
                    borderRadius: 'var(--r-ctrl)',
                    fontSize: 13.5, fontWeight: 700,
                    textDecoration: 'none',
                    color: isActive ? 'var(--on-brand)' : 'var(--on-dark-1)',
                    background: isActive ? 'var(--nav-active)' : 'transparent',
                  })}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span
                          aria-hidden="true"
                          style={{
                            position: 'absolute', left: -12, top: 8, bottom: 8,
                            width: 3, background: 'var(--emerald)',
                            borderRadius: '0 2px 2px 0',
                          }}
                        />
                      )}
                      <span
                        style={{
                          display: 'flex',
                          color: isActive ? 'var(--emerald)' : 'var(--on-brand)',
                          opacity: isActive ? 1 : 0.75,
                        }}
                      >
                        <Icon size={17} />
                      </span>
                      <span style={{ flex: 1 }}>{label}</span>
                      {badge !== undefined && badge > 0 && (
                        <span
                          className="mono"
                          style={{
                            background: 'var(--emerald)', color: 'var(--forest)',
                            fontSize: 10, fontWeight: 600,
                            padding: '1px 6px', borderRadius: 'var(--r-pill)',
                          }}
                        >
                          {badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div style={{ height: 1, background: 'var(--dark-line)', margin: '12px 18px 0' }} />

        <div style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            aria-hidden="true"
            className="mono"
            style={{
              width: 32, height: 32, borderRadius: 'var(--r-pill)',
              background: 'var(--forest-600)', color: 'var(--mint)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 600, flexShrink: 0,
            }}
          >
            {initials(ADMIN.name)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                color: 'var(--on-brand)', fontSize: 12.5, fontWeight: 700,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}
            >
              {ADMIN.name}
            </div>
            <div style={{ color: 'var(--on-dark-2)', fontSize: 11 }}>
              {ADMIN.role} · {ADMIN.city}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
