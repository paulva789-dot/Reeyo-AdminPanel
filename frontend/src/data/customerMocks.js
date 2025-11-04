// src/data/customerMocks.js

/**
 * Helper function to format currency for consistency
 * @param {number} value 
 */
const formatCurrency = (value) => {
    return `${value.toLocaleString('en-US')} FCFA`;
};

// --- Mock Data: Core Customer Profiles ---
export const initialCustomers = [
    {
        id: 'C001',
        name: 'Nathalie Eko',
        email: 'nathalie.eko@example.com',
        phone: '+237 677 123 456',
        signupDate: '2024-01-15',
        status: 'Active',
        lifetimeValue: 85000,
        ordersCompleted: 28,
        lastOrderDate: '2025-10-20',
        churnRisk: 'Low',
        supportTickets: 1, // Low support history
        tags: ['VIP', 'High Spender'],
    },
    {
        id: 'C002',
        name: 'Junior Manga',
        email: 'junior.manga@test.com',
        phone: '+237 699 987 654',
        signupDate: '2025-05-01',
        status: 'Active',
        lifetimeValue: 12000,
        ordersCompleted: 3,
        lastOrderDate: '2025-09-10',
        churnRisk: 'Medium', // Low order frequency recently
        supportTickets: 0,
        tags: ['New User'],
    },
    {
        id: 'C003',
        name: 'Musa Abubakar',
        email: 'musa.abu@web.net',
        phone: '+237 680 555 111',
        signupDate: '2023-11-20',
        status: 'Active',
        lifetimeValue: 250000,
        ordersCompleted: 65,
        lastOrderDate: '2025-10-25',
        churnRisk: 'Very Low',
        supportTickets: 5, // Active user but required support often
        tags: ['Power User', 'Frequent Buyer'],
    },
    {
        id: 'C004',
        name: 'Sophie Lontou',
        email: 'sophie.lontou@mail.cm',
        phone: '+237 650 444 333',
        signupDate: '2025-08-10',
        status: 'Suspended', // Needs admin review
        lifetimeValue: 4500,
        ordersCompleted: 2,
        lastOrderDate: '2025-08-15',
        churnRisk: 'High', // Suspended account
        supportTickets: 3, // High support tickets relative to orders
        tags: ['Fraud Risk', 'Review Needed'],
    },
    {
        id: 'C005',
        name: 'Emilia Tiku',
        email: 'emilia.tiku@work.net',
        phone: '+237 670 100 200',
        signupDate: '2024-06-22',
        status: 'Inactive',
        lifetimeValue: 35000,
        ordersCompleted: 10,
        lastOrderDate: '2025-06-01',
        churnRisk: 'High', // Hasn't ordered in months
        supportTickets: 2,
        tags: ['Lapsed User', 'Re-engage'],
    },
];

// --- Mock Data: Overall CMS KPIs ---
export const customerKpis = [
    { 
        id: 1, 
        title: "Total Users", 
        value: 5432, 
        change: '+4.5%', 
        icon: '👥', 
        color: 'text-indigo-500' 
    },
    { 
        id: 2, 
        title: "New Signups (30 Days)", 
        value: 350, 
        change: '+15.2%', 
        icon: '🚀', 
        color: 'text-green-500' 
    },
    { 
        id: 3, 
        title: "Accounts Suspended", 
        value: 12, 
        change: '0%', 
        icon: '⚠️', 
        color: 'text-red-500' 
    },
    { 
        id: 4, 
        title: "Avg. Lifetime Value", 
        value: 45000, 
        isCurrency: true,
        change: '+2.1%', 
        icon: '💰', 
        color: 'text-yellow-500' 
    },
];

// --- Mock Data: Detailed Order History for a single customer ---
export const customerOrders = [
    { id: '#O1024', vendor: 'Le Fast Food', amount: 3500, date: '2025-10-25', status: 'Completed' },
    { id: '#O1011', vendor: 'Mama Koko Grill', amount: 4200, date: '2025-10-18', status: 'Completed' },
    { id: '#O0980', vendor: 'The Coffee Spot', amount: 2500, date: '2025-10-01', status: 'Completed' },
    { id: '#O0905', vendor: 'Fresh Groceries', amount: 15000, date: '2025-09-15', status: 'Refunded' },
];