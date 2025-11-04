// src/components/Announcements/AppVersionControl.jsx

import React, { useState, useCallback } from 'react';
import { appVersions as initialAppVersions } from '../../../data/announcementMocks';
import { Save, AlertTriangle, RefreshCw } from 'lucide-react';

const AppVersionControl = () => {
    // State to hold the current versions (simulating fetching from backend)
    const [versions, setVersions] = useState(initialAppVersions);
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    // --- Handlers ---
    
    // Generic handler to update a specific version field
    const handleChange = useCallback((key, field, value) => {
        setVersions(prev => prev.map(app => 
            app.key === key ? { ...app, [field]: value } : app
        ));
        setIsDirty(true);
    }, []);

    // Simulates sending updated versions to the API
    const handleSave = useCallback(async () => {
        setIsSaving(true);
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500)); 

        // In a real app, you would send the 'versions' state to the backend here.
        console.log("💾 Updated app versions saved:", versions);

        setIsSaving(false);
        setIsDirty(false);
        // Success notification would go here
    }, [versions]);

    // --- UI Structure ---
    
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-gray-100 flex items-center">
                    <AlertTriangle size={24} className="mr-2 text-red-500" />
                    Client App Version Control
                </h2>
                <button
                    onClick={handleSave}
                    disabled={isSaving || !isDirty}
                    className={`flex items-center px-4 py-2 rounded-lg shadow-md transition font-semibold text-sm ${
                        isDirty
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
                    }`}
                >
                    {isSaving ? (
                        <>
                            <RefreshCw size={16} className="mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save size={16} className="mr-2" />
                            Save Changes
                        </>
                    )}
                </button>
            </div>

            <p className="text-gray-500 dark:text-gray-400 mb-6">
                Manage the minimum required and latest available versions for all client applications. Changing the minimum version will force older apps to update upon launch.
            </p>

            <div className="space-y-6">
                {versions.map(app => (
                    <div key={app.key} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div className="font-semibold text-lg text-slate-800 dark:text-gray-100">
                            {app.name}
                        </div>
                        
                        {/* Latest Version Input */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Latest Version</label>
                            <input
                                type="text"
                                value={app.latest}
                                onChange={(e) => handleChange(app.key, 'latest', e.target.value)}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            />
                        </div>
                        
                        {/* Minimum Required Version Input */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center">
                                Minimum Required
                                <AlertTriangle size={14} className="ml-1 text-red-500" title="Forces update on older versions" />
                            </label>
                            <input
                                type="text"
                                value={app.minimum}
                                onChange={(e) => handleChange(app.key, 'minimum', e.target.value)}
                                className="w-full p-2 border border-red-400 dark:border-red-600 rounded-lg bg-red-50 dark:bg-red-900 bg-opacity-10 text-red-600 dark:text-red-400 focus:ring-red-500 focus:border-red-500 text-sm"
                            />
                        </div>

                        {/* Status/Check (Placeholder for actual API check) */}
                        <div className="text-sm text-gray-500 dark:text-gray-400 pt-5 md:pt-0">
                            Current live status: <span className="text-green-500">OK</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AppVersionControl;

