// pages/Orders/components/OrderCard.jsx
import React from 'react';
import { Truck, Clock, CheckCircle } from 'lucide-react';

const StatItem = ({ title, value, icon: Icon, color }) => (
    <div className={`p-5 rounded-xl shadow-lg dark:shadow-2xl flex items-center justify-between transition-transform duration-300 transform hover:scale-[1.02] ${color} text-white`}>
        <div>
            <p className="text-sm font-medium opacity-80">{title}</p>
            <h2 className="text-4xl font-bold mt-1">{value}</h2>
        </div>
        <Icon size={40} className="opacity-50" />
    </div>
);

const OrderStatsCards = ({ stats }) => {
    return (
        // Responsive grid for statistics
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatItem 
                title="Pending" 
                value={stats.Pending} 
                icon={Clock} 
                color="bg-yellow-500 dark:bg-yellow-600"
            />
            <StatItem 
                title="In Transit" 
                value={stats['In Transit']} 
                icon={Truck} 
                color="bg-indigo-600 dark:bg-indigo-700"
            />
            <StatItem 
                title="Delivered Today" 
                value={stats.Delivered} 
                icon={CheckCircle} 
                color="bg-green-500 dark:bg-green-600"
            />
        </div>
    );
};

export default OrderStatsCards;