// src/components/Announcements/AnnouncementForm.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactQuill from 'react-quill'; // Rich Text Editor
import 'react-quill/dist/quill.snow.css'; // Quill editor styles (ensure this is imported globally too)
import { Save, X, Calendar, Users, Megaphone } from 'lucide-react';

const TARGET_OPTIONS = ['All Users', 'Riders Only', 'Vendors Only'];
const DEFAULT_FORM_DATA = {
    title: '',
    content: '',
    target: 'All Users',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'Scheduled', // Handled by parent, but useful for edit mode
    // Note: status, author, and dates are generally managed by the server/parent state
};

const AnnouncementForm = ({ initialData, onSave, onCancel, mode }) => {
    const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
    const [isSaving, setIsSaving] = useState(false);
    
    const isEditMode = mode === 'edit' && initialData;

    // Load initial data for editing
    useEffect(() => {
        if (isEditMode) {
            setFormData({
                ...DEFAULT_FORM_DATA,
                ...initialData,
                // Ensure dates are in yyyy-mm-dd format for input type="date"
                startDate: initialData.startDate || new Date().toISOString().split('T')[0],
                endDate: initialData.endDate || '',
            });
        } else {
            setFormData(DEFAULT_FORM_DATA);
        }
    }, [initialData, isEditMode]);

    // Update state for simple text/select inputs
    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    // Update state for ReactQuill content
    const handleContentChange = useCallback((value) => {
        setFormData(prev => ({ ...prev, content: value }));
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        
        // Basic validation
        if (!formData.title || !formData.content || !formData.target) {
            alert("Please fill in the Title, Content, and Target Audience.");
            return;
        }

        setIsSaving(true);
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500)); 

        onSave(formData);
        setIsSaving(false);
    }, [formData, onSave]);

    // Configuration for React Quill toolbar (basic options)
    const quillModules = useMemo(() => ({
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'color': [] }, { 'background': [] }],
            ['link'],
            ['clean']
        ],
    }), []);
    
    const titleText = isEditMode ? `Edit Announcement: ${initialData.title}` : 'Create New Announcement';

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
            <div className="flex justify-between items-center mb-6 pb-4 border-b dark:border-gray-700">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-gray-100">{titleText}</h2>
                <div className="space-x-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-semibold"
                    >
                        <X size={18} className="mr-2" />
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition font-semibold disabled:opacity-50"
                    >
                        {isSaving ? (
                            'Saving...'
                        ) : (
                            <>
                                <Save size={18} className="mr-2" />
                                {isEditMode ? 'Update Announcement' : 'Schedule Announcement'}
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                
                {/* 1. Title */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Megaphone size={16} className="inline mr-1" /> Announcement Title
                    </label>
                    <input
                        type="text"
                        name="title"
                        id="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                {/* 2. Target Audience */}
                <div>
                    <label htmlFor="target" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Users size={16} className="inline mr-1" /> Target Audience
                    </label>
                    <select
                        name="target"
                        id="target"
                        value={formData.target}
                        onChange={handleInputChange}
                        required
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                    >
                        {TARGET_OPTIONS.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </div>

                {/* 3. Start Date */}
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Calendar size={16} className="inline mr-1" /> Start Date
                    </label>
                    <input
                        type="date"
                        name="startDate"
                        id="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        required
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                
                {/* 4. End Date (Optional) */}
                <div className="lg:col-span-1">
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Calendar size={16} className="inline mr-1" /> End Date (Optional)
                    </label>
                    <input
                        type="date"
                        name="endDate"
                        id="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                
                {/* 5. Status (Only editable on Edit Mode, for demonstration) */}
                {isEditMode && (
                    <div className="lg:col-span-1">
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Current Status
                        </label>
                        <select
                            name="status"
                            id="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                        >
                            <option value="Active">Active</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="Ended">Ended</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Rich Text Editor for Content */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Announcement Content
                </label>
                <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                    <ReactQuill
                        theme="snow"
                        value={formData.content}
                        onChange={handleContentChange}
                        modules={quillModules}
                        placeholder="Write your announcement details here..."
                        className="min-h-[250px] dark:text-gray-200"
                    />
                </div>
            </div>

            {/* Submit Button Row (Duplicate for easy access) */}
            <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-semibold"
                >
                    <X size={18} className="mr-2" />
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition font-semibold disabled:opacity-50"
                >
                    <Save size={18} className="mr-2" />
                    {isEditMode ? 'Update Announcement' : 'Schedule Announcement'}
                </button>
            </div>
        </form>
    );
};

export default AnnouncementForm;

