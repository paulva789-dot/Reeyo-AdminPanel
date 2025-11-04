// src/pages/DeliveryZones/components/ZoneMap.jsx

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Tooltip, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { X, Check, Undo } from 'lucide-react';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map Invalidator Component
const MapInvalidator = () => {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    const handleResize = () => {
      map.invalidateSize();
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);

  return null;
};

// Drawing Tool Component
const DrawingTool = ({ isDrawing, onPointAdd, currentPoints, onComplete, onCancel }) => {
  useMapEvents({
    click(e) {
      if (isDrawing) {
        onPointAdd([e.latlng.lat, e.latlng.lng]);
      }
    },
  });

  return null;
};

// Zone Polygon Component
const ZonePolygon = ({ zone, isSelected, onClick }) => {
  const opacity = isSelected ? 0.5 : 0.3;
  const weight = isSelected ? 3 : 2;

  return (
    <Polygon
      positions={zone.coordinates}
      pathOptions={{
        color: zone.color,
        fillColor: zone.color,
        fillOpacity: opacity,
        weight: weight,
      }}
      eventHandlers={{
        click: () => onClick(zone.id),
        mouseover: (e) => {
          e.target.setStyle({
            fillOpacity: 0.6,
            weight: 4,
          });
        },
        mouseout: (e) => {
          e.target.setStyle({
            fillOpacity: opacity,
            weight: weight,
          });
        },
      }}
    >
      <Tooltip direction="center" permanent={isSelected}>
        <div className="text-center">
          <strong className="block text-sm">{zone.name}</strong>
          <span className="text-xs">{zone.deliveryFee} XAF</span>
        </div>
      </Tooltip>
    </Polygon>
  );
};

// Drawing Preview Polygon
const DrawingPreview = ({ points, color = '#3b82f6' }) => {
  if (points.length < 2) return null;

  return (
    <Polygon
      positions={points}
      pathOptions={{
        color: color,
        fillColor: color,
        fillOpacity: 0.3,
        weight: 2,
        dashArray: '10, 10',
      }}
    />
  );
};

// Main ZoneMap Component
const ZoneMap = ({ 
  zones, 
  selectedZoneId, 
  onZoneSelect, 
  isDrawingMode, 
  onDrawingComplete,
  onDrawingCancel 
}) => {
  const defaultCenter = [4.050, 9.700]; // Douala center
  const [drawingPoints, setDrawingPoints] = useState([]);
  const mapRef = useRef(null);

  // Reset drawing points when drawing mode is cancelled
  useEffect(() => {
    if (!isDrawingMode) {
      setDrawingPoints([]);
    }
  }, [isDrawingMode]);

  const handlePointAdd = (point) => {
    setDrawingPoints(prev => [...prev, point]);
  };

  const handleComplete = () => {
    if (drawingPoints.length >= 3) {
      onDrawingComplete(drawingPoints);
      setDrawingPoints([]);
    }
  };

  const handleCancel = () => {
    setDrawingPoints([]);
    onDrawingCancel();
  };

  const handleUndo = () => {
    setDrawingPoints(prev => prev.slice(0, -1));
  };

  // Calculate map bounds to fit all zones
  const mapBounds = zones.length > 0
    ? zones.flatMap(zone => zone.coordinates)
    : null;

  return (
    <div className="relative w-full h-full">
      {/* Drawing Instructions Overlay */}
      {isDrawingMode && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-blue-600 text-white px-6 py-3 rounded-lg shadow-xl"
        >
          <p className="text-sm font-semibold text-center">
            🖱️ Click on the map to place zone boundary points
          </p>
          <p className="text-xs text-blue-100 text-center mt-1">
            {drawingPoints.length} point{drawingPoints.length !== 1 ? 's' : ''} placed • Minimum 3 required
          </p>
        </motion.div>
      )}

      {/* Drawing Controls */}
      {isDrawingMode && drawingPoints.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[1000] flex gap-2"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleUndo}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg font-semibold flex items-center gap-2 shadow-lg hover:bg-gray-600 transition-colors"
          >
            <Undo size={18} />
            Undo
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCancel}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold flex items-center gap-2 shadow-lg hover:bg-red-700 transition-colors"
          >
            <X size={18} />
            Cancel
          </motion.button>

          {drawingPoints.length >= 3 && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleComplete}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold flex items-center gap-2 shadow-lg hover:bg-green-700 transition-colors"
            >
              <Check size={18} />
              Complete Zone
            </motion.button>
          )}
        </motion.div>
      )}

      {/* Info Card - Selected Zone */}
      {!isDrawingMode && selectedZoneId && zones.find(z => z.id === selectedZoneId) && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="absolute top-4 right-4 z-[1000] bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 max-w-xs border border-gray-200 dark:border-gray-700"
        >
          {(() => {
            const zone = zones.find(z => z.id === selectedZoneId);
            return (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: zone.color }}
                  />
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {zone.name}
                  </h3>
                </div>
                {zone.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {zone.description}
                  </p>
                )}
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Delivery Fee:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {zone.deliveryFee} XAF
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Avg Time:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {zone.averageDeliveryTime}
                    </span>
                  </div>
                </div>
              </>
            );
          })()}
        </motion.div>
      )}

      {/* Map Container */}
      <MapContainer
        ref={mapRef}
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={true}
        style={{ 
          height: '100%', 
          width: '100%', 
          minHeight: '500px',
          borderRadius: '12px',
          zIndex: 0,
          cursor: isDrawingMode ? 'crosshair' : 'grab'
        }}
        className="leaflet-container"
        bounds={mapBounds}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          minZoom={3}
        />

        <MapInvalidator />

        {/* Existing Zones */}
        {zones.map(zone => (
          <ZonePolygon
            key={zone.id}
            zone={zone}
            isSelected={zone.id === selectedZoneId}
            onClick={onZoneSelect}
          />
        ))}

        {/* Drawing Tool */}
        {isDrawingMode && (
          <>
            <DrawingTool
              isDrawing={isDrawingMode}
              onPointAdd={handlePointAdd}
              currentPoints={drawingPoints}
              onComplete={handleComplete}
              onCancel={handleCancel}
            />
            <DrawingPreview points={drawingPoints} />
          </>
        )}
      </MapContainer>

      {/* Empty State */}
      {!isDrawingMode && zones.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-8 text-center shadow-xl">
            <div className="text-6xl mb-3">🗺️</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No Zones Configured
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create your first delivery zone to get started
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZoneMap;

