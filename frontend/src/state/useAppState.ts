// The context, its types and its hook live apart from the provider component.
// A module that exports both a component and a hook cannot Fast Refresh, which
// showed up in development as "Could not Fast Refresh (useAppState export is
// incompatible)" and a full page reload on every edit.

import { createContext, useContext } from 'react';
import type {
  Order, PayoutRequest, Vendor, Rider, Customer, Payment,
  Offer, Banner, FeeRule, Dispute, MenuApproval, ApiKey,
} from '../data/types';
import type { RegionScope } from '../data/geography';

/** A row in the customer app's home screen ordering. */
export interface HomeSection {
  id: number;
  name: string;
  active: boolean;
}

export interface Toast {
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

export interface AppStateValue {
  orders: Order[];
  ordersState: Loaded<Order>;
  /**
   * Cancelling is the only order status a console can write — admin-api has no
   * generic status endpoint — and it requires a reason.
   */
  cancelOrder: (id: string, reason: string) => void;
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
  declinePayout: (id: string, reason: string) => void;

  disputes: Dispute[];
  disputesState: Loaded<Dispute>;
  resolveDispute: (id: string, resolution: string, refund?: number) => void;
  rejectDispute: (id: string, reason: string) => void;

  approvals: MenuApproval[];
  approvalsState: Loaded<MenuApproval>;
  approveMenu: (id: string) => void;
  rejectMenu: (id: string, reason: string) => void;

  apiKeys: ApiKey[];
  apiKeysState: Loaded<ApiKey>;
  createApiKey: (name: string, scopes: string[], expiresAt?: string) => Promise<string | null>;
  revokeApiKey: (id: string) => void;

  // Local-only: no backend route exists for these (see services/endpoints.ts).
  offers: Offer[];
  toggleOffer: (id: number) => void;
  banners: Banner[];
  toggleBanner: (id: number) => void;
  reorderBanners: (from: number, to: number) => void;
  moveBanner: (id: number, direction: -1 | 1) => void;
  sections: HomeSection[];
  toggleSection: (id: number) => void;
  feeRules: FeeRule[];
  toggleFeeRule: (id: string) => void;

  openOrders: number;
  pendingPayouts: number;
  openDisputes: number;
  pendingApprovals: number;

  /**
   * The region every collection above is scoped to. 'all' means the whole
   * country. Collections are already filtered, so pages need do nothing.
   */
  region: RegionScope;
  setRegion: (region: RegionScope) => void;
  /** Open orders per region, for the topbar selector. Never scoped. */
  ordersByRegion: Record<string, number>;
  /** Totals before scoping, so the UI can say what the filter is hiding. */
  nationalTotals: { orders: number; vendors: number; riders: number; customers: number };

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


export const AppStateContext = createContext<AppStateValue | null>(null);

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
