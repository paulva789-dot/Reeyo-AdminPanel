// src/pages/Users/Vendors/menuApprove/MenuApprovals.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import ApprovalRequestCard from './components/ApprovalRequestCard';
import { apiClient, ApiError } from '../../../../services/apiClient';

const MenuStatsCards = ({ requests }) => {
    const pending = requests.filter((r) => r.status === 'PENDING').length;
    const priceUpdates = requests.filter((r) => r.status === 'PENDING' && r.change_type === 'PRICE_UPDATE').length;
    const newItems = requests.filter((r) => r.status === 'PENDING' && r.change_type === 'NEW_ITEM').length;
    const rejected = requests.filter((r) => r.status === 'REJECTED').length;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <p className="text-sm text-gray-500">Total Pending</p>
                <p className="text-2xl font-bold text-yellow-500">{pending}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <p className="text-sm text-gray-500">Price Updates</p>
                <p className="text-2xl font-bold text-orange-500">{priceUpdates}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <p className="text-sm text-gray-500">New Items</p>
                <p className="text-2xl font-bold text-indigo-500">{newItems}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <p className="text-sm text-gray-500">Rejected</p>
                <p className="text-2xl font-bold text-red-500">{rejected}</p>
            </div>
        </div>
    );
};

const MenuFilterBar = ({ currentFilter, setFilter, searchQuery, setSearchQuery }) => {
    const filters = ['All', 'PENDING', 'APPROVED', 'REJECTED', 'PRICE_UPDATE', 'NEW_ITEM'];
    return (
        <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0 shrink-0">
                {filters.map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-150 shrink-0 ${
                            currentFilter === f
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                    >
                        {f === 'All' ? f : f.replace(/_/g, ' ')}
                    </button>
                ))}
            </div>
            <input
                type="text"
                placeholder="Search vendor or item name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-auto md:ml-auto p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
        </div>
    );
};

const MenuApprovals = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('PENDING');
    const [searchQuery, setSearchQuery] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        setError('');
        const STATUS_VALUES = ['PENDING', 'APPROVED', 'REJECTED'];
        try {
            const res = await apiClient.get('/menu-approvals', {
                status: STATUS_VALUES.includes(filter) ? filter : undefined,
            });
            setRequests(res.data || []);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Could not load the approval queue.');
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleApprove = async (id) => {
        setSubmitting(true);
        setError('');
        try {
            await apiClient.post(`/menu-approvals/${id}/approve`);
            setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'APPROVED' } : r)));
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Could not approve this request.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async (id, reason) => {
        setSubmitting(true);
        setError('');
        try {
            await apiClient.post(`/menu-approvals/${id}/reject`, { reason });
            setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'REJECTED', admin_notes: reason } : r)));
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Could not reject this request.');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredRequests = requests.filter(request => {
        const matchesFilter = filter === 'All'
            || request.status === filter
            || request.change_type === filter;

        const matchesSearch = (request.vendor?.business_name || '').toLowerCase().includes(searchQuery.toLowerCase())
            || (request.item_name || '').toLowerCase().includes(searchQuery.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    return (
        <div className="p-4 sm:p-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-gray-100 mb-6">
                Menu Approvals Queue
            </h1>

            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <MenuStatsCards requests={requests} />

            <MenuFilterBar
                currentFilter={filter}
                setFilter={setFilter}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
            />

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                    {filteredRequests.length > 0 ? (
                        filteredRequests.map(request => (
                            <ApprovalRequestCard
                                key={request.id}
                                request={request}
                                onApprove={handleApprove}
                                onReject={handleReject}
                                submitting={submitting}
                            />
                        ))
                    ) : (
                        <p className="col-span-full text-center text-gray-500 dark:text-gray-400 py-12">
                            No menu approval requests match your current criteria.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default MenuApprovals;
