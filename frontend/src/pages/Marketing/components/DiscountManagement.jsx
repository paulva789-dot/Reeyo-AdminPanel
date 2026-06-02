// src/pages/Marketing/components/DiscountManagement.jsx
import React, { useState, useCallback } from 'react';
import { Tag, Plus, X, Edit, Trash2, Percent, ShoppingBag, Store, Package, Truck, Users } from 'lucide-react';

const DISCOUNT_TYPES = ['Percentage', 'Fixed Amount', 'Free Delivery'];
const ENTITY_TYPES = ['All', 'Food Vendors', 'Shop Vendors', 'Specific Vendors', 'Riders'];

const mockDiscounts = [
  {
    id: 'd1',
    title: 'Summer Sale - All Stores',
    type: 'Percentage',
    value: 15,
    entity_type: 'All',
    startDate: '2024-06-01',
    endDate: '2024-08-31',
    status: 'Active',
    uses: 452,
  },
  {
    id: 'd2',
    title: 'Free Delivery - Chez Pierre',
    type: 'Free Delivery',
    value: 0,
    entity_type: 'Specific Vendors',
    vendors: ['v1'],
    startDate: '2024-06-10',
    endDate: '2024-06-20',
    status: 'Active',
    uses: 89,
  },
];

const DiscountManagement = () => {
  const [discounts, setDiscounts] = useState(mockDiscounts);
  const [showForm, setShowForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'Percentage',
    value: '',
    entity_type: 'All',
    vendors: [],
    startDate: '',
    endDate: '',
  });

  const handleCreateNew = () => {
    setEditingDiscount(null);
    setFormData({
      title: '',
      type: 'Percentage',
      value: '',
      entity_type: 'All',
      vendors: [],
      startDate: '',
      endDate: '',
    });
    setShowForm(true);
  };

  const handleEdit = (discount) => {
    setEditingDiscount(discount);
    setFormData({
      title: discount.title,
      type: discount.type,
      value: discount.value,
      entity_type: discount.entity_type,
      vendors: discount.vendors || [],
      startDate: discount.startDate,
      endDate: discount.endDate,
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setDiscounts(prev => prev.filter(d => d.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newDiscount = {
      id: editingDiscount ? editingDiscount.id : `d${Date.now()}`,
      ...formData,
      status: 'Scheduled',
      uses: 0,
    };
    
    if (editingDiscount) {
      setDiscounts(prev => prev.map(d => d.id === editingDiscount.id ? newDiscount : d));
    } else {
      setDiscounts(prev => [newDiscount, ...prev]);
    }
    setShowForm(false);
  };

  return (
    <div>
      {!showForm ? (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={handleCreateNew}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus size={18} className="mr-2" />
              Create New Discount
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg shadow">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Applies To</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Period</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Uses</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {discounts.map((discount) => (
                  <tr key={discount.id}>
                    <td className="px-4 py-3 font-medium">{discount.title}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        discount.type === 'Free Delivery' ? 'bg-blue-100 text-blue-800' :
                        discount.type === 'Percentage' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {discount.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {discount.type === 'Percentage' ? `${discount.value}%` :
                       discount.type === 'Fixed Amount' ? `XAF ${discount.value}` : '-'}
                    </td>
                    <td className="px-4 py-3">{discount.entity_type}</td>
                    <td className="px-4 py-3 text-sm">
                      {discount.startDate} - {discount.endDate}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        discount.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {discount.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{discount.uses}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(discount)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(discount.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg p-6 shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {editingDiscount ? 'Edit Discount' : 'Create New Discount'}
            </h2>
            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Discount Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., Summer Sale 2024"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Discount Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {DISCOUNT_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  {formData.type === 'Percentage' ? 'Percentage (%)' :
                   formData.type === 'Fixed Amount' ? 'Fixed Amount (XAF)' : 'N/A'}
                </label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({...formData, value: e.target.value})}
                  disabled={formData.type === 'Free Delivery'}
                  className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-100"
                  placeholder={formData.type === 'Percentage' ? '15' : '1000'}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Applies To</label>
              <select
                value={formData.entity_type}
                onChange={(e) => setFormData({...formData, entity_type: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {ENTITY_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
                {editingDiscount ? 'Update' : 'Create'} Discount
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DiscountManagement;