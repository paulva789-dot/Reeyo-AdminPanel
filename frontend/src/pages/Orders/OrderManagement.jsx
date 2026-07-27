// src/pages/Orders/OrderManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
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
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

    useEffect(() => {
        const handle = setTimeout(() => {
            setSearchQuery(searchInput);
            setPage(1);
        }, 400);
        return () => clearTimeout(handle);
    }, [searchInput]);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            if (searchQuery) {
                const res = await apiClient.get('/orders/search', { q: searchQuery });
                setOrders(res.data || []);
                setMeta({ total: (res.data || []).length, totalPages: 1 });
            } else {
                const res = await apiClient.get('/orders', {
                    page,
                    limit: 20,
                    status: filter === 'All' ? undefined : filter,
                });
                setOrders(res.data || []);
                setMeta(res.meta || { total: 0, totalPages: 1 });
            }
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Could not load orders.');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [page, filter, searchQuery]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

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

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                    {orders.length > 0 ? (
                        orders.map(order => (
                            <OrderCard key={order.id} order={order} onCancelled={handleCancelled} />
                        ))
                    ) : (
                        <p className="col-span-full text-center text-gray-500 dark:text-gray-400 py-12">
                            No orders match your current filter and search criteria.
                        </p>
                    )}
                </div>
            )}

            {!searchQuery && (
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
            )}
        </div>
    );
};

export default OrderManagement;
