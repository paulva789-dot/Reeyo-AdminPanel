// src/pages/Analytics/AnalyticsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Bike,
  Store,
  TrendingUp,
  RefreshCw,
  Package,
  BarChart3,
  PieChart,
  ShoppingBag,
  Users,
  Truck,
  Clock,
} from 'lucide-react';
import DateFilter from '../../components/DateFilter';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { apiClient, ApiError } from '../../services/apiClient';

const TABS = {
  OVERVIEW: 'overview',
  REVENUE: 'revenue',
  LEADERBOARDS: 'leaderboards',
};

const formatXAF = (amount) => Number(amount || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 });

function periodToRange(period) {
  const today = new Date();
  const iso = (d) => d.toISOString().slice(0, 10);
  const to = iso(today);
  switch (period) {
    case 'yesterday': {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { from: iso(y), to: iso(y), granularity: 'daily' };
    }
    case 'lastWeek': {
      const from = new Date(today);
      from.setDate(from.getDate() - 7);
      return { from: iso(from), to, granularity: 'daily' };
    }
    case 'lastMonth': {
      const from = new Date(today);
      from.setMonth(from.getMonth() - 1);
      return { from: iso(from), to, granularity: 'weekly' };
    }
    case 'lastYear': {
      const from = new Date(today);
      from.setFullYear(from.getFullYear() - 1);
      return { from: iso(from), to, granularity: 'monthly' };
    }
    default:
      return { from: to, to, granularity: 'daily' };
  }
}

const AnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState(TABS.OVERVIEW);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [live, setLive] = useState(null);
  const [revenueSeries, setRevenueSeries] = useState([]);
  const [ordersBreakdown, setOrdersBreakdown] = useState(null);
  const [topVendors, setTopVendors] = useState([]);
  const [topRiders, setTopRiders] = useState([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    const { from, to, granularity } = periodToRange(selectedPeriod);
    try {
      const [revenueRes, ordersRes, vendorsRes, ridersRes] = await Promise.all([
        apiClient.get(`/analytics/revenue/${granularity}`, { from, to }),
        apiClient.get('/analytics/orders', { from, to }),
        apiClient.get('/analytics/top-vendors', { limit: 10, from, to }),
        apiClient.get('/analytics/riders', { limit: 10 }),
      ]);
      setRevenueSeries(revenueRes.data || []);
      setOrdersBreakdown(ordersRes.data || null);
      setTopVendors(vendorsRes.data || []);
      setTopRiders(ridersRes.data || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load analytics.');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Live snapshot widget: poll every 15s per the admin-api integration checklist.
  useEffect(() => {
    let cancelled = false;
    const poll = () => {
      apiClient
        .get('/analytics/live')
        .then((res) => { if (!cancelled) setLive(res.data); })
        .catch(() => {});
    };
    poll();
    const interval = setInterval(poll, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const dateKey = revenueSeries[0] ? Object.keys(revenueSeries[0]).find((k) => k !== 'orders' && k !== 'revenue' && k !== 'commission' && k !== 'currency') : 'day';

  return (
    <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-gray-100 flex items-center">
          <BarChart3 size={28} className="mr-3 text-indigo-600" />
          Analytics Dashboard
        </h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Live snapshot */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Active Orders', value: live?.active_orders, icon: Package, color: 'text-indigo-600' },
          { label: 'Online Riders', value: live?.online_riders, icon: Bike, color: 'text-blue-600' },
          { label: 'Online Vendors', value: live?.online_vendors, icon: Store, color: 'text-orange-600' },
          { label: 'Orders Today', value: live?.orders_today, icon: ShoppingBag, color: 'text-green-600' },
          { label: 'Revenue Today', value: live ? formatXAF(live.revenue_today) : undefined, icon: TrendingUp, color: 'text-emerald-600' },
        ].map((item) => (
          <div key={item.label} className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow flex items-center gap-3">
            <item.icon size={22} className={item.color} />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
              <p className="font-bold text-gray-800 dark:text-white">{item.value ?? '—'}</p>
            </div>
          </div>
        ))}
      </div>
      {live?.pending_approvals && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
          Pending approvals: {live.pending_approvals.vendors} vendors, {live.pending_approvals.riders} riders, {live.pending_approvals.payouts} payouts.
        </p>
      )}

      <DateFilter selectedPeriod={selectedPeriod} onPeriodChange={setSelectedPeriod} />

      <div className="flex space-x-4 mb-6">
        {[
          { id: TABS.OVERVIEW, label: 'Orders Breakdown', icon: PieChart },
          { id: TABS.REVENUE, label: 'Revenue', icon: Package },
          { id: TABS.LEADERBOARDS, label: 'Leaderboards', icon: Users },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
              activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <>
          {activeTab === TABS.OVERVIEW && ordersBreakdown && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-100">Orders by Status</h3>
                <div className="space-y-2">
                  {Object.entries(ordersBreakdown.by_status || {}).map(([status, count]) => (
                    <div key={status} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{status.replace(/_/g, ' ')}</span>
                      <span className="font-semibold text-gray-800 dark:text-white">{count}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between font-semibold">
                  <span>Total Orders</span>
                  <span>{ordersBreakdown.total}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>Avg Order Value</span>
                  <span>{formatXAF(ordersBreakdown.avg_order_value)}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow space-y-6">
                <div>
                  <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-100">By Country</h3>
                  {Object.entries(ordersBreakdown.by_country || {}).map(([country, count]) => (
                    <div key={country} className="flex justify-between text-sm py-1">
                      <span className="text-gray-600 dark:text-gray-400">{country}</span>
                      <span className="font-semibold text-gray-800 dark:text-white">{count}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-100">By Payment Method</h3>
                  {Object.entries(ordersBreakdown.by_payment_method || {}).map(([method, count]) => (
                    <div key={method} className="flex justify-between text-sm py-1">
                      <span className="text-gray-600 dark:text-gray-400">{method.replace(/_/g, ' ')}</span>
                      <span className="font-semibold text-gray-800 dark:text-white">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === TABS.REVENUE && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-100">Revenue & Orders Trend</h3>
                {revenueSeries.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={revenueSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey={dateKey} />
                      <YAxis />
                      <Tooltip formatter={(value) => formatXAF(value)} />
                      <Line type="monotone" dataKey="revenue" stroke="#6366f1" name="Revenue" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">No revenue data for this period.</p>
                )}
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-100">Period Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-gray-600 dark:text-gray-300">Total Revenue</span>
                    <span className="font-bold text-gray-800 dark:text-white">{formatXAF(revenueSeries.reduce((s, r) => s + (r.revenue || 0), 0))}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-gray-600 dark:text-gray-300">Total Orders</span>
                    <span className="font-bold text-gray-800 dark:text-white">{revenueSeries.reduce((s, r) => s + (r.orders || 0), 0)}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-gray-600 dark:text-gray-300">Platform Commission</span>
                    <span className="font-bold text-green-600">{formatXAF(revenueSeries.reduce((s, r) => s + (r.commission || 0), 0))}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === TABS.LEADERBOARDS && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-800 dark:text-gray-100">
                  <Store size={18} className="text-orange-500" />
                  Top Vendors
                </h3>
                <div className="space-y-2">
                  {topVendors.map((entry, idx) => (
                    <div key={entry.vendor.id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700 dark:text-gray-300">{idx + 1}. {entry.vendor.business_name} <span className="text-gray-400">({entry.vendor.city})</span></span>
                      <span className="font-medium text-gray-800 dark:text-white">{entry.orders} orders &middot; {formatXAF(entry.revenue)}</span>
                    </div>
                  ))}
                  {topVendors.length === 0 && <p className="text-gray-500 dark:text-gray-400 italic">No data for this period.</p>}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-800 dark:text-gray-100">
                  <Truck size={18} className="text-blue-500" />
                  Top Riders
                </h3>
                <div className="space-y-2">
                  {topRiders.map((entry, idx) => (
                    <div key={entry.rider.id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700 dark:text-gray-300">{idx + 1}. {entry.rider.name} <span className="text-gray-400">({entry.rider.vehicle_type})</span></span>
                      <span className="font-medium text-gray-800 dark:text-white flex items-center gap-1">
                        {entry.deliveries} deliveries &middot; <Clock size={12} /> {entry.avg_delivery_mins}min
                      </span>
                    </div>
                  ))}
                  {topRiders.length === 0 && <p className="text-gray-500 dark:text-gray-400 italic">No data available.</p>}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
