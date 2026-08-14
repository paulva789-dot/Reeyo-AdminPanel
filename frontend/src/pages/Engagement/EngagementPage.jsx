// src/pages/Engagement/EngagementPage.jsx
import React, { useState } from 'react';
import { Sparkles, Info, Tag, Gift, Disc3, MessageSquare, Share2 } from 'lucide-react';
import TrackingFacts from './components/TrackingFacts';
import PreferenceTags from './components/PreferenceTags';
import LoyaltyManagement from './components/LoyaltyManagement';
import SpinWheels from './components/SpinWheels';
import Popups from './components/Popups';
import SharedCarts from './components/SharedCarts';
import { useAuth } from '../../context/AuthContext';

const TABS = [
  { id: 'facts', label: 'Tracking Facts', icon: Info, Component: TrackingFacts },
  { id: 'tags', label: 'Preference Tags', icon: Tag, Component: PreferenceTags },
  { id: 'loyalty', label: 'Loyalty', icon: Gift, Component: LoyaltyManagement },
  { id: 'wheels', label: 'Spin Wheels', icon: Disc3, Component: SpinWheels },
  { id: 'popups', label: 'Popups', icon: MessageSquare, Component: Popups },
  { id: 'carts', label: 'Shared Carts', icon: Share2, Component: SharedCarts },
];

const EngagementPage = () => {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.Component;
  const { isSuperAdmin } = useAuth();

  return (
    <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-extrabold text-slate-800 dark:text-gray-100 mb-6 flex items-center">
        <Sparkles size={28} className="mr-3 text-indigo-600" />
        Engagement
      </h1>

      {!isSuperAdmin && (
        <p className="mb-6 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          You have read-only access to Engagement management. Only a Super Admin can create, edit, or delete items here.
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm ${
              activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
};

export default EngagementPage;
