// The admin-api surface, transcribed from docs/ADMIN-API-ENDPOINT-REFERENCE.md,
// which the backend team verified against the live deployment and the route
// source. That document is the source of truth: if anything here disagrees with
// it, this file is wrong.
//
// Endpoints marked SUPER_ADMIN return 403 for a plain admin. The console gates
// those controls rather than letting the request fail silently.

export const ENDPOINTS = {
  /* Auth ------------------------------------------------------------------ */
  login: '/auth/login',
  refresh: '/auth/refresh',
  me: '/auth/me',
  logout: '/auth/logout',
  changePassword: '/auth/change-password',

  /* Users — the console calls these customers -----------------------------*/
  users: '/users',
  user: (id: string) => `/users/${id}`,
  userOrders: (id: string) => `/users/${id}/orders`,
  suspendUser: (id: string) => `/users/${id}/suspend`,
  unsuspendUser: (id: string) => `/users/${id}/unsuspend`,
  deleteUser: (id: string) => `/users/${id}`,

  /* Vendors ---------------------------------------------------------------*/
  vendors: '/vendors',
  vendor: (id: string) => `/vendors/${id}`,
  vendorOrders: (id: string) => `/vendors/${id}/orders`,
  vendorMenuItems: (id: string) => `/vendors/${id}/menu-items`,
  approveVendor: (id: string) => `/vendors/${id}/approve`,
  rejectVendor: (id: string) => `/vendors/${id}/reject`,
  suspendVendor: (id: string) => `/vendors/${id}/suspend`,
  featureVendor: (id: string) => `/vendors/${id}/feature`,
  updateVendor: (id: string) => `/vendors/${id}`,
  vendorCommission: (id: string) => `/vendors/${id}/commission`,

  /* Riders ----------------------------------------------------------------*/
  riders: '/riders',
  riderLiveLocations: '/riders/live-locations',
  rider: (id: string) => `/riders/${id}`,
  riderDeliveries: (id: string) => `/riders/${id}/deliveries`,
  approveRider: (id: string) => `/riders/${id}/approve`,
  rejectRider: (id: string) => `/riders/${id}/reject`,
  verifyRiderDocuments: (id: string) => `/riders/${id}/verify-documents`,
  suspendRider: (id: string) => `/riders/${id}/suspend`,
  updateRider: (id: string) => `/riders/${id}`,

  /* Orders ----------------------------------------------------------------*/
  orders: '/orders',
  orderSearch: '/orders/search',
  order: (id: string) => `/orders/${id}`,
  orderTimeline: (id: string) => `/orders/${id}/timeline`,
  assignRider: (id: string) => `/orders/${id}/assign-rider`,
  cancelOrder: (id: string) => `/orders/${id}/cancel`,

  /* Analytics — six endpoints, not one overview ---------------------------*/
  analyticsPlatform: '/analytics/platform',
  analyticsRevenue: '/analytics/revenue',
  analyticsTopVendors: '/analytics/top-vendors',
  analyticsTopRiders: '/analytics/top-riders',
  analyticsOrderStatus: '/analytics/order-status',
  analyticsLive: '/analytics/live',

  /* Config ----------------------------------------------------------------*/
  config: '/config',
  commissionRate: '/config/commission-rate',
  updateConfig: '/config',                       // SUPER_ADMIN
  featureFlags: '/config/feature-flags',
  featureFlag: (key: string) => `/config/feature-flags/${key}`, // SUPER_ADMIN
  apiKeys: '/config/api-keys',                   // SUPER_ADMIN
  apiKey: (id: string) => `/config/api-keys/${id}`,             // SUPER_ADMIN

  /* Disputes — there is no messages endpoint ------------------------------*/
  disputes: '/disputes',
  dispute: (id: string) => `/disputes/${id}`,
  resolveDispute: (id: string) => `/disputes/${id}/resolve`,
  rejectDispute: (id: string) => `/disputes/${id}/reject`,

  /* Payouts — pending and history, approve/reject need the recipient type -*/
  payoutsPending: '/payouts/pending',
  payoutsHistory: '/payouts/history',
  approvePayout: (id: string) => `/payouts/${id}/approve`,
  rejectPayout: (id: string) => `/payouts/${id}/reject`,

  /* Broadcast — push notifications ----------------------------------------*/
  broadcastUsers: '/broadcast/users',
  broadcastVendors: '/broadcast/vendors',
  broadcastRiders: '/broadcast/riders',

  /* Engagement — reads open, writes SUPER_ADMIN ---------------------------*/
  banners: '/engagement/banners',
  banner: (id: string) => `/engagement/banners/${id}`,
  trackingFacts: '/engagement/tracking-facts',
  preferenceTags: '/engagement/preference-tags',
  loyaltyRules: '/engagement/loyalty/rules',
  loyaltyRewards: '/engagement/loyalty/rewards',
  loyaltyAccount: (userId: string) => `/engagement/loyalty/accounts/${userId}`,
  spinWheels: '/engagement/spin-wheels',
  spinWheel: (id: string) => `/engagement/spin-wheels/${id}`,
  popups: '/engagement/popups',
  popup: (id: string) => `/engagement/popups/${id}`,
  sharedCarts: '/engagement/shared-carts',
  vendorBadges: (id: string) => `/engagement/vendors/${id}/badges`,   // SUPER_ADMIN
  menuItemUpsell: (id: string) => `/engagement/menu-items/${id}/upsell`, // SUPER_ADMIN

  /* Menu approvals --------------------------------------------------------*/
  menuApprovals: '/menu-approvals',
  approveMenu: (id: string) => `/menu-approvals/${id}/approve`,
  rejectMenu: (id: string) => `/menu-approvals/${id}/reject`,

  /* Admin users -----------------------------------------------------------*/
  adminUsers: '/admin-users',                    // SUPER_ADMIN
  adminUser: (id: string) => `/admin-users/${id}`,              // SUPER_ADMIN

  /* Uploads ---------------------------------------------------------------*/
  uploads: '/uploads',

  /* Logistics -------------------------------------------------------------*/
  zones: '/logistics/zones',
  zone: (id: string) => `/logistics/zones/${id}`,
} as const;

/** Routes that answer 403 unless the signed-in admin is a SUPER_ADMIN. */
export const SUPER_ADMIN_ONLY = [
  'updateConfig', 'featureFlag', 'apiKeys', 'apiKey',
  'vendorBadges', 'menuItemUpsell', 'adminUsers', 'adminUser',
] as const;

/**
 * Health lives at the app root, NOT under /api/v1 — the reference calls this
 * out specifically because the prefixed path 404s.
 */
export const HEALTH_PATH = '/health';

/**
 * Genuinely absent from admin-api. Everything else the console once marked
 * "no backend route" turned out to exist under a path I had not probed —
 * zones under /logistics, banners and spin wheels under /engagement,
 * announcements under /broadcast, admins at /admin-users.
 */
export const NOT_ON_BACKEND = [
  'a generic order status update — only cancel and assign-rider are writable',
  'dispute messages — resolve and reject are the only dispute writes',
  'admin-initiated refunds outside an existing dispute',
  'storefront home-section ordering',
  'delivery fee rules as a standalone resource',
  'delivery teams',
] as const;
