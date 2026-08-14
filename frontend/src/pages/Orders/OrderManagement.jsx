// src/pages/Orders/OrderManagement.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, ChevronLeft, ChevronRight, AlertTriangle, X } from 'lucide-react';
import OrderFilterBar from './components/OrderFilterBar';
import OrderStatsCards from './components/OrderStatsCards';
import OrderCard from './components/OrderCard';
import { apiClient, ApiError } from '../../services/apiClient';

const OrderManagement = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [breakdown, setBreakdown] = useState(null);
    const [filter, setFilter] = useState('All');
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await apiClient.get('/orders', {
                page,
                limit: 20,
                status: filter === 'All' ? undefined : filter,
            });
            setOrders(res.data || []);
            setMeta(res.meta || { total: 0, totalPages: 1 });
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Could not load orders.');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [page, filter]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // There's no backend search-by-order-number endpoint (confirmed removed,
    // not just undocumented) — this filters only the currently loaded page
    // rather than the whole order set.
    const visibleOrders = useMemo(() => {
        if (!searchInput.trim()) return orders;
        const q = searchInput.trim().toLowerCase();
        return orders.filter((o) => o.order_number?.toLowerCase().includes(q));
    }, [orders, searchInput]);

    useEffect(() => {
        apiClient
            .get('/analytics/orders')
            .then((res) => setBreakdown(res.data?.by_status))
            .catch(() => setBreakdown(null));
    }, []);

    const handleCancelled = (orderId, newStatus) => {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    };

    return (
        <div className="p-4 sm:p-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-gray-100 mb-6">
                Live Order Dashboard
            </h1>

            {error && (
                <div className="mb-4 flex items-center p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm">
                    <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{error}</span>
                    <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
                </div>
            )}

            <OrderStatsCards breakdown={breakdown} />

            <OrderFilterBar
                currentFilter={filter}
                setFilter={(f) => { setFilter(f); setPage(1); }}
                searchQuery={searchInput}
                setSearchQuery={setSearchInput}
            />
            {searchInput.trim() && (
                <p className="mt-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-2">
                    There's no order-number search on the backend yet — this only filters the orders already loaded on this page. Use the status filter or paginate to find orders elsewhere.
                </p>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                    {visibleOrders.length > 0 ? (
                        visibleOrders.map(order => (
                            <OrderCard key={order.id} order={order} onCancelled={handleCancelled} />
                        ))
                    ) : (
                        <p className="col-span-full text-center text-gray-500 dark:text-gray-400 py-12">
                            No orders match your current filter and search criteria.
                        </p>
                    )}
                </div>
            )}

            <div className="mt-6 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <div>
                    Page <span className="font-semibold text-gray-800 dark:text-white">{page}</span> of{' '}
                    <span className="font-semibold text-gray-800 dark:text-white">{meta.totalPages || 1}</span> &middot;{' '}
                    <span className="font-semibold text-gray-800 dark:text-white">{meta.total ?? 0}</span> total orders
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="p-2 border rounded-lg disabled:opacity-40 dark:border-gray-600">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => setPage((p) => Math.min(meta.totalPages || 1, p + 1))} disabled={page >= (meta.totalPages || 1)} className="p-2 border rounded-lg disabled:opacity-40 dark:border-gray-600">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderManagement;
