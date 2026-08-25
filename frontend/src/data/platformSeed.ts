// Sample platform config, feature flags and admin accounts, so Settings is
// reachable without a live session.

import type { PlatformConfig, FeatureFlag, AdminUser } from './types';

export const platformConfig: PlatformConfig = {
  commissionRate: 15,
  serviceFee: 2.5,
  riderCut: 10,
  baseDeliveryFare: 500,
};

export const featureFlags: FeatureFlag[] = [
  {
    key: 'accept_orders', enabled: true,
    description: 'Turning this off stops every vertical taking orders immediately.',
  },
  {
    key: 'scheduled_orders', enabled: true,
    description: 'Customers can pick a delivery slot up to 48 hours ahead.',
  },
  {
    key: 'auto_assign_riders', enabled: true,
    description: 'Orders go to the nearest idle rider without an admin picking one.',
  },
  {
    key: 'surge_pricing', enabled: false,
    description: 'Delivery fees rise automatically when demand outruns riders on shift.',
  },
  {
    key: 'vendor_self_signup', enabled: false,
    description: 'New vendors can register without an invite and wait under review.',
  },
];

export const adminUsers: AdminUser[] = [
  {
    id: 'AD-01', name: 'Ngwa Bertrand', email: 'bertrand@reeyo.cm',
    role: 'SUPER_ADMIN', status: 'ACTIVE', lastLogin: '12 min ago',
  },
  {
    id: 'AD-02', name: 'Sylvie Abena', email: 'sylvie@reeyo.cm',
    role: 'ADMIN', status: 'ACTIVE', lastLogin: '2 hr ago',
  },
  {
    id: 'AD-03', name: 'Junior Fokou', email: 'junior@reeyo.cm',
    role: 'ADMIN', status: 'ACTIVE', lastLogin: '1 d ago',
  },
  {
    id: 'AD-04', name: 'Mireille Tabi', email: 'mireille@reeyo.cm',
    role: 'ADMIN', status: 'SUSPENDED', lastLogin: '3 w ago',
  },
];
