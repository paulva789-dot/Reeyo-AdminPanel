// src/data/sidebarNav.js
import { LayoutDashboard, Users, Utensils, Bike, Settings, FileText, DollarSign, Megaphone, Tag } from 'lucide-react';

export const sidebarNav = [
  {
    title: 'Analytics',
    icon: BarChart3,
    path: '/', // Maps to /pages/Analytics/AnalyticsPage.jsx
  },
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard', // Maps to /pages/DashboardOverview.jsx
  },
  {
    title: 'Order Management',
    icon: FileText,
    path: '/orders', // Maps to /pages/Orders/OrdersPage.jsx
  },
  {
    title: 'User Management',
    icon: Users,
    path: '/users',
    children: [
      { title: 'Customers', path: '/users/customers' },
      { title: 'Delivery Guys', path: '/users/delivery-guys' },
    ],
  },
  {
    title: 'Vendor Management',
    icon: Utensils,
    path: '/vendors',
    children: [
      { title: 'Vendor List', path: '/users/vendors' },
      { title: 'Menu Approvals', path: '/vendors/approvals' },
    ],
  },
  {
    title: 'Logistics',
    icon: Bike,
    path: '/logistics',
    children: [
        { title: 'Rider Live Tracker', path: '/logistics/live' },
        { title: 'Delivery Zone Setup', path: '/logistics/zones' },
    ]
  },
  { // NEW: Finance Page
    title: 'Platform Finance',
    icon: DollarSign,
    path: '/finance', 
  },
  { // NEW: Marketing Page
    title: 'Marketing Hub',
    icon: Tag,
    path: '/marketing', 
  },
  { // NEW: Announcements Page
    title: 'System Announcements',
    icon: Megaphone,
    path: '/announcements',
  },
  {
    title: 'System Settings',
    icon: Settings,
    path: '/settings',
  },
];