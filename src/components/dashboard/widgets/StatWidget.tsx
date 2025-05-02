import React from 'react';
import { StatWidgetData } from '@/types/dashboard';

interface StatWidgetProps {
    title: string;
    data: StatWidgetData;
}

export const StatWidget: React.FC<StatWidgetProps> = ({ title, data }) => {
    const { value, label, change, changeType, icon } = data;

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
                {icon && (
                    <div className="text-primary-600">
                        <i className={icon}></i>
                    </div>
                )}
            </div>
            <div className="flex items-baseline">
                <div className="text-3xl font-bold text-gray-900">{value}</div>
                {change && (
                    <div className={`ml-2 text-sm font-medium ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {changeType === 'increase' ? '↑' : '↓'} {Math.abs(change)}%
                    </div>
                )}
            </div>
            <div className="mt-1 text-sm text-gray-500">{label}</div>
        </div>
    );
}; 