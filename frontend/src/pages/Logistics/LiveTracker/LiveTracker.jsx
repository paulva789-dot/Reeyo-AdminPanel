// src/pages/Logistics/LiveTracker/LiveTracker.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import TrackingSidebar from './components/TrackingSidebar';
import LiveMap from './components/LiveMap';
import { apiClient, ApiError } from '../../../services/apiClient';

const POLL_MS = 12000;

const LiveTracker = () => {
    const [riders, setRiders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedRiderId, setSelectedRiderId] = useState(null);
    const [country, setCountry] = useState('');
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchLocations = useCallback(async (isInitial = false) => {
        if (isInitial) setLoading(true);
        try {
            const res = await apiClient.get('/riders/live-locations', { country: country || undefined });
            setRiders(res.data || []);
            setLastUpdated(new Date());
            setError('');
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Could not load rider locations.');
        } finally {
            if (isInitial) setLoading(false);
        }
    }, [country]);

    useEffect(() => {
        fetchLocations(true);
        const interval = setInterval(() => fetchLocations(false), POLL_MS);
        return () => clearInterval(interval);
    }, [fetchLocations]);

    useEffect(() => {
        if (selectedRiderId && !riders.some((r) => r.rider_id === selectedRiderId)) {
            setSelectedRiderId(null);
        }
    }, [riders, selectedRiderId]);

    const onDelivery = riders.filter((r) => r.current_order_id).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                                📍 Live Rider Tracker
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Real-time rider positions, refreshed every {POLL_MS / 1000}s
                            </p>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                            <input
                                type="text"
                                maxLength={2}
                                value={country}
                                onChange={(e) => setCountry(e.target.value.toUpperCase())}
                                placeholder="Country (e.g. CM)"
                                className="px-3 py-1.5 text-sm border rounded-lg uppercase w-40 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />

                            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                <span className="text-sm font-semibold text-green-700 dark:text-green-300">Live</span>
                            </div>

                            {lastUpdated && (
                                <span className="hidden sm:inline text-xs text-gray-500 dark:text-gray-400">
                                    Updated {lastUpdated.toLocaleTimeString()}
                                </span>
                            )}
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
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Online Riders</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{riders.length}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">On Delivery</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{onDelivery}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Available</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{riders.length - onDelivery}</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-320px)] min-h-[600px]">
                        <TrackingSidebar riders={riders} selectedRiderId={selectedRiderId} onSelectRider={setSelectedRiderId} />
                        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            <LiveMap riders={riders} selectedRiderId={selectedRiderId} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveTracker;
