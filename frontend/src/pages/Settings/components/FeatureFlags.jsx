// src/pages/Settings/components/FeatureFlags.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { ToggleLeft, RefreshCw, Trash2, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { apiClient, ApiError } from '../../../services/apiClient';
import { useAuth } from '../../../context/AuthContext';

function MetadataEditor({ value, onChange, disabled }) {
  const [text, setText] = useState(JSON.stringify(value || {}, null, 2));
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setText(JSON.stringify(value || {}, null, 2));
  }, [value]);

  const handleBlur = () => {
    try {
      const parsed = JSON.parse(text);
      setInvalid(false);
      onChange(parsed);
    } catch {
      setInvalid(true);
    }
  };

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        disabled={disabled}
        rows={3}
        className={`w-full font-mono text-xs p-2 border rounded-lg disabled:bg-gray-100 ${invalid ? 'border-red-400' : 'border-gray-300'}`}
      />
      {invalid && <p className="text-xs text-red-600 mt-1">Invalid JSON — not saved yet.</p>}
    </div>
  );
}

function FlagRow({ flag, canEdit, onSave, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState(flag);
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(flag), [flag]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(flag);

  const persist = async (patch) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    if (!canEdit) return;
    setSaving(true);
    try {
      await onSave(flag.key, patch);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => setExpanded((e) => !e)} className="flex items-center gap-2 flex-1 text-left min-w-0">
          {expanded ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold text-gray-800 truncate">{flag.key}</p>
            <p className="text-xs text-gray-500 truncate">{flag.description}</p>
          </div>
        </button>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-gray-500">{draft.rollout_pct}%</span>
          <button
            onClick={() => persist({ enabled: !draft.enabled })}
            disabled={!canEdit || saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${draft.enabled ? 'bg-indigo-600' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${draft.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          {canEdit && (
            <button onClick={() => onDelete(flag.key)} className="text-red-500 hover:text-red-700">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
            <input
              type="text"
              value={draft.description || ''}
              disabled={!canEdit}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              onBlur={() => canEdit && persist({ description: draft.description })}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Rollout %</label>
              <input
                type="range" min={0} max={100}
                value={draft.rollout_pct}
                disabled={!canEdit}
                onChange={(e) => setDraft((d) => ({ ...d, rollout_pct: Number(e.target.value) }))}
                onMouseUp={() => canEdit && persist({ rollout_pct: draft.rollout_pct })}
                onTouchEnd={() => canEdit && persist({ rollout_pct: draft.rollout_pct })}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Scope</label>
              <select
                value={draft.scope}
                disabled={!canEdit}
                onChange={(e) => persist({ scope: e.target.value, country_code: e.target.value === 'GLOBAL' ? null : draft.country_code })}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
              >
                <option value="GLOBAL">Global</option>
                <option value="COUNTRY">Country</option>
              </select>
            </div>
          </div>

          {draft.scope === 'COUNTRY' && (
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Country (ISO-2)</label>
              <input
                type="text"
                maxLength={2}
                value={draft.country_code || ''}
                disabled={!canEdit}
                onChange={(e) => setDraft((d) => ({ ...d, country_code: e.target.value.toUpperCase() }))}
                onBlur={() => canEdit && persist({ country_code: draft.country_code })}
                className="w-24 p-2 border border-gray-300 rounded-lg text-sm uppercase disabled:bg-gray-100"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Metadata (JSON)</label>
            <MetadataEditor value={draft.metadata} disabled={!canEdit} onChange={(metadata) => persist({ metadata })} />
          </div>

          {dirty && !canEdit && <p className="text-xs text-amber-600">Unsaved — read-only access.</p>}
        </div>
      )}
    </div>
  );
}

function NewFlagForm({ onCreate, onCancel }) {
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onCreate(key.trim(), description.trim());
      setKey('');
      setDescription('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-dashed rounded-lg p-3 flex gap-2 items-end">
      <div className="flex-1">
        <label className="text-xs font-medium text-gray-600 block mb-1">New flag key</label>
        <input
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="service.mart"
          required
          className="w-full p-2 border border-gray-300 rounded-lg text-sm font-mono"
        />
      </div>
      <div className="flex-1">
        <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>
      <button type="submit" disabled={!key.trim() || submitting} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50 flex items-center gap-1">
        <Plus size={14} /> Add
      </button>
      <button type="button" onClick={onCancel} className="px-3 py-2 border rounded-lg text-sm">
        <X size={14} />
      </button>
    </form>
  );
}

const FeatureFlags = () => {
  const { isSuperAdmin } = useAuth();
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/config/feature-flags');
      setFlags(res.data || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load feature flags.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const handleSave = async (key, patch) => {
    try {
      const res = await apiClient.patch(`/config/feature-flags/${key}`, patch);
      setFlags((prev) => prev.map((f) => (f.key === key ? res.data : f)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Could not update ${key}.`);
    }
  };

  const handleDelete = async (key) => {
    try {
      await apiClient.delete(`/config/feature-flags/${key}`);
      setFlags((prev) => prev.filter((f) => f.key !== key));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Could not delete ${key}.`);
    }
  };

  const handleCreate = async (key, description) => {
    try {
      const res = await apiClient.patch(`/config/feature-flags/${key}`, { enabled: false, description, rollout_pct: 0, scope: 'GLOBAL' });
      setFlags((prev) => [res.data, ...prev]);
      setShowNewForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create flag.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-2 mb-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ToggleLeft size={24} className="text-indigo-600" /> Feature Flags
        </h1>
        {isSuperAdmin && !showNewForm && (
          <button onClick={() => setShowNewForm(true)} className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm">
            <Plus size={16} /> New Flag
          </button>
        )}
      </div>

      {!isSuperAdmin && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          You have read-only access to feature flags. A Super Admin can make changes here.
        </p>
      )}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

      {showNewForm && <NewFlagForm onCreate={handleCreate} onCancel={() => setShowNewForm(false)} />}

      {loading ? (
        <div className="flex items-center justify-center py-16"><RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {flags.map((flag) => (
            <FlagRow key={flag.key} flag={flag} canEdit={isSuperAdmin} onSave={handleSave} onDelete={handleDelete} />
          ))}
          {flags.length === 0 && <p className="text-center text-gray-500 py-8">No feature flags configured.</p>}
        </div>
      )}
    </div>
  );
};

export default FeatureFlags;
