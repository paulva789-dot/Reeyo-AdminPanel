// src/components/LiveTracker/TrackingOrderCard.jsx

import React from 'react';
import { BsTruck, BsClock, BsPerson, BsHouseDoor, BsCheckCircle } from 'react-icons/bs';

const TrackingOrderCard = ({ order, isSelected, onClick }) => {
    const { id, driver, customer, eta, status } = order;

    const statusIcon = status === 'In Transit' ? BsTruck : BsClock;
    const statusColor = status === 'In Transit' ? 'text-indigo-600' : 'text-yellow-600';
    const statusBg = status === 'In Transit' ? 'bg-indigo-600/10' : 'bg-yellow-600/10';

    return (
        <div 
            onClick={() => onClick(order)}
            className={`p-4 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                isSelected 
                    ? 'bg-indigo-50 dark:bg-indigo-900/50 border-indigo-500 shadow-md' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-sm'
            }`}
        >
            {/* Header: ID and Status */}
            <div className="flex justify-between items-center pb-2 border-b border-dashed dark:border-gray-700">
                <span className="font-bold text-lg text-slate-800 dark:text-gray-100">{id}</span>
                <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor} ${statusBg}`}>
                    <BsClock size={12} />
                    <span>{status}</span>
                </div>
            </div>

            {/* Details */}
            <div className="pt-2 space-y-2 text-sm">
                <div className="flex items-center space-x-2 text-slate-700 dark:text-gray-300">
                    <BsTruck size={16} className="text-indigo-500 shrink-0" />
                    <span className="font-medium truncate">{driver}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-700 dark:text-gray-300">
                    <BsPerson size={16} className="text-gray-500 shrink-0" />
                    <span className="truncate">{customer}</span>
                </div>
            </div>

            {/* Footer: ETA */}
            <div className="mt-3 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 flex justify-between items-center font-bold">
                <span className="text-xs text-gray-500 dark:text-gray-400">ETA:</span>
                <span className="text-base text-green-600 dark:text-green-400">{eta}</span>
            </div>
            
            {/* Example Action Button */}
            <button 
                className="w-full mt-3 py-2 text-sm rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                onClick={(e) => { e.stopPropagation(); console.log(`Marking ${id} delivered.`); }}
            >
                <BsCheckCircle size={16} />
                <span>Quick Deliver</span>
            </button>
        </div>
    );
};

export default TrackingOrderCard;

