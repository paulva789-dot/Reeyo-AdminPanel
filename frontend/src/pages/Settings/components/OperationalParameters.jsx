// src/pages/Settings/components/OperationalParameters.jsx
import React from 'react';
import { DollarSign, Percent, Clock, Mail, Link, Image as ImageIcon } from 'lucide-react';

const OperationalParameters = () => {
    return (
        <div className="space-y-8">
            
            <h1 className="text-2xl font-bold text-gray-800 border-b pb-2 mb-6">Operational Parameters</h1>

            {/* Vendor Commission Rates */}
            <section className="p-4 border rounded-lg shadow-sm">
                <h3 className="font-semibold text-xl flex items-center gap-2 mb-4"><Percent size={22} className="text-orange-500"/> Vendor Commission Rates</h3>
                <p className="text-sm text-gray-600 mb-4">Set the default commission rates applied to vendor sales. Rates can be overridden per vendor contract.</p>
                <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-2">Commission Types Available:</p>
                        <div className="flex gap-4 text-xs">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Percentage (%)</span>
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Fixed Amount (XAF)</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <label className="text-sm font-medium text-gray-700 w-48">Default Food Vendor Rate (%)</label>
                        <input type="number" defaultValue={15} min={0} max={100} className="mt-1 p-2 border border-gray-300 rounded-md w-24 text-center" />
                    </div>
                    <div className="flex items-center space-x-4">
                        <label className="text-sm font-medium text-gray-700 w-48">Default Grocery Rate (%)</label>
                        <input type="number" defaultValue={10} min={0} max={100} className="mt-1 p-2 border border-gray-300 rounded-md w-24 text-center" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <ImageIcon size={16} />
                                Vendor Storefront Image
                            </label>
                            <div className="text-xs text-gray-500">Vendors can upload storefront images when creating accounts</div>
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Link size={16} />
                                Google Maps Integration
                            </label>
                            <div className="text-xs text-gray-500">Add Google Maps address to vendor profiles for accurate location</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Delivery Fees & Minimum Order */}
            <section className="p-4 border rounded-lg shadow-sm">
                <h3 className="font-semibold text-xl flex items-center gap-2 mb-4"><DollarSign size={22} className="text-indigo-500"/> Delivery Fees & Minimums</h3>
                <p className="text-sm text-gray-600 mb-4">Configure system-wide default fees and minimum order values.</p>
                <div className="space-y-3">
                    <div className="flex items-center space-x-4">
                        <label className="text-sm font-medium text-gray-700 w-48">Base Delivery Fee (XAF)</label>
                        <input type="number" defaultValue={500} min={0} className="p-2 border border-gray-300 rounded-md w-32" />
                    </div>
                    <div className="flex items-center space-x-4">
                        <label className="text-sm font-medium text-gray-700 w-48">Min Order Value (XAF)</label>
                        <input type="number" defaultValue={1500} min={0} className="p-2 border border-gray-300 rounded-md w-32" />
                    </div>
                </div>
                <p className="mt-3 text-xs text-indigo-600 font-medium">ⓘ Zone-specific fee adjustments are managed in **Logistics**.</p>
            </section>

            {/* Refund Grace Period and Notifications */}
            <section className="p-4 border rounded-lg shadow-sm">
                <h3 className="font-semibold text-xl flex items-center gap-2 mb-4"><Clock size={22} className="text-fuchsia-500"/> Refund & Communication</h3>
                <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                        <label className="text-sm font-medium text-gray-700 w-48">Refund Grace Period</label>
                        <input type="number" defaultValue={12} min={0} className="p-2 border border-gray-300 rounded-md w-24 text-center" />
                        <span className="text-sm text-gray-600">hours after delivery.</span>
                    </div>

                    <div className="flex items-center space-x-4">
                        <label className="text-sm font-medium text-gray-700 w-48">Default Support Email</label>
                        <input type="email" defaultValue="support@reeyo.cm" className="p-2 border border-gray-300 rounded-md flex-1 min-w-0" />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default OperationalParameters;

