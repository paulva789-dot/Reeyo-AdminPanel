// src/components/Customers/StatCardGrid.jsx

import React from 'react';
import { Users, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';

// Helper function to format currency (assuming FCFA)
const formatValue = (value, isCurrency = false) => {
    if (isCurrency) {
        return `${value.toLocaleString('en-US')} FCFA`;
    }
    return value.toLocaleString('en-US');
};

// --- Single KPI Card Component ---
const StatCard = ({ title, value, change, color, icon, isCurrency }) => {
    
    // Determine the trend color
    const trendColor = change.startsWith('+') ? 'text-green-500' : (change === '0%' ? 'text-gray-500' : 'text-red-500');

    // Map the mock icon to a Lucide icon component
    const IconComponent = {
        '👥': Users,
        '🚀': TrendingUp,
        '⚠️': AlertTriangle,
        '💰': DollarSign,
    }[icon] || Users; 

    return (
        <div className="flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
                <div className={`p-2 rounded-full ${color.replace('text-', 'bg-')} bg-opacity-10 ${color}`}>
                    <IconComponent size={20} />
                </div>
            </div>

            <div className="text-3xl font-extrabold text-slate-800 dark:text-gray-100 mb-1">
                {formatValue(value, isCurrency)}
            </div>

            <div className="flex items-center mt-auto">
                <span className={`flex items-center text-sm font-semibold ${trendColor}`}>
                    {change}
                </span>
                <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                    vs. last period
                </span>
            </div>
        </div>
    );
};

// --- Main Grid Component ---
const StatCardGrid = ({ kpis }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map(kpi => (
                <StatCard 
                    key={kpi.id}
                    title={kpi.title}
                    value={kpi.value}
                    change={kpi.change}
                    color={kpi.color}
                    icon={kpi.icon}
                    isCurrency={kpi.isCurrency}
                />
            ))}
        </div>
    );
};

export default StatCardGrid;

