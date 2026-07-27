// src/pages/Engagement/components/PreferenceTags.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { apiClient, ApiError } from '../../../services/apiClient';

const DEFAULT_FORM = { tag: '', display_name: '', emoji: '', sort_order: 0 };

const PreferenceTags = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/engagement/preference-tags');
      setTags(res.data || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load preference tags.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTags(); }, [fetchTags]);

  const handleUpsert = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await apiClient.post('/engagement/preference-tags', form);
      setTags((prev) => {
        const exists = prev.some((t) => t.tag === res.data.tag);
        return exists ? prev.map((t) => (t.tag === res.data.tag ? res.data : t)) : [res.data, ...prev];
      });
      setForm(DEFAULT_FORM);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save tag.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (tag) => {
    try {
      await apiClient.delete(`/engagement/preference-tags/${tag}`);
      setTags((prev) => prev.filter((t) => t.tag !== tag));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete tag.');
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Cuisine/preference tags shown in onboarding and search filters (e.g. pizza 🍕).</p>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}

      <form onSubmit={handleUpsert} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end border border-dashed rounded-lg p-3">
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Tag (id)</label>
          <input required value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} className="w-full p-2 border rounded-lg text-sm font-mono" placeholder="pizza" />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-gray-600 block mb-1">Display Name</label>
          <input required value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="w-full p-2 border rounded-lg text-sm" placeholder="Pizza" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Emoji</label>
          <input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} className="w-full p-2 border rounded-lg text-sm" placeholder="🍕" />
        </div>
        <button type="submit" disabled={submitting || !form.tag.trim()} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50 flex items-center justify-center gap-1">
          <Plus size={14} /> Save
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-8"><RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" /></div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <div key={t.tag} className="flex items-center gap-2 border rounded-full pl-3 pr-2 py-1 text-sm bg-white">
              <span>{t.emoji} {t.display_name}</span>
              <button onClick={() => handleDelete(t.tag)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
            </div>
          ))}
          {tags.length === 0 && <p className="text-gray-500 py-6">No preference tags yet.</p>}
        </div>
      )}
    </div>
  );
};

export default PreferenceTags;
