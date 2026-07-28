// src/pages/Settings/components/UserAccess.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Key } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const UserAccess = () => {
  const navigate = useNavigate();
  const { admin, isSuperAdmin } = useAuth();

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
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2"><Users size={20} className="text-indigo-500"/> Admin User Roles &amp; Permissions</h2>
        <div className="p-4 border border-indigo-200 rounded-lg bg-indigo-50 shadow-inner flex justify-between items-center">
          <p className="text-sm text-gray-700">
            {isSuperAdmin ? 'Invite admins, change roles, and suspend accounts.' : 'View other admin accounts on the platform.'}
          </p>
          <button
            onClick={() => navigate('/settings/admin-users')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium flex-shrink-0"
          >
            Manage Admin Users
          </button>
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
