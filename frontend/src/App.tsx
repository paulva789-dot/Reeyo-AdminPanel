import { Routes, Route } from 'react-router-dom';
import Shell from './components/layout/Shell';
import ToastHost from './components/ui/Toast';
import { AppStateProvider, useAppState } from './state/AppState';
import Overview from './pages/Overview';
import Orders from './pages/Orders';
import Dispatch from './pages/Dispatch';
import Vendors from './pages/Vendors';
import Riders from './pages/Riders';
import Customers from './pages/Customers';
import Storefront from './pages/Storefront';
import Marketing from './pages/Marketing';
import Payments from './pages/Payments';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

function Routed() {
  // Badges read live state, so a status change or a payout approval moves them
  // in the same tick as the page that caused it — section 14.
  const { openOrders, pendingPayouts } = useAppState();

  return (
    <Routes>
      <Route element={<Shell openOrders={openOrders} pendingPayouts={pendingPayouts} />}>
        <Route path="/" element={<Overview />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/dispatch" element={<Dispatch />} />
        <Route path="/vendors" element={<Vendors />} />
        <Route path="/riders" element={<Riders />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/storefront" element={<Storefront />} />
        <Route path="/marketing" element={<Marketing />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <Routed />
      <ToastHost />
    </AppStateProvider>
  );
}
