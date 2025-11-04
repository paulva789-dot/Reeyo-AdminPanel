// src/pages/Users/vendors/menuApprove/MenuApprovals.jsx (CLEANED UP)

import React, { useState } from 'react';
import ApprovalRequestCard from './components/ApprovalRequestCard';
import { menuApprovalRequests } from '../../../../data/menuApprovalMocks';

// --- Placeholder Components (You can create dedicated components later) ---
const MenuStatsCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Pending</p>
            <p className="text-2xl font-bold text-yellow-500">3</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Price Updates</p>
            <p className="text-2xl font-bold text-orange-500">1</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">New Items</p>
            <p className="text-2xl font-bold text-indigo-500">1</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Rejected Last 7 Days</p>
            <p className="text-2xl font-bold text-red-500">1</p>
        </div>
    </div>
);

const MenuFilterBar = ({ currentFilter, setFilter, searchQuery, setSearchQuery }) => {
    const filters = ['All', 'Pending', 'Approved', 'Rejected', 'Price Update', 'New Item'];
    return (
        <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0 shrink-0">
                {filters.map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-150 shrink-0 ${
                            currentFilter === f 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>
            <input
                type="text"
                placeholder="Search vendor or item name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-auto md:ml-auto p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
        </div>
    );
};
// ---------------------------------------------------------------------

const MenuApprovals = () => {
    const [filter, setFilter] = useState('Pending');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredRequests = menuApprovalRequests.filter(request => {
        // Status and Type filtering
        const matchesFilter = filter === 'All' 
            || request.status === filter 
            || request.type === filter;
        
        // Search by Vendor or Item Name
        const matchesSearch = request.vendorName.toLowerCase().includes(searchQuery.toLowerCase())
            || request.itemName.toLowerCase().includes(searchQuery.toLowerCase());
            
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="p-4 sm:p-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-gray-100 mb-6">
                Menu Approvals Queue
            </h1>

            <MenuStatsCards />

            <MenuFilterBar 
                currentFilter={filter} 
                setFilter={setFilter} 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
            />

            {/* Request Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                {filteredRequests.length > 0 ? (
                    filteredRequests.map(request => (
                        <ApprovalRequestCard key={request.id} request={request} />
                    ))
                ) : (
                    <p className="col-span-full text-center text-gray-500 dark:text-gray-400 py-12">
                        No menu approval requests match your current criteria.
                    </p>
                )}
            </div>
        </div>
    );
};

export default MenuApprovals;
