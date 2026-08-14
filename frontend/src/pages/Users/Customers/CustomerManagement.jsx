// src/pages/Users/Customers/CustomerManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Download, Eye, Ban, CheckCircle, X, Mail, Phone, MapPin, ShoppingBag, Award, RefreshCw, ChevronLeft, ChevronRight, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiClient, ApiError } from '../../../services/apiClient';

// --- HELPER COMPONENTS ---

const DetailItem = ({ Icon, value }) => (
    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
        <Icon className="w-4 h-4 text-indigo-500" />
        <span className="text-sm">{value}</span>
    </div>
);

const StatCard = ({ Icon, title, value, color }) => {
    const colorClasses = {
        green: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
        orange: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
        blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    };
    const currentClasses = colorClasses[color] || colorClasses.green;

    return (
        <div className={`p-4 rounded-lg border border-opacity-20 ${currentClasses}`}>
            <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-5 h-5`} />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</span>
            </div>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    );
};

const formatXAF = (amount, currency = 'XAF') =>
  Number(amount ?? 0).toLocaleString('fr-FR', { style: 'currency', currency, minimumFractionDigits: 0 });

const STATUS_OPTIONS = ['All', 'ACTIVE', 'SUSPENDED', 'DELETED'];

function SuspendReasonModal({ user, onCancel, onConfirm, submitting }) {
  const [reason, setReason] = useState('');
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Suspend {user.name}?</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">A reason is required and will be recorded on the account.</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="e.g. Repeated chargebacks"
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <div className="mt-4 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-white">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim() || submitting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {submitting ? 'Suspending...' : 'Suspend'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Debounce free-text search before it triggers a refetch.
  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/users', {
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter === 'All' ? undefined : statusFilter,
      });
      setCustomers(res.data || []);
      setMeta(res.meta || { total: 0, totalPages: 1 });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load customers.');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleViewDetails = async (customer) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
    setDetailsLoading(true);
    setCustomerOrders([]);
    try {
      const [detailRes, ordersRes] = await Promise.all([
        apiClient.get(`/users/${customer.id}`),
        apiClient.get(`/users/${customer.id}/orders`, { page: 1, limit: 10 }),
      ]);
      setSelectedCustomer(detailRes.data);
      setCustomerOrders(ordersRes.data || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load customer details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleActivate = async (customer) => {
    setActionSubmitting(true);
    try {
      await apiClient.post(`/users/${customer.id}/unsuspend`);
      setCustomers((prev) => prev.map((c) => (c.id === customer.id ? { ...c, status: 'ACTIVE' } : c)));
      if (selectedCustomer?.id === customer.id) {
        setSelectedCustomer((prev) => ({ ...prev, status: 'ACTIVE' }));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not activate customer.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleSuspendConfirm = async (reason) => {
    if (!suspendTarget) return;
    setActionSubmitting(true);
    try {
      await apiClient.post(`/users/${suspendTarget.id}/suspend`, { reason });
      setCustomers((prev) => prev.map((c) => (c.id === suspendTarget.id ? { ...c, status: 'SUSPENDED' } : c)));
      if (selectedCustomer?.id === suspendTarget.id) {
        setSelectedCustomer((prev) => ({ ...prev, status: 'SUSPENDED' }));
      }
      setSuspendTarget(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not suspend customer.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Phone', 'Email', 'Country', 'Status', 'Joined'];
    const rows = customers.map((c) => [c.name, c.phone, c.email, c.country_code, c.status, c.created_at]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reeyo_customers.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusClasses = (status) => {
    if (status === 'ACTIVE') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (status === 'SUSPENDED') return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  return (
    <div className="p-2 sm:p-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Customer Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage and monitor your customer base.</p>
      </motion.div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl transition-colors duration-300">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s === 'All' ? 'All Status' : s}</option>
              ))}
            </select>
          </div>

          <motion.button
            onClick={exportToCSV}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Page (CSV)
          </motion.button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 text-green-600 dark:text-green-400 animate-spin" />
            <p className="ml-3 text-lg text-gray-600 dark:text-gray-400">Loading Customer Data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Country</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-800 dark:text-white">{customer.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">{customer.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">{customer.email || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">{customer.country_code || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClasses(customer.status)}`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(customer)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => (customer.status === 'ACTIVE' ? setSuspendTarget(customer) : handleActivate(customer))}
                          disabled={actionSubmitting}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                            customer.status === 'ACTIVE'
                              ? 'text-red-600 hover:bg-red-50 dark:hover:bg-gray-700'
                              : 'text-green-600 hover:bg-green-50 dark:hover:bg-gray-700'
                          }`}
                          title={customer.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        >
                          {customer.status === 'ACTIVE' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {customers.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">No customers found matching your criteria</div>
            )}
          </div>
        )}

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div>
            Page <span className="font-semibold text-gray-800 dark:text-white">{page}</span> of{' '}
            <span className="font-semibold text-gray-800 dark:text-white">{meta.totalPages || 1}</span> &middot;{' '}
            <span className="font-semibold text-gray-800 dark:text-white">{meta.total ?? 0}</span> total customers
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 border rounded-lg disabled:opacity-40 dark:border-gray-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages || 1, p + 1))}
              disabled={page >= (meta.totalPages || 1)}
              className="p-2 border rounded-lg disabled:opacity-40 dark:border-gray-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* --- Details Modal --- */}
      {showDetailsModal && selectedCustomer && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 100 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Customer Details: {selectedCustomer.name}</h2>
              <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Personal Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <span className="text-green-600 dark:text-green-300 font-semibold text-lg">{selectedCustomer.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">{selectedCustomer.name}</p>
                        <p className={`text-xs font-medium ${selectedCustomer.status === 'ACTIVE' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {selectedCustomer.status}
                        </p>
                      </div>
                    </div>
                    <DetailItem Icon={Mail} value={selectedCustomer.email || 'No email on file'} />
                    <DetailItem Icon={Phone} value={selectedCustomer.phone} />
                    <DetailItem Icon={MapPin} value={selectedCustomer.country_code || 'Not specified'} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Account Statistics</h3>
                  {detailsLoading ? (
                    <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <StatCard Icon={ShoppingBag} title="Total Orders" value={selectedCustomer.stats?.total_orders ?? '—'} color="green" />
                        <StatCard Icon={Award} title="Reecoins" value={selectedCustomer.stats?.reecoins_balance ?? '—'} color="orange" />
                        <StatCard Icon={Wallet} title="Wallet Balance" value={formatXAF(selectedCustomer.stats?.wallet_balance, selectedCustomer.stats?.currency)} color="blue" />
                        <StatCard Icon={ShoppingBag} title="Active Orders" value={selectedCustomer.stats?.active_orders ?? '—'} color="green" />
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 pt-2">
                        <p><span className="font-semibold">Member since:</span> {new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
                        <p><span className="font-semibold">Referral code:</span> {selectedCustomer.referral_code || '—'}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Order History ({customerOrders.length})
                </h3>
                {detailsLoading ? (
                  <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
                ) : customerOrders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Order #</th>
                          <th className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Date</th>
                          <th className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Vendor</th>
                          <th className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                          <th className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {customerOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white">{order.order_number}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{new Date(order.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white">{order.vendor?.business_name || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">{formatXAF(order.total_amount, order.currency)}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded text-xs font-medium">{order.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">No recent order history found.</p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {suspendTarget && (
        <SuspendReasonModal
          user={suspendTarget}
          onCancel={() => setSuspendTarget(null)}
          onConfirm={handleSuspendConfirm}
          submitting={actionSubmitting}
        />
      )}
    </div>
  );
}

export default CustomerManagement;
