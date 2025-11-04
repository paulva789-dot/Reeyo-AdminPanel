// pages/Orders/components/OrderCard.jsx

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Use react-icons/bs and react-icons/ai for icons
import { FaMapMarkerAlt } from 'react-icons/fa';
import { BsX, BsBoxSeam, BsPerson, BsBicycle, BsCurrencyDollar, BsClock, BsCalendar, BsCheckCircle, BsGeoAlt } from 'react-icons/bs';
import { AiOutlineShop } from 'react-icons/ai';
// Helper function for FCFA formatting
const formatFCFA = (amount) => {
    // Use 'fr-FR' locale for thousands separators (e.g., 15 500)
    return `${amount.toLocaleString('fr-FR')} FCFA`;
};

// Extended Mock Data for the Modal (simulate fetching full details) - **UPDATED FCFA VALUES**
const mockDetailedOrder = {
    id: '#003C',
    status: 'In Transit',
    customer: 'Bob Johnson',
    driver: 'Mike T.',
    total: 25950,
    items: [
        { name: 'Double Cheese Burger', quantity: 2, price: 7300 }, // Individual item price FCFA
        { name: 'Large Fries', quantity: 1, price: 2750 },
        { name: 'Soda (Coke)', quantity: 3, price: 1600 },
    ],
    restaurant: 'Gourmet Grill House',
    pickupAddress: '123 Main St, Central Kitchen, City A',
    deliveryAddress: '456 Oak Ave, Apt 10B, Suburb B',
    placedAt: '2025-10-25 10:45 AM',
    estimatedDelivery: '2025-10-25 11:30 AM',
    notes: 'Please ring twice. Delivery to the back gate.',
    paymentMethod: 'Credit Card (Visa)',
};

// Function to merge basic data with mock detailed data
const getCompleteDetails = (basicOrder) => ({
    ...basicOrder,
    // Add all the complex data points that OrderCard didn't have:
    restaurant: 'Gourmet Grill House',
    pickupAddress: '123 Main St, Central Kitchen, City A',
    deliveryAddress: '456 Oak Ave, Apt 10B, Suburb B',
    placedAt: '2025-10-25 10:45 AM',
    estimatedDelivery: '2025-10-25 11:30 AM',
    notes: 'Please ring twice. Delivery to the back gate.',
    paymentMethod: 'Credit Card (Visa)',
    items: [ // Detailed items list (using basic order's item count and FCFA prices)
        { name: 'Double Cheese Burger', quantity: 2, price: 7300 },
        { name: 'Large Fries', quantity: 1, price: 2750 },
        { name: 'Soda (Coke)', quantity: 3, price: 1600 },
    ].slice(0, basicOrder.items || 1), // Only show as many items as the basic card indicated
});


const DetailRow = ({ icon: Icon, label, value, colorClass = 'text-slate-700 dark:text-gray-200' }) => (
    <div className="flex items-start space-x-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
        <Icon size={18} className={`shrink-0 mt-0.5 ${colorClass}`} />
        <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">{label}</span>
            <span className={`text-sm ${colorClass} font-medium leading-tight`}>{value}</span>
        </div>
    </div>
);


const OrderDetailsModal = ({ isOpen, onClose, order }) => {
    
    const detailedOrder = getCompleteDetails(order); 

    const getStatusColor = (status) => {
        switch (status) {
            case 'In Transit': return 'text-indigo-600';
            case 'Delivered': return 'text-green-500';
            case 'Cancelled': return 'text-red-500';
            case 'Pending': 
            default: return 'text-yellow-500';
        }
    };

    if (!order) return null; 

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
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transition-colors duration-300"
                        initial={{ y: 50, scale: 0.9 }}
                        animate={{ y: 0, scale: 1 }}
                        exit={{ y: 50, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 z-10">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-gray-100">
                                Order Details <span className="font-mono text-indigo-500">{detailedOrder.id}</span>
                            </h2>
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
                                <BsX size={24} />
                            </button>
                        </div>

                        {/* Modal Content - Responsive Grid */}
                        <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Column 1: Core Details (2/3 width on large screens) */}
                            <div className="lg:col-span-2 space-y-6">
                                
                                {/* Status & Timeline */}
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                                    <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-gray-100">Status & Timing</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <DetailRow icon={BsCheckCircle} label="Current Status" value={detailedOrder.status} colorClass={getStatusColor(detailedOrder.status)} />
                                        <DetailRow icon={BsClock} label="Time Placed" value={new Date(detailedOrder.placedAt).toLocaleTimeString()} />
                                        <DetailRow icon={BsCalendar} label="Date" value={new Date(detailedOrder.placedAt).toLocaleDateString()} />
                                        <DetailRow icon={BsClock} label="Est. Delivery" value={detailedOrder.estimatedDelivery} />
                                    </div>
                                </div>

                                {/* Address Section */}
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                                    <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-gray-100">Location Details</h3>
                                    {/* Using AiOutlineShop as a Utensils/Restaurant icon alternative */}
                                    <DetailRow icon={AiOutlineShop} label="Restaurant" value={detailedOrder.restaurant} colorClass="text-orange-500" />
                                    <DetailRow icon={BsGeoAlt} label="Pickup Address" value={detailedOrder.pickupAddress} colorClass="text-slate-800 dark:text-gray-200" />
                                    <DetailRow icon={BsGeoAlt} label="Delivery Address" value={detailedOrder.deliveryAddress} colorClass="text-indigo-500" />
                                </div>
                                
                                {/* Notes */}
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                                    <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-gray-100">Special Notes</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 italic">{detailedOrder.notes || "No special instructions provided."}</p>
                                </div>

                            </div>

                            {/* Column 2: Order Summary (1/3 width on large screens) */}
                            <div className="lg:col-span-1 space-y-6">
                                
                                {/* Financial & People Summary */}
                                <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/50 shadow-inner">
                                    <h3 className="text-lg font-semibold mb-3 text-indigo-600 dark:text-indigo-300">Summary</h3>
                                    <DetailRow icon={BsPerson} label="Customer" value={detailedOrder.customer} />
                                    <DetailRow icon={BsBicycle} label="Driver" value={detailedOrder.driver} />
                                    <DetailRow icon={BsCurrencyDollar} label="Payment" value={detailedOrder.paymentMethod} />
                                    <DetailRow 
                                        icon={BsCurrencyDollar} 
                                        label="Order Total" 
                                        // **FIXED** to display FCFA
                                        value={formatFCFA(detailedOrder.total)} 
                                        colorClass="text-green-600 dark:text-green-400 font-bold text-base"
                                    />
                                </div>

                                {/* Item List */}
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                                    <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-gray-100 flex items-center space-x-2">
                                        <BsBoxSeam size={20} />
                                        <span>Order Items ({detailedOrder.items.length})</span>
                                    </h3>
                                    <ul className="space-y-2">
                                        {detailedOrder.items.map((item, index) => (
                                            <li key={index} className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                                                <span className="font-medium">{item.quantity}x {item.name}</span>
                                                {/* **FIXED** to display FCFA for item price */}
                                                <span className="font-semibold text-gray-900 dark:text-white">{formatFCFA(item.price)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer (Action Buttons) */}
                        <div className="sticky bottom-0 p-5 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-end space-x-3">
                             <button
                                onClick={onClose}
                                className="px-5 py-2 rounded-lg text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
                            >
                                Dispatch Order
                            </button>
                        </div>

                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default OrderDetailsModal;
