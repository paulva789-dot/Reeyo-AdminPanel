// src/pages/Finance/FinancePage.jsx

import React, { useState } from 'react';
import DateFilter from '../../components/DateFilter';
import StatCardGrid from './components/StatCardGrid';
import RevenueChart from './components/RevenueChart';
import TransactionTable from './components/TransactionTable';
import SettlementManagement from './components/SettlementManagement';
import { initialFinanceData } from '../../data/financeMocks';

const FinancePage = () => {
    const { kpis, monthlyRevenue, transactions } = initialFinanceData;
    const [selectedPeriod, setSelectedPeriod] = useState('today');

    return (
        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-gray-100 mb-6">
                Platform Finance Overview
            </h1>

            <DateFilter selectedPeriod={selectedPeriod} onPeriodChange={setSelectedPeriod} />

            <StatCardGrid kpis={kpis} />

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <RevenueChart data={monthlyRevenue} />
                </div>

                <div className="lg:col-span-1">
                    <SettlementManagement />
                </div>
            </div>

            <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <TransactionTable transactions={transactions} />
            </div>
        </div>
    );
};

export default FinancePage;
