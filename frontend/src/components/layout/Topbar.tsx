import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SearchIcon, BellIcon, RefreshIcon, MenuIcon, SunIcon, MoonIcon, MonitorIcon,
} from './icons';
import RegionPicker from './RegionPicker';
import DateFilter from '../ui/DateFilter';
import { useAppState } from '../../state/useAppState';
import { usePreferences } from '../../state/usePreferences';
import type { Theme } from '../../state/usePreferences';
import { useT } from '../../i18n/useT';

interface TopbarProps {
  onOpenNav: () => void;
}

const THEME_ORDER: Theme[] = ['light', 'dark', 'system'];

const iconButton: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 'var(--r-ctrl)',
  border: '1px solid var(--line)', background: 'var(--card)',
  color: 'var(--text-2)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
};

/** Sun, moon or monitor — whichever the current setting is (§2.2). */
function ThemeControl() {
  const { theme, setTheme } = usePreferences();
  const t = useT();

  const label = theme === 'light' ? t('top.themeLight')
    : theme === 'dark' ? t('top.themeDark') : t('top.themeSystem');
  const Icon = theme === 'light' ? SunIcon : theme === 'dark' ? MoonIcon : MonitorIcon;

  return (
    <button
      onClick={() => setTheme(THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length])}
      aria-label={`${t('top.theme')}: ${label}`}
      title={`${t('top.theme')}: ${label}`}
      style={iconButton}
    >
      <Icon size={17} />
    </button>
  );
}

/** FR / EN, visible on every page (§2.1). */
function LanguageControl() {
  const { language, setLanguage } = usePreferences();
  const t = useT();

  return (
    <div
      role="group"
      aria-label={t('top.language')}
      style={{
        display: 'flex', height: 34, borderRadius: 'var(--r-ctrl)',
        border: '1px solid var(--line)', background: 'var(--card)',
        overflow: 'hidden', flexShrink: 0,
      }}
    >
      {(['fr', 'en'] as const).map((code) => {
        const active = language === code;
        return (
          <button
            key={code}
            onClick={() => setLanguage(code)}
            aria-pressed={active}
            className="mono"
            style={{
              width: 32, border: 'none', cursor: 'pointer',
              background: active ? 'var(--go-soft)' : 'transparent',
              color: active ? 'var(--emerald-ink)' : 'var(--text-3)',
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
            }}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}

export default function Topbar({ onOpenNav }: TopbarProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const t = useT();
  const { reload, orders, pendingApprovals, openDisputes } = useAppState();
  const [query, setQuery] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);

  // "/" focuses search — section 11
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== '/') return;
      const el = document.activeElement;
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement;
      if (typing) return;
      e.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Search hands the term to the Orders page, which owns the filtering and the
  // backend search. A second search implementation here would be a second set
  // of results that disagrees with the first.
  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = query.trim();
    if (!term) return;
    navigate(`/orders?q=${encodeURIComponent(term)}`);
  };

  const refresh = () => {
    setSpinning(true);
    reload();
    window.setTimeout(() => setSpinning(false), 700);
  };

  // What the bell is actually for: work that has arrived and not been dealt
  // with. An unread dot that never changes is decoration.
  const unacknowledged = orders.filter((o) => !o.acknowledged).length;
  const alertCount = unacknowledged + pendingApprovals + openDisputes;

  return (
    <header
      style={{
        height: 'var(--topbar-h)', flexShrink: 0,
        background: 'var(--card)', borderBottom: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 var(--gutter)',
        position: 'relative',
      }}
    >
      <button
        className="reeyo-nav-toggle"
        onClick={onOpenNav}
        aria-label={t('top.openNav')}
        style={{ ...iconButton, display: 'none' }}
      >
        <MenuIcon size={17} />
      </button>

      <RegionPicker />
      <DateFilter />

      <form
        onSubmit={submitSearch}
        className="reeyo-search"
        style={{ position: 'relative', flex: 1, minWidth: 0, marginLeft: 'auto' }}
      >
        <span
          aria-hidden="true"
          style={{
            position: 'absolute', left: 11, top: '50%',
            transform: 'translateY(-50%)', color: 'var(--text-3)',
            display: 'flex', pointerEvents: 'none',
          }}
        >
          <SearchIcon size={15} />
        </span>
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('top.search')}
          aria-label={t('top.searchLabel')}
          size={1}
          style={{
            width: '100%', minWidth: 0, height: 38, paddingLeft: 34, paddingRight: 30,
            borderRadius: 'var(--r-ctrl)', border: '1px solid var(--line)',
            background: 'var(--canvas)', color: 'var(--text)',
            fontSize: 12.5, fontFamily: 'var(--sans)', outline: 'none',
          }}
        />
        <kbd
          className="mono reeyo-kbd"
          aria-hidden="true"
          style={{
            position: 'absolute', right: 9, top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 10, color: 'var(--text-3)',
            border: '1px solid var(--line)', borderRadius: 5,
            padding: '1px 5px', background: 'var(--card)',
          }}
        >
          /
        </kbd>
      </form>

      <LanguageControl />
      <ThemeControl />

      <button
        onClick={() => setAlertsOpen((open) => !open)}
        aria-label={`${t('top.alerts')} (${alertCount})`}
        aria-expanded={alertsOpen}
        style={{ ...iconButton, position: 'relative' }}
      >
        <BellIcon size={17} />
        {alertCount > 0 && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute', top: 7, right: 8,
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--emerald)',
              border: '1.5px solid var(--card)',
            }}
          />
        )}
      </button>

      <button
        onClick={refresh}
        aria-label={t('top.refresh')}
        title={t('top.refresh')}
        style={iconButton}
      >
        <span
          style={{
            display: 'flex',
            transition: 'transform 700ms cubic-bezier(.3,.9,.3,1)',
            transform: spinning ? 'rotate(360deg)' : 'none',
          }}
        >
          <RefreshIcon size={17} />
        </span>
      </button>

      {alertsOpen && (
        <AlertMenu
          unacknowledged={unacknowledged}
          approvals={pendingApprovals}
          disputes={openDisputes}
          onClose={() => setAlertsOpen(false)}
        />
      )}
    </header>
  );
}

/** What is waiting, and one click to each of them. */
function AlertMenu({
  unacknowledged, approvals, disputes, onClose,
}: {
  unacknowledged: number; approvals: number; disputes: number; onClose: () => void;
}) {
  const navigate = useNavigate();
  const t = useT();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const rows = [
    { count: unacknowledged, label: t('nav.orders'), to: '/orders' },
    { count: approvals, label: t('nav.approvals'), to: '/approvals' },
    { count: disputes, label: t('nav.disputes'), to: '/disputes' },
  ].filter((row) => row.count > 0);

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 40 }}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-label={t('top.alerts')}
        style={{
          position: 'absolute', top: 'calc(var(--topbar-h) - 6px)', right: 'var(--gutter)',
          zIndex: 41, width: 260, padding: 8,
          background: 'var(--card)', border: '1px solid var(--line)',
          borderRadius: 'var(--r-card)', boxShadow: 'var(--shadow)',
        }}
      >
        {rows.length === 0 ? (
          <p style={{ margin: 0, padding: '10px 12px', fontSize: 12.5, color: 'var(--text-2)' }}>
            Nothing is waiting on you.
          </p>
        ) : rows.map((row) => (
          <button
            key={row.to}
            onClick={() => { navigate(row.to); onClose(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '9px 11px', border: 'none', background: 'transparent',
              borderRadius: 'var(--r-ctrl)', cursor: 'pointer', textAlign: 'left',
              color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 12.5,
            }}
          >
            <span style={{ flex: 1 }}>{row.label}</span>
            <span
              className="mono"
              style={{
                fontSize: 11, fontWeight: 700, padding: '2px 7px',
                borderRadius: 'var(--r-pill)',
                background: 'var(--emerald)', color: 'var(--forest)',
              }}
            >
              {row.count}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
