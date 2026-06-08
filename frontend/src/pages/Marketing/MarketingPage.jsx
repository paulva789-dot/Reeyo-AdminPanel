// src/pages/Marketing/MarketingPage.jsx
import React, { useState, useCallback } from 'react';
import { Megaphone, Image, Tag, Percent, ShoppingBag, Store, Package, Tractor } from 'lucide-react';
import BannerManagement from './components/BannerManagement';
import DiscountManagement from './components/DiscountManagement';

const TABS = {
  BANNERS: 'banners',
  DISCOUNTS: 'discounts',
};

const DISCOUNT_TYPES = ['Percentage', 'Fixed Amount', 'Free Delivery'];
const ENTITY_TYPES = ['All', 'Specific Vendors', 'Specific Shops', 'Specific Riders'];

const MarketingPage = () => {
  const [activeTab, setActiveTab] = useState(TABS.BANNERS);
  
  return (
    <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-gray-100 flex items-center">
          <Megaphone size={28} className="mr-3 text-indigo-600" />
          Marketing Hub
        </h1>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab(TABS.BANNERS)}
          className={`pb-2 border-b-2 text-lg font-medium transition ${
            activeTab === TABS.BANNERS
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Image size={18} className="inline mr-2" /> Banners
        </button>
        <button
          onClick={() => setActiveTab(TABS.DISCOUNTS)}
          className={`pb-2 border-b-2 text-lg font-medium transition ${
            activeTab === TABS.DISCOUNTS
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Tag size={18} className="inline mr-2" /> Discounts & Offers
        </button>
      </div>

      {/* Main Content */}
      {activeTab === TABS.BANNERS && <BannerManagement />}
      {activeTab === TABS.DISCOUNTS && <DiscountManagement />}
    </div>
  );
};

export default MarketingPage;