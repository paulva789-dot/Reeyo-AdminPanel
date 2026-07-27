// pages/Orders/components/OrderCard.jsx
import React, { useState } from 'react';
import OrderDetailsModal from './OrderDetailsModal';
import {
    BsClock, BsTruck, BsCheckCircle, BsXCircle, BsBoxSeam,
    BsPerson, BsBicycle, BsCurrencyDollar, BsChevronRight
} from 'react-icons/bs';

const STATUS_STYLES = {
    PENDING: { icon: BsClock, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
    CONFIRMED: { icon: BsBoxSeam, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    PREPARING: { icon: BsBoxSeam, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    READY: { icon: BsBoxSeam, color: 'text-orange-600', bgColor: 'bg-orange-600/10' },
    RIDER_ASSIGNED: { icon: BsTruck, color: 'text-indigo-600', bgColor: 'bg-indigo-600/10' },
    PICKED_UP: { icon: BsTruck, color: 'text-indigo-600', bgColor: 'bg-indigo-600/10' },
    DELIVERED: { icon: BsCheckCircle, color: 'text-green-500', bgColor: 'bg-green-500/10' },
    CANCELLED: { icon: BsXCircle, color: 'text-red-500', bgColor: 'bg-red-500/10' },
    REFUNDED: { icon: BsXCircle, color: 'text-red-400', bgColor: 'bg-red-400/10' },
};

const getStatusStyles = (status) => STATUS_STYLES[status] || { icon: BsClock, color: 'text-gray-500', bgColor: 'bg-gray-500/10' };

const formatFCFA = (amount) => `${Number(amount || 0).toLocaleString('fr-FR')} FCFA`;

const OrderCard = ({ order, onCancelled }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { icon: StatusIcon, color, bgColor } = getStatusStyles(order.status);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg ring-1 ring-gray-100 dark:ring-gray-700 overflow-hidden transition-all duration-300 hover:shadow-xl hover:ring-2">

            <div className={`p-4 flex justify-between items-center ${bgColor}`}>
                <div className={`flex items-center space-x-2 ${color} font-bold`}>
                    <StatusIcon size={20} />
                    <span className="text-sm uppercase tracking-wider">{order.status.replace(/_/g, ' ')}</span>
                </div>
                <span className="text-sm font-mono text-gray-600 dark:text-gray-300">{order.order_number}</span>
            </div>

            <div className="p-4 space-y-3">
                <div className="flex items-center space-x-3 text-slate-700 dark:text-gray-200">
                    <BsPerson size={18} className="text-indigo-500" />
                    <span className="font-semibold truncate">{order.user?.name || 'N/A'}</span>
                </div>

                <div className="flex items-center space-x-3 text-slate-600 dark:text-gray-400">
                    <BsBicycle size={18} className="text-indigo-500" />
                    <span className="text-sm">{order.rider ? `Rider: ${order.rider.name}` : 'Awaiting rider'}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2 text-slate-700 dark:text-gray-200">
                        <BsCurrencyDollar size={16} className="text-green-500" />
                        <span className="text-lg font-extrabold text-green-600">{formatFCFA(order.total_amount)}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-600 dark:text-gray-400">
                        <BsBoxSeam size={16} className="text-orange-500" />
                        <span className="text-sm truncate">{order.vendor?.business_name || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full py-2 rounded-lg font-bold flex items-center justify-center space-x-2 transition-all duration-200 bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200/40"
                >
                    <span>View Details</span>
                    <BsChevronRight size={18} />
                </button>
            </div>

            <OrderDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                orderId={order.id}
                onCancelled={onCancelled}
            />
        </div>
    );
};

export default OrderCard;
