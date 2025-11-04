// src/pages/FinancePage.jsx

import React from 'react';
import StatCardGrid from './components/StatCardGrid';
import RevenueChart from './components/RevenueChart';
import TransactionTable from './components/TransactionTable';
import { initialFinanceData } from '../../data/financeMocks'; 
// We will create this mock data file next

const FinancePage = () => {
    // In a real application: Fetch all financial data here (API calls)
    const { kpis, monthlyRevenue, transactions } = initialFinanceData;

    return (
        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-gray-100 mb-6">
                Platform Finance Overview
            </h1>

            {/* 1. KPI Cards */}
            <StatCardGrid kpis={kpis} />
            
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 2. Revenue Chart (2/3 width) */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <RevenueChart data={monthlyRevenue} />
                </div>
                
                {/* 3. Payouts/Quick Stats (1/3 width) */}
                <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 mb-4">Quick Actions</h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        Manage vendor payouts and run quick reports.
                    </p>
                    {/* Placeholder for PayoutManagement Component */}
                    <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p className="font-semibold text-indigo-600 dark:text-indigo-400">Payout Management</p>
                        <button className="mt-2 w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                            Process Payouts
                        </button>
                    </div>
                </div>
            </div>

            {/* 4. Transaction Details Table */}
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                 <TransactionTable transactions={transactions} />
            </div>
        </div>
    );
};

export default FinancePage;