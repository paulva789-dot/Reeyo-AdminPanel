// src/pages/Users/DeliveryGuys/RiderManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Download, Eye, CheckCircle, XCircle, Pause, Play, MapPin, Star, TrendingUp, Package, X, Phone, Mail, FileCheck, FileX, RefreshCw, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiClient, ApiError } from '../../../services/apiClient';

const formatXAF = (amount) => Number(amount || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 });

const STATUS_OPTIONS = ['All', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED'];
const DOCUMENT_TYPES = [
  { key: 'NATIONAL_ID', label: 'National ID' },
  { key: 'DRIVERS_LICENSE', label: "Driver's License" },
];

const statusClasses = (status) => {
  if (status === 'APPROVED') return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
  if (status === 'PENDING_APPROVAL') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
  return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'; // REJECTED / SUSPENDED
};

const onlineClasses = (onlineStatus) =>
  onlineStatus === 'ONLINE'
    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
    : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';

function ReasonModal({ title, actionLabel, onCancel, onConfirm, submitting }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">{title}</h3>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Reason"
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <div className="mt-4 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-white">Cancel</button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim() || submitting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function RiderManagement() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  const [selectedRider, setSelectedRider] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [riderPayouts, setRiderPayouts] = useState([]);
  const [reasonAction, setReasonAction] = useState(null); // { rider, type: 'reject' | 'suspend' }
  const [docReject, setDocReject] = useState(null); // document_type pending a rejection reason
  const [actionSubmitting, setActionSubmitting] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const fetchRiders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/riders', {
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter === 'All' ? undefined : statusFilter,
      });
      setRiders(res.data || []);
      setMeta(res.meta || { total: 0, totalPages: 1 });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error fetching riders.');
      setRiders([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchRiders();
  }, [fetchRiders]);

  const handleViewDetails = async (rider) => {
    setSelectedRider(rider);
    setShowDetailsModal(true);
    setDetailsLoading(true);
    setRiderPayouts([]);
    try {
      const [detailRes, payoutsRes] = await Promise.all([
        apiClient.get(`/riders/${rider.id}`),
        apiClient.get('/payouts/history', { type: 'RIDER', page: 1, limit: 50 }),
      ]);
      setSelectedRider(detailRes.data);
      setRiderPayouts((payoutsRes.data || []).filter((p) => p.rider_id === rider.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load rider details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const applyStatusUpdate = (riderId, patch) => {
    setRiders((prev) => prev.map((r) => (r.id === riderId ? { ...r, ...patch } : r)));
    setSelectedRider((prev) => (prev?.id === riderId ? { ...prev, ...patch } : prev));
  };

  const handleApprove = async (rider) => {
    setActionSubmitting(true);
    try {
      const res = await apiClient.post(`/riders/${rider.id}/approve`);
      applyStatusUpdate(rider.id, res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not approve rider.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleReasonConfirm = async (reason) => {
    if (!reasonAction) return;
    const { rider, type } = reasonAction;
    setActionSubmitting(true);
    try {
      const res = await apiClient.post(`/riders/${rider.id}/${type}`, { reason });
      applyStatusUpdate(rider.id, res.data);
      setReasonAction(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Could not ${type} rider.`);
    } finally {
      setActionSubmitting(false);
    }
  };

  const submitDocumentDecision = async (documentType, status, reason) => {
    if (!selectedRider) return;
    setActionSubmitting(true);
    try {
      await apiClient.post(`/riders/${selectedRider.id}/verify-documents`, {
        decisions: [{ document_type: documentType, status, ...(reason ? { reason } : {}) }],
      });
      setDocReject(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit document decision.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Phone', 'Email', 'Vehicle Type', 'Status', 'Total Deliveries', 'Rating'];
    const rows = riders.map((r) => [r.name, r.phone, r.email, r.vehicle_type, r.status, r.total_deliveries, r.average_rating]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reeyo_riders.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-2 sm:p-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Delivery Rider Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage delivery agents and monitor their performance.</p>
      </motion.div>

      {error && (
        <div className="mb-4 flex items-center p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm">
          <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl transition-colors duration-300">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors"
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s === 'All' ? 'All Status' : s}</option>)}
            </select>
          </div>

          <motion.button onClick={exportToCSV} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            Export Page (CSV)
          </motion.button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
            <p className="ml-3 text-lg text-gray-600 dark:text-gray-400">Loading Rider Data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Approval</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Online</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {riders.map((rider) => (
                  <tr key={rider.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-800 dark:text-white">{rider.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{rider.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">{rider.vehicle_type || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClasses(rider.status)}`}>{rider.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${onlineClasses(rider.online_status)}`}>{rider.online_status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium text-gray-800 dark:text-white">{parseFloat(rider.average_rating || 0).toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleViewDetails(rider)} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-lg transition-colors" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        {rider.status === 'PENDING_APPROVAL' && (
                          <>
                            <button onClick={() => handleApprove(rider)} disabled={actionSubmitting} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50" title="Approve">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => setReasonAction({ rider, type: 'reject' })} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Reject">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {rider.status === 'APPROVED' && (
                          <button onClick={() => setReasonAction({ rider, type: 'suspend' })} className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Suspend">
                            <Pause className="w-4 h-4" />
                          </button>
                        )}
                        {rider.status === 'SUSPENDED' && (
                          <button onClick={() => handleApprove(rider)} disabled={actionSubmitting} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50" title="Reinstate">
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {riders.length === 0 && <div className="text-center py-12 text-gray-500 dark:text-gray-400">No riders found matching your criteria</div>}
          </div>
        )}

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div>
            Page <span className="font-semibold text-gray-800 dark:text-white">{page}</span> of{' '}
            <span className="font-semibold text-gray-800 dark:text-white">{meta.totalPages || 1}</span> &middot;{' '}
            <span className="font-semibold text-gray-800 dark:text-white">{meta.total ?? 0}</span> total riders
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

      {/* --- Details Modal --- */}
      {showDetailsModal && selectedRider && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 100 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Rider Details: {selectedRider.name}</h2>
              <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Personal & Contact</h3>
                  <div className="space-y-3">
                    <p className="font-semibold text-gray-800 dark:text-white text-lg">{selectedRider.name}</p>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Mail className="w-4 h-4 text-blue-500" />
                      <span>{selectedRider.email || 'No email on file'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Phone className="w-4 h-4 text-blue-500" />
                      <span>{selectedRider.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span>
                        {selectedRider.current_latitude && selectedRider.current_longitude
                          ? `${selectedRider.current_latitude}, ${selectedRider.current_longitude}`
                          : 'Location unavailable'}
                      </span>
                    </div>
                    {selectedRider.rejection_reason && (
                      <p className="text-xs text-red-600 dark:text-red-400">Rejection reason: {selectedRider.rejection_reason}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Vehicle & Documents</h3>
                  <div className="space-y-3">
                    <p className="font-medium text-gray-800 dark:text-white">
                      {selectedRider.vehicle_type || 'N/A'} &middot; {selectedRider.vehicle_plate || 'No plate on file'}
                    </p>
                    {selectedRider.id_image_url ? (
                      <a href={selectedRider.id_image_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                        View ID document ({selectedRider.id_type || 'unspecified type'})
                      </a>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">No ID document uploaded</p>
                    )}

                    {DOCUMENT_TYPES.map((doc) => (
                      <div key={doc.key} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <FileCheck className="w-4 h-4" />
                          <span className="font-medium text-sm">{doc.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => submitDocumentDecision(doc.key, 'APPROVED')}
                            disabled={actionSubmitting}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setDocReject(doc)}
                            className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900/40 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Total Deliveries</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{selectedRider.total_deliveries ?? 0}</p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/40 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Average Rating</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{parseFloat(selectedRider.average_rating || 0).toFixed(1)}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/40 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Total Earnings</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatXAF(selectedRider.total_earnings)}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Recent Payouts</h3>
                {detailsLoading ? (
                  <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
                ) : riderPayouts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Date</th>
                          <th className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                          <th className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {riderPayouts.slice(0, 10).map((payout) => (
                          <tr key={payout.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{new Date(payout.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">{formatXAF(payout.amount)}</td>
                            <td className="px-4 py-3 text-sm">{payout.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">No recent payout history available.</p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {reasonAction && (
        <ReasonModal
          title={reasonAction.type === 'reject' ? `Reject ${reasonAction.rider.name}?` : `Suspend ${reasonAction.rider.name}?`}
          actionLabel={reasonAction.type === 'reject' ? 'Reject' : 'Suspend'}
          onCancel={() => setReasonAction(null)}
          onConfirm={handleReasonConfirm}
          submitting={actionSubmitting}
        />
      )}

      {docReject && (
        <ReasonModal
          title={`Reject ${docReject.label}?`}
          actionLabel="Reject Document"
          onCancel={() => setDocReject(null)}
          onConfirm={(reason) => submitDocumentDecision(docReject.key, 'REJECTED', reason)}
          submitting={actionSubmitting}
        />
      )}
    </div>
  );
}

export default RiderManagement;
