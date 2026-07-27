// src/pages/Finance/components/SettlementManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Check, X } from 'lucide-react';
import { apiClient, ApiError } from '../../../services/apiClient';

const formatCurrency = (amount, currency = 'XAF') =>
  Number(amount || 0).toLocaleString('fr-FR', { style: 'currency', currency, minimumFractionDigits: 0 });

const TYPES = ['VENDOR', 'RIDER'];

function RejectModal({ payout, onCancel, onConfirm, submitting }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5">
        <h3 className="font-bold text-slate-800 mb-2">Reject payout for {payout.entity_name}?</h3>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="e.g. Bank details look wrong"
          className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <p className="text-xs text-slate-500 mt-1">Funds are returned to the wallet immediately on reject.</p>
        <div className="mt-3 flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 border rounded-lg text-sm">Cancel</button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim() || submitting}
            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50"
          >
            {submitting ? 'Rejecting...' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}

const SettlementManagement = () => {
  const [type, setType] = useState('VENDOR');
  const [view, setView] = useState('pending'); // 'pending' | 'history'
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (view === 'pending') {
        const res = await apiClient.get('/payouts/pending', { type });
        setPending(res.data || []);
      } else {
        const res = await apiClient.get('/payouts/history', { type, page: 1, limit: 20 });
        setHistory(res.data || []);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load payouts.');
    } finally {
      setLoading(false);
    }
  }, [type, view]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (payout) => {
    setSubmitting(true);
    setError('');
    try {
      await apiClient.post(`/payouts/${payout.id}/approve`, { type });
      setPending((prev) => prev.filter((p) => p.id !== payout.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not approve payout.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (reason) => {
    if (!rejectTarget) return;
    setSubmitting(true);
    setError('');
    try {
      await apiClient.post(`/payouts/${rejectTarget.id}/reject`, { type, reason });
      setPending((prev) => prev.filter((p) => p.id !== rejectTarget.id));
      setRejectTarget(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reject payout.');
    } finally {
      setSubmitting(false);
    }
  };

  const rows = view === 'pending' ? pending : history;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100">Payouts</h2>
        <div className="flex gap-1">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-2 py-1 text-xs font-semibold rounded ${type === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mb-3 text-sm">
        <button onClick={() => setView('pending')} className={`px-3 py-1 rounded-full ${view === 'pending' ? 'bg-orange-100 text-orange-700 font-semibold' : 'text-gray-500'}`}>
          Pending
        </button>
        <button onClick={() => setView('history')} className={`px-3 py-1 rounded-full ${view === 'history' ? 'bg-orange-100 text-orange-700 font-semibold' : 'text-gray-500'}`}>
          History
        </button>
      </div>

      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-8">
          <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto max-h-96">
          {rows.map((row) => (
            <div key={row.id} className="p-3 border dark:border-gray-700 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm text-slate-800 dark:text-gray-100">{row.entity_name || (type === 'VENDOR' ? row.vendor_id : row.rider_id)}</p>
                  <p className="text-xs text-gray-500">{new Date(row.created_at).toLocaleDateString()}</p>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    row.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    row.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {row.status}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-bold text-green-600">{formatCurrency(row.amount, row.currency)}</span>
                {view === 'pending' && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleApprove(row)}
                      disabled={submitting}
                      className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      title="Approve"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setRejectTarget(row)}
                      className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700"
                      title="Reject"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {rows.length === 0 && <p className="text-center text-sm text-gray-500 py-6">No {view} {type.toLowerCase()} payouts.</p>}
        </div>
      )}

      {rejectTarget && (
        <RejectModal payout={rejectTarget} onCancel={() => setRejectTarget(null)} onConfirm={handleReject} submitting={submitting} />
      )}
    </div>
  );
};

export default SettlementManagement;
