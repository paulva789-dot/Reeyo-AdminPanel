// src/pages/Finance/components/SettlementManagement.jsx
import React, { useState } from 'react';
import { DollarSign, Truck, Users, Calendar, CheckCircle, Clock, X } from 'lucide-react';

const MOCK_SETTLEMENTS = [
  {
    id: 's1',
    type: 'Vendor',
    name: 'Chez Pierre Bistro',
    amount: 125000,
    status: 'Completed',
    date: '2024-10-15',
    orders: 45,
  },
  {
    id: 's2',
    type: 'Rider',
    name: 'Alice Kameni',
    amount: 45000,
    status: 'Pending',
    date: '2024-10-16',
    orders: 32,
  },
];

const SettlementManagement = () => {
  const [settlements] = useState(MOCK_SETTLEMENTS);
  const [activeTab, setActiveTab] = useState('vendors');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredSettlements = settlements.filter(s => 
    activeTab === 'vendors' ? s.type === 'Vendor' : s.type === 'Rider'
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 mb-4">Settlements & Payouts</h2>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('vendors')}
          className={`flex-1 px-3 py-2 text-sm rounded-lg ${
            activeTab === 'vendors' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Vendors
        </button>
        <button
          onClick={() => setActiveTab('riders')}
          className={`flex-1 px-3 py-2 text-sm rounded-lg ${
            activeTab === 'riders' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Riders
        </button>
      </div>

      <div className="space-y-3">
        {filteredSettlements.map((settlement) => (
          <div key={settlement.id} className="p-3 border rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium">{settlement.name}</p>
                <p className="text-xs text-gray-500">{settlement.orders} orders</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                settlement.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {settlement.status}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-green-600">{formatCurrency(settlement.amount)}</span>
              <button className="px-3 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200">
                {settlement.status === 'Pending' ? 'Process' : 'View'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="font-bold text-xl">2,876</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Net Revenue</p>
            <p className="font-bold text-xl text-green-600">{formatCurrency(845000)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettlementManagement;