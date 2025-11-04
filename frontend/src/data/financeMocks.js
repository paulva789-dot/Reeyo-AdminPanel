// src/data/financeMocks.js

export const initialFinanceData = {
    kpis: [
        { 
            id: 1, 
            title: "Gross Revenue", 
            value: 1450000, 
            unit: 'FCFA', 
            change: '+12.5%', 
            icon: '💸', 
            color: 'text-green-500' 
        },
        { 
            id: 2, 
            title: "Platform Commission", 
            value: 290000, 
            unit: 'FCFA', 
            change: '+8.2%', 
            icon: '💰', 
            color: 'text-indigo-500' 
        },
        { 
            id: 3, 
            title: "Total Payouts", 
            value: 1015000, 
            unit: 'FCFA', 
            change: '-3.1%', 
            icon: '🏦', 
            color: 'text-red-500' 
        },
        { 
            id: 4, 
            title: "Net Profit", 
            value: 435000, 
            unit: 'FCFA', 
            change: '+15.0%', 
            icon: '📈', 
            color: 'text-blue-500' 
        },
    ],
    
    monthlyRevenue: [
        { name: 'Jan', revenue: 40000, commission: 8000 },
        { name: 'Feb', revenue: 45000, commission: 9000 },
        { name: 'Mar', revenue: 60000, commission: 12000 },
        { name: 'Apr', revenue: 75000, commission: 15000 },
        { name: 'May', revenue: 90000, commission: 18000 },
        { name: 'Jun', revenue: 110000, commission: 22000 },
        { name: 'Jul', revenue: 130000, commission: 26000 },
        { name: 'Aug', revenue: 150000, commission: 30000 },
        { name: 'Sep', revenue: 160000, commission: 32000 },
        { name: 'Oct', revenue: 180000, commission: 36000 },
        { name: 'Nov', revenue: 190000, commission: 38000 },
        { name: 'Dec', revenue: 200000, commission: 40000 },
    ],

    transactions: [
        { id: '#T001', type: 'Order', amount: 8500, status: 'Completed', date: '2025-10-25', vendor: 'Mama Koko Grill' },
        { id: '#T002', type: 'Payout', amount: -6800, status: 'Pending', date: '2025-10-24', vendor: 'Le Fast Food' },
        { id: '#T003', type: 'Refund', amount: -2000, status: 'Completed', date: '2025-10-24', vendor: 'Customer' },
        { id: '#T004', type: 'Order', amount: 12000, status: 'Completed', date: '2025-10-23', vendor: 'The Coffee Spot' },
        { id: '#T005', type: 'Payout', amount: -9600, status: 'Completed', date: '2025-10-22', vendor: 'Vendor A' },
    ]
};