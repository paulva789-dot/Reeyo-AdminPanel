import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Download, Eye, CheckCircle, XCircle, Pause, Play, Star, DollarSign, X, Phone, Mail, MapPin, AlertTriangle, Tag, Image as ImageIcon, Link, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { apiClient, ApiError } from '../../../services/apiClient';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0);

const STATUS_OPTIONS = ['All', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED'];
const BADGE_OPTIONS = ['IN_HIGH_DEMAND', 'NEW', 'TOP_RATED', 'FREE_DELIVERY', 'FAST'];

const statusClasses = (status) => {
  if (status === 'APPROVED') return 'bg-green-100 text-green-800';
  if (status === 'PENDING_APPROVAL') return 'bg-yellow-100 text-yellow-800';
  if (status === 'REJECTED') return 'bg-red-100 text-red-800';
  return 'bg-red-100 text-red-800'; // SUSPENDED
};

function ReasonModal({ title, actionLabel, onCancel, onConfirm, submitting }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Reason"
          className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <div className="mt-4 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 border rounded-lg hover:bg-slate-50">Cancel</button>
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

function VendorManagement() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [vendorOrders, setVendorOrders] = useState([]);
  const [vendorPayouts, setVendorPayouts] = useState([]);
  const [reasonAction, setReasonAction] = useState(null); // { vendor, type: 'reject' | 'suspend' }
  const [actionSubmitting, setActionSubmitting] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/vendors', {
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter === 'All' ? undefined : statusFilter,
      });
      setVendors(res.data || []);
      setMeta(res.meta || { total: 0, totalPages: 1 });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to fetch vendors.');
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleViewDetails = async (vendor) => {
    setSelectedVendor(vendor);
    setShowDetailsModal(true);
    setDetailsLoading(true);
    setVendorOrders([]);
    setVendorPayouts([]);
    try {
      const [detailRes, ordersRes, payoutsRes] = await Promise.all([
        apiClient.get(`/vendors/${vendor.id}`),
        apiClient.get(`/vendors/${vendor.id}/orders`, { page: 1, limit: 10 }),
        apiClient.get('/payouts/history', { type: 'VENDOR', page: 1, limit: 50 }),
      ]);
      setSelectedVendor(detailRes.data);
      setVendorOrders(ordersRes.data || []);
      setVendorPayouts((payoutsRes.data || []).filter((p) => p.vendor_id === vendor.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load vendor details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeModal = () => {
    setShowDetailsModal(false);
    setSelectedVendor(null);
    setVendorOrders([]);
    setVendorPayouts([]);
  };

  const applyStatusUpdate = (vendorId, patch) => {
    setVendors((prev) => prev.map((v) => (v.id === vendorId ? { ...v, ...patch } : v)));
    setSelectedVendor((prev) => (prev?.id === vendorId ? { ...prev, ...patch } : prev));
  };

  const handleApprove = async (vendor) => {
    setActionSubmitting(true);
    try {
      const res = await apiClient.post(`/vendors/${vendor.id}/approve`);
      applyStatusUpdate(vendor.id, res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not approve vendor.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleReasonConfirm = async (reason) => {
    if (!reasonAction) return;
    const { vendor, type } = reasonAction;
    setActionSubmitting(true);
    try {
      const res = await apiClient.post(`/vendors/${vendor.id}/${type}`, { reason });
      applyStatusUpdate(vendor.id, res.data);
      setReasonAction(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Could not ${type} vendor.`);
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleReactivate = async (vendor) => {
    // No dedicated "reactivate" endpoint on the backend — re-approving is the
    // documented way to move a SUSPENDED vendor back to APPROVED.
    await handleApprove(vendor);
  };

  const toggleBadge = async (vendor, badge) => {
    const current = vendor.badges || [];
    const next = current.includes(badge) ? current.filter((b) => b !== badge) : [...current, badge];
    setActionSubmitting(true);
    try {
      const res = await apiClient.patch(`/engagement/vendors/${vendor.id}/badges`, { badges: next });
      applyStatusUpdate(vendor.id, { badges: res.data.badges });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update badges.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Business Name', 'Owner', 'Phone', 'Email', 'Commission Rate', 'City', 'Rating', 'Status'];
    const rows = vendors.map((v) => [`"${v.business_name}"`, `"${v.owner_name}"`, v.phone, v.email, v.commission_rate, v.city, v.average_rating, v.status]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vendors.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Vendor Management</h1>
        <p className="text-slate-600">Manage restaurants and merchant partners</p>
      </div>

      {error && (
        <div className="mb-4 flex items-center p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg" role="alert">
          <AlertTriangle className="w-5 h-5 mr-3" />
          <span className="font-medium">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-700 hover:text-red-900">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by restaurant, contact, or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-600" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none bg-white pr-8"
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s === 'All' ? 'All Status' : s}</option>)}
            </select>
          </div>

          <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="w-4 h-4" />
            Export Page (CSV)
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider min-w-[150px]">Restaurant</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider min-w-[120px]">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Commission</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider min-w-[80px]">City</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider min-w-[80px]">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider min-w-[100px]">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider min-w-[140px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{vendor.business_name}</div>
                      <div className="text-sm text-slate-500">{vendor.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{vendor.owner_name}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-orange-600">{((vendor.commission_rate || 0) * 100).toFixed(0)}%</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{vendor.city || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{parseFloat(vendor.average_rating || 0).toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClasses(vendor.status)}`}>{vendor.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleViewDetails(vendor)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        {vendor.status === 'PENDING_APPROVAL' && (
                          <>
                            <button onClick={() => handleApprove(vendor)} disabled={actionSubmitting} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50" title="Approve">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => setReasonAction({ vendor, type: 'reject' })} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Reject">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {vendor.status === 'APPROVED' && (
                          <button onClick={() => setReasonAction({ vendor, type: 'suspend' })} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Suspend">
                            <Pause className="w-4 h-4" />
                          </button>
                        )}
                        {vendor.status === 'SUSPENDED' && (
                          <button onClick={() => handleReactivate(vendor)} disabled={actionSubmitting} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50" title="Reactivate">
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {vendors.length === 0 && <div className="text-center py-12 text-slate-500">No vendors found matching your criteria</div>}
          </div>
        )}

        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-600">
          <div>
            Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{meta.totalPages || 1}</span> &middot;{' '}
            <span className="font-semibold">{meta.total ?? 0}</span> total vendors
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="p-2 border rounded-lg disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(meta.totalPages || 1, p + 1))} disabled={page >= (meta.totalPages || 1)} className="p-2 border rounded-lg disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showDetailsModal && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-slate-800">Vendor Details</h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Restaurant Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-orange-600 font-bold text-xl">{selectedVendor.business_name?.charAt(0) || '?'}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-lg">{selectedVendor.business_name}</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{parseFloat(selectedVendor.average_rating || 0).toFixed(1)} ({selectedVendor.total_ratings || 0} ratings)</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{selectedVendor.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>{selectedVendor.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>{selectedVendor.address || selectedVendor.city || 'Not specified'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Business Details</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Owner</p>
                      <p className="font-medium text-slate-800">{selectedVendor.owner_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${statusClasses(selectedVendor.status)}`}>{selectedVendor.status}</span>
                      {selectedVendor.rejection_reason && (
                        <p className="text-xs text-red-600 mt-1">Reason: {selectedVendor.rejection_reason}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Commission Rate</p>
                      <p className="font-medium text-slate-800">{((selectedVendor.commission_rate || 0) * 100).toFixed(0)}% (set via platform config)</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Member Since</p>
                      <p className="font-medium text-slate-800">{new Date(selectedVendor.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 flex items-center gap-2">
                  <Tag size={18} /> Badges
                </h3>
                <div className="flex flex-wrap gap-2">
                  {BADGE_OPTIONS.map((badge) => {
                    const active = (selectedVendor.badges || []).includes(badge);
                    return (
                      <button
                        key={badge}
                        onClick={() => toggleBadge(selectedVendor, badge)}
                        disabled={actionSubmitting}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${
                          active ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {badge.replace(/_/g, ' ')}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Storefront</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600 mb-2">Storefront Image</p>
                    {selectedVendor.profile_image_url ? (
                      <img src={selectedVendor.profile_image_url} alt="Storefront" className="w-full h-32 object-cover rounded-lg" />
                    ) : (
                      <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                        <ImageIcon size={32} className="text-gray-400" />
                        <span className="ml-2 text-gray-500">No image uploaded</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-2">Location</p>
                    {selectedVendor.latitude && selectedVendor.longitude ? (
                      <a
                        href={`https://maps.google.com/?q=${selectedVendor.latitude},${selectedVendor.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 underline"
                      >
                        <Link size={16} /> View on Map
                      </a>
                    ) : (
                      <p className="text-slate-500 italic">No coordinates on file</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Business Hours</h3>
                {selectedVendor.business_hours ? (
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap">{JSON.stringify(selectedVendor.business_hours, null, 2)}</pre>
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No business hours specified</p>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 flex items-center gap-2">
                  <ShoppingBag size={18} /> Recent Orders ({vendorOrders.length})
                </h3>
                {detailsLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                ) : vendorOrders.length > 0 ? (
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Order #</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Customer</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Amount</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {vendorOrders.map((order) => (
                          <tr key={order.id}>
                            <td className="px-4 py-3 text-sm font-medium text-slate-800">{order.order_number}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{order.user?.name || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-green-600">{formatCurrency(order.total_amount)}</td>
                            <td className="px-4 py-3 text-sm">{order.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No orders found.</p>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Payout History</h3>
                {detailsLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                ) : vendorPayouts.length > 0 ? (
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Amount</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {vendorPayouts.map((payout) => (
                          <tr key={payout.id}>
                            <td className="px-4 py-3 text-sm text-slate-600">{new Date(payout.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-green-600">{formatCurrency(payout.amount)}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                payout.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                payout.status === 'PENDING' || payout.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>{payout.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No payout history found.</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-slate-600">Wallet Balance</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedVendor.stats?.wallet_balance)}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-slate-600">Revenue (30d)</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(selectedVendor.stats?.total_revenue_30d)}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingBag className="w-5 h-5 text-orange-600" />
                    <span className="text-sm text-slate-600">Active Menu Items</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">{selectedVendor.stats?.active_menu_items ?? '—'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {reasonAction && (
        <ReasonModal
          title={reasonAction.type === 'reject' ? `Reject ${reasonAction.vendor.business_name}?` : `Suspend ${reasonAction.vendor.business_name}?`}
          actionLabel={reasonAction.type === 'reject' ? 'Reject' : 'Suspend'}
          onCancel={() => setReasonAction(null)}
          onConfirm={handleReasonConfirm}
          submitting={actionSubmitting}
        />
      )}
    </div>
  );
}

export default VendorManagement;
