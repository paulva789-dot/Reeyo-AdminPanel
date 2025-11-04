// src/pages/LiveTracker.jsx

import React, { useState, useEffect } from 'react';
import TrackingSidebar from './components/TrackingSidebar';
import LiveMap from './components/LiveMap';
import { activeTrackingOrders } from '../../../data/trackingMocks';

const LiveTracker = () => {
    const orders = activeTrackingOrders;
    
    // Initialize with the first "In Transit" order, or the first order if none in transit
    const initialOrderId = orders.find(o => o.status === 'In Transit')?.id || orders[0]?.id || null;
    const [selectedOrderId, setSelectedOrderId] = useState(initialOrderId);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Get the full order object for the map component
    const selectedOrder = orders.find(order => order.id === selectedOrderId);

    const handleSelectOrder = (order) => {
        setSelectedOrderId(order.id);
    };

    // Update current time every minute for realistic feel
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute

        return () => clearInterval(timer);
    }, []);

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
            {/* Page Header */}
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                                📍 Live Dispatch Tracker
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Real-time order tracking and driver monitoring
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            {/* Live Status Indicator */}
                            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                                    Live
                                </span>
                            </div>

                            {/* Current Time */}
                            <div className="hidden sm:flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <span className="text-lg">🕐</span>
                                <span className="text-sm font-medium">
                                    {formatTime(currentTime)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Active</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{orders.length}</p>
                            </div>
                            <div className="text-3xl">📦</div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">In Transit</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {orders.filter(o => o.status === 'In Transit').length}
                                </p>
                            </div>
                            <div className="text-3xl">🚚</div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Preparing</p>
                                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                    {orders.filter(o => o.status === 'Preparing' || o.status === 'Processing').length}
                                </p>
                            </div>
                            <div className="text-3xl">👨‍🍳</div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg ETA</p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">18m</p>
                            </div>
                            <div className="text-3xl">⏱️</div>
                        </div>
                    </div>
                </div>

                {/* Main Layout: Sidebar + Map */}
                <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-280px)] min-h-[600px]">
                    {/* Sidebar */}
                    <TrackingSidebar 
                        orders={orders}
                        selectedOrderId={selectedOrderId}
                        onSelectOrder={handleSelectOrder}
                    />

                    {/* Map Container */}
                    <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <LiveMap selectedOrder={selectedOrder} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveTracker;

