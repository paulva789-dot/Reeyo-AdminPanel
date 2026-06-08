// src/pages/DashboardOverview.jsx
import React, { useState, useEffect } from 'react';
import {
  Users,
  Store,
  Bike,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  DollarSign,
  RefreshCw,
  Package
} from 'lucide-react';
import DateFilter from '../components/DateFilter';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

// Mock Data for Sales Chart
const salesData = [
  { date: 'Mar 12', value: 3200 },
  { date: 'Mar 13', value: 4100 },
  { date: 'Mar 14', value: 3800 },
  { date: 'Mar 15', value: 5350 },
  { date: 'Mar 16', value: 4900 },
  { date: 'Mar 17', value: 5200 },
  { date: 'Mar 18', value: 4800 }
];

// Mock Data for Category Pie Chart
const categoryData = [
  { name: 'Fast Food', value: 25, amount: 3020000, products: 1234, color: '#3B82F6' },
  { name: 'African Cuisine', value: 35, amount: 4228000, products: 1491, color: '#F97316' },
  { name: 'Drinks', value: 18, amount: 2172000, products: 658, color: '#EAB308' },
  { name: 'Pastries', value: 15, amount: 1810000, products: 498, color: '#22C55E' },
  { name: 'Others', value: 7, amount: 845000, products: 348, color: '#EF4444' }
];

// Mock Data for Top Products Table
const topProducts = [
  { 
    id: 1, 
    name: 'Poulet DG Special', 
    vendor: 'Chez Marie', 
    productId: 'SKU890',
    price: 3500, 
    status: 'In Stock', 
    statusColor: 'bg-green-100 text-green-700',
    sold: 342, 
    revenue: 1197000 
  },
  { 
    id: 2, 
    name: 'Ndole with Plantains', 
    vendor: 'Mama Kitchen',
    productId: 'SKU124', 
    price: 2500, 
    status: 'Low Stock',
    statusColor: 'bg-yellow-100 text-yellow-700', 
    sold: 289, 
    revenue: 722500 
  },
  { 
    id: 3, 
    name: 'Koki Beans Bundle', 
    vendor: 'Traditional Foods',
    productId: 'SKU567', 
    price: 1500, 
    status: 'In Stock',
    statusColor: 'bg-green-100 text-green-700', 
    sold: 425, 
    revenue: 637500 
  },
  { 
    id: 4, 
    name: 'Fresh Pepper Soup', 
    vendor: 'Spice Corner',
    productId: 'SKU901', 
    price: 2000, 
    status: 'In Stock',
    statusColor: 'bg-green-100 text-green-700', 
    sold: 318, 
    revenue: 636000 
  }
];

// Stat Card Component
function StatCard({ title, value, change, icon: Icon, trend, changeLabel }) {
  const isPositive = trend === 'up';
  
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 ${
          isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
        }`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change}
        </span>
      </div>
      <h3 className="text-sm text-gray-500 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-2">{changeLabel}</p>
    </motion.div>
  );
}

// Main Dashboard Component
function DashboardOverview() {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="ml-3 text-lg text-gray-600">Loading Dashboard...</p>
      </div>
    );
  }

  const totalRevenue = categoryData.reduce((sum, cat) => sum + cat.amount, 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor your platform's performance</p>
      </div>

      <DateFilter selectedPeriod={selectedPeriod} onPeriodChange={setSelectedPeriod} />

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="TODAY REVENUE" 
          value="XAF 2,579,000"
          change="+12%"
          changeLabel="vs yesterday"
          icon={DollarSign}
          trend="up"
        />
        <StatCard 
          title="TODAY VISITORS" 
          value="312"
          change="+4%"
          changeLabel="vs yesterday"
          icon={Users}
          trend="up"
        />
        <StatCard 
          title="TODAY TRANSACTIONS" 
          value="525"
          change="-0.69%"
          changeLabel="vs yesterday"
          icon={ShoppingBag}
          trend="down"
        />
        <StatCard 
          title="TOTAL PRODUCTS" 
          value="168"
          change="+2%"
          changeLabel="vs yesterday"
          icon={Package}
          trend="up"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sales Analytics Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Sales Analytics</h2>
            <span className="text-sm text-gray-500">Week 5</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={salesData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                stroke="#999"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#999"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#F97316" 
                strokeWidth={3}
                fill="url(#colorValue)"
                dot={{ fill: '#F97316', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Sales by Category */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Sales by Category</h2>
            <span className="text-sm text-gray-500">Week 5</span>
          </div>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {categoryData.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-gray-700">{cat.name} ({cat.value}%)</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {cat.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-gray-500">{cat.products} category products</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Products */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Top Selling</h2>
            <button className="text-sm text-gray-500 hover:text-gray-700">Sort by ▼</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Product Name</th>
                  <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Price</th>
                  <th className="text-center py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Sold</th>
                  <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Total Earning</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product) => (
                  <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-4 px-2">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                        <p className="text-xs text-gray-500">PRODUCT ID: {product.productId}</p>
                      </div>
                    </td>
                    <td className="py-4 px-2 text-right font-semibold text-gray-900">
                      {product.price.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-4 px-2 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${product.statusColor}`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="py-4 px-2 text-right font-semibold text-gray-900">
                      {product.sold} pcs
                    </td>
                    <td className="py-4 px-2 text-right font-bold text-gray-900">
                      {product.revenue.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trending Now Card */}
        <div className="bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <span className="inline-block px-3 py-1 bg-white rounded-full text-xs font-semibold text-gray-700 mb-4">
              +12% vs yesterday
            </span>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Trending Now</h3>
            <p className="text-2xl font-bold text-gray-900 mb-8">Single Breasted Blazer</p>
            <p className="text-3xl font-bold text-gray-900">XAF 1,439,000</p>
          </div>
          <div className="absolute bottom-0 right-0 w-48 h-48 opacity-30">
            <div className="w-full h-full bg-gradient-to-tl from-pink-300 to-transparent rounded-tl-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardOverview;

