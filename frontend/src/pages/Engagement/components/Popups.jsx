// src/pages/Engagement/components/Popups.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, RefreshCw, BarChart2 } from 'lucide-react';
import { apiClient, ApiError } from '../../../services/apiClient';

const AUDIENCES = ['ALL', 'NEW_USERS', 'RETURNING', 'INACTIVE', 'VIP'];
const TRIGGERS = ['HOME_OPEN', 'POST_ORDER', 'PRE_CHECKOUT', 'APP_OPEN', 'INACTIVE_7D', 'MANUAL'];

const DEFAULT_FORM = {
  title: '', body: '', cta_label: '', cta_link: '', cta_link_type: 'SCREEN',
  trigger: 'HOME_OPEN', country_code: '', audience: 'ALL', max_displays_per_user: 1, priority: 10,
};

const Popups = () => {
  const [popups, setPopups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({});

  const fetchPopups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/engagement/popups');
      setPopups(res.data || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load popups.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPopups(); }, [fetchPopups]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await apiClient.post('/engagement/popups', { ...form, country_code: form.country_code || undefined });
      setPopups((prev) => [res.data, ...prev]);
      setForm(DEFAULT_FORM);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create popup.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/engagement/popups/${id}`);
      setPopups((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete popup.');
    }
  };

  const loadStats = async (id) => {
    if (stats[id]) {
      setStats((prev) => ({ ...prev, [id]: undefined }));
      return;
    }
    try {
      const res = await apiClient.get(`/engagement/popups/${id}/stats`);
      setStats((prev) => ({ ...prev, [id]: res.data }));
    } catch {
      setStats((prev) => ({ ...prev, [id]: { error: true } }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">In-app popups shown to customers on specific triggers.</p>
        <button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm">
          <Plus size={14} /> New Popup
        </button>
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}

      {showForm && (
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-2 border border-dashed rounded-lg p-3">
          <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="p-2 border rounded-lg text-sm md:col-span-2" />
          <select value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value })} className="p-2 border rounded-lg text-sm">
            {TRIGGERS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <textarea required placeholder="Body" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={2} className="p-2 border rounded-lg text-sm md:col-span-3" />
          <input placeholder="CTA Label" value={form.cta_label} onChange={(e) => setForm({ ...form, cta_label: e.target.value })} className="p-2 border rounded-lg text-sm" />
          <input placeholder="CTA Link" value={form.cta_link} onChange={(e) => setForm({ ...form, cta_link: e.target.value })} className="p-2 border rounded-lg text-sm" />
          <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} className="p-2 border rounded-lg text-sm">
            {AUDIENCES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <input maxLength={2} placeholder="Country (optional)" value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value.toUpperCase() })} className="p-2 border rounded-lg text-sm uppercase" />
          <input type="number" placeholder="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} className="p-2 border rounded-lg text-sm" />
          <button type="submit" disabled={submitting} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50">Create</button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {popups.map((popup) => (
            <div key={popup.id} className="border rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-sm text-gray-800">{popup.title}</p>
                  <p className="text-xs text-gray-500">{popup.body}</p>
                  <p className="text-xs font-mono text-gray-400 mt-1">{popup.trigger} &middot; {popup.audience} &middot; priority {popup.priority}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => loadStats(popup.id)} className="text-indigo-600 hover:text-indigo-800"><BarChart2 size={16} /></button>
                  <button onClick={() => handleDelete(popup.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                </div>
              </div>
              {stats[popup.id] && !stats[popup.id].error && (
                <div className="mt-2 pt-2 border-t grid grid-cols-4 gap-2 text-center text-xs">
                  <div><p className="font-bold">{stats[popup.id].views}</p><p className="text-gray-500">Views</p></div>
                  <div><p className="font-bold">{stats[popup.id].dismissed}</p><p className="text-gray-500">Dismissed</p></div>
                  <div><p className="font-bold">{stats[popup.id].clicked}</p><p className="text-gray-500">Clicked</p></div>
                  <div><p className="font-bold">{stats[popup.id].unique_users}</p><p className="text-gray-500">Unique</p></div>
                </div>
              )}
            </div>
          ))}
          {popups.length === 0 && <p className="text-center text-gray-500 py-6">No popups yet.</p>}
        </div>
      )}
    </div>
  );
};

export default Popups;
