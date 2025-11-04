// src/components/LiveTracker/LiveMap.jsx

import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import DriverMapMarker from './DriverMapMarker';
import { simulateDriverMovement } from '../../../../data/trackingMocks';

// ============================================
// Map Controller: Handles smooth view updates
// ============================================
const MapViewUpdater = ({ center, zoom }) => {
    const map = useMap();
    
    useEffect(() => {
        if (center && center.length === 2) {
            map.flyTo(center, zoom, {
                duration: 1.2,
                easeLinearity: 0.5
            });
        }
    }, [center, zoom, map]);

    return null;
};

// ============================================
// Map Size Fix: Forces proper dimension calculation
// ============================================
const MapInvalidator = () => {
    const map = useMap();

    useEffect(() => {
        // Initial invalidation
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 150);

        // Handle window resize
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

// ============================================
// Main Live Map Component
// ============================================
const LiveMap = ({ selectedOrder }) => {
    const defaultCenter = [4.050, 9.700]; // Douala center
    const [driverCoords, setDriverCoords] = useState(null);
    const [routePath, setRoutePath] = useState([]);
    
    // Memoized map center based on selected order
    const mapCenter = useMemo(() => {
        if (!selectedOrder) return defaultCenter;
        return selectedOrder.driverCoords || selectedOrder.pickupCoords || defaultCenter;
    }, [selectedOrder]);

    const mapZoom = selectedOrder ? 13 : 11;

    // Initialize driver coordinates when order changes
    useEffect(() => {
        if (selectedOrder) {
            setDriverCoords(selectedOrder.driverCoords);
            // Initialize route path with starting position
            setRoutePath([selectedOrder.driverCoords]);
        } else {
            setDriverCoords(null);
            setRoutePath([]);
        }
    }, [selectedOrder?.id]); // Only reset when order ID changes

    // Real-time driver position simulation
    useEffect(() => {
        if (!selectedOrder || !driverCoords) return;
        
        // Only simulate movement for "In Transit" orders
        if (selectedOrder.status !== 'In Transit') return;
        
        const interval = setInterval(() => {
            setDriverCoords(prevCoords => {
                // Simulate movement towards dropoff location
                const newCoords = simulateDriverMovement(
                    prevCoords, 
                    selectedOrder.dropoffCoords
                );
                
                // Add to route path for polyline trail
                setRoutePath(prev => [...prev, newCoords].slice(-50)); // Keep last 50 points
                
                return newCoords;
            });
        }, 3000); // Update every 3 seconds

        return () => clearInterval(interval);
    }, [selectedOrder?.id, selectedOrder?.status, driverCoords]);

    // Empty state when no order is selected
    if (!selectedOrder) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-8 text-center">
                <div className="text-6xl mb-4">🗺️</div>
                <h3 className="text-xl font-semibold mb-2">No Order Selected</h3>
                <p className="text-sm">
                    Select an active order from the sidebar to view its live tracking map.
                </p>
            </div>
        );
    }
    
    const { id, driver, pickupCoords, dropoffCoords, status, customer } = selectedOrder;

    return (
        <div className="relative w-full h-full">
            {/* Map Container */}
            <MapContainer 
                key={`map-${id}`} // Force remount on order change for clean state
                center={mapCenter} 
                zoom={mapZoom} 
                scrollWheelZoom={true}
                zoomControl={true}
                style={{ 
                    height: '100%', 
                    width: '100%',
                    minHeight: '500px',
                    borderRadius: '12px',
                    zIndex: 0
                }}
                className="leaflet-container"
            >
                {/* Tile Layer - OpenStreetMap */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                    minZoom={3}
                />
                
                {/* Map utilities */}
                <MapInvalidator /> 
                <MapViewUpdater center={driverCoords || mapCenter} zoom={mapZoom} />

                {/* Route polyline (driver's path) */}
                {routePath.length > 1 && (
                    <Polyline 
                        positions={routePath} 
                        color="#10b981" 
                        weight={4}
                        opacity={0.7}
                        dashArray="10, 10"
                        dashOffset="0"
                    />
                )}

                {/* Location Markers */}
                <DriverMapMarker 
                    type="pickup" 
                    position={pickupCoords} 
                />
                <DriverMapMarker 
                    type="dropoff" 
                    position={dropoffCoords} 
                />
                {driverCoords && (
                    <DriverMapMarker 
                        type="driver" 
                        position={driverCoords} 
                        driverName={driver} 
                        orderId={id} 
                        status={status}
                    />
                )}
            </MapContainer>

            {/* Overlay Info Card */}
            <div className="absolute top-4 left-4 z-[1000] bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 max-w-xs border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        ORDER {id}
                    </span>
                    <span className={`
                        px-2 py-0.5 text-xs rounded-full font-bold
                        ${status === 'In Transit' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                        }
                    `}>
                        {status}
                    </span>
                </div>
                
                <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                    {customer}
                </h4>
                
                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <div className="flex items-center gap-2">
                        <span>🚴</span>
                        <span className="font-medium">{driver}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>⏱️</span>
                        <span>ETA: <strong>{selectedOrder.eta}</strong></span>
                    </div>
                    {selectedOrder.estimatedDistance && (
                        <div className="flex items-center gap-2">
                            <span>📏</span>
                            <span>{selectedOrder.estimatedDistance}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LiveMap;

