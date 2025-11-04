// src/pages/Users/vendors/menuApprove/components/ApprovalRequestCard.jsx (CLEANED UP)

import React, { useState } from 'react';
import ApprovalDetailsModal from './ApprovalDetailsModal';
import { BsClock, BsCheckCircle, BsXCircle, BsShop, BsFileText, BsChevronRight } from 'react-icons/bs';
import { formatFCFA } from '../../../../../data/menuApprovalMocks'; // Ensure this path is correct

const getStatusStyles = (status) => {
    switch (status) {
        case 'Pending':
            return { icon: BsClock, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' };
        case 'Approved':
            return { icon: BsCheckCircle, color: 'text-green-500', bgColor: 'bg-green-500/10' };
        case 'Rejected':
        default:
            return { icon: BsXCircle, color: 'text-red-500', bgColor: 'bg-red-500/10' };
    }
};

const getTypeStyles = (type) => {
    switch (type) {
        case 'Price Update': return 'text-orange-500 border-orange-500/50';
        case 'New Item': return 'text-indigo-500 border-indigo-500/50';
        case 'Item Removal': return 'text-red-500 border-red-500/50';
        case 'Description Change': 
        default: return 'text-blue-500 border-blue-500/50';
    }
}

const ApprovalRequestCard = ({ request }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const { icon: StatusIcon, color, bgColor } = getStatusStyles(request.status);
    const typeClass = getTypeStyles(request.type);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg ring-1 ring-gray-100 dark:ring-gray-700 overflow-hidden transition-all duration-300 hover:shadow-xl hover:ring-2">
            
            {/* Header: Request ID & Status */}
            <div className={`p-4 flex justify-between items-center ${bgColor}`}>
                <div className={`flex items-center space-x-2 ${color} font-bold`}>
                    <StatusIcon size={20} />
                    <span className="text-sm uppercase tracking-wider">{request.status}</span>
                </div>
                <span className="text-sm font-mono text-gray-600 dark:text-gray-300">{request.id}</span>
            </div>

            {/* Body: Item and Vendor Info */}
            <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${typeClass} dark:text-gray-100`}>
                        {request.type}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(request.submittedAt).toLocaleDateString()}
                    </span>
                </div>

                <h3 className="text-lg font-bold text-slate-800 dark:text-gray-100 truncate mt-1">
                    {request.itemName}
                </h3>
                
                <div className="flex items-center space-x-2 text-slate-600 dark:text-gray-400">
                    <BsShop size={18} className="text-indigo-500" />
                    <span className="text-sm font-medium truncate">{request.vendorName}</span>
                </div>

                {/* Price Difference */}
                {(request.type === 'Price Update' || request.type === 'New Item') && (
                    <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Current Price</span>
                            <span className="font-semibold text-sm">{formatFCFA(request.currentPrice)}</span>
                        </div>
                        <BsChevronRight size={18} className="text-indigo-500 shrink-0 mx-2" />
                        <div className="flex flex-col text-right">
                            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">Requested Price</span>
                            <span className="text-lg font-extrabold text-green-600 dark:text-green-400">
                                {formatFCFA(request.requestedPrice)}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer: Action */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                <button 
                    onClick={() => setIsModalOpen(true)}
                    disabled={request.status !== 'Pending'}
                    className={`w-full py-2 rounded-lg font-bold flex items-center justify-center space-x-2 transition-colors duration-200 ${
                        request.status === 'Pending' 
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                            : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
                    }`}
                >
                    <span>{request.status === 'Pending' ? 'Review & Act' : 'View History'}</span>
                    <BsFileText size={18} />
                </button>
            </div>

            {/* The Modal Component */}
            <ApprovalDetailsModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                request={request} // Pass the entire request object
            />

        </div>
    );
};

export default ApprovalRequestCard;

