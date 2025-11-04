// src/pages/Settings/components/DataBackup.jsx
import React from 'react';
import { DownloadCloud, UploadCloud, RefreshCw, Server } from 'lucide-react';

const DataBackup = () => {
  const lastBackup = "2025-10-30 @ 03:00 AM";

  return (
    <div className="space-y-8">
      
      <h1 className="text-2xl font-bold text-gray-800 border-b pb-2 mb-6">Data & Backup Management</h1>

      {/* Database Backup */}
      <section className="p-4 border rounded-lg shadow-sm bg-gray-50">
        <h3 className="font-semibold text-xl flex items-center gap-2 mb-3"><RefreshCw size={22} className="text-blue-500"/> Automated Backup Status</h3>
        
        <div className="flex items-center justify-between p-3 bg-white rounded-md border mb-4">
            <p className="text-sm text-gray-600">
              Last successful automated backup: <span className="font-mono text-sm font-medium text-blue-800">{lastBackup}</span>
            </p>
            <span className="text-xs bg-green-100 text-green-800 p-1 rounded font-semibold">Scheduled Daily</span>
        </div>

        <div className="flex gap-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2">
                <DownloadCloud size={18} /> Trigger Immediate Backup
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors text-sm font-medium">
                View Backup History & Logs
            </button>
        </div>
      </section>

      {/* Data Export/Import */}
      <section className="p-4 border rounded-lg shadow-sm">
        <h3 className="font-semibold text-xl flex items-center gap-2 mb-3"><UploadCloud size={22} className="text-purple-500"/> Data Export & Import Tools</h3>
        <p className="text-sm text-gray-600 mb-4">
          Export full datasets for regulatory compliance, audit, or migration purposes.
        </p>
        <div className="flex flex-wrap gap-4">
            <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2">
                <DownloadCloud size={18} /> Export All User Data (CSV)
            </button>
            <button className="px-4 py-2 border border-purple-300 text-purple-700 rounded-md hover:bg-purple-50 transition-colors text-sm font-medium">
                Export Orders Data (JSON)
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors text-sm font-medium flex items-center gap-2">
                <UploadCloud size={18} /> Import Bulk Data
            </button>
        </div>
      </section>

      {/* System Health */}
      <section className="p-4 border rounded-lg shadow-sm bg-gray-50">
        <h3 className="font-semibold text-xl flex items-center gap-2 mb-3"><Server size={22} className="text-teal-500"/> System Health & Diagnostics</h3>
        <div className="text-sm space-y-1">
            <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-600">DB Connection Status:</span>
                <span className="text-green-600 font-medium">✅ OK (Latency: 2ms)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-600">Storage Usage:</span>
                <span className="text-yellow-600 font-medium">⚠️ Warning (78% Full)</span>
            </div>
            <div className="flex justify-between py-1">
                <span className="text-gray-600">CDN/Static Files Status:</span>
                <span className="text-green-600 font-medium">✅ OK</span>
            </div>
        </div>
      </section>
    </div>
  );
};

export default DataBackup;