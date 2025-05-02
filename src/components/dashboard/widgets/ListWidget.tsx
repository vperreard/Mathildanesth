import React from 'react';
import { ListWidgetData } from '@/types/dashboard';

interface ListWidgetProps {
    title: string;
    data: ListWidgetData;
}

export const ListWidget: React.FC<ListWidgetProps> = ({ title, data }) => {
    const { items, showStatus, showDate } = data;

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
            <ul className="space-y-3">
                {items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                            <span className="w-2 h-2 bg-primary-500 rounded-full mr-2" />
                            <div>
                                <div className="font-medium text-gray-900">{item.title}</div>
                                {item.description && (
                                    <div className="text-sm text-gray-500">{item.description}</div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            {showStatus && item.status && (
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                    }`}>
                                    {item.status}
                                </span>
                            )}
                            {showDate && item.date && (
                                <span className="text-sm text-gray-500">
                                    {new Date(item.date).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}; 