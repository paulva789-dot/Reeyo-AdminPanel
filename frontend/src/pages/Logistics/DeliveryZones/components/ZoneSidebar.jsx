// src/pages/DeliveryZones/components/ZoneSidebar.jsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  MapPin, 
  DollarSign, 
  Clock, 
  Users, 
  Package,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { formatDeliveryFee } from '../../../../data/zoneMocks';

const ZoneSidebar = ({ 
  zones, 
  selectedZoneId, 
  onSelectZone, 
  onCreateZone, 
  onEditZone, 
  onDeleteZone,
  isDrawingMode
}) => {
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleDelete = (zoneId) => {
    if (confirmDelete === zoneId) {
      onDeleteZone(zoneId);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(zoneId);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const getZoneStats = (zone) => ({
    orders: zone.totalOrders || 0,
    drivers: zone.activeDrivers || 0,
    avgTime: zone.averageDeliveryTime || 'N/A',
  });

  return (
    <div className="w-full lg:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col max-h-full">
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MapPin size={24} />
              Delivery Zones
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              {zones.length} {zones.length === 1 ? 'zone' : 'zones'} configured
            </p>
          </div>
        </div>

        <motion.button
          onClick={onCreateZone}
          disabled={isDrawingMode}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`
            w-full px-4 py-3 rounded-lg font-semibold text-white 
            flex items-center justify-center gap-2 transition-all
            ${isDrawingMode 
              ? 'bg-white/20 cursor-not-allowed' 
              : 'bg-white/10 hover:bg-white/20 shadow-lg hover:shadow-xl'
            }
          `}
        >
          <Plus size={20} />
          {isDrawingMode ? 'Drawing Zone...' : 'Create New Zone'}
        </motion.button>

        {isDrawingMode && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-xs text-blue-100 text-center"
          >
            Click on the map to draw zone boundaries
          </motion.p>
        )}
      </div>

      {/* Zones List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {zones.length === 0 ? (
          <div className="text-center py-12">
            <MapPin size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No delivery zones yet
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              Click "Create New Zone" to get started
            </p>
          </div>
        ) : (
          zones.map((zone, index) => {
            const isSelected = zone.id === selectedZoneId;
            const stats = getZoneStats(zone);
            const isConfirmingDelete = confirmDelete === zone.id;

            return (
              <motion.div
                key={zone.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  relative p-4 rounded-lg border-2 transition-all cursor-pointer
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-750 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm'
                  }
                `}
                onClick={() => !isConfirmingDelete && onSelectZone(zone.id)}
              >
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                  style={{ backgroundColor: zone.color }}
                />

                <div className="flex items-start justify-between mb-3 pl-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base truncate">
                      {zone.name}
                    </h3>
                    {zone.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {zone.description}
                      </p>
                    )}
                  </div>

                  <span className={`
                    ml-2 px-2 py-1 text-xs rounded-full font-semibold whitespace-nowrap flex items-center gap-1
                    ${zone.isActive 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }
                  `}>
                    {zone.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                    {zone.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3 pl-3">
                  <DollarSign size={16} className="text-green-600 dark:text-green-400" />
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatDeliveryFee(zone.deliveryFee)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">delivery fee</span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3 pl-3">
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <Package size={14} className="mx-auto text-blue-600 dark:text-blue-400 mb-1" />
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{stats.orders}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Orders</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <Users size={14} className="mx-auto text-green-600 dark:text-green-400 mb-1" />
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{stats.drivers}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Drivers</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <Clock size={14} className="mx-auto text-orange-600 dark:text-orange-400 mb-1" />
                    <p className="text-[10px] font-bold text-gray-900 dark:text-white">{stats.avgTime}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Avg Time</p>
                  </div>
                </div>

                <div className="flex gap-2 pl-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditZone(zone);
                    }}
                    className="flex-1 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg font-semibold text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit2 size={14} />
                    Edit
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(zone.id);
                    }}
                    className={`
                      flex-1 px-3 py-2 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-1
                      ${isConfirmingDelete 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50'
                      }
                    `}
                  >
                    {isConfirmingDelete ? (
                      <>
                        <AlertCircle size={14} />
                        Confirm?
                      </>
                    ) : (
                      <>
                        <Trash2 size={14} />
                        Delete
                      </>
                    )}
                  </motion.button>
                </div>

                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 pl-3 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-semibold"
                  >
                    <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></span>
                    Viewing on map
                  </motion.div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Active Zones:</span>
          <span className="font-bold text-green-600 dark:text-green-400">
            {zones.filter(z => z.isActive).length}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-gray-600 dark:text-gray-400">Total Coverage:</span>
          <span className="font-bold text-blue-600 dark:text-blue-400">
            {zones.length} {zones.length === 1 ? 'area' : 'areas'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ZoneSidebar;

