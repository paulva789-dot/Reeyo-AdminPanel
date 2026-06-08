// src/pages/Marketing/components/BannerManagement.jsx
import React, { useState, useCallback } from 'react';
import { Image as ImageIcon, Plus, X, Edit, Trash2, Globe, MapPin, Upload } from 'lucide-react';

const BANNER_TYPES = [
  { value: 'image', label: 'Image (JPG/PNG)' },
  { value: 'gif', label: 'Animated GIF' },
];

const mockBanners = [
  {
    id: 'b1',
    title: 'Summer Promotion',
    type: 'image',
    zone: 'All Zones',
    imageUrl: 'https://via.placeholder.com/600x200?text=Summer+Promotion',
    startDate: '2024-06-01',
    endDate: '2024-08-31',
    status: 'Active',
    clicks: 1245,
  },
  {
    id: 'b2',
    title: 'Douala Special',
    type: 'gif',
    zone: 'Akwa Downtown',
    imageUrl: 'https://via.placeholder.com/600x200?text=Douala+Special',
    startDate: '2024-06-15',
    endDate: '2024-06-30',
    status: 'Scheduled',
    clicks: 0,
  },
];

const BannerManagement = () => {
  const [banners, setBanners] = useState(mockBanners);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'image',
    zone: 'All Zones',
    startDate: '',
    endDate: '',
    imageFile: null,
  });

  const handleCreateNew = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      type: 'image',
      zone: 'All Zones',
      startDate: '',
      endDate: '',
      imageFile: null,
    });
    setShowForm(true);
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      type: banner.type,
      zone: banner.zone,
      startDate: banner.startDate,
      endDate: banner.endDate,
      imageFile: null,
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setBanners(prev => prev.filter(b => b.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingBanner) {
      setBanners(prev => prev.map(b => 
        b.id === editingBanner.id ? { ...b, ...formData } : b
      ));
    } else {
      setBanners(prev => [{
        id: `b${Date.now()}`,
        ...formData,
        status: 'Scheduled',
        clicks: 0,
      }, ...prev]);
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
              Create New Banner
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((banner) => (
              <div key={banner.id} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                <img src={banner.imageUrl} alt={banner.title} className="w-full h-40 object-cover" />
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{banner.title}</h3>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                    <span>{banner.type === 'gif' ? 'GIF' : 'Image'}</span>
                    <span>•</span>
                    <span>{banner.zone}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      banner.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {banner.status}
                    </span>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button onClick={() => handleEdit(banner)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(banner.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg p-6 shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {editingBanner ? 'Edit Banner' : 'Create New Banner'}
            </h2>
            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Banner Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter banner title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Banner Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {BANNER_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Display Zone</label>
              <select
                value={formData.zone}
                onChange={(e) => setFormData({...formData, zone: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="All Zones">All Zones</option>
                <option value="Akwa Downtown">Akwa Downtown</option>
                <option value="Bonanjo">Bonanjo</option>
                <option value="Bonaberi">Bonaberi</option>
                <option value="Bepanda">Bepanda</option>
                <option value="Buea Town">Buea Town</option>
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

            <div>
              <label className="block text-sm font-medium mb-2">Upload Banner</label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <ImageIcon size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">Click to upload or drag image here</p>
                <input type="file" accept="image/*" className="hidden" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
                {editingBanner ? 'Update' : 'Create'} Banner
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default BannerManagement;