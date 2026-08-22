import {
  createContext, useContext, useState, useCallback, useMemo, useEffect, useRef,
} from 'react';
import type {
  Order, OrderStatus, PayoutRequest, Vendor, Rider, Customer, Payment,
  Offer, Banner, FeeRule,
} from '../data/types';
import {
  orders as seedOrders,
  payoutRequests as seedPayouts,
  payments as seedPayments,
  vendors as seedVendors,
  riders as seedRiders,
  customers as seedCustomers,
  offers as seedOffers,
  banners as seedBanners,
  homeSections as seedSections,
  feeRules as seedFeeRules,
} from '../data/seed';
import { resources } from '../services/resources';
import { ApiError } from '../services/apiClient';
import { useAuth } from './AuthContext';

interface Toast {
  id: number;
  message: string;
}

/** Per-collection load state, so a card can show its own error. */
export interface Loaded<T> {
  rows: T[];
  loading: boolean;
  error: string | null;
  /** True when these rows are seed data rather than anything from the API. */
  sample: boolean;
}

interface AppStateValue {
  orders: Order[];
  ordersState: Loaded<Order>;
  setOrderStatus: (id: string, status: OrderStatus) => void;
  assignRider: (id: string, rider: string) => void;

  vendors: Vendor[];
  vendorsState: Loaded<Vendor>;
  riders: Rider[];
  ridersState: Loaded<Rider>;
  customers: Customer[];
  customersState: Loaded<Customer>;
  payments: Payment[];
  paymentsState: Loaded<Payment>;

  payouts: PayoutRequest[];
  payoutsState: Loaded<PayoutRequest>;
  approvePayout: (id: string) => void;
  declinePayout: (id: string) => void;

  // Local-only: no backend route exists for these (see services/endpoints.ts).
  offers: Offer[];
  toggleOffer: (id: number) => void;
  banners: Banner[];
  toggleBanner: (id: number) => void;
  reorderBanners: (from: number, to: number) => void;
  moveBanner: (id: number, direction: -1 | 1) => void;
  sections: typeof seedSections;
  toggleSection: (id: number) => void;
  feeRules: FeeRule[];
  toggleFeeRule: (id: string) => void;

  openOrders: number;
  pendingPayouts: number;

  /** True when the rows on screen are seed data rather than the live API. */
  isSample: boolean;
  /**
   * Returns a value only in sample mode. Use it for figures the backend gives
   * us no way to compute — period-over-period trends, historical series. In
   * live mode they become undefined and simply do not render, rather than
   * showing an invented number next to real data.
   */
  sampleOnly: <T>(value: T) => T | undefined;

  toasts: Toast[];
  pushToast: (message: string) => void;

  reload: () => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}

const CLOSED: OrderStatus[] = ['delivered', 'cancelled'];

let toastSeq = 0;

function idle<T>(seed: T[]): Loaded<T> {
  return { rows: seed, loading: false, error: null, sample: true };
}

function describe(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.isNetworkFailure) return 'Could not reach the admin API.';
    if (err.isMissingEndpoint) return 'This is not available on the backend yet.';
    return err.message;
  }
  return 'Something went wrong loading this.';
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const { mode, isAuthenticated } = useAuth();
  const live = mode === 'live';

  const [ordersState, setOrdersState] = useState<Loaded<Order>>(idle(seedOrders));
  const [vendorsState, setVendorsState] = useState<Loaded<Vendor>>(idle(seedVendors));
  const [ridersState, setRidersState] = useState<Loaded<Rider>>(idle(seedRiders));
  const [customersState, setCustomersState] = useState<Loaded<Customer>>(idle(seedCustomers));
  const [paymentsState, setPaymentsState] = useState<Loaded<Payment>>(idle(seedPayments));
  const [payoutsState, setPayoutsState] = useState<Loaded<PayoutRequest>>(idle(seedPayouts));

  const [offers, setOffers] = useState<Offer[]>(seedOffers);
  const [banners, setBanners] = useState<Banner[]>(seedBanners);
  const [sections, setSections] = useState(seedSections);
  const [feeRules, setFeeRules] = useState<FeeRule[]>(seedFeeRules);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  // Timers are tracked so unmounting cannot leave them firing setState.
  const toastTimers = useRef<number[]>([]);
  useEffect(() => () => {
    toastTimers.current.forEach((t) => clearTimeout(t));
  }, []);

  const pushToast = useCallback((message: string) => {
    const id = ++toastSeq;
    setToasts((prev) => [...prev, { id, message }]);
    const timer = window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      toastTimers.current = toastTimers.current.filter((t) => t !== timer);
    }, 2600);
    toastTimers.current.push(timer);
  }, []);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  // Load everything the backend actually serves. In sample mode we keep the
  // seed rows already in state and make no requests at all.
  useEffect(() => {
    if (!isAuthenticated || !live) return;
    let cancelled = false;

    const load = <T,>(
      fetcher: () => Promise<T[]>,
      set: React.Dispatch<React.SetStateAction<Loaded<T>>>,
      seed: T[],
    ) => {
      set((prev) => ({ ...prev, loading: true, error: null }));
      fetcher()
        .then((rows) => {
          if (cancelled) return;
          set({ rows, loading: false, error: null, sample: false });
        })
        .catch((err) => {
          if (cancelled) return;
          // Keep seed rows visible so the page still reads, but flag the error
          // and keep sample: true so the UI never claims this is live.
          set({ rows: seed, loading: false, error: describe(err), sample: true });
        });
    };

    load(() => resources.orders(), setOrdersState, seedOrders);
    load(() => resources.vendors(), setVendorsState, seedVendors);
    load(() => resources.riders(), setRidersState, seedRiders);
    load(() => resources.customers(), setCustomersState, seedCustomers);
    load(() => resources.payments(), setPaymentsState, seedPayments);
    load(() => resources.payoutRequests(), setPayoutsState, seedPayouts);

    return () => { cancelled = true; };
  }, [isAuthenticated, live, reloadKey]);

  const setOrderStatus = useCallback((id: string, status: OrderStatus) => {
    setOrdersState((prev) => ({
      ...prev,
      rows: prev.rows.map((o) => (o.id === id
        ? { ...o, status, eta: CLOSED.includes(status) ? 'done' : o.eta }
        : o)),
    }));
    pushToast(`${id} is now ${status}`);

    if (live) {
      resources.setOrderStatus(id, status).catch((err) => {
        pushToast(`${id} did not save — ${describe(err)}`);
        reload();
      });
    }
  }, [live, pushToast, reload]);

  const assignRider = useCallback((id: string, rider: string) => {
    setOrdersState((prev) => ({
      ...prev,
      rows: prev.rows.map((o) => (o.id === id ? { ...o, rider } : o)),
    }));
    pushToast(`${rider} is on ${id}`);

    if (live) {
      const match = ridersState.rows.find((r) => r.name === rider);
      if (match) {
        resources.assignRider(id, match.id).catch((err) => {
          pushToast(`${id} did not save — ${describe(err)}`);
          reload();
        });
      }
    }
  }, [live, ridersState.rows, pushToast, reload]);

  const approvePayout = useCallback((id: string) => {
    const target = payoutsState.rows.find((p) => p.id === id);
    setPayoutsState((prev) => ({
      ...prev,
      rows: prev.rows.map((p) => (p.id === id ? { ...p, status: 'approved' as const } : p)),
    }));
    if (target) pushToast(`FCFA released to ${target.who}`);

    if (live) {
      resources.approvePayout(id).catch((err) => {
        pushToast(`${id} did not save — ${describe(err)}`);
        reload();
      });
    }
  }, [live, payoutsState.rows, pushToast, reload]);

  const declinePayout = useCallback((id: string) => {
    setPayoutsState((prev) => ({
      ...prev,
      rows: prev.rows.map((p) => (p.id === id ? { ...p, status: 'failed' as const } : p)),
    }));
    pushToast(`${id} declined`);

    if (live) {
      resources.declinePayout(id, 'Declined from the operations console').catch((err) => {
        pushToast(`${id} did not save — ${describe(err)}`);
        reload();
      });
    }
  }, [live, pushToast, reload]);

  const toggleOffer = useCallback((id: number) => {
    setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, active: !o.active } : o)));
  }, []);

  const toggleBanner = useCallback((id: number) => {
    setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, active: !b.active } : b)));
  }, []);

  const reorderBanners = useCallback((from: number, to: number) => {
    setBanners((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  /** Keyboard-operable equivalent of the drag handle — section 11. */
  const moveBanner = useCallback((id: number, direction: -1 | 1) => {
    setBanners((prev) => {
      const index = prev.findIndex((b) => b.id === id);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  const toggleSection = useCallback((id: number) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
  }, []);

  const toggleFeeRule = useCallback((id: string) => {
    setFeeRules((prev) => prev.map((f) => (f.id === id ? { ...f, active: !f.active } : f)));
  }, []);

  const orders = ordersState.rows;
  const payouts = payoutsState.rows;

  const openOrders = useMemo(
    () => orders.filter((o) => !CLOSED.includes(o.status)).length,
    [orders],
  );
  const pendingPayouts = useMemo(
    () => payouts.filter((p) => p.status === 'pending').length,
    [payouts],
  );

  const isSample = !live || ordersState.sample;
  const sampleOnly = useCallback(
    <T,>(v: T): T | undefined => (isSample ? v : undefined),
    [isSample],
  );

  const value: AppStateValue = {
    orders, ordersState, setOrderStatus, assignRider,
    vendors: vendorsState.rows, vendorsState,
    riders: ridersState.rows, ridersState,
    customers: customersState.rows, customersState,
    payments: paymentsState.rows, paymentsState,
    payouts, payoutsState, approvePayout, declinePayout,
    offers, toggleOffer,
    banners, toggleBanner, reorderBanners, moveBanner,
    sections, toggleSection,
    feeRules, toggleFeeRule,
    openOrders, pendingPayouts,
    isSample, sampleOnly,
    toasts, pushToast,
    reload,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
