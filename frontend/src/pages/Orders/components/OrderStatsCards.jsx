// pages/Orders/components/OrderStatsCards.jsx
import React from 'react';
import { Truck, Clock, CheckCircle, XCircle } from 'lucide-react';

const StatItem = ({ title, value, icon: Icon, color }) => (
    <div className={`p-5 rounded-xl shadow-lg dark:shadow-2xl flex items-center justify-between transition-transform duration-300 transform hover:scale-[1.02] ${color} text-white`}>
        <div>
            <p className="text-sm font-medium opacity-80">{title}</p>
            <h2 className="text-4xl font-bold mt-1">{value ?? '—'}</h2>
        </div>
        <Icon size={40} className="opacity-50" />
    </div>
);

// `breakdown` is /analytics/orders' by_status map: { PENDING, PREPARING, RIDER_ASSIGNED,
// PICKED_UP, DELIVERED, CANCELLED, REFUNDED, ... } for the selected date range.
const OrderStatsCards = ({ breakdown }) => {
    const inTransit = (breakdown?.RIDER_ASSIGNED || 0) + (breakdown?.PICKED_UP || 0) + (breakdown?.IN_TRANSIT || 0);
    return (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <StatItem title="Pending" value={breakdown?.PENDING} icon={Clock} color="bg-yellow-500 dark:bg-yellow-600" />
            <StatItem title="In Transit" value={inTransit} icon={Truck} color="bg-indigo-600 dark:bg-indigo-700" />
            <StatItem title="Delivered" value={breakdown?.DELIVERED} icon={CheckCircle} color="bg-green-500 dark:bg-green-600" />
            <StatItem title="Cancelled" value={breakdown?.CANCELLED} icon={XCircle} color="bg-red-500 dark:bg-red-600" />
        </div>
    );
};

export default OrderStatsCards;
