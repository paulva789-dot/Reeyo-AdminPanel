// src/pages/Settings/SettingsPage.jsx
import React from 'react';
import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import { Shield, Settings, Database, Plug, ToggleLeft } from 'lucide-react';

// Define the tabs for the Settings page
const settingsTabs = [
    { 
        name: 'User & Access', 
        path: 'access', 
        icon: Shield 
    },
    { 
        name: 'Operational Params', 
        path: 'operational', 
        icon: Settings 
    },
    { 
        name: 'Integrations', 
        path: 'integrations', 
        icon: Plug 
    },
    { 
        name: 'Platform Services', 
        path: 'services', 
        icon: ToggleLeft 
    },
    { 
        name: 'Data & Backup', 
        path: 'data', 
        icon: Database 
    },
];

const SettingsPage = () => {
    const location = useLocation();
    const isRootPath = location.pathname.endsWith('/settings');

    // If we hit the base /settings route, immediately navigate to the default tab
    if (isRootPath) {
        return <Navigate to="access" replace />;
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">⚙️ System Configuration</h1>
            
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-8">
                <nav className="-mb-px flex space-x-8" aria-label="Settings Tabs">
                    {settingsTabs.map((tab) => (
                        <NavLink
                            key={tab.path}
                            to={tab.path}
                            className={({ isActive }) => 
                                `${isActive 
                                    ? 'border-orange-500 text-orange-600 font-semibold' 
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } 
                                whitespace-nowrap py-3 px-1 flex items-center gap-2 border-b-2 text-sm transition-colors duration-150
                            `}
                        >
                            <tab.icon size={18} />
                            <span>{tab.name}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>
            
            {/* Content Area - Renders the nested component */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <Outlet />
            </div>
        </div>
    );
};

export default SettingsPage;
