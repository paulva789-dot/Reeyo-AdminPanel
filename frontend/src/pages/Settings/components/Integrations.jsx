// src/pages/Settings/components/Integrations.jsx
import React, { useState } from 'react';
import { 
  Plug, 
  Key, 
  Mail, 
  MessageSquare, 
  CreditCard, 
  Truck, 
  Send, 
  X, 
  Check, 
  AlertCircle,
  Info
} from 'lucide-react';

const INTEGRATION_CATEGORIES = [
  {
    id: 'payment',
    name: 'Payment Gateways',
    description: 'Process customer payments and manage transactions',
    icon: CreditCard,
    integrations: ['Stripe', 'PayPal', 'Flutterwave', 'MTN Mobile Money', 'Orange Money'],
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Send emails, SMS, and push notifications',
    icon: MessageSquare,
    integrations: ['SendGrid', 'Twilio', 'Firebase Cloud Messaging', 'OneSignal'],
  },
  {
    id: 'delivery',
    name: 'Delivery Services',
    description: 'Connect with third-party logistics providers',
    icon: Truck,
    integrations: ['Google Maps API', 'Mapbox', 'Sendy', 'Gokada'],
  },
  {
    id: 'email',
    name: 'Email Marketing',
    description: 'Newsletter and marketing automation',
    icon: Mail,
    integrations: ['Mailchimp', 'ConvertKit', 'SendGrid Email'],
  },
];

const Integrations = () => {
  const [configuredIntegrations, setConfiguredIntegrations] = useState({
    'PayPal': { id: 'paypal-001', status: 'Connected', apiKey: '****-****-****-1234' },
    'Twilio': { id: 'twilio-001', status: 'Connected', apiKey: '****-****-****-5678' },
  });
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [configData, setConfigData] = useState({ apiKey: '', apiSecret: '', webhookUrl: '' });

  const handleConfigure = (integration) => {
    setSelectedIntegration(integration);
    setConfigData(configuredIntegrations[integration] || { apiKey: '', apiSecret: '', webhookUrl: '' });
    setShowConfigModal(true);
  };

  const handleSaveConfig = () => {
    if (selectedIntegration) {
      setConfiguredIntegrations(prev => ({
        ...prev,
        [selectedIntegration]: {
          ...configData,
          status: 'Connected',
        },
      }));
      setShowConfigModal(false);
    }
  };

  const handleDisconnect = (integration) => {
    setConfiguredIntegrations(prev => {
      const newState = { ...prev };
      delete newState[integration];
      return newState;
    });
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800 border-b pb-2 mb-6">Integrations Management</h1>

      {INTEGRATION_CATEGORIES.map((category) => (
        <section key={category.id} className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-4">
            <category.icon size={24} className="text-indigo-600" />
            <div>
              <h3 className="font-semibold text-xl">{category.name}</h3>
              <p className="text-sm text-gray-600">{category.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.integrations.map((integration) => {
              const isConfigured = configuredIntegrations[integration];
              return (
                <div key={integration} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800">{integration}</h4>
                    {isConfigured ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        <Check size={12} /> Connected
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">Not configured</span>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    {isConfigured?.apiKey && (
                      <div>
                        <span className="text-gray-500">API Key:</span>
                        <span className="ml-2 font-mono text-gray-700">{isConfigured.apiKey}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    {isConfigured ? (
                      <>
                        <button
                          onClick={() => handleConfigure(integration)}
                          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-100 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDisconnect(integration)}
                          className="flex-1 px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition"
                        >
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleConfigure(integration)}
                        className="w-full px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition flex items-center justify-center gap-1"
                      >
                        <Plug size={14} /> Connect
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-bold">Configure {selectedIntegration}</h3>
              <button onClick={() => setShowConfigModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">API Key *</label>
                <div className="relative">
                  <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={configData.apiKey || ''}
                    onChange={(e) => setConfigData(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Enter API Key"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">API Secret (Optional)</label>
                <input
                  type="password"
                  value={configData.apiSecret || ''}
                  onChange={(e) => setConfigData(prev => ({ ...prev, apiSecret: e.target.value }))}
                  placeholder="Enter API Secret"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL (Optional)</label>
                <div className="relative">
                  <Send size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="url"
                    value={configData.webhookUrl || ''}
                    onChange={(e) => setConfigData(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    placeholder="https://your-domain.com/webhook"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                <Info size={16} className="text-blue-600 mt-0.5" />
                <p className="text-xs text-gray-600">
                  Credentials are encrypted and stored securely. Find API keys in your {selectedIntegration} dashboard.
                </p>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setShowConfigModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSaveConfig} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Integrations;