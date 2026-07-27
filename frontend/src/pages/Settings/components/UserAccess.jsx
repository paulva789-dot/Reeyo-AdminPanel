// src/pages/Settings/components/UserAccess.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Key, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const UserAccess = () => {
  const navigate = useNavigate();
  const { admin } = useAuth();

  return (
    <div className="space-y-8">

      <h1 className="text-2xl font-bold text-gray-800 border-b pb-2 mb-6">User & Access Management</h1>

      <section>
        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2"><Users size={20} className="text-blue-500"/> Your Account</h2>

        <div className="p-4 border rounded-lg bg-gray-50 shadow-inner space-y-1 text-sm text-gray-700">
          <p><span className="font-medium">Email:</span> {admin?.email}</p>
          <p><span className="font-medium">Role:</span> {admin?.role}</p>
          <p><span className="font-medium">Last login:</span> {admin?.last_login_at ? new Date(admin.last_login_at).toLocaleString() : '—'}</p>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2 text-yellow-800 text-sm">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <span>
            Listing and managing other admin accounts (roles, 2FA policy, password rules) isn't exposed by the current admin-api —
            only <code>/auth/me</code> and <code>/auth/change-password</code> for your own account. That management screen needs a
            backend endpoint before it can be built here.
          </span>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2"><Key size={20} className="text-green-500"/> API Key Management</h2>
        <div className="p-4 border border-green-300 rounded-lg bg-green-50 shadow-inner flex justify-between items-center">
          <p className="text-sm text-gray-700">Generate, revoke, and track usage for bots and automations.</p>
          <button
            onClick={() => navigate('/settings/api-keys')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium flex-shrink-0"
          >
            View & Generate Keys
          </button>
        </div>
      </section>
    </div>
  );
};

export default UserAccess;
