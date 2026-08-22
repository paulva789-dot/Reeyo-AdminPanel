import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { Order, OrderStatus, PayoutRequest } from '../data/types';
import {
  orders as seedOrders,
  payoutRequests as seedPayouts,
  offers as seedOffers,
  banners as seedBanners,
  homeSections as seedSections,
  feeRules as seedFeeRules,
} from '../data/seed';
import type { Offer, Banner, FeeRule } from '../data/types';

interface Toast {
  id: number;
  message: string;
}

interface AppStateValue {
  orders: Order[];
  setOrderStatus: (id: string, status: OrderStatus) => void;
  assignRider: (id: string, rider: string) => void;

  payouts: PayoutRequest[];
  approvePayout: (id: string) => void;
  declinePayout: (id: string) => void;

  offers: Offer[];
  toggleOffer: (id: number) => void;

  banners: Banner[];
  toggleBanner: (id: number) => void;
  reorderBanners: (from: number, to: number) => void;

  sections: typeof seedSections;
  toggleSection: (id: number) => void;

  feeRules: FeeRule[];
  toggleFeeRule: (id: string) => void;

  /** Open orders drive the Orders badge — anything not finished. */
  openOrders: number;
  pendingPayouts: number;

  toasts: Toast[];
  pushToast: (message: string) => void;
  dismissToast: (id: number) => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}

const CLOSED: OrderStatus[] = ['delivered', 'cancelled'];

let toastSeq = 0;

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(seedOrders);
  const [payouts, setPayouts] = useState<PayoutRequest[]>(seedPayouts);
  const [offers, setOffers] = useState<Offer[]>(seedOffers);
  const [banners, setBanners] = useState<Banner[]>(seedBanners);
  const [sections, setSections] = useState(seedSections);
  const [feeRules, setFeeRules] = useState<FeeRule[]>(seedFeeRules);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback((message: string) => {
    const id = ++toastSeq;
    setToasts((prev) => [...prev, { id, message }]);
    // Toast auto-dismisses at 2.6s — section 5.7
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  const setOrderStatus = useCallback((id: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id
      ? { ...o, status, eta: CLOSED.includes(status) ? 'done' : o.eta }
      : o)));
    pushToast(`${id} is now ${status}`);
  }, [pushToast]);

  const assignRider = useCallback((id: string, rider: string) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, rider } : o)));
    pushToast(`${rider} is on ${id}`);
  }, [pushToast]);

  const approvePayout = useCallback((id: string) => {
    setPayouts((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) pushToast(`FCFA released to ${target.who}`);
      return prev.map((p) => (p.id === id ? { ...p, status: 'approved' as const } : p));
    });
  }, [pushToast]);

  const declinePayout = useCallback((id: string) => {
    setPayouts((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) pushToast(`${target.id} declined`);
      return prev.map((p) => (p.id === id ? { ...p, status: 'failed' as const } : p));
    });
  }, [pushToast]);

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

  const toggleSection = useCallback((id: number) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
  }, []);

  const toggleFeeRule = useCallback((id: string) => {
    setFeeRules((prev) => prev.map((f) => (f.id === id ? { ...f, active: !f.active } : f)));
  }, []);

  const openOrders = useMemo(
    () => orders.filter((o) => !CLOSED.includes(o.status)).length,
    [orders],
  );
  const pendingPayouts = useMemo(
    () => payouts.filter((p) => p.status === 'pending').length,
    [payouts],
  );

  const value: AppStateValue = {
    orders, setOrderStatus, assignRider,
    payouts, approvePayout, declinePayout,
    offers, toggleOffer,
    banners, toggleBanner, reorderBanners,
    sections, toggleSection,
    feeRules, toggleFeeRule,
    openOrders, pendingPayouts,
    toasts, pushToast, dismissToast,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
