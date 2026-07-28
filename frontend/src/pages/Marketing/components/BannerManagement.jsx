// src/pages/Marketing/components/BannerManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Image as ImageIcon, Plus, X, Edit, Trash2, RefreshCw } from 'lucide-react';
import { apiClient, ApiError } from '../../../services/apiClient';
import ImageUploadField from '../../../components/ImageUploadField';

const DEFAULT_FORM = {
  slot: 'PRIMARY',
  country_code: '',
  title: '',
  subtitle: '',
  image_url: '',
  link: '',
  link_type: 'SCREEN',
  bg_color: '#39CB69',
  text_color: '#FFFFFF',
  sort_order: 0,
  is_active: true,
  expires_at: '',
};

function bannerStatus(banner) {
  if (!banner.is_active) return { label: 'Inactive', classes: 'bg-gray-100 text-gray-700' };
  if (banner.expires_at && new Date(banner.expires_at) < new Date()) return { label: 'Expired', classes: 'bg-red-100 text-red-800' };
  if (banner.starts_at && new Date(banner.starts_at) > new Date()) return { label: 'Scheduled', classes: 'bg-yellow-100 text-yellow-800' };
  return { label: 'Active', classes: 'bg-green-100 text-green-800' };
}

const BannerManagement = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/engagement/banners');
      setBanners(res.data || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load banners.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleCreateNew = () => {
    setEditingBanner(null);
    setFormData(DEFAULT_FORM);
    setShowForm(true);
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      slot: banner.slot,
      country_code: banner.country_code || '',
      title: banner.title,
      subtitle: banner.subtitle || '',
      image_url: banner.image_url || '',
      link: banner.link || '',
      link_type: banner.link_type || 'SCREEN',
      bg_color: banner.bg_color || '#39CB69',
      text_color: banner.text_color || '#FFFFFF',
      sort_order: banner.sort_order || 0,
      is_active: banner.is_active,
      expires_at: banner.expires_at ? banner.expires_at.slice(0, 10) : '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    setError('');
    try {
      await apiClient.delete(`/engagement/banners/${id}`);
      setBanners((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete banner.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const payload = {
      ...formData,
      country_code: formData.country_code || undefined,
      expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : undefined,
    };
    try {
      if (editingBanner) {
        const res = await apiClient.patch(`/engagement/banners/${editingBanner.id}`, payload);
        setBanners((prev) => prev.map((b) => (b.id === editingBanner.id ? res.data : b)));
      } else {
        const res = await apiClient.post('/engagement/banners', payload);
        setBanners((prev) => [res.data, ...prev]);
      }
      setShowForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save banner.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {!showForm ? (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={handleCreateNew} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
              <Plus size={18} className="mr-2" />
              Create New Banner
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16"><RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {banners.map((banner) => {
                const status = bannerStatus(banner);
                return (
                  <div key={banner.id} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                    {banner.image_url ? (
                      <img src={banner.image_url} alt={banner.title} className="w-full h-40 object-cover" />
                    ) : (
                      <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                        <ImageIcon size={32} className="text-gray-400" />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg">{banner.title}</h3>
                      {banner.subtitle && <p className="text-sm text-gray-500 mt-1">{banner.subtitle}</p>}
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                        <span>{banner.slot}</span>
                        <span>&middot;</span>
                        <span>{banner.country_code || 'All countries'}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-1 rounded text-xs ${status.classes}`}>{status.label}</span>
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
                );
              })}
              {banners.length === 0 && <p className="col-span-full text-center text-gray-500 py-12">No banners yet.</p>}
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg p-6 shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{editingBanner ? 'Edit Banner' : 'Create New Banner'}</h2>
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
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Order 2, get 1 free"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Subtitle</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Slot</label>
                <input
                  type="text"
                  value={formData.slot}
                  onChange={(e) => setFormData({ ...formData, slot: e.target.value })}
                  placeholder="PRIMARY"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Country (optional, ISO-2)</label>
                <input
                  type="text"
                  maxLength={2}
                  value={formData.country_code}
                  onChange={(e) => setFormData({ ...formData, country_code: e.target.value.toUpperCase() })}
                  placeholder="CM"
                  className="w-full px-3 py-2 border rounded-lg uppercase"
                />
              </div>
            </div>

            <ImageUploadField
              label="Banner Image"
              value={formData.image_url}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Link</label>
                <input
                  type="text"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="reeyo://promotions/..."
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Link Type</label>
                <select
                  value={formData.link_type}
                  onChange={(e) => setFormData({ ...formData, link_type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="SCREEN">Screen</option>
                  <option value="PROMOTION">Promotion</option>
                  <option value="EXTERNAL">External</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Background</label>
                <input type="color" value={formData.bg_color} onChange={(e) => setFormData({ ...formData, bg_color: e.target.value })} className="w-full h-10 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Text Color</label>
                <input type="color" value={formData.text_color} onChange={(e) => setFormData({ ...formData, text_color: e.target.value })} className="w-full h-10 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Sort Order</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium mb-2">Expires At (optional)</label>
                <input
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <label className="flex items-center gap-2 pb-2">
                <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
                <span className="text-sm font-medium">Active</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">
                {submitting ? 'Saving...' : `${editingBanner ? 'Update' : 'Create'} Banner`}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default BannerManagement;
