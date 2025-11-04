// src/pages/Announcements/AnnouncementsPage.jsx (Complete and Fixed)

import React, { useState, useCallback } from 'react';
import { initialAnnouncements, generateAnnouncementId } from '../../data/announcementMocks';
import AnnouncementList from './components/AnnouncementList';
import AnnouncementForm from './components/AnnouncementForm';
import AppVersionControl from './components/AppVersionControl'; 
import { Megaphone, ListOrdered, Smartphone } from 'lucide-react'; 

const TABS = {
    ANNOUNCEMENTS: 'Announcements',
    VERSION_CONTROL: 'App Versions',
};

const AnnouncementsPage = () => {
    const [announcements, setAnnouncements] = useState(initialAnnouncements);
    const [isFormOpen, setIsFormOpen] = useState(false); // 👈 FIX: Declared missing state
    const [editingAnnouncement, setEditingAnnouncement] = useState(null); 
    const [activeTab, setActiveTab] = useState(TABS.ANNOUNCEMENTS);

    const handleCreateNew = () => {
        setEditingAnnouncement(null); 
        setIsFormOpen(true);
    };

    const handleEdit = useCallback((announcement) => {
        setEditingAnnouncement(announcement);
        setIsFormOpen(true);
    }, []);

    const handleSave = useCallback((formData) => {
        if (editingAnnouncement) {
            // EDIT MODE
            setAnnouncements(prev => prev.map(ann => 
                ann.id === editingAnnouncement.id 
                    ? { ...ann, ...formData, status: formData.status || ann.status } 
                    : ann
            ));
            console.log('✅ Announcement updated:', formData.title);
        } else {
            // CREATE MODE
            const newAnnouncement = {
                id: generateAnnouncementId(),
                ...formData,
                status: 'Scheduled',
                author: 'Admin',
            };
            setAnnouncements(prev => [newAnnouncement, ...prev]);
            console.log('➕ New Announcement created:', newAnnouncement.title);
        }
        setIsFormOpen(false);
        setEditingAnnouncement(null);
    }, [editingAnnouncement]);

    const handleDelete = useCallback((id) => {
        setAnnouncements(prev => prev.filter(ann => ann.id !== id));
        console.log(`🗑️ Announcement ${id} deleted.`);
    }, []);

    const handleToggleStatus = useCallback((id, currentStatus) => {
        const newStatus = currentStatus === 'Active' ? 'Ended' : 'Active';
        setAnnouncements(prev => prev.map(ann => 
            ann.id === id ? { ...ann, status: newStatus } : ann
        ));
        console.log(`🔄 Announcement ${id} set to ${newStatus}.`);
    }, []);


    // Conditional rendering for the form
    if (isFormOpen) {
        return (
            <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
                <AnnouncementForm 
                    initialData={editingAnnouncement}
                    onSave={handleSave}
                    onCancel={() => setIsFormOpen(false)}
                    mode={editingAnnouncement ? 'edit' : 'create'}
                />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex justify-between items-center mb-4 border-b pb-4 dark:border-gray-700">
                <h1 className="text-3xl font-extrabold text-slate-800 dark:text-gray-100 flex items-center">
                    <Megaphone size={28} className="mr-3 text-indigo-600" />
                    System Management
                </h1>
                
                {/* Create Button only visible on the Announcements Tab */}
                {activeTab === TABS.ANNOUNCEMENTS && (
                    <button
                        onClick={handleCreateNew}
                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition font-semibold"
                    >
                        <ListOrdered size={18} className="mr-2" />
                        Create New Announcement
                    </button>
                )}
            </div>
            
            {/* Tab Navigation */}
            <div className="flex space-x-4 mb-6">
                <button
                    onClick={() => setActiveTab(TABS.ANNOUNCEMENTS)}
                    className={`pb-2 border-b-2 text-lg font-medium transition ${
                        activeTab === TABS.ANNOUNCEMENTS 
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    <Megaphone size={18} className="inline mr-2" /> Announcements
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

            {/* Main Content Area based on Tab */}
            {activeTab === TABS.ANNOUNCEMENTS && (
                <AnnouncementList 
                    announcements={announcements} 
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                />
            )}
            
            {activeTab === TABS.VERSION_CONTROL && (
                <AppVersionControl /> 
            )}
            
        </div>
    );
};

export default AnnouncementsPage;

