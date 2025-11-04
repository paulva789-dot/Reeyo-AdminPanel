// src/data/trackingMocks.js

// Realistic coordinates for Douala/Buea region in Cameroon
// Format: [latitude, longitude]

const initialDriverLocation = [4.150, 9.250]; // Near Buea Town
const restaurantLocation = [4.015, 9.700];    // Near Douala - Akwa
const customerLocation = [4.050, 9.750];      // Near Douala - Bonanjo

export const activeTrackingOrders = [
    {
        id: '#003C',
        status: 'In Transit',
        customer: 'Bob Johnson',
        driver: 'Mike T.',
        driverId: 'D01',
        total: 25950,
        pickupCoords: restaurantLocation,
        dropoffCoords: customerLocation,
        driverCoords: initialDriverLocation, 
        eta: '18 min',
        estimatedDistance: '12.5 km',
        orderTime: '14:32',
    },
    {
        id: '#006F',
        status: 'Preparing',
        customer: 'Lois Griffin',
        driver: 'Peter P.',
        driverId: 'D02',
        total: 12000,
        pickupCoords: [4.120, 9.200],
        dropoffCoords: [4.050, 9.250],
        driverCoords: [4.120, 9.200], // At pickup location
        eta: 'Preparing',
        estimatedDistance: '8.2 km',
        orderTime: '14:45',
    },
    {
        id: '#007A',
        status: 'In Transit',
        customer: 'Clark Kent',
        driver: 'Lana Lang',
        driverId: 'D03',
        total: 35000,
        pickupCoords: [4.005, 9.300],
        dropoffCoords: [4.100, 9.400],
        driverCoords: [4.050, 9.350], 
        eta: '25 min',
        estimatedDistance: '15.8 km',
        orderTime: '14:20',
    },
    {
        id: '#008B',
        status: 'In Transit',
        customer: 'Diana Prince',
        driver: 'Steve Trevor',
        driverId: 'D04',
        total: 18500,
        pickupCoords: [4.030, 9.720],
        dropoffCoords: [4.080, 9.770],
        driverCoords: [4.055, 9.745], 
        eta: '12 min',
        estimatedDistance: '6.3 km',
        orderTime: '14:50',
    },
];

/**
 * Simulates realistic driver movement towards destination
 * Adds small random variations to simulate real-world GPS fluctuations
 * @param {Array} currentCoords - Current [lat, lng] position
 * @param {Array} targetCoords - Target [lat, lng] position (optional)
 * @returns {Array} New [lat, lng] position
 */
export const simulateDriverMovement = (currentCoords, targetCoords = null) => {
    let lat = currentCoords[0];
    let lng = currentCoords[1];
    
    if (targetCoords) {
        // Move slightly towards target with some randomness
        const latDiff = targetCoords[0] - currentCoords[0];
        const lngDiff = targetCoords[1] - currentCoords[1];
        
        // Move 1-2% of the remaining distance per update
        const movementFactor = 0.015 + (Math.random() * 0.01);
        lat += latDiff * movementFactor;
        lng += lngDiff * movementFactor;
    }
    
    // Add GPS jitter (realistic GPS fluctuation)
    const jitter = 0.0001;
    lat += (Math.random() * jitter * 2) - jitter;
    lng += (Math.random() * jitter * 2) - jitter;
    
    return [lat, lng];
};

/**
 * Calculate approximate ETA based on distance (simplified)
 * @param {Array} from - Starting coordinates
 * @param {Array} to - Destination coordinates
 * @returns {string} Estimated time string
 */
export const calculateETA = (from, to) => {
    // Simple Euclidean distance (not accurate but good for demo)
    const latDiff = to[0] - from[0];
    const lngDiff = to[1] - from[1];
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    
    // Rough conversion to minutes (adjust multiplier for realism)
    const minutes = Math.round(distance * 200);
    
    return minutes > 0 ? `${minutes} min` : '< 1 min';
};