// src/pages/Settings/components/AdminUsers.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, X, RefreshCw, Copy, Check, Ban, CheckCircle } from 'lucide-react';
import { apiClient, ApiError } from '../../../services/apiClient';
import { useAuth } from '../../../context/AuthContext';

const ROLES = ['ADMIN', 'SUPER_ADMIN'];

function InviteModal({ onCancel, onCreated }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await apiClient.post('/admin-users', { email, name, role });
      onCreated(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not invite admin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800">Invite Admin</h3>
          <button type="button" onClick={onCancel}><X size={20} /></button>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 mb-3">{error}</p>}

        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full p-2 border border-gray-300 rounded-lg mb-3" />

        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-2 border border-gray-300 rounded-lg mb-3" />

        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg mb-4">
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-lg">Cancel</button>
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">
            {submitting ? 'Inviting...' : 'Invite'}
          </button>
        </div>
      </form>
    </div>
  );
}

function TempPasswordModal({ invited, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(invited.tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Invited {invited.name}</h3>
        <p className="text-sm text-red-600 font-semibold mb-3">
          There's no invite email yet — relay this temporary password to them yourself (Slack/WhatsApp). It won't be shown again.
        </p>
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-3 mb-4">
          <code className="text-sm font-mono break-all flex-1">{invited.tempPassword}</code>
          <button onClick={handleCopy} className="p-2 bg-indigo-600 text-white rounded-lg flex-shrink-0">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
        <button onClick={onClose} className="w-full py-2 bg-gray-800 text-white rounded-lg">
          I've relayed it — Close
        </button>
      </div>
    </div>
  );
}

const AdminUsers = () => {
  const { admin: currentAdmin } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [invited, setInvited] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/admin-users');
      setAdmins(res.data || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load admin users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleInvited = (newAdmin) => {
    setShowInvite(false);
    setInvited(newAdmin);
    setAdmins((prev) => [newAdmin, ...prev]);
  };

  const handleRoleChange = async (adminUser, role) => {
    setBusyId(adminUser.id);
    setError('');
    try {
      const res = await apiClient.patch(`/admin-users/${adminUser.id}`, { role });
      setAdmins((prev) => prev.map((a) => (a.id === adminUser.id ? { ...a, ...res.data } : a)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not change role.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSuspend = async (adminUser) => {
    setBusyId(adminUser.id);
    setError('');
    try {
      await apiClient.delete(`/admin-users/${adminUser.id}`);
      setAdmins((prev) => prev.map((a) => (a.id === adminUser.id ? { ...a, status: 'SUSPENDED' } : a)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not suspend admin.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReactivate = async (adminUser) => {
    setBusyId(adminUser.id);
    setError('');
    try {
      const res = await apiClient.patch(`/admin-users/${adminUser.id}`, { status: 'ACTIVE' });
      setAdmins((prev) => prev.map((a) => (a.id === adminUser.id ? { ...a, ...res.data } : a)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reactivate admin.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-2 mb-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Users size={24} className="text-blue-600" /> Admin Users
        </h1>
        <button onClick={() => setShowInvite(true)} className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm">
          <Plus size={16} /> Invite Admin
        </button>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center py-16"><RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" /></div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Name</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Email</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Role</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Status</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Last Login</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {admins.map((a) => {
                const isSelf = a.id === currentAdmin?.id;
                return (
                  <tr key={a.id}>
                    <td className="px-4 py-3 font-medium text-gray-800">{a.name}{isSelf && <span className="ml-1 text-xs text-gray-400">(you)</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{a.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={a.role}
                        disabled={isSelf || busyId === a.id}
                        onChange={(e) => handleRoleChange(a, e.target.value)}
                        className="p-1 border border-gray-300 rounded text-xs disabled:bg-gray-100"
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${a.status === 'SUSPENDED' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{a.last_login_at ? new Date(a.last_login_at).toLocaleDateString() : 'Never'}</td>
                    <td className="px-4 py-3">
                      {!isSelf && (
                        a.status === 'SUSPENDED' ? (
                          <button onClick={() => handleReactivate(a)} disabled={busyId === a.id} className="text-green-600 hover:text-green-800 flex items-center gap-1 text-xs font-semibold">
                            <CheckCircle size={14} /> Reactivate
                          </button>
                        ) : (
                          <button onClick={() => handleSuspend(a)} disabled={busyId === a.id} className="text-red-600 hover:text-red-800 flex items-center gap-1 text-xs font-semibold">
                            <Ban size={14} /> Suspend
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
              {admins.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No admin accounts found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showInvite && <InviteModal onCancel={() => setShowInvite(false)} onCreated={handleInvited} />}
      {invited && <TempPasswordModal invited={invited} onClose={() => setInvited(null)} />}
    </div>
  );
};

export default AdminUsers;
