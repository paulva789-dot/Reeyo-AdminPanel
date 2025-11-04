// src/pages/DeliveryZones/DeliveryZones.jsx

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Layers, Settings } from 'lucide-react';
import ZoneMap from './components/ZoneMap';
import ZoneSidebar from './components/ZoneSidebar';
import ZoneForm from './components/ZoneForm';
import { deliveryZones as initialZones, generateZoneId, getRandomZoneColor } from '../../../data/zoneMocks';

const DeliveryZones = () => {
  const [zones, setZones] = useState(initialZones);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
  const [editingZone, setEditingZone] = useState(null);
  const [pendingCoordinates, setPendingCoordinates] = useState(null);

  // Handle zone selection
  const handleSelectZone = useCallback((zoneId) => {
    setSelectedZoneId(zoneId);
  }, []);

  // Initiate creating a new zone
  const handleCreateZone = useCallback(() => {
    setIsDrawingMode(true);
    setSelectedZoneId(null);
    setPendingCoordinates(null);
  }, []);

  // Handle drawing completion
  const handleDrawingComplete = useCallback((coordinates) => {
    setPendingCoordinates(coordinates);
    setIsDrawingMode(false);
    setFormMode('create');
    setEditingZone(null);
    setIsFormOpen(true);
  }, []);

  // Handle drawing cancellation
  const handleDrawingCancel = useCallback(() => {
    setIsDrawingMode(false);
    setPendingCoordinates(null);
  }, []);

  // Handle zone form submission
  const handleZoneSubmit = useCallback((formData) => {
    if (formMode === 'create' && pendingCoordinates) {
      // Create new zone
      const newZone = {
        id: generateZoneId(),
        ...formData,
        coordinates: pendingCoordinates,
        isActive: true,
        totalOrders: 0,
        activeDrivers: 0,
        averageDeliveryTime: 'N/A',
        createdAt: new Date().toISOString().split('T')[0],
      };

      setZones(prev => [...prev, newZone]);
      setSelectedZoneId(newZone.id);
      setPendingCoordinates(null);
      
      // Success notification (you can integrate your notification system here)
      console.log('✅ Zone created successfully:', newZone.name);
    } else if (formMode === 'edit' && editingZone) {
      // Update existing zone
      setZones(prev =>
        prev.map(zone =>
          zone.id === editingZone.id
            ? { ...zone, ...formData }
            : zone
        )
      );
      
      setEditingZone(null);
      console.log('✅ Zone updated successfully');
    }

    setIsFormOpen(false);
  }, [formMode, pendingCoordinates, editingZone]);

  // Handle zone edit
  const handleEditZone = useCallback((zone) => {
    setEditingZone(zone);
    setFormMode('edit');
    setIsFormOpen(true);
  }, []);

  // Handle zone deletion
  const handleDeleteZone = useCallback((zoneId) => {
    setZones(prev => prev.filter(zone => zone.id !== zoneId));
    
    if (selectedZoneId === zoneId) {
      setSelectedZoneId(null);
    }
    
    console.log('🗑️ Zone deleted');
  }, [selectedZoneId]);

  // Close form
  const handleFormClose = useCallback(() => {
    setIsFormOpen(false);
    setPendingCoordinates(null);
    setEditingZone(null);
  }, []);

  // Calculate statistics
  const stats = {
    total: zones.length,
    active: zones.filter(z => z.isActive).length,
    totalOrders: zones.reduce((sum, z) => sum + (z.totalOrders || 0), 0),
    avgFee: zones.length > 0
      ? Math.round(zones.reduce((sum, z) => sum + z.deliveryFee, 0) / zones.length)
      : 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin className="text-blue-600 dark:text-blue-400" size={32} />
                Delivery Zones
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage delivery areas, pricing, and coverage zones
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Map/List View Toggle */}
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                <button className="px-3 py-1.5 bg-white dark:bg-gray-600 rounded-md text-sm font-semibold text-gray-900 dark:text-white shadow-sm">
                  <Layers size={16} className="inline mr-1" />
                  Map
                </button>
                <button className="px-3 py-1.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  <Settings size={16} className="inline mr-1" />
                  Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Zones</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="text-3xl">🗺️</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Active Zones</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalOrders}</p>
              </div>
              <div className="text-3xl">📦</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg Fee</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.avgFee} XAF</p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </motion.div>
        </div>

        {/* Main Layout: Sidebar + Map */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-280px)] min-h-[600px]"
        >
          {/* Sidebar */}
          <ZoneSidebar
            zones={zones}
            selectedZoneId={selectedZoneId}
            onSelectZone={handleSelectZone}
            onCreateZone={handleCreateZone}
            onEditZone={handleEditZone}
            onDeleteZone={handleDeleteZone}
            isDrawingMode={isDrawingMode}
          />

          {/* Map Container */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <ZoneMap
              zones={zones}
              selectedZoneId={selectedZoneId}
              onZoneSelect={handleSelectZone}
              isDrawingMode={isDrawingMode}
              onDrawingComplete={handleDrawingComplete}
              onDrawingCancel={handleDrawingCancel}
            />
          </div>
        </motion.div>
      </div>

      {/* Zone Form Modal */}
      <ZoneForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleZoneSubmit}
        existingZone={editingZone}
        mode={formMode}
      />
    </div>
  );
};

export default DeliveryZones;

