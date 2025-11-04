// src/data/menuApprovalMocks.js

export const menuApprovalRequests = [
    {
        id: 'M001',
        vendorName: 'Gourmet Grill House',
        itemName: 'Wagyu Beef Burger',
        type: 'Price Update',
        status: 'Pending',
        submittedAt: '2025-10-24 10:30 AM',
        currentPrice: 32000,
        requestedPrice: 35500,
        category: 'Main Course',
        reason: 'Increased cost of premium imported beef.',
    },
    {
        id: 'M002',
        vendorName: 'Mama Mia Pizzeria',
        itemName: 'Vegan Pepperoni',
        type: 'New Item',
        status: 'Pending',
        submittedAt: '2025-10-24 11:45 AM',
        currentPrice: 0, // N/A
        requestedPrice: 18000,
        category: 'Pizza',
        reason: 'Responding to customer demand for plant-based options.',
    },
    {
        id: 'M003',
        vendorName: 'The Spicy Bowl',
        itemName: 'Chicken Korma',
        type: 'Item Removal',
        status: 'Rejected',
        submittedAt: '2025-10-23 09:15 AM',
        currentPrice: 10500,
        requestedPrice: 0, // N/A
        category: 'Curries',
        reason: 'Poor sales performance over the last quarter.',
        adminNotes: 'Rejected: Item has high ratings; suggested seasonal removal instead.',
    },
    {
        id: 'M004',
        vendorName: 'Fresh Juices Co.',
        itemName: 'Mango Smoothie (Large)',
        type: 'Description Change',
        status: 'Pending',
        submittedAt: '2025-10-25 08:00 AM',
        currentPrice: 4500,
        requestedPrice: 4500,
        category: 'Beverage',
        reason: 'Updating description to "Now with organic, locally sourced mangoes".',
    },
];

export const formatFCFA = (amount) => {
    // If the amount is 0 (for item removal or new item old price), display 'N/A'
    if (amount === 0) return 'N/A';
    // Use 'fr-FR' locale for thousands separators (e.g., 15 500)
    return `${amount.toLocaleString('fr-FR')} FCFA`;
};