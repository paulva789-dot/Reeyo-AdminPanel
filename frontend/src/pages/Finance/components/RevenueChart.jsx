// src/components/Finance/RevenueChart.jsx

import React from 'react';
import { 
    ResponsiveContainer, 
    AreaChart, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    Area 
} from 'recharts';

// Custom Tooltip for better readability
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg text-sm">
                <p className="font-semibold text-slate-800 dark:text-gray-100 mb-1">{`Month: ${label}`}</p>
                {payload.map((p, index) => (
                    <p key={index} style={{ color: p.color }}>
                        {`${p.name}: ${p.value.toLocaleString()} FCFA`}
                    </p>
                ))}
                <p className="text-xs text-gray-500 mt-1">Click to view detail</p>
            </div>
        );
    }

    return null;
};


const RevenueChart = ({ data }) => {
    return (
        <div className="h-96"> {/* Fixed height for the container */}
            <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 mb-4">
                Monthly Financial Trends
            </h2>
            
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 15,
                        left: 10,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" className="dark:stroke-gray-600" />
                    <XAxis dataKey="name" stroke="#6b7280" className="text-xs" />
                    <YAxis 
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        stroke="#6b7280" 
                        className="text-xs"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    
                    {/* Gross Revenue Area */}
                    <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        name="Gross Revenue" 
                        stroke="#4F46E5" 
                        fill="#4F46E5" 
                        fillOpacity={0.3} 
                        strokeWidth={2}
                    />
                    
                    {/* Platform Commission Area */}
                    <Area 
                        type="monotone" 
                        dataKey="commission" 
                        name="Platform Commission" 
                        stroke="#10B981" 
                        fill="#10B981" 
                        fillOpacity={0.2} 
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RevenueChart;

