// src/pages/Users/vendors/menuApprove/components/ApprovalRequestCard.jsx (CLEANED UP)

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BsX, BsShop, BsCalendar, BsClock, BsFileText, BsQuestionCircle, BsCheckCircle, BsXCircle, BsTag
} from 'react-icons/bs';
import { formatFCFA } from '../../../../../data/menuApprovalMocks';

// --- HELPER FUNCTIONS REDEFINED FOR MODAL ---
// FIX: Redefining getStatusStyles so it's accessible within this file's scope
const getStatusStyles = (status) => {
    switch (status) {
        case 'Pending':
            return { color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' };
        case 'Approved':
            return { color: 'text-green-500', bgColor: 'bg-green-500/10' };
        case 'Rejected':
        default:
            return { color: 'text-red-500', bgColor: 'bg-red-500/10' };
    }
};

const getStatusColor = (status) => {
    switch (status) {
        case 'Approved': return 'text-green-600 dark:text-green-400';
        case 'Rejected': return 'text-red-600 dark:text-red-400';
        case 'Pending': 
        default: return 'text-yellow-600 dark:text-yellow-400';
    }
};
// --------------------------------------------

const DetailRow = ({ icon: Icon, label, value, colorClass = 'text-slate-700 dark:text-gray-200' }) => (
    <div className="flex items-start space-x-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
        <Icon size={18} className={`shrink-0 mt-0.5 ${colorClass}`} />
        <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">{label}</span>
            <span className={`text-sm ${colorClass} font-medium leading-tight`}>{value}</span>
        </div>
    </div>
);

const PriceBlock = ({ title, price, isNew }) => (
    <div className={`p-4 rounded-lg flex flex-col ${isNew ? 'bg-green-50 dark:bg-green-900/50' : 'bg-gray-50 dark:bg-gray-700'} border ${isNew ? 'border-green-300' : 'border-gray-200 dark:border-gray-600'}`}>
        <span className={`text-xs font-bold uppercase ${isNew ? 'text-green-600' : 'text-gray-500 dark:text-gray-400'}`}>
            {title}
        </span>
        <span className={`text-xl font-extrabold mt-1 ${isNew ? 'text-green-700 dark:text-green-300' : 'text-slate-800 dark:text-gray-100'}`}>
            {formatFCFA(price)}
        </span>
    </div>
);

const ApprovalDetailsModal = ({ isOpen, onClose, request }) => {
    
    if (!request) return null;

    const isPriceChange = request.type === 'Price Update' || request.type === 'New Item';
    const isPending = request.status === 'Pending';
    const formattedDate = new Date(request.submittedAt).toLocaleString();

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto transition-colors duration-300"
                        initial={{ y: 50, scale: 0.9 }}
                        animate={{ y: 0, scale: 1 }}
                        exit={{ y: 50, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 z-10">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-gray-100">
                                Menu Review: <span className="font-mono text-indigo-500">{request.itemName}</span>
                            </h2>
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
                                <BsX size={24} />
                            </button>
                        </div>

                        {/* Modal Content - Two-Column Layout */}
                        <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Left Column (2/3): Core Details & Description */}
                            <div className="lg:col-span-2 space-y-6">
                                
                                {/* Item & Vendor Info */}
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                                    <h3 className="text-xl font-semibold mb-3 text-slate-800 dark:text-gray-100">Request Overview</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <DetailRow icon={BsShop} label="Vendor" value={request.vendorName} colorClass="text-indigo-500" />
                                        <DetailRow icon={BsTag} label="Category" value={request.category} />
                                        <DetailRow icon={BsCalendar} label="Submitted On" value={formattedDate} />
                                        <DetailRow icon={BsFileText} label="Change Type" value={request.type} colorClass="font-bold text-orange-500" />
                                    </div>
                                </div>
                                
                                {/* Price Comparison / Status */}
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                                    <h3 className="text-xl font-semibold mb-3 text-slate-800 dark:text-gray-100">
                                        {isPriceChange ? 'Price Comparison' : 'Details'}
                                    </h3>
                                    
                                    {isPriceChange ? (
                                        <div className="grid grid-cols-3 gap-4">
                                            <PriceBlock 
                                                title="Current Price" 
                                                price={request.currentPrice} 
                                                isNew={false}
                                            />
                                            <div className='col-span-1 flex items-center justify-center'>
                                                <BsClock size={30} className='text-gray-400 dark:text-gray-500'/>
                                            </div>
                                            <PriceBlock 
                                                title="Requested Price" 
                                                price={request.requestedPrice} 
                                                isNew={true}
                                            />
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                                            {request.type} for **{request.itemName}** requires review of the description or item details.
                                        </p>
                                    )}
                                </div>

                                {/* Vendor Reason */}
                                <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/50">
                                    <h3 className="text-lg font-semibold mb-2 text-indigo-600 dark:text-indigo-300 flex items-center space-x-2">
                                        <BsQuestionCircle size={20} />
                                        <span>Vendor's Reason for Change</span>
                                    </h3>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{request.reason}"</p>
                                </div>

                            </div>

                            {/* Right Column (1/3): Action History / Status */}
                            <div className="lg:col-span-1 space-y-6">
                                
                                <div className="p-4 rounded-lg bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-gray-100">Review Status</h3>
                                    {/* FIX: Using getStatusStyles redefined above */}
                                    <div className={`p-4 rounded-lg text-center font-bold text-xl ${getStatusStyles(request.status).color} ${getStatusStyles(request.status).bgColor}`}>
                                        {request.status.toUpperCase()}
                                    </div>

                                    {request.adminNotes && (
                                        <div className="mt-4 pt-3 border-t dark:border-gray-700">
                                            <span className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Admin Notes</span>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 italic">{request.adminNotes}</p>
                                        </div>
                                    )}
                                </div>
                                
                                {isPending && (
                                    <div className="flex flex-col space-y-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-100">Take Action</h3>
                                        
                                        <button 
                                            // TODO: Implement actual approval logic here
                                            className="w-full py-3 rounded-lg bg-green-600 text-white font-bold flex items-center justify-center space-x-2 hover:bg-green-700 transition-colors"
                                        >
                                            <BsCheckCircle size={18} />
                                            <span>Approve Menu Change</span>
                                        </button>

                                        <button 
                                            // TODO: Implement actual rejection logic here
                                            className="w-full py-3 rounded-lg bg-red-600 text-white font-bold flex items-center justify-center space-x-2 hover:bg-red-700 transition-colors"
                                        >
                                            <BsXCircle size={18} />
                                            <span>Reject Change</span>
                                        </button>
                                        
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer (Just a Close button if pending, otherwise keep it clean) */}
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                            <button
                                onClick={onClose}
                                className="px-5 py-2 rounded-lg text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                        

                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ApprovalDetailsModal;

