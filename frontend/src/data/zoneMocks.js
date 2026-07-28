// src/data/zoneMocks.js
//
// Pure display helpers still used by the (now real-data) Delivery Zones
// page. The mock zone list and its id/validation helpers were removed
// once DeliveryZones.jsx was wired to GET/POST/PATCH/DELETE /logistics/zones.

/**
 * Deterministic color per zone id, since the backend doesn't store a
 * color field — this keeps a zone's map color stable across reloads
 * without needing to persist it.
 */
const ZONE_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444',
  '#06b6d4', '#ec4899', '#f97316', '#14b8a6', '#6366f1',
];

export const colorForZoneId = (id) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return ZONE_COLORS[hash % ZONE_COLORS.length];
};

export const formatDeliveryFee = (amount) => {
  if (amount === null || amount === undefined) return 'Platform default';
  return new Intl.NumberFormat('en-CM', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
  }).format(amount);
};
