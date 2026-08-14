// src/pages/Engagement/components/LoyaltyManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, RefreshCw, Search } from 'lucide-react';
import { apiClient, ApiError } from '../../../services/apiClient';
import ImageUploadField from '../../../components/ImageUploadField';
import { useAuth } from '../../../context/AuthContext';

const REWARD_TYPES = ['DISCOUNT_CODE', 'FREE_DELIVERY', 'WALLET_TOPUP', 'FREE_ITEM', 'MERCH'];
const SUB_TABS = { RULES: 'Rules', REWARDS: 'Rewards', LOOKUP: 'Account Lookup' };

const DEFAULT_RULE = { event_type: 'ORDER_DELIVERED', points_per_unit: 1, unit_amount: 500, country_code: '' };
const DEFAULT_REWARD = { name: '', description: '', image_url: '', points_cost: 100, reward_type: 'DISCOUNT_CODE', reward_value: '{"pct":10,"max":2000}', country_code: '' };

function RulesPanel() {
  const { isSuperAdmin } = useAuth();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(DEFAULT_RULE);
  const [submitting, setSubmitting] = useState(false);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/engagement/loyalty/rules');
      setRules(res.data || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load loyalty rules.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await apiClient.post('/engagement/loyalty/rules', { ...form, country_code: form.country_code || undefined });
      setRules((prev) => [res.data, ...prev]);
      setForm(DEFAULT_RULE);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create rule.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/engagement/loyalty/rules/${id}`);
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete rule.');
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Rules that award Reecoins for platform events (e.g. 1 point per 500 XAF spent).</p>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}

      {isSuperAdmin && (
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end border border-dashed rounded-lg p-3">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Event Type</label>
            <input required value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })} className="w-full p-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Points per Unit</label>
            <input type="number" value={form.points_per_unit} onChange={(e) => setForm({ ...form, points_per_unit: Number(e.target.value) })} className="w-full p-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Unit Amount (XAF)</label>
            <input type="number" value={form.unit_amount} onChange={(e) => setForm({ ...form, unit_amount: Number(e.target.value) })} className="w-full p-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Country (optional)</label>
            <input maxLength={2} value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value.toUpperCase() })} className="w-full p-2 border rounded-lg text-sm uppercase" />
          </div>
          <button type="submit" disabled={submitting} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50 flex items-center justify-center gap-1">
            <Plus size={14} /> Add Rule
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between border rounded-lg p-3 text-sm">
              <p>{rule.points_per_unit} point(s) per {rule.unit_amount} XAF on <span className="font-mono">{rule.event_type}</span> {rule.country_code ? `(${rule.country_code})` : '(global)'}</p>
              {isSuperAdmin && (
                <button onClick={() => handleDelete(rule.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
              )}
            </div>
          ))}
          {rules.length === 0 && <p className="text-center text-gray-500 py-6">No loyalty rules yet.</p>}
        </div>
      )}
    </div>
  );
}

function RewardsPanel() {
  const { isSuperAdmin } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(DEFAULT_REWARD);
  const [submitting, setSubmitting] = useState(false);

  const fetchRewards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/engagement/loyalty/rewards');
      setRewards(res.data || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load rewards.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRewards(); }, [fetchRewards]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    let rewardValue;
    try {
      rewardValue = JSON.parse(form.reward_value);
    } catch {
      setError('Reward value must be valid JSON.');
      setSubmitting(false);
      return;
    }
    try {
      const res = await apiClient.post('/engagement/loyalty/rewards', {
        name: form.name,
        description: form.description,
        image_url: form.image_url || undefined,
        points_cost: form.points_cost,
        reward_type: form.reward_type,
        reward_value: rewardValue,
        country_code: form.country_code || undefined,
      });
      setRewards((prev) => [res.data, ...prev]);
      setForm(DEFAULT_REWARD);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create reward.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (reward) => {
    try {
      const res = await apiClient.patch(`/engagement/loyalty/rewards/${reward.id}`, { is_active: !reward.is_active });
      setRewards((prev) => prev.map((r) => (r.id === reward.id ? res.data : r)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update reward.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/engagement/loyalty/rewards/${id}`);
      setRewards((prev) => prev.map((r) => (r.id === id ? { ...r, is_active: false } : r)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete reward.');
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Rewards customers can redeem with Reecoins.</p>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}

      {isSuperAdmin && (
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-2 border border-dashed rounded-lg p-3">
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="p-2 border rounded-lg text-sm" />
          <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="p-2 border rounded-lg text-sm" />
          <input type="number" placeholder="Points cost" value={form.points_cost} onChange={(e) => setForm({ ...form, points_cost: Number(e.target.value) })} className="p-2 border rounded-lg text-sm" />
          <select value={form.reward_type} onChange={(e) => setForm({ ...form, reward_type: e.target.value })} className="p-2 border rounded-lg text-sm">
            {REWARD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input value={form.reward_value} onChange={(e) => setForm({ ...form, reward_value: e.target.value })} className="p-2 border rounded-lg text-sm font-mono md:col-span-1" placeholder='{"pct":10}' />
          <div className="md:col-span-3">
            <ImageUploadField label="Reward Image (optional)" value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
          </div>
          <button type="submit" disabled={submitting || !form.name.trim()} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50 flex items-center justify-center gap-1">
            <Plus size={14} /> Add Reward
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rewards.map((reward) => (
            <div key={reward.id} className="border rounded-lg p-3">
              <div className="flex justify-between items-start gap-3">
                {reward.image_url && (
                  <img src={reward.image_url} alt="" className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800">{reward.name}</p>
                  <p className="text-xs text-gray-500">{reward.description}</p>
                  <p className="text-xs font-mono text-gray-400 mt-1">{reward.reward_type} &middot; {reward.points_cost} pts</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    onClick={isSuperAdmin ? () => toggleActive(reward) : undefined}
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isSuperAdmin ? 'cursor-pointer' : ''} ${reward.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {reward.is_active ? 'Active' : 'Inactive'}
                  </span>
                  {isSuperAdmin && (
                    <button onClick={() => handleDelete(reward.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {rewards.length === 0 && <p className="col-span-full text-center text-gray-500 py-6">No rewards yet.</p>}
        </div>
      )}
    </div>
  );
}

function LookupPanel() {
  const [userId, setUserId] = useState('');
  const [account, setAccount] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!userId.trim()) return;
    setLoading(true);
    setError('');
    setAccount(null);
    setLedger([]);
    try {
      const [accountRes, ledgerRes] = await Promise.all([
        apiClient.get(`/engagement/loyalty/accounts/${userId}`),
        apiClient.get(`/engagement/loyalty/accounts/${userId}/ledger`),
      ]);
      setAccount(accountRes.data);
      setLedger(ledgerRes.data || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load loyalty account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleLookup} className="flex gap-2">
        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Customer user ID"
          className="flex-1 p-2 border rounded-lg text-sm"
        />
        <button type="submit" disabled={loading} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm flex items-center gap-1 disabled:opacity-50">
          <Search size={14} /> Look up
        </button>
      </form>

      {loading && <div className="flex justify-center py-8"><RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" /></div>}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}

      {account && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="border rounded-lg p-3"><p className="text-xs text-gray-500">Balance</p><p className="font-bold text-lg">{account.balance}</p></div>
          <div className="border rounded-lg p-3"><p className="text-xs text-gray-500">Total Earned</p><p className="font-bold text-lg">{account.total_earned}</p></div>
          <div className="border rounded-lg p-3"><p className="text-xs text-gray-500">Total Spent</p><p className="font-bold text-lg">{account.total_spent}</p></div>
          <div className="border rounded-lg p-3"><p className="text-xs text-gray-500">Tier</p><p className="font-bold text-lg">{account.tier}</p></div>
        </div>
      )}

      {ledger.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Delta</th><th className="px-3 py-2 text-left">Reason</th><th className="px-3 py-2 text-left">Description</th><th className="px-3 py-2 text-left">Date</th></tr></thead>
            <tbody className="divide-y">
              {ledger.map((entry) => (
                <tr key={entry.id}>
                  <td className={`px-3 py-2 font-semibold ${entry.delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>{entry.delta >= 0 ? '+' : ''}{entry.delta}</td>
                  <td className="px-3 py-2 font-mono text-xs">{entry.reason}</td>
                  <td className="px-3 py-2">{entry.description}</td>
                  <td className="px-3 py-2 text-gray-500">{new Date(entry.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const LoyaltyManagement = () => {
  const [tab, setTab] = useState(SUB_TABS.RULES);
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {Object.values(SUB_TABS).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-full text-sm font-medium ${tab === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === SUB_TABS.RULES && <RulesPanel />}
      {tab === SUB_TABS.REWARDS && <RewardsPanel />}
      {tab === SUB_TABS.LOOKUP && <LookupPanel />}
    </div>
  );
};

export default LoyaltyManagement;
