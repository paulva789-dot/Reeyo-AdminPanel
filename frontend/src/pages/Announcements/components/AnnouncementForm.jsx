// src/pages/Announcements/components/AnnouncementForm.jsx
import React, { useState } from 'react';
import { Save, X, Megaphone, Users } from 'lucide-react';
import { apiClient, ApiError } from '../../../services/apiClient';

const RECIPIENT_ENDPOINTS = {
    'All Users': '/broadcast/users',
    'Vendors Only': '/broadcast/vendors',
    'Riders Only': '/broadcast/riders',
};

const DEFAULT_FORM_DATA = {
    title: '',
    body: '',
    country: '',
    recipient: 'All Users',
};

const AnnouncementForm = ({ onSent, onCancel }) => {
    const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.title.trim() || !formData.body.trim()) {
            setError('Title and message body are required.');
            return;
        }

        setIsSaving(true);
        try {
            const endpoint = RECIPIENT_ENDPOINTS[formData.recipient];
            const res = await apiClient.post(endpoint, {
                title: formData.title,
                body: formData.body,
                country: formData.country || undefined,
                audience: 'ALL',
            });
            onSent(res.data);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Could not send broadcast.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
            <div className="flex justify-between items-center mb-6 pb-4 border-b dark:border-gray-700">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-gray-100">Send Broadcast Notification</h2>
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
                        {isSaving ? 'Sending...' : (<><Save size={18} className="mr-2" />Send Now</>)}
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
                Broadcasts send immediately as push + in-app notifications — there is no draft, schedule, or edit step on the backend.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Megaphone size={16} className="inline mr-1" /> Title
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

                <div>
                    <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Users size={16} className="inline mr-1" /> Recipients
                    </label>
                    <select
                        name="recipient"
                        id="recipient"
                        value={formData.recipient}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                    >
                        {Object.keys(RECIPIENT_ENDPOINTS).map((option) => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Country (optional, ISO-2)
                    </label>
                    <input
                        type="text"
                        name="country"
                        id="country"
                        maxLength={2}
                        placeholder="e.g. CM"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-indigo-500 focus:border-indigo-500 uppercase"
                    />
                </div>
            </div>

            <div className="mb-6">
                <label htmlFor="body" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message Body
                </label>
                <textarea
                    name="body"
                    id="body"
                    rows={4}
                    value={formData.body}
                    onChange={handleInputChange}
                    required
                    placeholder="Order from 30+ new restaurants this weekend."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
        </form>
    );
};

export default AnnouncementForm;
