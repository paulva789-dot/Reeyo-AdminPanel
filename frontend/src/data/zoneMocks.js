// src/data/zoneMocks.js

// Mock delivery zones for Douala/Buea region in Cameroon
// Each zone has polygon coordinates, delivery fee, and color coding

export const deliveryZones = [
  {
    id: 'zone-001',
    name: 'Akwa Downtown',
    description: 'Central business district',
    coordinates: [
      [4.050, 9.700],  // Northwest corner
      [4.050, 9.730],  // Northeast corner
      [4.030, 9.730],  // Southeast corner
      [4.030, 9.700],  // Southwest corner
    ],
    deliveryFee: 500,
    color: '#10b981', // Green
    isActive: true,
    averageDeliveryTime: '15-20 min',
    totalOrders: 1248,
    activeDrivers: 12,
    createdAt: '2024-01-15',
  },
  {
    id: 'zone-002',
    name: 'Bonanjo',
    description: 'Administrative area',
    coordinates: [
      [4.060, 9.730],
      [4.060, 9.760],
      [4.040, 9.760],
      [4.040, 9.730],
    ],
    deliveryFee: 750,
    color: '#3b82f6', // Blue
    isActive: true,
    averageDeliveryTime: '20-25 min',
    totalOrders: 896,
    activeDrivers: 8,
    createdAt: '2024-01-20',
  },
  {
    id: 'zone-003',
    name: 'Bonaberi',
    description: 'West Douala industrial zone',
    coordinates: [
      [4.080, 9.680],
      [4.080, 9.710],
      [4.060, 9.710],
      [4.060, 9.680],
    ],
    deliveryFee: 1000,
    color: '#f59e0b', // Orange
    isActive: true,
    averageDeliveryTime: '25-30 min',
    totalOrders: 654,
    activeDrivers: 6,
    createdAt: '2024-02-01',
  },
  {
    id: 'zone-004',
    name: 'Bepanda',
    description: 'Residential area',
    coordinates: [
      [4.070, 9.740],
      [4.070, 9.770],
      [4.050, 9.770],
      [4.050, 9.740],
    ],
    deliveryFee: 800,
    color: '#8b5cf6', // Purple
    isActive: true,
    averageDeliveryTime: '20-25 min',
    totalOrders: 432,
    activeDrivers: 5,
    createdAt: '2024-02-10',
  },
  {
    id: 'zone-005',
    name: 'Buea Town',
    description: 'University area',
    coordinates: [
      [4.160, 9.230],
      [4.160, 9.260],
      [4.140, 9.260],
      [4.140, 9.230],
    ],
    deliveryFee: 1200,
    color: '#ef4444', // Red
    isActive: true,
    averageDeliveryTime: '30-35 min',
    totalOrders: 789,
    activeDrivers: 7,
    createdAt: '2024-02-15',
  },
];

/**
 * Generate a new zone ID
 */
export const generateZoneId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `zone-${timestamp}-${random}`;
};

/**
 * Get random color for new zones
 */
export const getRandomZoneColor = () => {
  const colors = [
    '#10b981', // Green
    '#3b82f6', // Blue
    '#f59e0b', // Orange
    '#8b5cf6', // Purple
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#f97316', // Deep Orange
    '#14b8a6', // Teal
    '#6366f1', // Indigo
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Calculate approximate area of a polygon (simplified)
 * @param {Array} coordinates - Array of [lat, lng] coordinates
 * @returns {number} - Approximate area in square kilometers
 */
export const calculateZoneArea = (coordinates) => {
  if (!coordinates || coordinates.length < 3) return 0;
  
  // Simplified area calculation (not geodesically accurate)
  let area = 0;
  const n = coordinates.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coordinates[i][0] * coordinates[j][1];
    area -= coordinates[j][0] * coordinates[i][1];
  }
  
  area = Math.abs(area) / 2;
  
  // Convert to approximate square kilometers (rough conversion)
  // 1 degree ≈ 111 km at equator
  return (area * 111 * 111).toFixed(2);
};

/**
 * Check if a point is inside a polygon
 * @param {Array} point - [lat, lng]
 * @param {Array} polygon - Array of [lat, lng] coordinates
 * @returns {boolean}
 */
export const isPointInZone = (point, polygon) => {
  const [x, y] = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
};

/**
 * Validate zone data
 * @param {Object} zone
 * @returns {Object} - { valid: boolean, errors: Array }
 */
export const validateZone = (zone) => {
  const errors = [];
  
  if (!zone.name || zone.name.trim().length === 0) {
    errors.push('Zone name is required');
  }
  
  if (!zone.deliveryFee || zone.deliveryFee < 0) {
    errors.push('Valid delivery fee is required');
  }
  
  if (!zone.coordinates || zone.coordinates.length < 3) {
    errors.push('At least 3 coordinates are required to form a zone');
  }
  
  if (!zone.color) {
    errors.push('Zone color is required');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Format currency for display
 * @param {number} amount
 * @returns {string}
 */
export const formatDeliveryFee = (amount) => {
  return new Intl.NumberFormat('en-CM', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
  }).format(amount);
};