// src/pages/Settings/components/ApiKeys.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Key, Plus, X, Trash2, RefreshCw, Copy, Check } from 'lucide-react';
import { apiClient, ApiError } from '../../../services/apiClient';

const COMMON_SCOPES = ['orders:read', 'users:read', 'vendors:read', 'riders:read', 'broadcast:write', 'analytics:read'];

function CreateKeyModal({ onCancel, onCreated }) {
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState([]);
  const [expiresAt, setExpiresAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggleScope = (scope) => {
    setScopes((prev) => (prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (scopes.length === 0) {
      setError('Select at least one scope.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await apiClient.post('/config/api-keys', {
        name,
        scopes,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      });
      onCreated(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create key.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800">New API Key</h3>
          <button type="button" onClick={onCancel}><X size={20} /></button>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 mb-3">{error}</p>}

        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="support-bot"
          className="w-full p-2 border border-gray-300 rounded-lg mb-3"
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">Scopes</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {COMMON_SCOPES.map((scope) => (
            <button
              type="button"
              key={scope}
              onClick={() => toggleScope(scope)}
              className={`px-2 py-1 rounded text-xs font-mono ${scopes.includes(scope) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              {scope}
            </button>
          ))}
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-1">Expires (optional)</label>
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg mb-4"
        />

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-lg">Cancel</button>
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">
            {submitting ? 'Creating...' : 'Create Key'}
          </button>
        </div>
      </form>
    </div>
  );
}

function RawKeyModal({ apiKey, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey.rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Key created: {apiKey.name}</h3>
        <p className="text-sm text-red-600 font-semibold mb-3">
          Copy this now — it will not be shown again.
        </p>
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-3 mb-4">
          <code className="text-sm font-mono break-all flex-1">{apiKey.rawKey}</code>
          <button onClick={handleCopy} className="p-2 bg-indigo-600 text-white rounded-lg flex-shrink-0">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
        <button onClick={onClose} className="w-full py-2 bg-gray-800 text-white rounded-lg">
          I've saved it — Close
        </button>
      </div>
    </div>
  );
}

const ApiKeys = () => {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [revealedKey, setRevealedKey] = useState(null);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/config/api-keys');
      setKeys(res.data || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load API keys.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreated = (newKey) => {
    setShowCreate(false);
    setRevealedKey(newKey);
    setKeys((prev) => [newKey, ...prev]);
  };

  const handleRevoke = async (id) => {
    setError('');
    try {
      await apiClient.delete(`/config/api-keys/${id}`);
      setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, revoked_at: new Date().toISOString() } : k)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not revoke key.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-2 mb-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Key size={24} className="text-green-600" /> API Keys
        </h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm">
          <Plus size={16} /> New Key
        </button>
      </div>

      <p className="text-sm text-gray-600 bg-gray-50 border rounded-lg p-3">
        Generate, revoke, and track usage for bots and automations. Treat these keys like passwords — the raw value is only shown once, at creation.
      </p>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center py-16"><RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" /></div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Name</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Key</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Scopes</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Last Used</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Status</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {keys.map((k) => (
                <tr key={k.id}>
                  <td className="px-4 py-3 font-medium text-gray-800">{k.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{k.key_prefix}...</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {k.scopes.map((s) => <span key={s} className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">{s}</span>)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${k.revoked_at ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {k.revoked_at ? 'Revoked' : 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {!k.revoked_at && (
                      <button onClick={() => handleRevoke(k.id)} className="text-red-600 hover:text-red-800 flex items-center gap-1 text-xs font-semibold">
                        <Trash2 size={14} /> Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {keys.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No API keys yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <CreateKeyModal onCancel={() => setShowCreate(false)} onCreated={handleCreated} />}
      {revealedKey && <RawKeyModal apiKey={revealedKey} onClose={() => setRevealedKey(null)} />}
    </div>
  );
};

export default ApiKeys;
