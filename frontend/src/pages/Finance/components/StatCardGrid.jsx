// src/components/Finance/StatCardGrid.jsx

import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Wallet, Percent, Users, Globe } from 'lucide-react';

// Helper function to format currency (assuming FCFA)
const formatCurrency = (value) => {
    return `${value.toLocaleString('en-US')} FCFA`;
};

// --- Single KPI Card Component ---
const StatCard = ({ title, value, unit, change, color, icon }) => {
    
    // Determine the trend icon and color class
    const isPositive = change.startsWith('+');
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;
    const trendColor = isPositive ? 'text-green-500' : 'text-red-500';

    // Placeholder for Lucide icon mapping (or use emojis from mock data if available)
    // Using a basic set for demonstration; you can map them more accurately.
    const IconComponent = {
        '💸': DollarSign,
        '💰': Wallet,
        '🏦': Users,
        '📈': Percent,
    }[icon] || Globe; // Default icon

    return (
        <div className="flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition duration-300">
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
                <div className={`p-2 rounded-full ${color.replace('text-', 'bg-')} bg-opacity-10 ${color}`}>
                    <IconComponent size={20} />
                </div>
            </div>

            <div className="text-3xl font-extrabold text-slate-800 dark:text-gray-100 mb-1">
                {title.includes('Profit') || title.includes('Revenue') ? formatCurrency(value) : (value.toLocaleString() + ' ' + unit)}
            </div>

            <div className="flex items-center mt-auto">
                <span className={`flex items-center text-sm font-semibold ${trendColor}`}>
                    <TrendIcon size={16} className="mr-1" />
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
                    unit={kpi.unit}
                    change={kpi.change}
                    color={kpi.color}
                    icon={kpi.icon}
                />
            ))}
        </div>
    );
};

export default StatCardGrid;
