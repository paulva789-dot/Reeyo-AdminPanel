// src/components/LiveTracker/DriverMapMarker.jsx

import React from 'react';
import { Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons not showing (common Leaflet + Webpack issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons for different marker types
const createCustomIcon = (type) => {
    const iconConfig = {
        driver: {
            html: `
                <div style="
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 3px solid white;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    font-size: 20px;
                    animation: pulse 2s infinite;
                ">
                    🏍️
                </div>
                <style>
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.1); }
                    }
                </style>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
        },
        pickup: {
            html: `
                <div style="
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 3px solid white;
                    box-shadow: 0 3px 10px rgba(0,0,0,0.25);
                    font-size: 18px;
                ">
                    🍽️
                </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
        },
        dropoff: {
            html: `
                <div style="
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 3px solid white;
                    box-shadow: 0 3px 10px rgba(0,0,0,0.25);
                    font-size: 18px;
                ">
                    📍
                </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
        },
    };

    const config = iconConfig[type] || iconConfig.driver;
    
    return L.divIcon({
        html: config.html,
        iconSize: config.iconSize,
        iconAnchor: config.iconAnchor,
        className: 'custom-map-marker', // Custom class to avoid default Leaflet styles
    });
};

const DriverMapMarker = ({ type, position, driverName, orderId, status }) => {
    const icon = createCustomIcon(type);

    // Render different popup content based on marker type
    const renderPopupContent = () => {
        switch (type) {
            case 'driver':
                return (
                    <div className="text-center p-1">
                        <strong className="block text-base text-green-700 mb-1">
                            🚴 {driverName}
                        </strong>
                        <p className="text-sm text-gray-600 mb-1">Order: {orderId}</p>
                        <span className={`
                            inline-block px-2 py-1 text-xs rounded-full font-semibold
                            ${status === 'In Transit' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }
                        `}>
                            {status}
                        </span>
                    </div>
                );
            case 'pickup':
                return (
                    <div className="text-center p-1">
                        <strong className="block text-base text-amber-700 mb-1">
                            🍽️ Pickup Location
                        </strong>
                        <p className="text-sm text-gray-600">Restaurant</p>
                    </div>
                );
            case 'dropoff':
                return (
                    <div className="text-center p-1">
                        <strong className="block text-base text-blue-700 mb-1">
                            📍 Delivery Location
                        </strong>
                        <p className="text-sm text-gray-600">Customer Address</p>
                    </div>
                );
            default:
                return null;
        }
    };

    const getTooltipText = () => {
        switch (type) {
            case 'driver':
                return `Driver: ${driverName}`;
            case 'pickup':
                return 'Pickup Point';
            case 'dropoff':
                return 'Delivery Point';
            default:
                return '';
        }
    };

    return (
        <Marker position={position} icon={icon}>
            <Popup>
                {renderPopupContent()}
            </Popup>
            <Tooltip direction="top" offset={[0, -20]} opacity={0.9}>
                {getTooltipText()}
            </Tooltip>
        </Marker>
    );
};

export default DriverMapMarker;

