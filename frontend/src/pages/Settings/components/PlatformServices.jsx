// src/pages/Settings/components/PlatformServices.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Utensils, Package, ShoppingBag, Truck, Store, RefreshCw } from 'lucide-react';
import { apiClient, ApiError } from '../../../services/apiClient';
import { useAuth } from '../../../context/AuthContext';

const SERVICE_META = {
  'service.food': { name: 'Food Delivery', icon: Utensils, iconColor: 'text-orange-500', bgColor: 'bg-orange-100', description: 'Restaurant food delivery service' },
  'service.mart': { name: 'Mart', icon: ShoppingBag, iconColor: 'text-green-500', bgColor: 'bg-green-100', description: 'E-commerce and retail shopping' },
  'service.package': { name: 'Package Delivery', icon: Package, iconColor: 'text-blue-500', bgColor: 'bg-blue-100', description: 'Package and courier delivery service' },
  'service.parcel': { name: 'Parcel Delivery', icon: Truck, iconColor: 'text-purple-500', bgColor: 'bg-purple-100', description: 'Point-to-point parcel delivery' },
  'service.reeyomart': { name: 'ReeyoMart', icon: Store, iconColor: 'text-pink-500', bgColor: 'bg-pink-100', description: 'Reeyo-operated grocery storefront' },
};

const PlatformServices = () => {
  const { isSuperAdmin } = useAuth();
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(null);

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/config/feature-flags');
      setFlags((res.data || []).filter((f) => f.key.startsWith('service.')));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load platform services.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const toggleService = async (flag) => {
    if (!isSuperAdmin) return;
    setSaving(flag.key);
    setError('');
    try {
      const res = await apiClient.patch(`/config/feature-flags/${flag.key}`, { enabled: !flag.enabled });
      setFlags((prev) => prev.map((f) => (f.key === flag.key ? res.data : f)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Could not toggle ${flag.key}.`);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16"><RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800 border-b pb-2 mb-6">Platform Services Management</h1>

      <p className="text-gray-600 mb-4">
        Enable or disable platform services. When disabled, services show as "Closed" on the customer app. Backed by the same
        feature flags as the full editor — for rollout percentage or country scoping, use Feature Flags.
      </p>

      {!isSuperAdmin && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          You have read-only access. A Super Admin can toggle services here.
        </p>
      )}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {flags.map((flag) => {
          const meta = SERVICE_META[flag.key] || { name: flag.key, icon: Package, iconColor: 'text-gray-500', bgColor: 'bg-gray-100', description: flag.description };
          return (
            <div key={flag.key} className="border rounded-xl p-6 bg-white shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 ${meta.bgColor} rounded-lg flex items-center justify-center`}>
                  <meta.icon size={28} className={meta.iconColor} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-800">{meta.name}</h3>
                  <p className="text-sm text-gray-500">{meta.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{flag.enabled ? 'Active' : 'Closed'}</span>
                <button
                  onClick={() => toggleService(flag)}
                  disabled={!isSuperAdmin || saving === flag.key}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${flag.enabled ? 'bg-indigo-600' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${flag.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          );
        })}
        {flags.length === 0 && <p className="col-span-full text-center text-gray-500 py-8">No service flags found.</p>}
      </div>
    </div>
  );
};

export default PlatformServices;
