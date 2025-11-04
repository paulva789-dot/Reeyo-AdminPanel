// src/pages/Settings/components/UserAccess.jsx
import React from 'react';
import { Lock, Key, Users, AlertTriangle } from 'lucide-react';

const UserAccess = () => {
  return (
    <div className="space-y-8">
      
      <h1 className="text-2xl font-bold text-gray-800 border-b pb-2 mb-6">User & Access Management</h1>

      {/* Admin User Management */}
      <section>
        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2"><Users size={20} className="text-blue-500"/> Admin User Roles & Permissions</h2>
        
        <div className="p-4 border rounded-lg bg-gray-50 shadow-inner">
          <p className="text-sm text-gray-600 mb-4">
            Manage who has access to the Reeyo Admin Panel and what they can view or modify. Roles include **Super Admin**, **Finance Manager**, **Support Agent**, and **Content Editor**.
          </p>
          <div className="flex justify-between items-center">
             <span className="text-sm font-medium text-gray-700">Total Admin Accounts: 12</span>
             <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">
                Manage User Access
             </button>
          </div>
        </div>
      </section>

      {/* API Key Management */}
      <section>
        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2"><Key size={20} className="text-green-500"/> API Key Management</h2>
        
        <div className="p-4 border border-green-300 rounded-lg bg-green-50 shadow-inner">
          <p className="text-sm text-gray-700 mb-3">
            Generate, revoke, and track usage for third-party integrations. Treat these keys like passwords!
          </p>
          <div className="flex justify-between items-center">
             <span className="text-sm font-medium text-gray-700">Active API Keys: 4</span>
             <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium">
                View & Generate Keys
             </button>
          </div>
        </div>
      </section>

      {/* Security Policy */}
      <section>
        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2"><Lock size={20} className="text-red-500"/> Security Policy</h2>
        
        <div className="p-4 border rounded-lg bg-gray-50 shadow-inner space-y-4">
          <div className="flex items-center space-x-4">
            <label className="block text-sm font-medium text-gray-700 w-64">
              Minimum Password Length
            </label>
            <input 
              type="number" 
              defaultValue={10}
              min={6}
              className="mt-1 block w-20 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="block text-sm font-medium text-gray-700 w-64">
              Require 2-Factor Authentication (2FA)
            </label>
            <input 
              type="checkbox" 
              defaultChecked={true}
              className="h-5 w-5 text-red-600 border-gray-300 rounded"
            />
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded-lg flex items-center gap-2 text-yellow-800 text-sm">
            <AlertTriangle size={18} />
            Changes to the Security Policy require a mandatory admin re-login.
        </div>
      </section>
    </div>
  );
};

export default UserAccess;
