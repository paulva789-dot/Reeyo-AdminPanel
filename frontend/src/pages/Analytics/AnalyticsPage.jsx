// src/pages/Analytics/AnalyticsPage.jsx
import React, { useState } from 'react';
import {
  Users,
  Bike,
  Store,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  DollarSign,
  RefreshCw,
  Package,
  Timer,
  Smile,
  BarChart3,
  PieChart,
  CheckCircle
} from 'lucide-react';
import DateFilter from '../../components/DateFilter';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const TABS = {
  OVERVIEW: 'overview',
  ORDERS: 'orders',
  CUSTOMERS: 'customers',
  OPS: 'ops',
};

const AnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState(TABS.OVERVIEW);
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  const leaderboardData = [
    { name: 'Chez Pierre Bistro', value: 1250, type: 'Restaurant' },
    { name: 'Mama Kitchen', value: 980, type: 'Restaurant' },
    { name: 'QuickShip Riders', value: 156, type: 'Rider' },
    { name: 'Yaounde Shop', value: 890, type: 'Shop' },
  ];

  const trafficData = [
    { shop: 'Chez Pierre Bistro', visits: 1245 },
    { shop: 'Mama Kitchen', visits: 982 },
    { shop: 'The Sushi Spot', visits: 856 },
  ];

  const orderData = [
    { period: 'Jan', gmv: 12500000, orders: 450 },
    { period: 'Feb', gmv: 15600000, orders: 520 },
    { period: 'Mar', gmv: 18900000, orders: 610 },
  ];

  const opsData = [
    { metric: 'Order Acceptance', rate: 92 },
    { metric: 'Avg Prep Time', minutes: 25 },
    { metric: 'Avg Delivery Time', minutes: 35 },
    { metric: 'On-time Rate', rate: 88 },
  ];

  return (
    <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-gray-100 flex items-center">
          <BarChart3 size={28} className="mr-3 text-indigo-600" />
          Analytics Dashboard
        </h1>
      </div>

      <DateFilter selectedPeriod={selectedPeriod} onPeriodChange={setSelectedPeriod} />

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6">
        {[
          { id: TABS.OVERVIEW, label: 'Overview', icon: PieChart },
          { id: TABS.ORDERS, label: 'Orders & Revenue', icon: Package },
          { id: TABS.CUSTOMERS, label: 'Customer Behavior', icon: Users },
          { id: TABS.OPS, label: 'Ops Performance', icon: Timer },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === TABS.OVERVIEW && (
        <div className="space-y-6">
          {/* Leaderboards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 shadow">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Store size={18} className="text-orange-500" />
                Top Restaurants
              </h3>
              <div className="space-y-2">
                {leaderboardData.filter(d => d.type === 'Restaurant').map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{idx + 1}. {item.name}</span>
                    <span className="font-medium">{item.value} orders</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <ShoppingBag size={18} className="text-green-500" />
                Top Shops
              </h3>
              <div className="space-y-2">
                {leaderboardData.filter(d => d.type === 'Shop').map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{idx + 1}. {item.name}</span>
                    <span className="font-medium">{item.value} orders</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Bike size={18} className="text-blue-500" />
                Top Riders
              </h3>
              <div className="space-y-2">
                {leaderboardData.filter(d => d.type === 'Rider').map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{idx + 1}. {item.name}</span>
                    <span className="font-medium">{item.value} deliveries</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Traffic - Most Visited */}
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="font-semibold mb-4">Most Visited Locations</h3>
            <div className="space-y-3">
              {trafficData.map((shop, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span>{shop.shop}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full" 
                        style={{ width: `${(shop.visits / 1245) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{shop.visits}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === TABS.ORDERS && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="font-semibold mb-4">GMV & Orders Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={orderData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="gmv" stroke="#6366f1" name="GMV" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="font-semibold mb-4">Key Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span>Gross Merchandise Value</span>
                <span className="font-bold">XAF 18,900,000</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span>Average Order Value</span>
                <span className="font-bold">XAF 31,000</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span>Net Revenue</span>
                <span className="font-bold text-green-600">XAF 4,200,000</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span>Peak Hours</span>
                <span className="font-bold">2:00 PM - 3:30 PM</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customers Tab */}
      {activeTab === TABS.CUSTOMERS && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-sm text-gray-500">New Customers (Week)</p>
            <p className="text-2xl font-bold">124</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-sm text-gray-500">Activation Rate</p>
            <p className="text-2xl font-bold">78%</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-sm text-gray-500">Referral Rate</p>
            <p className="text-2xl font-bold">24%</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-sm text-gray-500">Repeat Customers (Week)</p>
            <p className="text-2xl font-bold">67</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-sm text-gray-500">Avg Repeat Time</p>
            <p className="text-2xl font-bold">5.2 days</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-sm text-gray-500">Cart Abandonment</p>
            <p className="text-2xl font-bold text-red-600">12%</p>
          </div>
        </div>
      )}

      {/* Ops Performance Tab */}
      {activeTab === TABS.OPS && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow">
            <Timer size={24} className="text-blue-500 mb-2" />
            <p className="text-sm text-gray-500">Avg Prep Time</p>
            <p className="text-2xl font-bold">25 min</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <Bike size={24} className="text-green-500 mb-2" />
            <p className="text-sm text-gray-500">Avg Delivery Time</p>
            <p className="text-2xl font-bold">35 min</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <CheckCircle size={24} className="text-indigo-500 mb-2" />
            <p className="text-sm text-gray-500">On-time Rate</p>
            <p className="text-2xl font-bold">88%</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <Smile size={24} className="text-yellow-500 mb-2" />
            <p className="text-sm text-gray-500">Customer Satisfaction</p>
            <p className="text-2xl font-bold">4.6/5</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;