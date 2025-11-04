// src/pages/DeliveryZones/components/ZoneForm.jsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, AlertCircle, Palette, DollarSign, FileText } from 'lucide-react';

const PRESET_COLORS = [
  { name: 'Green', value: '#10b981' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Orange', value: '#f59e0b' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Amber', value: '#f59e0b' },
];

const ZoneForm = ({ isOpen, onClose, onSubmit, existingZone = null, mode = 'create' }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    deliveryFee: '',
    color: '#10b981',
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing zone data when editing
  useEffect(() => {
    if (existingZone && mode === 'edit') {
      setFormData({
        name: existingZone.name || '',
        description: existingZone.description || '',
        deliveryFee: existingZone.deliveryFee?.toString() || '',
        color: existingZone.color || '#10b981',
      });
    } else {
      // Reset form for new zone
      setFormData({
        name: '',
        description: '',
        deliveryFee: '',
        color: '#10b981',
      });
    }
    setErrors({});
  }, [existingZone, mode, isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Zone name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Zone name must be at least 3 characters';
    }
    
    if (!formData.deliveryFee) {
      newErrors.deliveryFee = 'Delivery fee is required';
    } else if (isNaN(formData.deliveryFee) || Number(formData.deliveryFee) < 0) {
      newErrors.deliveryFee = 'Please enter a valid amount';
    }
    
    if (!formData.color) {
      newErrors.color = 'Please select a color';
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
        ...formData,
        deliveryFee: Number(formData.deliveryFee),
      });
      
      // Reset form after successful submission
      setFormData({
        name: '',
        description: '',
        deliveryFee: '',
        color: '#10b981',
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Failed to submit zone:', error);
      setErrors({ submit: 'Failed to save zone. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {mode === 'edit' ? 'Edit Delivery Zone' : 'New Delivery Zone'}
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    {mode === 'edit' ? 'Update zone information' : 'Configure your new delivery zone'}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-180px)]">
                {/* Zone Name */}
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
                    className={`
                      w-full px-4 py-3 rounded-lg border-2 transition-all
                      bg-gray-50 dark:bg-gray-900
                      text-gray-900 dark:text-white
                      placeholder-gray-400 dark:placeholder-gray-500
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${errors.name 
                        ? 'border-red-300 dark:border-red-700' 
                        : 'border-gray-200 dark:border-gray-700'
                      }
                    `}
                  />
                  {errors.name && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
                    >
                      <AlertCircle size={14} />
                      {errors.name}
                    </motion.p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <FileText size={16} />
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Brief description of the zone"
                    rows={3}
                    className="
                      w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700
                      bg-gray-50 dark:bg-gray-900
                      text-gray-900 dark:text-white
                      placeholder-gray-400 dark:placeholder-gray-500
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                      transition-all resize-none
                    "
                  />
                </div>

                {/* Delivery Fee */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <DollarSign size={16} />
                    Delivery Fee (XAF) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.deliveryFee}
                      onChange={(e) => handleChange('deliveryFee', e.target.value)}
                      placeholder="500"
                      min="0"
                      step="50"
                      className={`
                        w-full px-4 py-3 rounded-lg border-2 transition-all
                        bg-gray-50 dark:bg-gray-900
                        text-gray-900 dark:text-white
                        placeholder-gray-400 dark:placeholder-gray-500
                        focus:outline-none focus:ring-2 focus:ring-blue-500
                        ${errors.deliveryFee 
                          ? 'border-red-300 dark:border-red-700' 
                          : 'border-gray-200 dark:border-gray-700'
                        }
                      `}
                    />
                  </div>
                  {errors.deliveryFee && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
                    >
                      <AlertCircle size={14} />
                      {errors.deliveryFee}
                    </motion.p>
                  )}
                </div>

                {/* Color Picker */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    <Palette size={16} />
                    Zone Color *
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {PRESET_COLORS.map((colorOption) => (
                      <button
                        key={colorOption.value}
                        type="button"
                        onClick={() => handleChange('color', colorOption.value)}
                        className={`
                          relative w-full aspect-square rounded-lg transition-all
                          hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                          ${formData.color === colorOption.value ? 'ring-4 ring-blue-500 scale-110' : ''}
                        `}
                        style={{ backgroundColor: colorOption.value }}
                        title={colorOption.name}
                      >
                        {formData.color === colorOption.value && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 bg-gray-900 rounded-full"></div>
                            </div>
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Error */}
                {errors.submit && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                  >
                    <p className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                      <AlertCircle size={16} />
                      {errors.submit}
                    </p>
                  </motion.div>
                )}
              </form>

              {/* Footer Actions */}
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

