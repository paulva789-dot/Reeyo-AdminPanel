// src/components/DateFilter.jsx
import React from 'react';
import { Calendar } from 'lucide-react';

const PERIODS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'lastWeek', label: 'Last Week' },
  { id: 'lastMonth', label: 'Last Month' },
  { id: 'lastYear', label: 'Last Year' },
];

const DateFilter = ({ selectedPeriod, onPeriodChange }) => {
  return (
    <div className="flex items-center gap-2 mb-6 flex-wrap">
      <div className="flex items-center gap-2 text-gray-700 mr-2">
        <Calendar size={18} />
        <span className="text-sm font-medium">Period:</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {PERIODS.map(period => (
          <button
            key={period.id}
            onClick={() => onPeriodChange(period.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPeriod === period.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DateFilter;
