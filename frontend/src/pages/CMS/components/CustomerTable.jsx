// src/components/Customers/CustomerTable.jsx

import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, User, Heart, AlertTriangle } from 'lucide-react';

// Helper function to format currency
const formatCurrency = (value) => `${value.toLocaleString('en-US')} FCFA`;

// Helper function to get Status Badge style
const getStatusBadge = (status) => {
    const commonClasses = "px-3 py-1 text-xs font-semibold rounded-full";
    switch (status) {
        case 'Active':
            return <span className={`${commonClasses} text-green-700 bg-green-100 dark:bg-green-700 dark:text-green-100`}>{status}</span>;
        case 'Suspended':
            return <span className={`${commonClasses} text-red-700 bg-red-100 dark:bg-red-700 dark:text-red-100`}>{status}</span>;
        case 'Inactive':
            return <span className={`${commonClasses} text-yellow-700 bg-yellow-100 dark:bg-yellow-700 dark:text-yellow-100`}>{status}</span>;
        default:
            return <span className={`${commonClasses} text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-100`}>{status}</span>;
    }
};

// Helper function to get Churn Risk style
const getRiskTag = (risk) => {
    const commonClasses = "px-2 py-0.5 text-xs font-medium rounded-md flex items-center w-max";
    switch (risk) {
        case 'High':
            return <span className={`${commonClasses} bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300`}><AlertTriangle size={12} className="mr-1" />{risk}</span>;
        case 'Medium':
            return <span className={`${commonClasses} bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300`}>Medium</span>;
        case 'Low':
            return <span className={`${commonClasses} bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300`}>Low</span>;
        case 'Very Low':
            return <span className={`${commonClasses} bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300`}><Heart size={12} className="mr-1" />{risk}</span>;
        default:
            return <span className={`${commonClasses} bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300`}>{risk}</span>;
    }
};


const CustomerTable = ({ customers, onViewDetails }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [sortBy, setSortBy] = useState({ key: 'signupDate', direction: 'desc' });

    // Filter and Sort Logic
    const filteredAndSortedCustomers = useMemo(() => {
        let filtered = customers.filter(customer => {
            const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  customer.phone.includes(searchTerm);
            
            const matchesStatus = filterStatus === 'All' || customer.status === filterStatus;

            return matchesSearch && matchesStatus;
        });

        // Sorting
        filtered.sort((a, b) => {
            const aValue = a[sortBy.key];
            const bValue = b[sortBy.key];

            let comparison = 0;
            if (aValue > bValue) {
                comparison = 1;
            } else if (aValue < bValue) {
                comparison = -1;
            }

            return sortBy.direction === 'asc' ? comparison : comparison * -1;
        });

        return filtered;
    }, [customers, searchTerm, filterStatus, sortBy]);

    const handleSort = (key) => {
        setSortBy(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
        }));
    };
    
    // Icon to show sorting direction
    const getSortIcon = (key) => {
        if (sortBy.key !== key) return null;
        return sortBy.direction === 'asc' ? ' ▲' : ' ▼';
    };

    const statusOptions = ['All', 'Active', 'Inactive', 'Suspended'];

    return (
        <div>
            <div className="flex flex-wrap justify-between items-center mb-6 border-b pb-4 dark:border-gray-700">
                <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 mb-3 sm:mb-0">All Platform Users ({customers.length})</h2>
                
                <div className="flex flex-wrap items-center space-x-3">
                    
                    {/* Status Filter */}
                    <div className="relative">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2 pl-3 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        >
                            {statusOptions.map(status => (
                                <option key={status} value={status}>{status} Status</option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" />
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search Name, Email, or Phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full sm:w-64 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            {['Name', 'LTV', 'Orders', 'Risk', 'Status', 'Signup Date', 'Actions'].map(header => {
                                const sortKeyMap = {
                                    'Name': 'name', 
                                    'LTV': 'lifetimeValue', 
                                    'Orders': 'ordersCompleted', 
                                    'Signup Date': 'signupDate'
                                };
                                const sortKey = sortKeyMap[header];
                                
                                return (
                                    <th
                                        key={header}
                                        scope="col"
                                        onClick={sortKey ? () => handleSort(sortKey) : undefined}
                                        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${sortKey ? 'cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition' : ''}`}
                                    >
                                        {header}
                                        {sortKey && getSortIcon(sortKey)}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredAndSortedCustomers.length > 0 ? (
                            filteredAndSortedCustomers.map(c => (
                                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                                    
                                    {/* Name and Contact */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <User size={20} className="mr-3 text-indigo-500" />
                                            <div>
                                                <div className="text-sm font-medium text-slate-800 dark:text-gray-100">{c.name}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{c.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    
                                    {/* LTV */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                                        {formatCurrency(c.lifetimeValue)}
                                    </td>
                                    
                                    {/* Orders Completed */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                        {c.ordersCompleted}
                                    </td>

                                    {/* Churn Risk */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {getRiskTag(c.churnRisk)}
                                    </td>
                                    
                                    {/* Status */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {getStatusBadge(c.status)}
                                    </td>
                                    
                                    {/* Signup Date */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {c.signupDate}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button 
                                            onClick={() => onViewDetails(c.id)}
                                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition"
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                    No customers found matching your criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CustomerTable;

