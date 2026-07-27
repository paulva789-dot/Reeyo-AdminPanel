// src/pages/Announcements/components/AnnouncementList.jsx
import React, { useState, useMemo } from 'react';
import { Search, RefreshCw } from 'lucide-react';

const AUDIENCE_BADGE = {
    USER: 'text-indigo-700 bg-indigo-100 dark:bg-indigo-700 dark:text-indigo-100',
    VENDOR: 'text-orange-700 bg-orange-100 dark:bg-orange-700 dark:text-orange-100',
    RIDER: 'text-blue-700 bg-blue-100 dark:bg-blue-700 dark:text-blue-100',
};

const AnnouncementList = ({ history, loading }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filtered = useMemo(() => {
        if (!searchTerm) return history;
        const term = searchTerm.toLowerCase();
        return history.filter((item) => item.title.toLowerCase().includes(term));
    }, [history, searchTerm]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex justify-end items-center mb-6">
                <div className="relative w-full max-w-sm">
                    <input
                        type="text"
                        placeholder="Search title..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                    <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            {['Title', 'Audience', 'Country', 'Recipients', 'Sent Via', 'Sent At'].map((header) => (
                                <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center">
                                    <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin mx-auto" />
                                </td>
                            </tr>
                        ) : filtered.length > 0 ? (
                            filtered.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                                    <td className="px-6 py-4 max-w-xs truncate text-sm font-medium text-slate-800 dark:text-gray-100">{item.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${AUDIENCE_BADGE[item.audience_type] || 'bg-gray-100 text-gray-700'}`}>
                                            {item.audience_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.country_code || 'All'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-100">{item.recipient_count?.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{(item.sent_via || []).join(', ')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(item.created_at).toLocaleString()}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                    No broadcasts sent yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AnnouncementList;
