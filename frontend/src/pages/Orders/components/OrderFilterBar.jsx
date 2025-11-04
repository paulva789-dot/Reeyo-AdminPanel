// pages/Orders/components/OrderCard.jsx
import React from 'react';
import { Search, ListFilter } from 'lucide-react';

const statuses = ['All', 'Pending', 'Processing', 'In Transit', 'Delivered', 'Cancelled'];

const OrderFilterBar = ({ currentFilter, setFilter, searchQuery, setSearchQuery }) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md space-y-4 md:space-y-0">
            
            {/* Search Input (Takes full width on mobile) */}
            <div className="relative flex-grow md:w-1/3">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by ID or Customer Name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full py-2 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100 placeholder-gray-400"
                />
            </div>

            {/* Filter Buttons (Scrollable on mobile) */}
            <div className="flex items-center space-x-3 overflow-x-auto pb-1 md:w-auto">
                <ListFilter size={20} className="text-gray-500 dark:text-gray-400 hidden sm:block shrink-0" />
                {statuses.map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap transition-colors duration-200 shrink-0 ${
                            currentFilter === status
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        {status}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default OrderFilterBar;