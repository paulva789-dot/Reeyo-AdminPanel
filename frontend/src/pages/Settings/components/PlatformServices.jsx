// src/pages/Settings/components/PlatformServices.jsx
import React, { useState } from 'react';
import { 
  Utensils, 
  Package, 
  ShoppingBag, 
  Clock,
  X
} from 'lucide-react';

const SERVICES = [
  {
    id: 'food',
    name: 'Food Delivery',
    icon: Utensils,
    iconColor: 'text-orange-500',
    bgColor: 'bg-orange-100',
    description: 'Restaurant food delivery service',
  },
  {
    id: 'parcel',
    name: 'Parcel Delivery',
    icon: Package,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-100',
    description: 'Package and courier delivery service',
  },
  {
    id: 'shops',
    name: 'Shops',
    icon: ShoppingBag,
    iconColor: 'text-green-500',
    bgColor: 'bg-green-100',
    description: 'E-commerce and retail shopping',
  },
];

const PlatformServices = () => {
  const [services, setServices] = useState({
    food: { enabled: true, scheduledTime: null },
    parcel: { enabled: true, scheduledTime: null },
    shops: { enabled: false, scheduledTime: null },
  });
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [scheduleTime, setScheduleTime] = useState({ startTime: '', endTime: '' });

  const toggleService = (serviceId) => {
    setServices(prev => ({
      ...prev,
      [serviceId]: { ...prev[serviceId], enabled: !prev[serviceId].enabled },
    }));
  };

  const handleSchedule = (service) => {
    setSelectedService(service);
    setScheduleTime({
      startTime: services[service.id]?.scheduledTime?.startTime || '',
      endTime: services[service.id]?.scheduledTime?.endTime || '',
    });
    setShowScheduleModal(true);
  };

  const saveSchedule = () => {
    if (selectedService) {
      setServices(prev => ({
        ...prev,
        [selectedService.id]: {
          ...prev[selectedService.id],
          scheduledTime: scheduleTime.startTime && scheduleTime.endTime ? scheduleTime : null,
        },
      }));
      setShowScheduleModal(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800 border-b pb-2 mb-6">Platform Services Management</h1>

      <p className="text-gray-600 mb-4">
        Enable or disable platform services. When disabled, services show as "Closed" on the customer app.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SERVICES.map((service) => {
          const serviceState = services[service.id];
          return (
            <div key={service.id} className="border rounded-xl p-6 bg-white shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 ${service.bgColor} rounded-lg flex items-center justify-center`}>
                  <service.icon size={28} className={service.iconColor} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-800">{service.name}</h3>
                  <p className="text-sm text-gray-500">{service.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-700">
                  {serviceState.enabled ? 'Active' : 'Closed'}
                </span>
                <button
                  onClick={() => toggleService(service.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    serviceState.enabled ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      serviceState.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {serviceState.enabled && (
                <button
                  onClick={() => handleSchedule(service)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
                >
                  <Clock size={14} />
                  {serviceState.scheduledTime ? 'Edit Schedule' : 'Set Schedule'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {showScheduleModal && selectedService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-bold">Set Schedule for {selectedService.name}</h3>
              <button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                <input
                  type="time"
                  value={scheduleTime.startTime}
                  onChange={(e) => setScheduleTime(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                <input
                  type="time"
                  value={scheduleTime.endTime}
                  onChange={(e) => setScheduleTime(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <p className="text-xs text-gray-500">
                Leave empty for 24/7 service. Set specific hours when this service should be available.
              </p>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setShowScheduleModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={saveSchedule} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformServices;