// src/pages/Disputes/DisputesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { AlertOctagon, Search, RefreshCw, X, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient, ApiError } from '../../services/apiClient';

const STATUS_OPTIONS = ['All', 'OPEN', 'RESOLVED', 'REJECTED'];

const PRIORITY_CLASSES = {
  HIGH: 'bg-red-100 text-red-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-gray-100 text-gray-700',
};

function DisputeDetail({ disputeId, onClose, onResolved }) {
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [resolution, setResolution] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundToWallet, setRefundToWallet] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get(`/disputes/${disputeId}`);
      setDispute(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load dispute.');
    } finally {
      setLoading(false);
    }
  }, [disputeId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const res = await apiClient.post(`/disputes/${disputeId}/messages`, { message: newMessage });
      setDispute((prev) => ({ ...prev, messages: [...(prev.messages || []), res.data] }));
      setNewMessage('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send message.');
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    setResolving(true);
    setError('');
    try {
      const res = await apiClient.post(`/disputes/${disputeId}/resolve`, {
        resolution,
        refundAmount: refundAmount ? Number(refundAmount) : undefined,
        refundToWallet,
      });
      setDispute((prev) => ({ ...prev, status: res.data.status, resolution, resolved_at: res.data.resolved_at }));
      onResolved(disputeId, res.data.status);
      setShowResolveForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not resolve dispute.');
    } finally {
      setResolving(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    setRejecting(true);
    setError('');
    try {
      const res = await apiClient.post(`/disputes/${disputeId}/reject`, { reason: rejectReason });
      setDispute((prev) => ({ ...prev, status: res.data?.status || 'REJECTED' }));
      onResolved(disputeId, res.data?.status || 'REJECTED');
      setShowRejectForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reject dispute.');
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-800">{dispute?.ticket_number || 'Dispute'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center"><RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" /></div>
        ) : error && !dispute ? (
          <p className="p-6 text-red-600">{error}</p>
        ) : dispute ? (
          <div className="p-5 space-y-4">
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Category:</span> <span className="font-medium">{dispute.category}</span></div>
              <div><span className="text-gray-500">Priority:</span> <span className={`px-2 py-0.5 rounded text-xs font-semibold ${PRIORITY_CLASSES[dispute.priority] || 'bg-gray-100'}`}>{dispute.priority}</span></div>
              <div><span className="text-gray-500">User:</span> <span className="font-medium">{dispute.user?.name}</span></div>
              <div><span className="text-gray-500">Order:</span> <span className="font-medium">{dispute.order?.order_number || '—'}</span></div>
              <div><span className="text-gray-500">Status:</span> <span className="font-medium">{dispute.status}</span></div>
              <div><span className="text-gray-500">Opened:</span> <span className="font-medium">{new Date(dispute.created_at).toLocaleString()}</span></div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-800 mb-2">{dispute.subject}</h3>
            </div>

            {dispute.status === 'RESOLVED' && dispute.resolution && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                <p className="font-semibold">Resolved</p>
                <p>{dispute.resolution}</p>
              </div>
            )}

            <div className="space-y-3 max-h-64 overflow-y-auto border rounded-lg p-3 bg-gray-50">
              {(dispute.messages || []).map((msg) => (
                <div key={msg.id} className="text-sm">
                  <p className="font-semibold text-gray-700">{msg.sender_type}</p>
                  <p className="text-gray-600">{msg.message}</p>
                  <p className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleString()}</p>
                </div>
              ))}
              {(dispute.messages || []).length === 0 && <p className="text-sm text-gray-500 italic">No messages yet.</p>}
            </div>

            {dispute.status === 'OPEN' && (
              <>
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Reply to this dispute..."
                    className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <button type="submit" disabled={sending || !newMessage.trim()} className="px-3 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">
                    <Send size={16} />
                  </button>
                </form>

                {!showResolveForm && !showRejectForm && (
                  <div className="flex gap-2">
                    <button onClick={() => setShowResolveForm(true)} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-semibold">
                      Resolve Dispute
                    </button>
                    <button onClick={() => setShowRejectForm(true)} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold">
                      Reject Dispute
                    </button>
                  </div>
                )}

                {showRejectForm && (
                  <form onSubmit={handleReject} className="p-3 border border-red-200 bg-red-50 rounded-lg space-y-2">
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Reason for rejecting this dispute"
                      required
                      rows={2}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setShowRejectForm(false)} className="px-3 py-1.5 border rounded-lg text-sm">Cancel</button>
                      <button type="submit" disabled={rejecting || !rejectReason.trim()} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50">
                        {rejecting ? 'Rejecting...' : 'Confirm Rejection'}
                      </button>
                    </div>
                  </form>
                )}

                {showResolveForm && (
                  <form onSubmit={handleResolve} className="p-3 border border-green-200 bg-green-50 rounded-lg space-y-2">
                    <textarea
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      placeholder="Resolution summary"
                      required
                      rows={2}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        placeholder="Refund amount (optional)"
                        className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <label className="flex items-center gap-1 text-sm">
                        <input type="checkbox" checked={refundToWallet} onChange={(e) => setRefundToWallet(e.target.checked)} />
                        To wallet
                      </label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setShowResolveForm(false)} className="px-3 py-1.5 border rounded-lg text-sm">Cancel</button>
                      <button type="submit" disabled={resolving} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm disabled:opacity-50">
                        {resolving ? 'Resolving...' : 'Confirm Resolution'}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const DisputesPage = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [selectedId, setSelectedId] = useState(null);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/disputes', {
        page,
        limit: 20,
        status: statusFilter === 'All' ? undefined : statusFilter,
        category: searchInput || undefined,
      });
      setDisputes(res.data || []);
      setMeta(res.meta || { total: 0, totalPages: 1 });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load disputes.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchInput]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const handleResolved = (id, status) => {
    setDisputes((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-extrabold text-slate-800 dark:text-gray-100 mb-6 flex items-center">
        <AlertOctagon size={28} className="mr-3 text-red-500" />
        Disputes
      </h1>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="p-4 border-b flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by category..."
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Ticket</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Opened</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {disputes.map((d) => (
                  <tr key={d.id} onClick={() => setSelectedId(d.id)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-mono text-sm text-indigo-600">{d.ticket_number}</td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate">{d.subject}</td>
                    <td className="px-4 py-3 text-sm">{d.user?.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${PRIORITY_CLASSES[d.priority] || 'bg-gray-100'}`}>{d.priority}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">{d.status}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(d.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {disputes.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">No disputes found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t flex items-center justify-between text-sm text-gray-600">
          <div>Page {page} of {meta.totalPages || 1} &middot; {meta.total ?? 0} total</div>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="p-2 border rounded-lg disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(meta.totalPages || 1, p + 1))} disabled={page >= (meta.totalPages || 1)} className="p-2 border rounded-lg disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {selectedId && (
        <DisputeDetail disputeId={selectedId} onClose={() => setSelectedId(null)} onResolved={handleResolved} />
      )}
    </div>
  );
};

export default DisputesPage;
