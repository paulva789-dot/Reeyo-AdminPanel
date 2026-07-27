// src/pages/Settings/components/Integrations.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard, RefreshCw, Info } from 'lucide-react';
import { apiClient, ApiError } from '../../../services/apiClient';
import { useAuth } from '../../../context/AuthContext';

const GATEWAY_LABELS = {
  'payments.campay': 'CamPay (Mobile Money)',
  'payments.notchpay': 'NotchPay',
  'payments.paystack': 'Paystack',
  'payments.flutterwave': 'Flutterwave',
  'payments.mpesa': 'M-Pesa',
  'payments.stripe': 'Stripe',
};

const Integrations = () => {
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
      setFlags((res.data || []).filter((f) => f.key.startsWith('payments.')));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load payment integrations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const toggleGateway = async (flag) => {
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 border-b pb-2 mb-6">Integrations Management</h1>

      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-sm text-gray-700">
        <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
        <p>
          Payment gateway credentials (API keys/secrets) live in the backend's own environment configuration, not here — this panel
          only controls whether a gateway is turned on for checkout, via the same feature flags as the Feature Flags editor.
          Notification, mapping, and email-marketing integrations aren't exposed by the admin-api and aren't shown here.
        </p>
      </div>

      {!isSuperAdmin && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          You have read-only access. A Super Admin can toggle gateways here.
        </p>
      )}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center py-16"><RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flags.map((flag) => (
            <div key={flag.key} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CreditCard size={18} className="text-indigo-600" />
                  <h4 className="font-medium text-gray-800">{GATEWAY_LABELS[flag.key] || flag.key}</h4>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${flag.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                  {flag.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <button
                onClick={() => toggleGateway(flag)}
                disabled={!isSuperAdmin || saving === flag.key}
                className={`w-full px-3 py-1.5 text-sm rounded-md transition disabled:opacity-50 ${
                  flag.enabled ? 'border border-red-300 text-red-600 hover:bg-red-50' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {flag.enabled ? 'Disable' : 'Enable'}
              </button>
            </div>
          ))}
          {flags.length === 0 && <p className="col-span-full text-center text-gray-500 py-8">No payment gateway flags configured.</p>}
        </div>
      )}
    </div>
  );
};

export default Integrations;
