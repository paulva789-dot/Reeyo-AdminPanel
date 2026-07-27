// src/pages/Announcements/AnnouncementsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import AnnouncementList from './components/AnnouncementList';
import AnnouncementForm from './components/AnnouncementForm';
import AppVersionControl from './components/AppVersionControl';
import { Megaphone, ListOrdered, Smartphone } from 'lucide-react';
import { apiClient, ApiError } from '../../services/apiClient';

const TABS = {
    ANNOUNCEMENTS: 'Announcements',
    VERSION_CONTROL: 'App Versions',
};

const AnnouncementsPage = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(TABS.ANNOUNCEMENTS);
    const [lastSent, setLastSent] = useState(null);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await apiClient.get('/broadcast/history', { limit: 50 });
            setHistory(res.data || []);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Could not load broadcast history.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const handleSent = (result) => {
        setLastSent(result);
        setIsFormOpen(false);
        fetchHistory();
    };

    if (isFormOpen) {
        return (
            <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
                <AnnouncementForm onSent={handleSent} onCancel={() => setIsFormOpen(false)} />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex justify-between items-center mb-4 pb-4">
                <h1 className="text-3xl font-extrabold text-slate-800 dark:text-gray-100 flex items-center">
                    <Megaphone size={28} className="mr-3 text-indigo-600" />
                    System Management
                </h1>

                {activeTab === TABS.ANNOUNCEMENTS && (
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition font-semibold"
                    >
                        <ListOrdered size={18} className="mr-2" />
                        Send Broadcast
                    </button>
                )}
            </div>

            {lastSent && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg text-sm">
                    Sent to {lastSent.recipients?.toLocaleString()} recipients via {(lastSent.delivered_via || []).join(', ')}.
                </div>
            )}
            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div className="flex space-x-4 mb-6">
                <button
                    onClick={() => setActiveTab(TABS.ANNOUNCEMENTS)}
                    className={`pb-2 border-b-2 text-lg font-medium transition ${
                        activeTab === TABS.ANNOUNCEMENTS
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    <Megaphone size={18} className="inline mr-2" /> Broadcast History
                </button>
                <button
                    onClick={() => setActiveTab(TABS.VERSION_CONTROL)}
                    className={`pb-2 border-b-2 text-lg font-medium transition ${
                        activeTab === TABS.VERSION_CONTROL
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    <Smartphone size={18} className="inline mr-2" /> App Version Control
                </button>
            </div>

            {activeTab === TABS.ANNOUNCEMENTS && <AnnouncementList history={history} loading={loading} />}
            {activeTab === TABS.VERSION_CONTROL && <AppVersionControl />}
        </div>
    );
};

export default AnnouncementsPage;
