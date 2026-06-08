// pages/Orders/components/OrderCard.jsx

import React, { useState } from 'react';
import OrderDetailsModal from './OrderDetailsModal';
import { 
    BsClock, BsTruck, BsCheckCircle, BsXCircle, BsBoxSeam, 
    BsPerson, BsBicycle, BsCurrencyDollar, BsChevronRight 
} from 'react-icons/bs';

const getStatusStyles = (status) => {
    const IconMap = {
        'New': BsClock,
        'Scheduled': BsClock,
        'Accepted': BsBoxSeam,
        'Ready for Delivery': BsBoxSeam,
        'On the Way': BsTruck,
        'Delivered': BsCheckCircle,
        'Cancelled': BsXCircle,
        'Abandoned': BsXCircle,
        'Delayed': BsClock,
    };

    switch (status) {
        case 'New':
            return { icon: IconMap[status], color: 'text-blue-500', bgColor: 'bg-blue-500/10' };
        case 'Scheduled':
            return { icon: IconMap[status], color: 'text-purple-500', bgColor: 'bg-purple-500/10' };
        case 'Accepted':
            return { icon: IconMap[status], color: 'text-indigo-600', bgColor: 'bg-indigo-600/10' };
        case 'Ready for Delivery':
            return { icon: IconMap[status], color: 'text-orange-500', bgColor: 'bg-orange-500/10' };
        case 'On the Way':
            return { icon: IconMap[status], color: 'text-indigo-600', bgColor: 'bg-indigo-600/10' };
        case 'Delivered':
            return { icon: IconMap[status], color: 'text-green-500', bgColor: 'bg-green-500/10' };
        case 'Cancelled':
        case 'Abandoned':
            return { icon: IconMap[status], color: 'text-red-500', bgColor: 'bg-red-500/10' };
        case 'Delayed':
            return { icon: IconMap[status], color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' };
        default:
            return { icon: BsClock, color: 'text-gray-500', bgColor: 'bg-gray-500/10' };
    }
};

// Helper function for FCFA formatting
const formatFCFA = (amount) => {
    // Use 'fr-FR' locale for thousands separators (e.g., 15 500)
    return `${amount.toLocaleString('fr-FR')} FCFA`;
};

const OrderCard = ({ order, onAssignRider }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const { icon: StatusIcon, color, bgColor } = getStatusStyles(order.status);

    const handleViewDetails = () => {
        setIsModalOpen(true);
    };

    const showAssignButton = ['New', 'Scheduled', 'Accepted', 'Ready for Delivery'].includes(order.status) && 
                           (order.driver === 'Unassigned' || !order.driver);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg ring-1 ring-gray-100 dark:ring-gray-700 overflow-hidden transition-all duration-300 hover:shadow-xl hover:ring-2">
            
            <div className={`p-4 flex justify-between items-center ${bgColor}`}>
                <div className={`flex items-center space-x-2 ${color} font-bold`}>
                    <StatusIcon size={20} />
                    <span className="text-sm uppercase tracking-wider">{order.status}</span>
                </div>
                <span className="text-sm font-mono text-gray-600 dark:text-gray-300">{order.id}</span>
            </div>

            <div className="p-4 space-y-3">
                
                <div className="flex items-center space-x-3 text-slate-700 dark:text-gray-200">
                    <BsPerson size={18} className="text-indigo-500" />
                    <span className="font-semibold truncate">{order.customer}</span>
                </div>
                
                <div className="flex items-center space-x-3 text-slate-600 dark:text-gray-400">
                    <BsBicycle size={18} className="text-indigo-500" />
                    <span className="text-sm">{order.driver === 'Unassigned' ? 'Awaiting Driver' : `Driver: ${order.driver}`}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2 text-slate-700 dark:text-gray-200">
                        <BsCurrencyDollar size={16} className="text-green-500" />
                        {/* **FIXED** to display FCFA */}
                        <span className="text-lg font-extrabold text-green-600">{formatFCFA(order.total)}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-600 dark:text-gray-400">
                        <BsBoxSeam size={16} className="text-orange-500" />
                        <span className="text-sm">{order.items} Items</span>
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                {showAssignButton && onAssignRider && (
                    <button 
                        onClick={() => onAssignRider(order)}
                        className="flex-1 py-2 rounded-lg font-bold flex items-center justify-center space-x-2 transition-all duration-200 bg-green-600 text-white hover:bg-green-700 shadow-sm"
                    >
                        <span>Assign Rider</span>
                    </button>
                )}
                <button 
                    onClick={handleViewDetails}
                    className={`${showAssignButton ? 'flex-1' : 'w-full'} py-2 rounded-lg font-bold flex items-center justify-center space-x-2 transition-all duration-200 bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200/40`}
                >
                    <span>View Details</span>
                    <BsChevronRight size={18} />
                </button>
            </div>

            <OrderDetailsModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                order={order} 
            />

        </div>
    );
};

export default OrderCard;

