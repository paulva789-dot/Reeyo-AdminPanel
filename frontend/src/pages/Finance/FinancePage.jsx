// src/pages/Finance/FinancePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import DateFilter from '../../components/DateFilter';
import StatCardGrid from './components/StatCardGrid';
import RevenueChart from './components/RevenueChart';
import TransactionTable from './components/TransactionTable';
import SettlementManagement from './components/SettlementManagement';
import { apiClient, ApiError } from '../../services/apiClient';

function periodToRange(period) {
    const today = new Date();
    const iso = (d) => d.toISOString().slice(0, 10);
    const to = iso(today);
    const from = new Date(today);
    if (period === 'yesterday') from.setDate(from.getDate() - 1);
    else if (period === 'lastWeek') from.setDate(from.getDate() - 7);
    else if (period === 'lastMonth') from.setMonth(from.getMonth() - 1);
    else if (period === 'lastYear') from.setFullYear(from.getFullYear() - 1);
    return { from: iso(from), to };
}

const FinancePage = () => {
    const [selectedPeriod, setSelectedPeriod] = useState('lastMonth');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [kpis, setKpis] = useState([]);
    const [monthlyRevenue, setMonthlyRevenue] = useState([]);
    const [transactions, setTransactions] = useState([]);

    const fetchFinanceData = useCallback(async () => {
        setLoading(true);
        setError('');
        const { from, to } = periodToRange(selectedPeriod);
        try {
            const [revenueRes, ordersRes, ordersListRes, payoutHistoryRes] = await Promise.all([
                apiClient.get('/analytics/revenue/monthly', { from, to }),
                apiClient.get('/analytics/orders', { from, to }),
                apiClient.get('/orders', { page: 1, limit: 15 }),
                apiClient.get('/payouts/history', { page: 1, limit: 15 }),
            ]);

            const revenueSeries = revenueRes.data || [];
            const totalRevenue = revenueSeries.reduce((s, r) => s + (r.revenue || 0), 0);
            const totalCommission = revenueSeries.reduce((s, r) => s + (r.commission || 0), 0);
            const totalOrders = ordersRes.data?.total || 0;
            const avgOrderValue = ordersRes.data?.avg_order_value || 0;

            setKpis([
                { id: 'revenue', title: 'Gross Revenue', value: totalRevenue, unit: '', change: '', color: 'text-indigo-600', icon: '💸' },
                { id: 'commission', title: 'Platform Commission', value: totalCommission, unit: '', change: '', color: 'text-green-600', icon: '📈' },
                { id: 'orders', title: 'Total Orders', value: totalOrders, unit: 'orders', change: '', color: 'text-blue-600', icon: '🏦' },
                { id: 'aov', title: 'Avg Order Value', value: avgOrderValue, unit: 'XAF', change: '', color: 'text-orange-600', icon: '💰' },
            ]);

            setMonthlyRevenue(revenueSeries.map((r) => ({ name: r.month || r.week || r.day, revenue: r.revenue, commission: r.commission })));

            const orderTx = (ordersListRes.data || []).map((o) => ({
                id: o.order_number,
                type: o.status === 'CANCELLED' || o.status === 'REFUNDED' ? 'Refund' : 'Order',
                vendor: o.vendor?.business_name || 'N/A',
                date: new Date(o.created_at).toLocaleDateString(),
                amount: o.total_amount,
                status: o.status === 'DELIVERED' ? 'Completed' : o.status === 'CANCELLED' || o.status === 'REFUNDED' ? 'Refund' : 'Pending',
            }));
            const payoutTx = (payoutHistoryRes.data || []).map((p) => ({
                id: p.id,
                type: 'Payout',
                vendor: p.entity_name || p.vendor_id || p.rider_id,
                date: new Date(p.created_at).toLocaleDateString(),
                amount: p.amount,
                status: p.status === 'COMPLETED' ? 'Completed' : p.status === 'FAILED' ? 'Refund' : 'Pending',
            }));
            setTransactions([...orderTx, ...payoutTx].sort((a, b) => new Date(b.date) - new Date(a.date)));
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Could not load finance data.');
        } finally {
            setLoading(false);
        }
    }, [selectedPeriod]);

    useEffect(() => {
        fetchFinanceData();
    }, [fetchFinanceData]);

    return (
        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-gray-100 mb-6">
                Platform Finance Overview
            </h1>

            <DateFilter selectedPeriod={selectedPeriod} onPeriodChange={setSelectedPeriod} />

            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
            ) : (
                <>
                    <StatCardGrid kpis={kpis} />

                    <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                            <RevenueChart data={monthlyRevenue} />
                        </div>

                        <div className="lg:col-span-1">
                            <SettlementManagement />
                        </div>
                    </div>

                    <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <TransactionTable transactions={transactions} />
                    </div>
                </>
            )}
        </div>
    );
};

export default FinancePage;
