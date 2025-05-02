import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarViewType } from '../../types/event';

interface CalendarHeaderProps {
    title: string;
    description?: string;
    view: CalendarViewType;
    currentRange: { start: Date; end: Date };
    onViewChange: (view: CalendarViewType) => void;
    onPrevious: () => void;
    onNext: () => void;
    onToday: () => void;
    extraActions?: React.ReactNode;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
    title,
    description,
    view,
    currentRange,
    onViewChange,
    onPrevious,
    onNext,
    onToday,
    extraActions
}) => {
    // Formatage du titre de la plage de dates
    const getDateRangeTitle = () => {
        if (!currentRange.start || !currentRange.end) return '';

        if (view === CalendarViewType.MONTH) {
            return format(currentRange.start, 'MMMM yyyy', { locale: fr });
        } else if (view === CalendarViewType.WEEK) {
            return `${format(currentRange.start, 'dd')} - ${format(currentRange.end, 'dd MMMM yyyy', { locale: fr })}`;
        } else if (view === CalendarViewType.DAY) {
            return format(currentRange.start, 'EEEE dd MMMM yyyy', { locale: fr });
        }

        return `${format(currentRange.start, 'dd/MM/yyyy')} - ${format(currentRange.end, 'dd/MM/yyyy')}`;
    };

    return (
        <div className="bg-white shadow rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">{title}</h2>
                    {description && <p className="text-sm text-gray-500">{description}</p>}
                </div>

                <div className="flex flex-wrap gap-2 justify-end mt-3 sm:mt-0">
                    {/* Navigation buttons */}
                    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                        <button
                            onClick={onPrevious}
                            className="p-2 hover:bg-gray-100"
                            aria-label="Période précédente"
                        >
                            <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <button
                            onClick={onToday}
                            className="px-3 py-2 hover:bg-gray-100 border-l border-r border-gray-300 text-sm"
                        >
                            Aujourd&#39;hui
                        </button>

                        <button
                            onClick={onNext}
                            className="p-2 hover:bg-gray-100"
                            aria-label="Période suivante"
                        >
                            <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* View selector */}
                    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                        <button
                            onClick={() => onViewChange(CalendarViewType.MONTH)}
                            className={`px-3 py-2 text-sm ${view === CalendarViewType.MONTH ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
                        >
                            Mois
                        </button>

                        <button
                            onClick={() => onViewChange(CalendarViewType.WEEK)}
                            className={`px-3 py-2 text-sm border-l border-gray-300 ${view === CalendarViewType.WEEK ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
                        >
                            Semaine
                        </button>

                        <button
                            onClick={() => onViewChange(CalendarViewType.DAY)}
                            className={`px-3 py-2 text-sm border-l border-gray-300 ${view === CalendarViewType.DAY ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
                        >
                            Jour
                        </button>

                        <button
                            onClick={() => onViewChange(CalendarViewType.LIST)}
                            className={`px-3 py-2 text-sm border-l border-gray-300 ${view === CalendarViewType.LIST ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
                        >
                            Liste
                        </button>
                    </div>

                    {/* Extra actions */}
                    {extraActions}
                </div>
            </div>

            <div className="mt-2 text-sm text-gray-500">
                {getDateRangeTitle()}
            </div>
        </div>
    );
}; 