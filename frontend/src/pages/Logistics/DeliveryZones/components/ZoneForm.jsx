// src/pages/Logistics/DeliveryZones/components/ZoneForm.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, AlertCircle, DollarSign, FileText, Globe } from 'lucide-react';

const ZoneForm = ({ isOpen, onClose, onSubmit, existingZone = null, mode = 'create' }) => {
  const [formData, setFormData] = useState({
    name: '',
    country_code: '',
    delivery_fee_override: '',
    is_active: true,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingZone && mode === 'edit') {
      setFormData({
        name: existingZone.name || '',
        country_code: existingZone.country_code || '',
        delivery_fee_override: existingZone.delivery_fee_override?.toString() || '',
        is_active: existingZone.is_active ?? true,
      });
    } else {
      setFormData({ name: '', country_code: '', delivery_fee_override: '', is_active: true });
    }
    setErrors({});
  }, [existingZone, mode, isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Zone name is required';
    if (!formData.country_code.trim()) newErrors.country_code = 'Country code is required';
    if (formData.delivery_fee_override && (isNaN(formData.delivery_fee_override) || Number(formData.delivery_fee_override) < 0)) {
      newErrors.delivery_fee_override = 'Please enter a valid amount';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: formData.name,
        country_code: formData.country_code.toUpperCase(),
        delivery_fee_override: formData.delivery_fee_override ? Number(formData.delivery_fee_override) : null,
        is_active: formData.is_active,
      });
      onClose();
    } catch (error) {
      setErrors({ submit: error?.message || 'Failed to save zone. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {mode === 'edit' ? 'Edit Delivery Zone' : 'New Delivery Zone'}
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    {mode === 'edit' ? 'Update zone information' : 'Configure your new delivery zone'}
                  </p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-180px)]">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <FileText size={16} />
                    Zone Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g., Akwa Downtown"
                    className={`w-full px-4 py-3 rounded-lg border-2 transition-all bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'}`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <Globe size={16} />
                    Country Code *
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={formData.country_code}
                    onChange={(e) => handleChange('country_code', e.target.value.toUpperCase())}
                    placeholder="CM"
                    className={`w-full px-4 py-3 rounded-lg border-2 uppercase transition-all bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.country_code ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'}`}
                  />
                  {errors.country_code && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.country_code}
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <DollarSign size={16} />
                    Delivery Fee Override (XAF, optional)
                  </label>
                  <input
                    type="number"
                    value={formData.delivery_fee_override}
                    onChange={(e) => handleChange('delivery_fee_override', e.target.value)}
                    placeholder="Leave blank to use platform default"
                    min="0"
                    step="50"
                    className={`w-full px-4 py-3 rounded-lg border-2 transition-all bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.delivery_fee_override ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'}`}
                  />
                  {errors.delivery_fee_override && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.delivery_fee_override}
                    </p>
                  )}
                </div>

                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.is_active} onChange={(e) => handleChange('is_active', e.target.checked)} className="w-4 h-4" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Active</span>
                </label>

                {errors.submit && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                      <AlertCircle size={16} /> {errors.submit}
                    </p>
                  </div>
                )}
              </form>

              <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 rounded-lg font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      {mode === 'edit' ? 'Update Zone' : 'Create Zone'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ZoneForm;
