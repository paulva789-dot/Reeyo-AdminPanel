// src/pages/Logistics/LiveTracker/components/TrackingSidebar.jsx
import React from 'react';

const TrackingSidebar = ({ riders, selectedRiderId, onSelectRider }) => {
    if (riders.length === 0) {
        return (
            <div className="w-full lg:w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Online Riders</h2>
                <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                    <div className="text-5xl mb-3">🏍️</div>
                    <p className="text-sm">No riders online at the moment</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full lg:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col max-h-full">
            <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800">
                <h2 className="text-xl font-bold text-white mb-1">🏍️ Online Riders</h2>
                <p className="text-blue-100 text-sm">{riders.length} rider{riders.length === 1 ? '' : 's'} online</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {riders.map((rider) => {
                    const isSelected = rider.rider_id === selectedRiderId;
                    return (
                        <button
                            key={rider.rider_id}
                            onClick={() => onSelectRider(rider.rider_id)}
                            className={`w-full text-left p-4 rounded-lg transition-all duration-200 border-2 hover:shadow-md ${
                                isSelected
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-750 hover:border-blue-300 dark:hover:border-blue-700'
                            }`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="font-bold text-gray-900 dark:text-white text-base">{rider.name}</h3>
                                <span className={`px-2 py-1 text-xs rounded-full font-semibold whitespace-nowrap ${
                                    rider.current_order_id
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                }`}>
                                    {rider.current_order_id ? 'On Delivery' : 'Available'}
                                </span>
                            </div>

                            {rider.current_order_id && (
                                <p className="text-xs font-mono text-gray-500 dark:text-gray-400">Order: {rider.current_order_id}</p>
                            )}

                            {isSelected && (
                                <div className="mt-2 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-semibold">
                                    <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></span>
                                    Tracking on map
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">On Delivery:</span>
                    <span className="font-bold text-green-600 dark:text-green-400">{riders.filter((r) => r.current_order_id).length}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-600 dark:text-gray-400">Available:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{riders.filter((r) => !r.current_order_id).length}</span>
                </div>
            </div>
        </div>
    );
};

export default TrackingSidebar;
