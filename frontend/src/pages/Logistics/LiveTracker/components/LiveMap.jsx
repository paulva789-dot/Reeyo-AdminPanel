// src/pages/Logistics/LiveTracker/components/LiveMap.jsx
import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import DriverMapMarker from './DriverMapMarker';

const MapViewUpdater = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center && center.length === 2) {
            map.flyTo(center, zoom, { duration: 1.2, easeLinearity: 0.5 });
        }
    }, [center, zoom, map]);
    return null;
};

const MapInvalidator = () => {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => map.invalidateSize(), 150);
        const handleResize = () => map.invalidateSize();
        window.addEventListener('resize', handleResize);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', handleResize);
        };
    }, [map]);
    return null;
};

const DEFAULT_CENTER = [4.050, 9.700]; // Douala

const LiveMap = ({ riders, selectedRiderId }) => {
    const selectedRider = riders.find((r) => r.rider_id === selectedRiderId);

    const mapCenter = useMemo(() => {
        if (selectedRider) return [selectedRider.lat, selectedRider.lng];
        if (riders.length > 0) return [riders[0].lat, riders[0].lng];
        return DEFAULT_CENTER;
    }, [selectedRider, riders]);

    const mapZoom = selectedRider ? 14 : 12;

    if (riders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-8 text-center">
                <div className="text-6xl mb-4">🗺️</div>
                <h3 className="text-xl font-semibold mb-2">No riders online</h3>
                <p className="text-sm">Riders will appear here as soon as they come online.</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                scrollWheelZoom={true}
                zoomControl={true}
                style={{ height: '100%', width: '100%', minHeight: '500px', borderRadius: '12px', zIndex: 0 }}
                className="leaflet-container"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                    minZoom={3}
                />
                <MapInvalidator />
                <MapViewUpdater center={mapCenter} zoom={mapZoom} />

                {riders.map((rider) => (
                    <DriverMapMarker
                        key={rider.rider_id}
                        type="driver"
                        position={[rider.lat, rider.lng]}
                        driverName={rider.name}
                        orderId={rider.current_order_id || 'Idle'}
                        status={rider.current_order_id ? 'On Delivery' : 'Available'}
                    />
                ))}
            </MapContainer>
        </div>
    );
};

export default LiveMap;
