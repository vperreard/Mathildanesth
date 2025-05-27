import React from 'react';
import { CalendarEventType } from '../types/event';

interface CalendarLegendProps {
    showLeaves?: boolean;
    showDuties?: boolean;
    showOnCalls?: boolean;
    showAssignments?: boolean;
    showHolidays?: boolean;
    showOthers?: boolean;
}

export const CalendarLegend: React.FC<CalendarLegendProps> = ({
    showLeaves = true,
    showDuties = true,
    showOnCalls = true,
    showAssignments = true,
    showHolidays = true,
    showOthers = true
}) => {
    const legendItems = [
        {
            id: CalendarEventType.LEAVE,
            color: 'bg-indigo-500',
            label: 'Congés',
            show: showLeaves
        },
        {
            id: CalendarEventType.DUTY,
            color: 'bg-red-500',
            label: 'Gardes',
            show: showDuties
        },
        {
            id: CalendarEventType.ON_CALL,
            color: 'bg-amber-500',
            label: 'Astreintes',
            show: showOnCalls
        },
        {
            id: CalendarEventType.ASSIGNMENT,
            color: 'bg-emerald-500',
            label: 'Affectations',
            show: showAssignments
        },
        {
            id: CalendarEventType.HOLIDAY,
            color: 'bg-purple-500',
            label: 'Jours fériés',
            show: showHolidays
        },
        {
            id: CalendarEventType.OTHER,
            color: 'bg-gray-500',
            label: 'Autres',
            show: showOthers
        }
    ];

    return (
        <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Légende</h3>

            <div className="space-y-2">
                {legendItems
                    .filter(item => item.show)
                    .map(item => (
                        <div key={item.id} className="flex items-center">
                            <div className={`h-4 w-4 rounded-full ${item.color} mr-2`} />
                            <span className="text-sm text-gray-600">{item.label}</span>
                        </div>
                    ))}
            </div>

            {showHolidays && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center">
                        <div className="h-4 w-4 rounded-full bg-purple-100 border border-purple-500 mr-2 relative">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs text-purple-600 font-bold">F</span>
                            </div>
                        </div>
                        <span className="text-sm text-gray-600">Jour férié (calendrier)</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// Fonction utilitaire pour obtenir une couleur en fonction d'un index
function getColorForIndex(index: number): string {
    const colors = [
        '#EF4444', // red-500
        '#F59E0B', // amber-500
        '#10B981', // emerald-500
        '#3B82F6', // blue-500
        '#6366F1', // indigo-500
        '#8B5CF6', // violet-500
        '#EC4899', // pink-500
        '#14B8A6', // teal-500
        '#F97316', // orange-500
        '#06B6D4', // cyan-500
        '#84CC16', // lime-500
        '#9333EA', // purple-500
        '#F43F5E', // rose-500
        '#0EA5E9', // sky-500
        '#22D3EE', // cyan-400
        '#4ADE80', // green-400
        '#A78BFA', // violet-400
        '#FB7185', // rose-400
        '#FBBF24', // amber-400
        '#2DD4BF', // teal-400
    ];

    return colors[index % colors.length];
}