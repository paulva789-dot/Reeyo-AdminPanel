// src/components/LiveTracker/TrackingSidebar.jsx

import React from 'react';

const TrackingSidebar = ({ orders, selectedOrderId, onSelectOrder }) => {
    
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'In Transit':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'Preparing':
            case 'Processing':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'Pending':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            default:
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-CM', {
            style: 'currency',
            currency: 'XAF',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    if (orders.length === 0) {
        return (
            <div className="w-full lg:w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Active Orders
                </h2>
                <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                    <div className="text-5xl mb-3">📦</div>
                    <p className="text-sm">No active orders at the moment</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full lg:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col max-h-full">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800">
                <h2 className="text-xl font-bold text-white mb-1">
                    🚚 Active Deliveries
                </h2>
                <p className="text-blue-100 text-sm">
                    {orders.length} {orders.length === 1 ? 'order' : 'orders'} in progress
                </p>
            </div>

            {/* Scrollable Order List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {orders.map((order) => {
                    const isSelected = order.id === selectedOrderId;
                    
                    return (
                        <button
                            key={order.id}
                            onClick={() => onSelectOrder(order)}
                            className={`
                                w-full text-left p-4 rounded-lg transition-all duration-200
                                border-2 hover:shadow-md
                                ${isSelected 
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-750 hover:border-blue-300 dark:hover:border-blue-700'
                                }
                            `}
                        >
                            {/* Order Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                                        {order.id}
                                    </span>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-base mt-0.5">
                                        {order.customer}
                                    </h3>
                                </div>
                                <span className={`
                                    px-2 py-1 text-xs rounded-full font-semibold whitespace-nowrap
                                    ${getStatusBadgeClass(order.status)}
                                `}>
                                    {order.status}
                                </span>
                            </div>

                            {/* Driver Info */}
                            <div className="flex items-center gap-2 mb-2 text-sm">
                                <span className="text-lg">🏍️</span>
                                <span className="text-gray-700 dark:text-gray-300 font-medium">
                                    {order.driver}
                                </span>
                                <span className="text-gray-400 dark:text-gray-500 text-xs">
                                    ({order.driverId})
                                </span>
                            </div>

                            {/* Order Details */}
                            <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500 dark:text-gray-400">⏱️</span>
                                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                                        ETA: {order.eta}
                                    </span>
                                </div>
                                <div className="font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(order.total)}
                                </div>
                            </div>

                            {/* Distance (if available) */}
                            {order.estimatedDistance && (
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    <span>📏</span>
                                    <span>{order.estimatedDistance}</span>
                                </div>
                            )}

                            {/* Selected indicator */}
                            {isSelected && (
                                <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-semibold">
                                    <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></span>
                                    Tracking on map
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Footer Stats */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                        In Transit:
                    </span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                        {orders.filter(o => o.status === 'In Transit').length}
                    </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-600 dark:text-gray-400">
                        Preparing:
                    </span>
                    <span className="font-bold text-yellow-600 dark:text-yellow-400">
                        {orders.filter(o => o.status === 'Preparing' || o.status === 'Processing').length}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default TrackingSidebar;
