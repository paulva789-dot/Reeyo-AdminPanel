// src/pages/Logistics/DeliveryZones/DeliveryZones.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, RefreshCw } from 'lucide-react';
import ZoneMap from './components/ZoneMap';
import ZoneSidebar from './components/ZoneSidebar';
import ZoneForm from './components/ZoneForm';
import { apiClient, ApiError } from '../../../services/apiClient';

const DeliveryZones = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [editingZone, setEditingZone] = useState(null);
  const [pendingCoordinates, setPendingCoordinates] = useState(null);

  const fetchZones = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/logistics/zones');
      setZones(res.data || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load delivery zones.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const handleSelectZone = useCallback((zoneId) => {
    setSelectedZoneId(zoneId);
  }, []);

  const handleCreateZone = useCallback(() => {
    setIsDrawingMode(true);
    setSelectedZoneId(null);
    setPendingCoordinates(null);
  }, []);

  const handleDrawingComplete = useCallback((coordinates) => {
    setPendingCoordinates(coordinates);
    setIsDrawingMode(false);
    setFormMode('create');
    setEditingZone(null);
    setIsFormOpen(true);
  }, []);

  const handleDrawingCancel = useCallback(() => {
    setIsDrawingMode(false);
    setPendingCoordinates(null);
  }, []);

  const handleZoneSubmit = useCallback(async (formData) => {
    if (formMode === 'create' && pendingCoordinates) {
      const res = await apiClient.post('/logistics/zones', {
        ...formData,
        polygon: pendingCoordinates,
      });
      setZones((prev) => [...prev, res.data]);
      setSelectedZoneId(res.data.id);
      setPendingCoordinates(null);
    } else if (formMode === 'edit' && editingZone) {
      const res = await apiClient.patch(`/logistics/zones/${editingZone.id}`, formData);
      setZones((prev) => prev.map((zone) => (zone.id === editingZone.id ? res.data : zone)));
      setEditingZone(null);
    }
    setIsFormOpen(false);
  }, [formMode, pendingCoordinates, editingZone]);

  const handleEditZone = useCallback((zone) => {
    setEditingZone(zone);
    setFormMode('edit');
    setIsFormOpen(true);
  }, []);

  const handleDeleteZone = useCallback(async (zoneId) => {
    setError('');
    try {
      await apiClient.delete(`/logistics/zones/${zoneId}`);
      setZones((prev) => prev.filter((zone) => zone.id !== zoneId));
      setSelectedZoneId((prev) => (prev === zoneId ? null : prev));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete zone.');
    }
  }, []);

  const handleFormClose = useCallback(() => {
    setIsFormOpen(false);
    setPendingCoordinates(null);
    setEditingZone(null);
  }, []);

  const stats = {
    total: zones.length,
    active: zones.filter(z => z.is_active).length,
  };
  const zonesWithOverride = zones.filter(z => z.delivery_fee_override != null);
  const avgOverride = zonesWithOverride.length > 0
    ? Math.round(zonesWithOverride.reduce((sum, z) => sum + z.delivery_fee_override, 0) / zonesWithOverride.length)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin className="text-blue-600 dark:text-blue-400" size={32} />
                Delivery Zones
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage delivery areas and per-zone fee overrides
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Zones</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="text-3xl">🗺️</div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Active Zones</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg Fee Override</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{avgOverride !== null ? `${avgOverride} XAF` : '—'}</p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </motion.div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-280px)] min-h-[600px]">
            <ZoneSidebar
              zones={zones}
              selectedZoneId={selectedZoneId}
              onSelectZone={handleSelectZone}
              onCreateZone={handleCreateZone}
              onEditZone={handleEditZone}
              onDeleteZone={handleDeleteZone}
              isDrawingMode={isDrawingMode}
            />

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
        )}
      </div>

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
