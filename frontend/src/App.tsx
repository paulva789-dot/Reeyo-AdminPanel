import { Routes, Route, Navigate } from 'react-router-dom';
import Shell from './components/layout/Shell';
import ToastHost from './components/ui/Toast';
import { AuthProvider } from './state/AuthContext';
import { PreferencesProvider } from './state/PreferencesContext';
import { DateRangeProvider } from './state/DateRangeContext';
import { AlertsProvider } from './state/AlertsContext';
import { useAuth } from './state/useAuth';
import { AppStateProvider } from './state/AppState';
import { useAppState } from './state/useAppState';
import Login from './pages/Login';
import Overview from './pages/Overview';
import Orders from './pages/Orders';
import Dispatch from './pages/Dispatch';
import Disputes from './pages/Disputes';
import Approvals from './pages/Approvals';
import Vendors from './pages/Vendors';
import Riders from './pages/Riders';
import Customers from './pages/Customers';
import Storefront from './pages/Storefront';
import Marketing from './pages/Marketing';
import Payments from './pages/Payments';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

/**
 * Shown while /auth/me decides whether there is a session to restore. Against a
 * remote backend this can run for several seconds, so it carries the brand and
 * says what it is waiting on rather than showing an empty canvas.
 */
function Booting() {
  return (
    <div
      style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
        background: 'var(--canvas)',
      }}
    >
      <img src="/logo.svg" alt="" style={{ width: 40, height: 40, borderRadius: 10 }} />
      <div
        style={{
          width: 132, height: 3, borderRadius: 'var(--r-pill)',
          background: 'var(--line)', overflow: 'hidden',
        }}
      >
        <div className="reeyo-indeterminate" style={{ height: '100%', width: '40%' }} />
      </div>
      <span className="eyebrow">Checking your session</span>
    </div>
  );
}

function SignedIn() {
  // Badges read live state, so a status change or a payout approval moves them
  // in the same tick as the page that caused it — section 14.
  const { openOrders, pendingPayouts, openDisputes, pendingApprovals } = useAppState();

  return (
    <Routes>
      <Route element={<Shell
        openOrders={openOrders}
        pendingPayouts={pendingPayouts}
        openDisputes={openDisputes}
        pendingApprovals={pendingApprovals}
      />}>
        <Route path="/" element={<Overview />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/dispatch" element={<Dispatch />} />
        <Route path="/disputes" element={<Disputes />} />
        <Route path="/approvals" element={<Approvals />} />
        <Route path="/vendors" element={<Vendors />} />
        <Route path="/riders" element={<Riders />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/storefront" element={<Storefront />} />
        <Route path="/marketing" element={<Marketing />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function Gate() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Booting />;

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  // AppState lives inside the gate so it only ever loads for a real session.
  return (
    <DateRangeProvider>
      <AppStateProvider>
        <AlertsProvider>
      <SignedIn />
      <ToastHost />
        </AlertsProvider>
      </AppStateProvider>
    </DateRangeProvider>
  );
}

export default function App() {
  return (
    <PreferencesProvider>
      <AuthProvider>
      <Gate />
      </AuthProvider>
    </PreferencesProvider>
  );
}
