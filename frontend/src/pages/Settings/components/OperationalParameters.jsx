// src/pages/Settings/components/OperationalParameters.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Percent, Clock, MapPin, RefreshCw, Save } from 'lucide-react';
import { apiClient, ApiError } from '../../../services/apiClient';
import { useAuth } from '../../../context/AuthContext';

const PAYOUT_CURRENCIES = ['XAF', 'NGN', 'KES', 'GHS'];

const OperationalParameters = () => {
    const { isSuperAdmin } = useAuth();
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);

    const fetchConfig = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await apiClient.get('/config');
            setConfig(res.data);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Could not load platform config.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    const updateField = (field, value) => {
        setConfig((prev) => ({ ...prev, [field]: value }));
        setSaved(false);
    };

    const updateMinPayout = (currency, value) => {
        setConfig((prev) => ({ ...prev, min_payout: { ...prev.min_payout, [currency]: value } }));
        setSaved(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            const res = await apiClient.patch('/config', config);
            setConfig(res.data);
            setSaved(true);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Could not save platform config.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center py-16"><RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" /></div>;
    }

    if (!config) {
        return <p className="text-red-600">{error || 'Config unavailable.'}</p>;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between border-b pb-2 mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Operational Parameters</h1>
                {isSuperAdmin && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-semibold"
                    >
                        <Save size={16} />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                )}
            </div>

            {!isSuperAdmin && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    You have read-only access to platform config. A Super Admin can make changes here.
                </p>
            )}
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}
            {saved && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">Saved.</p>}

            <section className="p-4 border rounded-lg shadow-sm">
                <h3 className="font-semibold text-xl flex items-center gap-2 mb-4"><Percent size={22} className="text-orange-500" /> Vendor Commission Rates</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Food Vendor Rate (%)</label>
                        <input
                            type="number" min={0} max={100} step={0.5}
                            disabled={!isSuperAdmin}
                            value={(config.commission_rate_food * 100).toFixed(1)}
                            onChange={(e) => updateField('commission_rate_food', Number(e.target.value) / 100)}
                            className="p-2 border border-gray-300 rounded-md w-full disabled:bg-gray-100"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Mart Vendor Rate (%)</label>
                        <input
                            type="number" min={0} max={100} step={0.5}
                            disabled={!isSuperAdmin}
                            value={(config.commission_rate_mart * 100).toFixed(1)}
                            onChange={(e) => updateField('commission_rate_mart', Number(e.target.value) / 100)}
                            className="p-2 border border-gray-300 rounded-md w-full disabled:bg-gray-100"
                        />
                    </div>
                </div>
            </section>

            <section className="p-4 border rounded-lg shadow-sm">
                <h3 className="font-semibold text-xl flex items-center gap-2 mb-4"><DollarSign size={22} className="text-indigo-500" /> Delivery Fees & Minimums</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Base Delivery Fee (XAF)</label>
                        <input type="number" min={0} disabled={!isSuperAdmin} value={config.delivery_fee_base} onChange={(e) => updateField('delivery_fee_base', Number(e.target.value))} className="p-2 border border-gray-300 rounded-md w-full disabled:bg-gray-100" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Fee Per Km (XAF)</label>
                        <input type="number" min={0} disabled={!isSuperAdmin} value={config.delivery_fee_per_km} onChange={(e) => updateField('delivery_fee_per_km', Number(e.target.value))} className="p-2 border border-gray-300 rounded-md w-full disabled:bg-gray-100" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Min Order Value (XAF)</label>
                        <input type="number" min={0} disabled={!isSuperAdmin} value={config.min_order_amount} onChange={(e) => updateField('min_order_amount', Number(e.target.value))} className="p-2 border border-gray-300 rounded-md w-full disabled:bg-gray-100" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Free Delivery Threshold (XAF)</label>
                        <input type="number" min={0} disabled={!isSuperAdmin} value={config.free_delivery_threshold} onChange={(e) => updateField('free_delivery_threshold', Number(e.target.value))} className="p-2 border border-gray-300 rounded-md w-full disabled:bg-gray-100" />
                    </div>
                </div>
            </section>

            <section className="p-4 border rounded-lg shadow-sm">
                <h3 className="font-semibold text-xl flex items-center gap-2 mb-4"><MapPin size={22} className="text-fuchsia-500" /> Matching & Distance</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Rider Search Radius (m)</label>
                        <input type="number" min={0} disabled={!isSuperAdmin} value={config.rider_search_radius_m} onChange={(e) => updateField('rider_search_radius_m', Number(e.target.value))} className="p-2 border border-gray-300 rounded-md w-full disabled:bg-gray-100" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Max Delivery Distance (km)</label>
                        <input type="number" min={0} disabled={!isSuperAdmin} value={config.delivery_max_distance_km} onChange={(e) => updateField('delivery_max_distance_km', Number(e.target.value))} className="p-2 border border-gray-300 rounded-md w-full disabled:bg-gray-100" />
                    </div>
                </div>
            </section>

            <section className="p-4 border rounded-lg shadow-sm">
                <h3 className="font-semibold text-xl flex items-center gap-2 mb-4"><Clock size={22} className="text-emerald-500" /> Minimum Payout Thresholds</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {PAYOUT_CURRENCIES.map((currency) => (
                        <div key={currency}>
                            <label className="text-sm font-medium text-gray-700 block mb-1">{currency}</label>
                            <input
                                type="number" min={0}
                                disabled={!isSuperAdmin}
                                value={config.min_payout?.[currency] ?? 0}
                                onChange={(e) => updateMinPayout(currency, Number(e.target.value))}
                                className="p-2 border border-gray-300 rounded-md w-full disabled:bg-gray-100"
                            />
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default OperationalParameters;
