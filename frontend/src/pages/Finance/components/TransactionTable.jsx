// src/components/Finance/TransactionTable.jsx

import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, Download } from 'lucide-react';

// Helper function to determine badge style based on status
const getStatusBadge = (status) => {
    switch (status) {
        case 'Completed':
            return <span className="px-3 py-1 text-xs font-semibold leading-tight text-green-700 bg-green-100 rounded-full dark:bg-green-700 dark:text-green-100">Completed</span>;
        case 'Pending':
            return <span className="px-3 py-1 text-xs font-semibold leading-tight text-yellow-700 bg-yellow-100 rounded-full dark:bg-yellow-700 dark:text-yellow-100">Pending</span>;
        case 'Refund':
            return <span className="px-3 py-1 text-xs font-semibold leading-tight text-red-700 bg-red-100 rounded-full dark:bg-red-700 dark:text-red-100">Refund</span>;
        case 'Payout':
            return <span className="px-3 py-1 text-xs font-semibold leading-tight text-indigo-700 bg-indigo-100 rounded-full dark:bg-indigo-700 dark:text-indigo-100">Payout</span>;
        default:
            return <span className="px-3 py-1 text-xs font-semibold leading-tight text-gray-700 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-100">{status}</span>;
    }
};

// Helper function to format amount and determine color
const formatAmount = (amount, type) => {
    const isCredit = type === 'Order';
    const color = isCredit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    const sign = isCredit ? '+' : '';
    
    return (
        <span className={`font-semibold ${color}`}>
            {sign}{amount.toLocaleString('en-US')} FCFA
        </span>
    );
};


const TransactionTable = ({ transactions }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');

    // Filter transactions based on search term and type
    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const matchesSearch = tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  tx.vendor.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesType = filterType === 'All' || tx.type === filterType;

            return matchesSearch && matchesType;
        });
    }, [transactions, searchTerm, filterType]);


    const transactionTypes = ['All', 'Order', 'Payout', 'Refund'];

    const exportToCSV = () => {
        const headers = ['ID', 'Type', 'Vendor/Source', 'Date', 'Amount', 'Status'];
        const rows = filteredTransactions.map((tx) => [tx.id, tx.type, tx.vendor, tx.date, tx.amount, tx.status]);
        const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reeyo_transactions.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6 pb-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100">Transaction History</h2>
                <div className="flex items-center space-x-4">
                    
                    {/* Filter Dropdown */}
                    <div className="relative">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2 pl-3 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        >
                            {transactionTypes.map(type => (
                                <option key={type} value={type}>{type} Type</option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" />
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search ID or Vendor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 w-64 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>

                    {/* Export Button */}
                    <button onClick={exportToCSV} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition text-sm">
                        <Download size={16} className="mr-2" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            {['ID', 'Type', 'Vendor/Source', 'Date', 'Amount', 'Status', 'Actions'].map(header => (
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
                        {filteredTransactions.length > 0 ? (
                            filteredTransactions.map(tx => (
                                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600 dark:text-indigo-400">{tx.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{tx.type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{tx.vendor}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{tx.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {formatAmount(tx.amount, tx.type)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {getStatusBadge(tx.status === 'Refund' ? 'Refund' : tx.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                    No transactions found matching your criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TransactionTable;

