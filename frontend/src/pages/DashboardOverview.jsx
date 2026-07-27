// src/pages/DashboardOverview.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Store,
  Bike,
  ShoppingBag,
  TrendingUp,
  RefreshCw,
  Package,
  Clock3,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { apiClient, ApiError } from '../services/apiClient';

const formatXAF = (amount) => Number(amount || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 });

function StatCard({ title, value, icon: Icon }) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
      </div>
      <h3 className="text-sm text-gray-500 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value ?? '—'}</p>
    </motion.div>
  );
}

function DashboardOverview() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [live, setLive] = useState(null);
  const [revenueSeries, setRevenueSeries] = useState([]);
  const [topVendors, setTopVendors] = useState([]);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    const today = new Date();
    const to = today.toISOString().slice(0, 10);
    const from7 = new Date(today);
    from7.setDate(from7.getDate() - 6);
    const from = from7.toISOString().slice(0, 10);

    try {
      const [liveRes, revenueRes, vendorsRes] = await Promise.all([
        apiClient.get('/analytics/live'),
        apiClient.get('/analytics/revenue/daily', { from, to }),
        apiClient.get('/analytics/top-vendors', { limit: 5, from, to }),
      ]);
      setLive(liveRes.data);
      setRevenueSeries(revenueRes.data || []);
      setTopVendors(vendorsRes.data || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load the dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(() => {
      apiClient.get('/analytics/live').then((res) => setLive(res.data)).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="ml-3 text-lg text-gray-600">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Live snapshot of the platform, updated every 15 seconds.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Revenue Today" value={live ? formatXAF(live.revenue_today) : undefined} icon={TrendingUp} />
        <StatCard title="Orders Today" value={live?.orders_today} icon={ShoppingBag} />
        <StatCard title="Active Orders" value={live?.active_orders} icon={Package} />
        <StatCard title="Online Riders / Vendors" value={live ? `${live.online_riders} / ${live.online_vendors}` : undefined} icon={Bike} />
      </div>

      {live?.pending_approvals && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3 text-sm text-yellow-800">
          <Clock3 className="w-5 h-5 flex-shrink-0" />
          <span>
            Pending approvals: <strong>{live.pending_approvals.vendors}</strong> vendors, <strong>{live.pending_approvals.riders}</strong> riders,{' '}
            <strong>{live.pending_approvals.payouts}</strong> payouts.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Revenue — Last 7 Days</h2>
          </div>
          {revenueSeries.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenueSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#999" />
                <YAxis tick={{ fontSize: 12 }} stroke="#999" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} formatter={(value) => formatXAF(value)} />
                <Line type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={3} dot={{ fill: '#F97316', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 italic">No revenue data for the last 7 days.</p>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Top Vendors — Last 7 Days</h2>
          </div>
          <div className="space-y-3">
            {topVendors.map((entry, idx) => (
              <div key={entry.vendor.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-gray-700">{idx + 1}. {entry.vendor.business_name}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 text-sm">{formatXAF(entry.revenue)}</p>
                  <p className="text-xs text-gray-500">{entry.orders} orders</p>
                </div>
              </div>
            ))}
            {topVendors.length === 0 && <p className="text-gray-500 italic">No vendor activity for this period.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardOverview;
