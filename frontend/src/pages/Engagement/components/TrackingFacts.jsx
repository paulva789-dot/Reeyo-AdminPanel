// src/pages/Engagement/components/TrackingFacts.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { apiClient, ApiError } from '../../../services/apiClient';
import { useAuth } from '../../../context/AuthContext';

const DEFAULT_FORM = { text: '', category: '', country_code: '', sort_order: 0 };

const TrackingFacts = () => {
  const { isSuperAdmin } = useAuth();
  const [facts, setFacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchFacts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/engagement/tracking-facts');
      setFacts(res.data || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load tracking facts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFacts(); }, [fetchFacts]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await apiClient.post('/engagement/tracking-facts', {
        ...form,
        category: form.category || undefined,
        country_code: form.country_code || undefined,
      });
      setFacts((prev) => [res.data, ...prev]);
      setForm(DEFAULT_FORM);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create fact.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (fact) => {
    try {
      const res = await apiClient.patch(`/engagement/tracking-facts/${fact.id}`, { is_active: !fact.is_active });
      setFacts((prev) => prev.map((f) => (f.id === fact.id ? res.data : f)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update fact.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/engagement/tracking-facts/${id}`);
      setFacts((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete fact.');
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Fun facts shown to customers on the order-tracking screen.</p>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}

      {isSuperAdmin && (
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end border border-dashed rounded-lg p-3">
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-gray-600 block mb-1">Text</label>
            <input required value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} className="w-full p-2 border rounded-lg text-sm" placeholder="Mount Cameroon is..." />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Category</label>
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full p-2 border rounded-lg text-sm" placeholder="CULTURE" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Country (ISO-2)</label>
            <input maxLength={2} value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value.toUpperCase() })} className="w-full p-2 border rounded-lg text-sm uppercase" />
          </div>
          <button type="submit" disabled={submitting || !form.text.trim()} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50 flex items-center justify-center gap-1">
            <Plus size={14} /> Add
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {facts.map((fact) => (
            <div key={fact.id} className="flex items-center justify-between border rounded-lg p-3 text-sm">
              <div>
                <p className="text-gray-800">{fact.text}</p>
                <p className="text-xs text-gray-500">{fact.category || 'Uncategorized'} &middot; {fact.country_code || 'All countries'}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  onClick={isSuperAdmin ? () => toggleActive(fact) : undefined}
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${isSuperAdmin ? 'cursor-pointer' : ''} ${fact.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                >
                  {fact.is_active ? 'Active' : 'Inactive'}
                </span>
                {isSuperAdmin && (
                  <button onClick={() => handleDelete(fact.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                )}
              </div>
            </div>
          ))}
          {facts.length === 0 && <p className="text-center text-gray-500 py-6">No tracking facts yet.</p>}
        </div>
      )}
    </div>
  );
};

export default TrackingFacts;
