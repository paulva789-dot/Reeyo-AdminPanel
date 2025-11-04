// src/components/Announcements/AnnouncementList.jsx

import React, { useState, useMemo } from 'react';
import { Edit, Trash2, ToggleLeft, ToggleRight, Search, Eye } from 'lucide-react';

// Helper function to render a colored badge for the announcement status
const getStatusBadge = (status) => {
    const commonClasses = "px-3 py-1 text-xs font-semibold rounded-full";
    switch (status) {
        case 'Active':
            return <span className={`${commonClasses} text-green-700 bg-green-100 dark:bg-green-700 dark:text-green-100`}>Active</span>;
        case 'Scheduled':
            return <span className={`${commonClasses} text-indigo-700 bg-indigo-100 dark:bg-indigo-700 dark:text-indigo-100`}>Scheduled</span>;
        case 'Draft':
            return <span className={`${commonClasses} text-yellow-700 bg-yellow-100 dark:bg-yellow-700 dark:text-yellow-100`}>Draft</span>;
        case 'Ended':
            return <span className={`${commonClasses} text-red-700 bg-red-100 dark:bg-red-700 dark:text-red-100`}>Ended</span>;
        default:
            return <span className={`${commonClasses} text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-100`}>{status}</span>;
    }
};

const AnnouncementList = ({ announcements, onEdit, onDelete, onToggleStatus }) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Filter announcements based on search term (title or target)
    const filteredAnnouncements = useMemo(() => {
        if (!searchTerm) return announcements;
        
        const term = searchTerm.toLowerCase();
        return announcements.filter(ann => 
            ann.title.toLowerCase().includes(term) ||
            ann.target.toLowerCase().includes(term)
        );
    }, [announcements, searchTerm]);

    const handlePreview = (announcement) => {
        // Simple preview logic: you'd use a modal in a real app
        alert(`Preview: ${announcement.title}\n\nContent:\n${announcement.content.replace(/<[^>]*>?/gm, '')}\n\nTarget: ${announcement.target}`);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            
            <div className="flex justify-end items-center mb-6">
                <div className="relative w-full max-w-sm">
                    <input
                        type="text"
                        placeholder="Search title or target..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                    <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            {['Title', 'Target', 'Status', 'Schedule', 'Author', 'Actions'].map(header => (
                                <th
                                    key={header}
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredAnnouncements.length > 0 ? (
                            filteredAnnouncements.map(ann => {
                                const isActionable = ann.status === 'Active' || ann.status === 'Scheduled';
                                const ToggleIcon = ann.status === 'Active' ? ToggleRight : ToggleLeft;
                                
                                return (
                                    <tr key={ann.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                                        
                                        <td className="px-6 py-4 max-w-xs truncate text-sm font-medium text-slate-800 dark:text-gray-100">{ann.title}</td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 dark:text-indigo-400">{ann.target}</td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(ann.status)}
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {ann.startDate} {ann.endDate && `to ${ann.endDate}`}
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{ann.author}</td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-3">
                                                
                                                {/* Preview */}
                                                <button 
                                                    onClick={() => handlePreview(ann)}
                                                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition"
                                                    title="Preview Content"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                
                                                {/* Edit */}
                                                <button 
                                                    onClick={() => onEdit(ann)}
                                                    className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 transition"
                                                    title="Edit Announcement"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                
                                                {/* Toggle Status (Active/End) */}
                                                {isActionable && (
                                                    <button 
                                                        onClick={() => onToggleStatus(ann.id, ann.status)}
                                                        className={`transition ${ann.status === 'Active' ? 'text-green-600' : 'text-gray-500'}`}
                                                        title={ann.status === 'Active' ? 'End Announcement' : 'Activate Announcement'}
                                                    >
                                                        <ToggleIcon size={22} />
                                                    </button>
                                                )}
                                                
                                                {/* Delete */}
                                                <button 
                                                    onClick={() => onDelete(ann.id)}
                                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition"
                                                    title="Delete Announcement"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                    No announcements found matching your criteria.
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

