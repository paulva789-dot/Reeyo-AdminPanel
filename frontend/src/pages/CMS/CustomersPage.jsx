// src/pages/Customers/CustomersPage.jsx

import React, { useState, useCallback } from 'react';
import { initialCustomers, customerKpis, customerOrders } from '../../data/customerMocks';
import StatCardGrid from './components/StatCardGrid';
import CustomerTable from './components/CustomerTable';
import CustomerDetails from './components/CustomerDetails';
import { Users, ArrowLeft } from 'lucide-react';

const CustomersPage = () => {
    const [customers, setCustomers] = useState(initialCustomers);
    const [selectedCustomer, setSelectedCustomer] = useState(null); // Holds the ID of the customer to view details
    
    // --- Data Handlers (Mocked Actions) ---
    
    // Find customer details and their mock orders for the details view
    const getSelectedCustomerData = useCallback(() => {
        if (!selectedCustomer) return null;
        
        const profile = customers.find(c => c.id === selectedCustomer);
        
        // In a real app, you'd fetch the actual orders for this ID
        const orders = profile.id === 'C003' ? customerOrders : []; // Only C003 has mock orders
        
        return { profile, orders };
    }, [selectedCustomer, customers]);

    // Handle blocking/suspending an account (retention action)
    const handleToggleStatus = useCallback((customerId, newStatus) => {
        setCustomers(prev => prev.map(c => 
            c.id === customerId ? { ...c, status: newStatus, tags: newStatus === 'Suspended' ? [...c.tags, 'Suspended'] : c.tags.filter(t => t !== 'Suspended') } : c
        ));
        setSelectedCustomer(null); // Go back to the list view after action
    }, []);

    // --- Conditional Rendering ---
    
    if (selectedCustomer) {
        const data = getSelectedCustomerData();
        
        if (!data.profile) {
            // Handle case where customer ID is invalid
            setSelectedCustomer(null);
            return null; 
        }

        return (
            <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
                <button 
                    onClick={() => setSelectedCustomer(null)} 
                    className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mb-6 font-semibold transition"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Customer List
                </button>
                <CustomerDetails 
                    customer={data.profile} 
                    orders={data.orders} 
                    onToggleStatus={handleToggleStatus}
                />
            </div>
        );
    }

    // --- Default View: Dashboard and List ---
    return (
        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-gray-100 mb-6 flex items-center">
                <Users size={28} className="mr-3 text-indigo-600" />
                Customer Management Dashboard
            </h1>

            {/* 1. KPI Cards */}
            <StatCardGrid kpis={customerKpis} />
            
            {/* 2. Customer List */}
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                 <CustomerTable 
                    customers={customers} 
                    onViewDetails={setSelectedCustomer} 
                />
            </div>
        </div>
    );
};

export default CustomersPage;