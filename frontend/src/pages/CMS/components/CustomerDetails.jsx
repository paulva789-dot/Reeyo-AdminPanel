// src/components/Customers/CustomerDetails.jsx

import React, { useState } from 'react';
import { 
    DollarSign, 
    Truck, 
    MessageCircle, 
    User, 
    AlertTriangle, 
    Lock, 
    CheckCircle,
    Tag,
    Clock
} from 'lucide-react';

// Helper function to format currency
const formatCurrency = (value) => `${value.toLocaleString('en-US')} FCFA`;

// Helper function to get Churn Risk style (copied from CustomerTable)
const getRiskTag = (risk) => {
    const commonClasses = "px-3 py-1 text-sm font-medium rounded-full flex items-center w-max";
    switch (risk) {
        case 'High':
            return <span className={`${commonClasses} bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300`}><AlertTriangle size={16} className="mr-1" />HIGH RISK</span>;
        case 'Medium':
            return <span className={`${commonClasses} bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300`}>MEDIUM RISK</span>;
        case 'Low':
        case 'Very Low':
            return <span className={`${commonClasses} bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300`}><CheckCircle size={16} className="mr-1" />LOW RISK</span>;
        default:
            return <span className={`${commonClasses} bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300`}>{risk}</span>;
    }
};

const CustomerDetails = ({ customer, orders, onToggleStatus }) => {
    const [isActionLoading, setIsActionLoading] = useState(false);

    const isSuspended = customer.status === 'Suspended';

    // Simulated action for demonstration
    const handleAdminAction = async (actionType) => {
        if (actionType === 'toggleStatus') {
            const newStatus = isSuspended ? 'Active' : 'Suspended';
            
            if (!window.confirm(`Are you sure you want to ${newStatus} this account?`)) {
                return;
            }

            setIsActionLoading(true);
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000)); 
            
            // Call the parent handler
            onToggleStatus(customer.id, newStatus); 
            setIsActionLoading(false);
            console.log(`User ${customer.id} status changed to ${newStatus}`);
        }
        // Other actions (Issue Credit, Send Promo) would go here
    };

    // Card component for a quick metric
    const MetricCard = ({ icon: Icon, title, value, colorClass }) => (
        <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Icon size={24} className={`mr-4 ${colorClass}`} />
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-xl font-bold text-slate-800 dark:text-gray-100">{value}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Header: Name and Status */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between border-b pb-4 mb-4 dark:border-gray-700">
                    <div className="flex items-center">
                        <User size={36} className="mr-4 text-indigo-600 dark:text-indigo-400" />
                        <div>
                            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-gray-100">{customer.name}</h2>
                            <p className="text-md text-gray-500 dark:text-gray-400">{customer.email} | {customer.phone}</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                        {getRiskTag(customer.churnRisk)}
                        <span className={`text-sm font-semibold ${isSuspended ? 'text-red-500' : 'text-green-500'}`}>
                            {isSuspended ? 'Account Suspended' : 'Account Active'}
                        </span>
                    </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap items-center text-sm text-gray-600 dark:text-gray-300">
                    <p className="font-semibold mr-2">Tags:</p>
                    {customer.tags.map(tag => (
                        <span key={tag} className="flex items-center px-3 py-1 bg-indigo-50 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-200 rounded-full mr-2 mb-1">
                            <Tag size={12} className="mr-1" />{tag}
                        </span>
                    ))}
                    <span className="flex items-center px-3 py-1 text-gray-500 dark:text-gray-400 text-xs">
                        <Clock size={12} className="mr-1" />
                        Signed up: {customer.signupDate}
                    </span>
                </div>
            </div>

            {/* Section 1: Retention Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard 
                    icon={DollarSign} 
                    title="Lifetime Value (LTV)" 
                    value={formatCurrency(customer.lifetimeValue)} 
                    colorClass="text-green-600"
                />
                <MetricCard 
                    icon={Truck} 
                    title="Orders Completed" 
                    value={customer.ordersCompleted} 
                    colorClass="text-blue-600"
                />
                <MetricCard 
                    icon={MessageCircle} 
                    title="Support Tickets" 
                    value={customer.supportTickets} 
                    colorClass="text-yellow-600"
                />
                <MetricCard 
                    icon={Clock} 
                    title="Last Activity" 
                    value={customer.lastOrderDate} 
                    colorClass="text-gray-600"
                />
            </div>

            {/* Section 2: Administrative Actions (Keep or Reject) */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-gray-100 mb-4 border-b pb-2 dark:border-gray-700">
                    Retention & Account Control
                </h3>
                <div className="flex flex-wrap gap-4">
                    
                    {/* Action 1: Toggle Status (Reject/Allow) */}
                    <button
                        onClick={() => handleAdminAction('toggleStatus')}
                        disabled={isActionLoading}
                        className={`flex items-center px-4 py-2 rounded-lg font-semibold transition text-white ${
                            isSuspended 
                                ? 'bg-green-600 hover:bg-green-700' 
                                : 'bg-red-600 hover:bg-red-700'
                        } disabled:opacity-50`}
                    >
                        <Lock size={18} className="mr-2" />
                        {isActionLoading ? 'Processing...' : (isSuspended ? 'Activate Account' : 'Suspend Account')}
                    </button>

                    {/* Action 2: Retention Effort (Keep) */}
                    <button
                        onClick={() => alert(`Sending a custom 10% OFF promo to ${customer.name}`)}
                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
                    >
                        <DollarSign size={18} className="mr-2" />
                        Issue Retention Credit (5,000 FCFA)
                    </button>

                    {/* Action 3: Support */}
                    <button
                        onClick={() => alert(`Redirecting to New Ticket form for ${customer.name}`)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                    >
                        <MessageCircle size={18} className="mr-2" />
                        Log Support Inquiry
                    </button>
                </div>
            </div>

            {/* Section 3: Order History */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-gray-100 mb-4 border-b pb-2 dark:border-gray-700">
                    Recent Order History ({orders.length})
                </h3>
                
                {orders.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    {['ID', 'Vendor', 'Amount', 'Date', 'Status'].map(header => (
                                        <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{header}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {orders.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600 dark:text-indigo-400">{order.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{order.vendor}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(order.amount)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{order.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${order.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 py-4">No recent orders found for this customer.</p>
                )}
            </div>
        </div>
    );
};

export default CustomerDetails;

