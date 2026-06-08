// src/pages/OrderManagement.jsx (UPDATED for FCFA)
import React, { useState } from 'react';
import { X } from 'lucide-react';
import OrderFilterBar from './components/OrderFilterBar';
import OrderStatsCards from './components/OrderStatsCards';
import OrderCard from './components/OrderCard';

// Mock Data for demonstration - **UPDATED FCFA VALUES**
const mockOrders = [
    { id: '#001A', status: 'New', time: '10:30 AM', customer: 'John Doe', driver: 'Unassigned', items: 3, total: 15500, service: 'Food' }, // ~25.50 USD
    { id: '#002B', status: 'Scheduled', time: '10:45 AM', customer: 'Jane Smith', driver: 'Unassigned', items: 2, total: 9100, service: 'Food' },  // ~15.00 USD
    { id: '#003C', status: 'Accepted', time: '11:00 AM', customer: 'Bob Johnson', driver: 'Alice K.', items: 5, total: 25950, service: 'Parcel' }, // ~42.75 USD
    { id: '#004D', status: 'Ready for Delivery', time: '11:15 AM', customer: 'Sarah Lee', driver: 'Mike T.', items: 1, total: 5499, service: 'Food' },  // ~8.99 USD
    { id: '#005E', status: 'On the Way', time: '11:30 AM', customer: 'Tom Hanks', driver: 'Chris P.', items: 4, total: 18250, service: 'Shops' }, // ~30.00 USD
    { id: '#006F', status: 'Delivered', time: '11:45 AM', customer: 'Mary Jones', driver: 'Alice K.', items: 2, total: 8750, service: 'Food' },  // ~14.50 USD
    { id: '#007G', status: 'Cancelled', time: '12:00 PM', customer: 'Peter Wilson', driver: 'Unassigned', items: 1, total: 3200, service: 'Parcel' },  // ~5.30 USD
    { id: '#008H', status: 'Abandoned', time: '12:15 PM', customer: 'Lisa Brown', driver: 'Unassigned', items: 0, total: 0, service: 'Food' },  // N/A
    { id: '#009I', status: 'Delayed', time: '12:30 PM', customer: 'David Lee', driver: 'Mike T.', items: 3, total: 12500, service: 'Shops' },  // ~20.80 USD
];

const MOCK_RIDERS = [
    { id: 'r1', name: 'Alice Kameni', status: 'Available', zone: 'Akwa Downtown', rating: 4.8 },
    { id: 'r2', name: 'Mike Tabe', status: 'Available', zone: 'Bonanjo', rating: 4.6 },
    { id: 'r3', name: 'Chris Nji', status: 'On Trip', zone: 'Douala', rating: 4.9 },
];

const OrderManagement = () => {
    const [orders, setOrders] = useState(mockOrders);
    const [filter, setFilter] = useState('All');
    const [serviceFilter, setServiceFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const filteredOrders = orders.filter(order => {
        const matchesStatus = filter === 'All' || order.status === filter;
        const matchesService = serviceFilter === 'All' || order.service === serviceFilter;
        const matchesSearch = order.id.includes(searchQuery) || order.customer.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch && matchesService;
    });

    const stats = {
        New: orders.filter(o => o.status === 'New').length,
        Scheduled: orders.filter(o => o.status === 'Scheduled').length,
        Accepted: orders.filter(o => o.status === 'Accepted').length,
        'On the Way': orders.filter(o => o.status === 'On the Way').length,
        Delivered: orders.filter(o => o.status === 'Delivered').length,
    };

    const handleAssignRider = (order) => {
        setSelectedOrder(order);
        setShowAssignModal(true);
    };

    const assignRiderToOrder = (riderId) => {
        const rider = MOCK_RIDERS.find(r => r.id === riderId);
        if (rider) {
            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order.id === selectedOrder?.id
                        ? { ...order, driver: rider.name, status: 'Accepted' }
                        : order
                )
            );
            setShowAssignModal(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-gray-100 mb-6">
                Live Order Dashboard
            </h1>

            {/* Service Filter Tabs */}
            <div className="flex gap-2 mb-4">
                {['All', 'Food', 'Parcel', 'Shops'].map(service => (
                    <button
                        key={service}
                        onClick={() => setServiceFilter(service)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            serviceFilter === service
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        {service} Orders
                    </button>
                ))}
            </div>

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
                        <OrderCard key={order.id} order={order} onAssignRider={handleAssignRider} />
                    ))
                ) : (
                    <p className="col-span-full text-center text-gray-500 dark:text-gray-400 py-12">
                        No orders match your current filter and search criteria.
                    </p>
                )}
            </div>

            {/* Rider Assignment Modal */}
            {showAssignModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Assign Rider to Order {selectedOrder.id}</h3>
                            <button onClick={() => setShowAssignModal(false)} className="p-1">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {MOCK_RIDERS.filter(r => r.status === 'Available').map(rider => (
                                <div key={rider.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <p className="font-medium">{rider.name}</p>
                                        <p className="text-sm text-gray-500">Zone: {rider.zone} • Rating: {rider.rating}</p>
                                    </div>
                                    <button
                                        onClick={() => assignRiderToOrder(rider.id)}
                                        className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                    >
                                        Assign
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowAssignModal(false)}
                            className="w-full mt-4 py-2 border rounded-lg"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderManagement;
