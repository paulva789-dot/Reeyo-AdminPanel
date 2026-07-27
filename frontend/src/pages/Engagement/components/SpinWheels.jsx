// src/pages/Engagement/components/SpinWheels.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, RefreshCw, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { apiClient, ApiError } from '../../../services/apiClient';

const SEGMENT_REWARD_TYPES = ['DISCOUNT_PCT', 'DISCOUNT_FIXED', 'FREE_DELIVERY', 'REECOINS', 'PROMO_CODE', 'NOTHING'];

const DEFAULT_WHEEL = { name: '', trigger: 'CHECKOUT', country_code: '', max_spins_per_user: 1, cooldown_hours: 24, min_order_amount: 0 };
const DEFAULT_SEGMENT = { label: '', reward_type: 'REECOINS', reward_value: '{"coins":100}', probability_weight: 10, color: '#39CB69' };

function SegmentForm({ wheelId, onAdded }) {
  const [form, setForm] = useState(DEFAULT_SEGMENT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    let rewardValue;
    try {
      rewardValue = JSON.parse(form.reward_value);
    } catch {
      setError('Reward value must be valid JSON.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await apiClient.post(`/engagement/spin-wheels/${wheelId}/segments`, {
        label: form.label,
        reward_type: form.reward_type,
        reward_value: rewardValue,
        probability_weight: form.probability_weight,
        color: form.color,
      });
      onAdded(res.data);
      setForm(DEFAULT_SEGMENT);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add segment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end border border-dashed rounded p-2">
      <input required placeholder="Label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="p-1.5 border rounded text-xs" />
      <select value={form.reward_type} onChange={(e) => setForm({ ...form, reward_type: e.target.value })} className="p-1.5 border rounded text-xs">
        {SEGMENT_REWARD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <input value={form.reward_value} onChange={(e) => setForm({ ...form, reward_value: e.target.value })} className="p-1.5 border rounded text-xs font-mono" placeholder='{"coins":100}' />
      <input type="number" value={form.probability_weight} onChange={(e) => setForm({ ...form, probability_weight: Number(e.target.value) })} className="p-1.5 border rounded text-xs" placeholder="Weight" />
      <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-8 border rounded" />
      <button type="submit" disabled={submitting} className="px-2 py-1.5 bg-indigo-600 text-white rounded text-xs disabled:opacity-50">Add</button>
      {error && <p className="col-span-full text-xs text-red-600">{error}</p>}
    </form>
  );
}

function WheelRow({ wheel, onDeleted, onSegmentAdded, onSegmentRemoved }) {
  const [expanded, setExpanded] = useState(false);
  const [results, setResults] = useState(null);

  const loadResults = async () => {
    if (results) { setResults(null); return; }
    try {
      const res = await apiClient.get(`/engagement/spin-wheels/${wheel.id}/results`);
      setResults(res.data || []);
    } catch {
      setResults([]);
    }
  };

  const totalWeight = (wheel.segments || []).reduce((s, seg) => s + seg.probability_weight, 0);

  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center justify-between">
        <button onClick={() => setExpanded((e) => !e)} className="flex items-center gap-2 text-left flex-1">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          <div>
            <p className="font-semibold text-sm text-gray-800">{wheel.name}</p>
            <p className="text-xs text-gray-500">{wheel.trigger} &middot; {wheel.country_code || 'All'} &middot; {wheel.segments?.length || 0} segments</p>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${wheel.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {wheel.is_active ? 'Active' : 'Inactive'}
          </span>
          <button onClick={loadResults} className="text-indigo-600 hover:text-indigo-800"><Eye size={16} /></button>
          <button onClick={() => onDeleted(wheel.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t space-y-2">
          {(wheel.segments || []).map((seg) => (
            <div key={seg.id} className="flex items-center justify-between text-xs p-2 rounded" style={{ backgroundColor: `${seg.color}22` }}>
              <span>{seg.label} — {seg.reward_type} &middot; win chance: {totalWeight ? Math.round((seg.probability_weight / totalWeight) * 100) : 0}%</span>
              <button onClick={() => onSegmentRemoved(wheel.id, seg.id)} className="text-red-500 hover:text-red-700"><Trash2 size={12} /></button>
            </div>
          ))}
          <SegmentForm wheelId={wheel.id} onAdded={(seg) => onSegmentAdded(wheel.id, seg)} />

          {results !== null && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-gray-600 mb-1">Recent spins</p>
              {results.length > 0 ? (
                <div className="space-y-1">
                  {results.slice(0, 5).map((r) => (
                    <p key={r.id} className="text-xs text-gray-500">{r.segment_label} &middot; {r.redeemed ? 'redeemed' : 'unredeemed'} &middot; {new Date(r.created_at).toLocaleDateString()}</p>
                  ))}
                </div>
              ) : <p className="text-xs text-gray-400">No spins yet.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const SpinWheels = () => {
  const [wheels, setWheels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(DEFAULT_WHEEL);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchWheels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/engagement/spin-wheels');
      setWheels(res.data || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load spin wheels.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWheels(); }, [fetchWheels]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await apiClient.post('/engagement/spin-wheels', { ...form, country_code: form.country_code || undefined });
      setWheels((prev) => [{ ...res.data, segments: [] }, ...prev]);
      setForm(DEFAULT_WHEEL);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create wheel.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/engagement/spin-wheels/${id}`);
      setWheels((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete wheel.');
    }
  };

  const handleSegmentAdded = (wheelId, segment) => {
    setWheels((prev) => prev.map((w) => (w.id === wheelId ? { ...w, segments: [...(w.segments || []), segment] } : w)));
  };

  const handleSegmentRemoved = async (wheelId, segmentId) => {
    try {
      await apiClient.delete(`/engagement/spin-wheels/${wheelId}/segments/${segmentId}`);
      setWheels((prev) => prev.map((w) => (w.id === wheelId ? { ...w, segments: w.segments.filter((s) => s.id !== segmentId) } : w)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not remove segment.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">Gamified spin-to-win wheels shown at checkout or other triggers.</p>
        <button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm">
          <Plus size={14} /> New Wheel
        </button>
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}

      {showForm && (
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-2 border border-dashed rounded-lg p-3">
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="p-2 border rounded-lg text-sm" />
          <input placeholder="Trigger (CHECKOUT)" value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value })} className="p-2 border rounded-lg text-sm" />
          <input maxLength={2} placeholder="Country (optional)" value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value.toUpperCase() })} className="p-2 border rounded-lg text-sm uppercase" />
          <input type="number" placeholder="Max spins/user" value={form.max_spins_per_user} onChange={(e) => setForm({ ...form, max_spins_per_user: Number(e.target.value) })} className="p-2 border rounded-lg text-sm" />
          <input type="number" placeholder="Cooldown (hours)" value={form.cooldown_hours} onChange={(e) => setForm({ ...form, cooldown_hours: Number(e.target.value) })} className="p-2 border rounded-lg text-sm" />
          <input type="number" placeholder="Min order amount" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: Number(e.target.value) })} className="p-2 border rounded-lg text-sm" />
          <button type="submit" disabled={submitting} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50">Create</button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {wheels.map((wheel) => (
            <WheelRow key={wheel.id} wheel={wheel} onDeleted={handleDelete} onSegmentAdded={handleSegmentAdded} onSegmentRemoved={handleSegmentRemoved} />
          ))}
          {wheels.length === 0 && <p className="text-center text-gray-500 py-6">No spin wheels yet.</p>}
        </div>
      )}
    </div>
  );
};

export default SpinWheels;
