import { useEffect, useRef } from 'react';
import { SearchIcon, BellIcon, RefreshIcon, MenuIcon } from './icons';
import RegionPicker from './RegionPicker';

interface TopbarProps {
  onOpenNav: () => void;
}

export default function Topbar({ onOpenNav }: TopbarProps) {
  const searchRef = useRef<HTMLInputElement>(null);

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

  const iconButton: React.CSSProperties = {
    width: 34, height: 34, borderRadius: 'var(--r-ctrl)',
    border: '1px solid var(--line)', background: 'var(--card)',
    color: 'var(--text-2)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  };

  return (
    <header
      style={{
        height: 'var(--topbar-h)', flexShrink: 0,
        background: 'var(--card)', borderBottom: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 var(--gutter)',
      }}
    >
      <button
        onClick={onOpenNav}
        aria-label="Open navigation"
        className="reeyo-nav-toggle"
        style={{ ...iconButton, display: 'none' }}
      >
        <MenuIcon size={18} />
      </button>

      <RegionPicker />

      <div className="reeyo-spacer" style={{ flex: 1, minWidth: 0 }} />

      <div
        className="reeyo-search"
        style={{ position: 'relative', flexGrow: 1, flexShrink: 1, flexBasis: '0%', minWidth: 0 }}
      >
        <span
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
          placeholder="Search orders, vendors, riders"
          aria-label="Search"
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
      </div>

      <button aria-label="Alerts" style={{ ...iconButton, position: 'relative' }}>
        <BellIcon size={17} />
        <span
          aria-hidden="true"
          style={{
            position: 'absolute', top: 7, right: 8,
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--emerald)',
            border: '1.5px solid var(--card)',
          }}
        />
      </button>

      <button aria-label="Refresh data" style={iconButton}>
        <RefreshIcon size={17} />
      </button>
    </header>
  );
}
