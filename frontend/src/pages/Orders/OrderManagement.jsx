// src/pages/OrderManagement.jsx (UPDATED for FCFA)
import React, { useState } from 'react';
import OrderFilterBar from './components/OrderFilterBar';
import OrderStatsCards from './components/OrderStatsCards';
import OrderCard from './components/OrderCard';

// Mock Data for demonstration - **UPDATED FCFA VALUES**
const mockOrders = [
    { id: '#001A', status: 'Pending', time: '10:30 AM', customer: 'John Doe', driver: 'N/A', items: 3, total: 15500 }, // ~25.50 USD
    { id: '#002B', status: 'Processing', time: '10:45 AM', customer: 'Jane Smith', driver: 'Alice K.', items: 2, total: 9100 },  // ~15.00 USD
    { id: '#003C', status: 'In Transit', time: '11:00 AM', customer: 'Bob Johnson', driver: 'Mike T.', items: 5, total: 25950 }, // ~42.75 USD
    { id: '#004D', status: 'Delivered', time: '11:15 AM', customer: 'Sarah Lee', driver: 'N/A', items: 1, total: 5499 },  // ~8.99 USD
    { id: '#005E', status: 'Cancelled', time: '11:30 AM', customer: 'Tom Hanks', driver: 'N/A', items: 4, total: 18250 }, // ~30.00 USD
];

const OrderManagement = () => {
    const [filter, setFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredOrders = mockOrders.filter(order => {
        const matchesStatus = filter === 'All' || order.status === filter;
        const matchesSearch = order.id.includes(searchQuery) || order.customer.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const stats = {
        Pending: mockOrders.filter(o => o.status === 'Pending').length,
        'In Transit': mockOrders.filter(o => o.status === 'In Transit').length,
        Delivered: mockOrders.filter(o => o.status === 'Delivered').length,
    };

    return (
        <div className="p-4 sm:p-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-gray-100 mb-6">
                Live Order Dashboard
            </h1>

            {/* Top Level Stats */}
            <OrderStatsCards stats={stats} />

            {/* Filter and Search Bar */}
            <OrderFilterBar 
                currentFilter={filter} 
                setFilter={setFilter} 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
            />

            {/* Order Grid: 1 column on mobile, 2 on tablet, 3 on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                {filteredOrders.length > 0 ? (
                    filteredOrders.map(order => (
                        <OrderCard key={order.id} order={order} />
                    ))
                ) : (
                    <p className="col-span-full text-center text-gray-500 dark:text-gray-400 py-12">
                        No orders match your current filter and search criteria.
                    </p>
                )}
            </div>
        </div>
    );
};

export default OrderManagement;
