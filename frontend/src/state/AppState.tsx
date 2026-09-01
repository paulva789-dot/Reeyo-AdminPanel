import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AppStateContext } from './useAppState';
import type { AppStateValue, Loaded, Toast } from './useAppState';
import type {
  Order, OrderStatus, PayoutRequest, Vendor, Rider, Customer, Payment,
  Offer, FeeRule, Dispute, MenuApproval, ApiKey,
  PendingVendor, PendingRider,
} from '../data/types';
import {
  orders as seedOrders,
  payoutRequests as seedPayouts,
  payments as seedPayments,
  vendors as seedVendors,
  riders as seedRiders,
  customers as seedCustomers,
  disputes as seedDisputes,
  menuApprovals as seedApprovals,
  apiKeys as seedApiKeys,
  offers as seedOffers,
  homeSections as seedSections,
  feeRules as seedFeeRules,
} from '../data/seed';
import { ALL_REGIONS } from '../data/geography';
import type { Region, RegionScope } from '../data/geography';
import { resources } from '../services/resources';
import { platform } from '../services/platformResources';
import type { DocumentVerdict } from '../services/platformResources';
import {
  pendingVendors as seedPendingVendors,
  pendingRiders as seedPendingRiders,
} from '../data/approvalSeed';
import { ApiError } from '../services/apiClient';
import { useAuth } from './useAuth';

const CLOSED: OrderStatus[] = ['delivered', 'cancelled', 'failed'];

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
  const [disputesState, setDisputesState] = useState<Loaded<Dispute>>(idle(seedDisputes));
  const [approvalsState, setApprovalsState] = useState<Loaded<MenuApproval>>(idle(seedApprovals));
  const [apiKeysState, setApiKeysState] = useState<Loaded<ApiKey>>(idle(seedApiKeys));
  const [pendingVendorsState, setPendingVendorsState] =
    useState<Loaded<PendingVendor>>(idle(seedPendingVendors));
  const [pendingRidersState, setPendingRidersState] =
    useState<Loaded<PendingRider>>(idle(seedPendingRiders));

  const [offers, setOffers] = useState<Offer[]>(seedOffers);
  const [sections, setSections] = useState(seedSections);
  const [feeRules, setFeeRules] = useState<FeeRule[]>(seedFeeRules);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [region, setRegion] = useState<RegionScope>(ALL_REGIONS);

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
    load(() => resources.disputes(), setDisputesState, seedDisputes);
    load(() => resources.menuApprovals(), setApprovalsState, seedApprovals);
    load(() => resources.apiKeys(), setApiKeysState, seedApiKeys);
    load(() => platform.pendingVendors(), setPendingVendorsState, seedPendingVendors);
    load(() => platform.pendingRiders(), setPendingRidersState, seedPendingRiders);

    return () => { cancelled = true; };
  }, [isAuthenticated, live, reloadKey]);

  const cancelOrder = useCallback((id: string, reason: string) => {
    setOrdersState((prev) => ({
      ...prev,
      rows: prev.rows.map((o) => (o.id === id
        ? { ...o, status: 'cancelled' as OrderStatus, eta: 'done' }
        : o)),
    }));
    pushToast(`${id} is now cancelled`);

    if (live) {
      resources.cancelOrder(id, reason).catch((err) => {
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

    if (live && target) {
      resources.approvePayout(id, target.kind === 'Vendor' ? 'VENDOR' : 'RIDER').catch((err) => {
        pushToast(`${id} did not save — ${describe(err)}`);
        reload();
      });
    }
  }, [live, payoutsState.rows, pushToast, reload]);

  const declinePayout = useCallback((id: string, reason: string) => {
    const target = payoutsState.rows.find((p) => p.id === id);
    setPayoutsState((prev) => ({
      ...prev,
      rows: prev.rows.map((p) => (p.id === id ? { ...p, status: 'failed' as const } : p)),
    }));
    pushToast(`${id} declined`);

    if (live && target) {
      resources
        .rejectPayout(id, target.kind === 'Vendor' ? 'VENDOR' : 'RIDER', reason)
        .catch((err) => {
          pushToast(`${id} did not save — ${describe(err)}`);
          reload();
        });
    }
  }, [live, payoutsState.rows, pushToast, reload]);

  /** Optimistic write, then the API call; a failure says so and re-syncs. */
  const writeThrough = useCallback((label: string, call: () => Promise<unknown>) => {
    if (!live) return;
    call().catch((err) => {
      pushToast(`${label} did not save — ${describe(err)}`);
      reload();
    });
  }, [live, pushToast, reload]);

  const resolveDispute = useCallback((id: string, resolution: string, refund?: number) => {
    setDisputesState((prev) => ({
      ...prev,
      rows: prev.rows.map((d) => (d.id === id
        ? { ...d, status: 'resolved' as const, resolution } : d)),
    }));
    pushToast(refund && refund > 0
      ? `${id} resolved with a refund`
      : `${id} resolved`);
    writeThrough(id, () => resources.resolveDispute(id, resolution, refund));
  }, [pushToast, writeThrough]);

  const rejectDispute = useCallback((id: string, reason: string) => {
    setDisputesState((prev) => ({
      ...prev,
      rows: prev.rows.map((d) => (d.id === id ? { ...d, status: 'rejected' as const } : d)),
    }));
    pushToast(`${id} rejected`);
    writeThrough(id, () => resources.rejectDispute(id, reason));
  }, [pushToast, writeThrough]);

  const approveMenu = useCallback((id: string) => {
    const target = approvalsState.rows.find((a) => a.id === id);
    setApprovalsState((prev) => ({
      ...prev,
      rows: prev.rows.map((a) => (a.id === id ? { ...a, status: 'approved' as const } : a)),
    }));
    pushToast(target ? `${target.itemName} approved` : `${id} approved`);
    writeThrough(id, () => resources.approveMenu(id));
  }, [approvalsState.rows, pushToast, writeThrough]);

  const rejectMenu = useCallback((id: string, reason: string) => {
    const target = approvalsState.rows.find((a) => a.id === id);
    setApprovalsState((prev) => ({
      ...prev,
      rows: prev.rows.map((a) => (a.id === id
        ? { ...a, status: 'rejected' as const, adminNotes: reason } : a)),
    }));
    pushToast(target ? `${target.itemName} rejected` : `${id} rejected`);
    writeThrough(id, () => resources.rejectMenu(id, reason));
  }, [approvalsState.rows, pushToast, writeThrough]);

  /**
   * Returns the raw key so the caller can show it once. In sample mode a local
   * placeholder stands in — clearly not a usable credential.
   */
  const createApiKey = useCallback(async (
    name: string, scopes: string[], expiresAt?: string,
  ): Promise<string | null> => {
    if (!live) {
      const fake = `rey_sample_${Math.random().toString(36).slice(2, 10)}`;
      setApiKeysState((prev) => ({
        ...prev,
        rows: [{
          id: `local-${Date.now()}`, name, prefix: fake.slice(0, 13),
          scopes, lastUsed: null, revoked: false,
        }, ...prev.rows],
      }));
      pushToast(`${name} created`);
      return fake;
    }

    try {
      const res = await resources.createApiKey(name, scopes, expiresAt);
      const raw = res.data?.rawKey ?? res.data?.key ?? null;
      pushToast(`${name} created`);
      reload();
      return raw;
    } catch (err) {
      pushToast(`${name} was not created — ${describe(err)}`);
      return null;
    }
  }, [live, pushToast, reload]);

  const revokeApiKey = useCallback((id: string) => {
    const target = apiKeysState.rows.find((k) => k.id === id);
    setApiKeysState((prev) => ({
      ...prev,
      rows: prev.rows.map((k) => (k.id === id ? { ...k, revoked: true } : k)),
    }));
    pushToast(target ? `${target.name} revoked` : `${id} revoked`);
    writeThrough(id, () => resources.revokeApiKey(id));
  }, [apiKeysState.rows, pushToast, writeThrough]);


  /* ---- Riders ----------------------------------------------------------- */

  const suspendRider = useCallback((id: string, reason: string) => {
    const target = ridersState.rows.find((r) => r.id === id);
    setPendingRidersState((prev) => ({
      ...prev,
      rows: prev.rows.map((r) => (r.id === id ? { ...r, status: 'suspended' as const } : r)),
    }));
    pushToast(target ? `${target.name} suspended` : `${id} suspended`);
    writeThrough(id, () => platform.suspendRider(id, reason));
  }, [ridersState.rows, pushToast, writeThrough]);

  /* ---- Customers -------------------------------------------------------- */

  const suspendCustomer = useCallback((id: string, reason: string) => {
    const target = customersState.rows.find((c) => c.id === id);
    pushToast(target ? `${target.name} suspended` : `${id} suspended`);
    writeThrough(id, () => platform.suspendUser(id, reason));
  }, [customersState.rows, pushToast, writeThrough]);

  const unsuspendCustomer = useCallback((id: string) => {
    const target = customersState.rows.find((c) => c.id === id);
    pushToast(target ? `${target.name} reinstated` : `${id} reinstated`);
    writeThrough(id, () => platform.unsuspendUser(id));
  }, [customersState.rows, pushToast, writeThrough]);

  const deleteCustomer = useCallback((id: string) => {
    const target = customersState.rows.find((c) => c.id === id);
    setCustomersState((prev) => ({ ...prev, rows: prev.rows.filter((c) => c.id !== id) }));
    pushToast(target ? `${target.name} deleted` : `${id} deleted`);
    writeThrough(id, () => platform.deleteUser(id));
  }, [customersState.rows, pushToast, writeThrough]);

  /* ---- Approval queues -------------------------------------------------- */

  const approveVendor = useCallback((id: string) => {
    const target = pendingVendorsState.rows.find((v) => v.id === id);
    setPendingVendorsState((prev) => ({
      ...prev,
      rows: prev.rows.map((v) => (v.id === id ? { ...v, status: 'approved' as const } : v)),
    }));
    pushToast(target ? `${target.name} approved` : `${id} approved`);
    writeThrough(id, () => platform.approveVendor(id));
  }, [pendingVendorsState.rows, pushToast, writeThrough]);

  const rejectVendor = useCallback((id: string, reason: string) => {
    const target = pendingVendorsState.rows.find((v) => v.id === id);
    setPendingVendorsState((prev) => ({
      ...prev,
      rows: prev.rows.map((v) => (v.id === id ? { ...v, status: 'rejected' as const } : v)),
    }));
    pushToast(target ? `${target.name} rejected` : `${id} rejected`);
    writeThrough(id, () => platform.rejectVendor(id, reason));
  }, [pendingVendorsState.rows, pushToast, writeThrough]);

  // Suspending reaches a vendor from two places — the approval queue and the
  // vendor's own drawer — so it updates whichever list holds them.
  const suspendVendor = useCallback((id: string, reason: string) => {
    const target = pendingVendorsState.rows.find((v) => v.id === id)
      ?? vendorsState.rows.find((v) => v.id === id);
    setPendingVendorsState((prev) => ({
      ...prev,
      rows: prev.rows.map((v) => (v.id === id ? { ...v, status: 'suspended' as const } : v)),
    }));
    setVendorsState((prev) => ({
      ...prev,
      rows: prev.rows.map((v) => (v.id === id ? { ...v, status: 'suspended' as const } : v)),
    }));
    pushToast(target ? `${target.name} suspended` : `${id} suspended`);
    writeThrough(id, () => platform.suspendVendor(id, reason));
  }, [pendingVendorsState.rows, vendorsState.rows, pushToast, writeThrough]);

  const approveRider = useCallback((id: string) => {
    const target = pendingRidersState.rows.find((r) => r.id === id);
    setPendingRidersState((prev) => ({
      ...prev,
      rows: prev.rows.map((r) => (r.id === id ? { ...r, status: 'approved' as const } : r)),
    }));
    pushToast(target ? `${target.name} approved` : `${id} approved`);
    writeThrough(id, () => platform.approveRider(id));
  }, [pendingRidersState.rows, pushToast, writeThrough]);

  const rejectRider = useCallback((id: string, reason: string) => {
    const target = pendingRidersState.rows.find((r) => r.id === id);
    setPendingRidersState((prev) => ({
      ...prev,
      rows: prev.rows.map((r) => (r.id === id ? { ...r, status: 'rejected' as const } : r)),
    }));
    pushToast(target ? `${target.name} rejected` : `${id} rejected`);
    writeThrough(id, () => platform.rejectRider(id, reason));
  }, [pendingRidersState.rows, pushToast, writeThrough]);

  /**
   * Document decisions are recorded on the rider, but deliberately do not move
   * the rider's own status — the API treats approval as a separate act once
   * every document has been reviewed.
   */
  const verifyRiderDocuments = useCallback((id: string, decisions: DocumentVerdict[]) => {
    setPendingRidersState((prev) => ({
      ...prev,
      rows: prev.rows.map((r) => (r.id === id
        ? {
          ...r,
          documents: r.documents.map((doc) => {
            const verdict = decisions.find((d) => d.document_type === doc.type);
            if (!verdict) return doc;
            return {
              ...doc,
              status: verdict.status === 'APPROVED' ? 'approved' as const : 'rejected' as const,
              reason: verdict.reason ?? null,
            };
          }),
        }
        : r)),
    }));
    pushToast(`${decisions.length} document${decisions.length === 1 ? '' : 's'} reviewed`);
    writeThrough(id, () => platform.verifyRiderDocuments(id, decisions));
  }, [pushToast, writeThrough]);

  const toggleOffer = useCallback((id: number) => {
    setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, active: !o.active } : o)));
  }, []);

  /** Keyboard-operable equivalent of the drag handle — section 11. */
  const toggleSection = useCallback((id: number) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
  }, []);

  const toggleFeeRule = useCallback((id: string) => {
    setFeeRules((prev) => prev.map((f) => (f.id === id ? { ...f, active: !f.active } : f)));
  }, []);


  /* ---- Region scoping -----------------------------------------------------
   * One rule throughout: a record we cannot place is always shown. Filtering
   * is there to narrow attention, never to hide work an admin would otherwise
   * have acted on.
   */

  const inScope = useCallback(
    (rowRegion?: Region | null) => region === ALL_REGIONS || !rowRegion || rowRegion === region,
    [region],
  );

  const scopedOrders = useMemo(
    () => ordersState.rows.filter((o) => inScope(o.region)),
    [ordersState.rows, inScope],
  );
  const scopedVendors = useMemo(
    () => vendorsState.rows.filter((v) => inScope(v.region)),
    [vendorsState.rows, inScope],
  );
  const scopedRiders = useMemo(
    () => ridersState.rows.filter((r) => inScope(r.region)),
    [ridersState.rows, inScope],
  );
  const scopedCustomers = useMemo(
    () => customersState.rows.filter((c) => inScope(c.region)),
    [customersState.rows, inScope],
  );

  // Disputes and approvals carry no region of their own, so they inherit one
  // from the order or vendor they are about. Anything we cannot match stays
  // visible rather than disappearing from a filtered view.
  const orderRegion = useMemo(() => {
    const map = new Map<string, Region>();
    for (const o of ordersState.rows) map.set(o.id, o.region);
    return map;
  }, [ordersState.rows]);

  const vendorRegion = useMemo(() => {
    const map = new Map<string, Region>();
    for (const v of vendorsState.rows) map.set(v.name, v.region);
    return map;
  }, [vendorsState.rows]);

  const scopedDisputes = useMemo(
    () => disputesState.rows.filter(
      (d) => inScope(d.orderId ? orderRegion.get(d.orderId) : null),
    ),
    [disputesState.rows, orderRegion, inScope],
  );

  const scopedApprovals = useMemo(
    () => approvalsState.rows.filter((a) => inScope(vendorRegion.get(a.vendor))),
    [approvalsState.rows, vendorRegion, inScope],
  );

  // Applicants do carry their own region, so they scope directly.
  const scopedPendingVendors = useMemo(
    () => pendingVendorsState.rows.filter((v) => inScope(v.region)),
    [pendingVendorsState.rows, inScope],
  );

  const scopedPendingRiders = useMemo(
    () => pendingRidersState.rows.filter((r) => inScope(r.region)),
    [pendingRidersState.rows, inScope],
  );

  const personRegion = useMemo(() => {
    const map = new Map<string, Region>();
    for (const r of ridersState.rows) map.set(r.name, r.region);
    for (const v of vendorsState.rows) map.set(v.name, v.region);
    return map;
  }, [ridersState.rows, vendorsState.rows]);

  const scopedPayouts = useMemo(
    () => payoutsState.rows.filter((p) => inScope(personRegion.get(p.who))),
    [payoutsState.rows, personRegion, inScope],
  );

  const scopedPayments = useMemo(
    () => paymentsState.rows.filter(
      (p) => inScope(personRegion.get(p.to) ?? personRegion.get(p.from)),
    ),
    [paymentsState.rows, personRegion, inScope],
  );

  const ordersByRegion = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of ordersState.rows) {
      if (CLOSED.includes(o.status)) continue;
      counts[o.region] = (counts[o.region] ?? 0) + 1;
    }
    return counts;
  }, [ordersState.rows]);

  const nationalTotals = useMemo(() => ({
    orders: ordersState.rows.length,
    vendors: vendorsState.rows.length,
    riders: ridersState.rows.length,
    customers: customersState.rows.length,
  }), [ordersState.rows, vendorsState.rows, ridersState.rows, customersState.rows]);

  const orders = scopedOrders;
  const payouts = scopedPayouts;

  const openOrders = useMemo(
    () => orders.filter((o) => !CLOSED.includes(o.status)).length,
    [orders],
  );
  const pendingPayouts = useMemo(
    () => payouts.filter((p) => p.status === 'pending').length,
    [payouts],
  );
  const openDisputes = useMemo(
    () => scopedDisputes.filter((d) => d.status === 'open').length,
    [scopedDisputes],
  );
  const pendingApprovals = useMemo(
    () => scopedApprovals.filter((a) => a.status === 'pending').length
      + scopedPendingVendors.filter((v) => v.status === 'pending').length
      + scopedPendingRiders.filter((r) => r.status === 'pending').length,
    [scopedApprovals, scopedPendingVendors, scopedPendingRiders],
  );

  const isSample = !live || ordersState.sample;
  const sampleOnly = useCallback(
    <T,>(v: T): T | undefined => (isSample ? v : undefined),
    [isSample],
  );

  const value: AppStateValue = {
    orders, ordersState, cancelOrder, assignRider,
    vendors: scopedVendors, vendorsState,
    riders: scopedRiders, ridersState, suspendRider,
    customers: scopedCustomers, customersState,
    suspendCustomer, unsuspendCustomer, deleteCustomer,
    payments: scopedPayments, paymentsState,
    payouts, payoutsState, approvePayout, declinePayout,
    disputes: scopedDisputes, disputesState,
    resolveDispute, rejectDispute,
    approvals: scopedApprovals, approvalsState,
    approveMenu, rejectMenu,
    pendingVendors: scopedPendingVendors, pendingVendorsState,
    approveVendor, rejectVendor, suspendVendor,
    pendingRiders: scopedPendingRiders, pendingRidersState,
    approveRider, rejectRider, verifyRiderDocuments,
    apiKeys: apiKeysState.rows, apiKeysState,
    createApiKey, revokeApiKey,
    offers, toggleOffer,
    sections, toggleSection,
    feeRules, toggleFeeRule,
    openOrders, pendingPayouts, openDisputes, pendingApprovals,
    region, setRegion, ordersByRegion, nationalTotals,
    isSample, sampleOnly,
    toasts, pushToast,
    reload,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
