import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Rail from './Rail';
import Topbar from './Topbar';

interface ShellProps {
  openOrders: number;
  pendingPayouts: number;
}

export default function Shell({ openOrders, pendingPayouts }: ShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Escape closes any overlay — section 11
  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  useEffect(() => {
    document.querySelector('main')?.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <Rail
        openOrders={openOrders}
        pendingPayouts={pendingPayouts}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div
        className="reeyo-content"
        style={{
          flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
          marginLeft: 'var(--rail-w)', height: '100%',
        }}
      >
        <Topbar onOpenNav={() => setMobileOpen(true)} />
        <main style={{ flex: 1, overflowY: 'auto', padding: 'var(--gutter)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
