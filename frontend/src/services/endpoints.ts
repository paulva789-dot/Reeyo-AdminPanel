// The real admin-api surface, probed against the deployed backend on
// 2026-08-22. A 401 means the route exists and needs auth; a 404 means it is
// genuinely not built. Keeping this map explicit stops us wiring a page to a
// route that was only ever a guess.

export const ENDPOINTS = {
  // Auth — all present
  me: '/auth/me',
  login: '/auth/login',
  logout: '/auth/logout',
  refresh: '/auth/refresh',
  changePassword: '/auth/change-password',

  // Present
  orders: '/orders',
  orderSearch: '/orders/search',
  riders: '/riders',
  riderDeliveries: (id: string) => `/riders/${id}/deliveries`,
  vendors: '/vendors',
  menuApprovals: '/vendors/menu-approvals',
  users: '/users', // customers live here, NOT at /customers
  disputes: '/disputes',
  analyticsOverview: '/analytics/overview',
  payouts: '/payouts',
  payoutRequests: '/payouts/requests',
  config: '/config',
  configSettings: '/config/settings',
  apiKeys: '/config/api-keys',
  uploads: '/uploads',
} as const;

/**
 * Features with no backend route on this deployment. Probed and confirmed 404:
 * /customers (it is /users), /zones, /delivery-zones, /settlements,
 * /announcements, /banners, /offers, /admins.
 *
 * Pages covering these run on local seed data and say so in the UI rather than
 * pretending to be live. This mirrors what docs/BACKEND_ENDPOINT_REQUESTS.md
 * tracked on the previous panel.
 */
export const NOT_ON_BACKEND = [
  'offers', 'banners', 'announcements', 'spin wheel', 'delivery zones',
  'storefront sections', 'delivery fee rules', 'teams',
] as const;

export type MissingFeature = (typeof NOT_ON_BACKEND)[number];
