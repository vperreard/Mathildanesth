import React, { memo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarViewType } from '../../types/event';

// Types de vues disponibles dans la barre d'outils
const VIEW_OPTIONS = [
    { value: CalendarViewType.MONTH, label: 'Mois' },
    { value: CalendarViewType.WEEK, label: 'Semaine' },
    { value: CalendarViewType.DAY, label: 'Jour' },
    { value: CalendarViewType.LIST, label: 'Liste' }
];

interface CalendarToolbarProps {
    view: CalendarViewType;
    dateRange: {
        start: Date;
        end: Date;
    };
    onViewChange: (view: CalendarViewType) => void;
    onPrevious: () => void;
    onNext: () => void;
    onToday: () => void;
    showViewSelector?: boolean;
    showExportButton?: boolean;
    onExport?: () => void;
    className?: string;
}

/**
 * Composant de barre d'outils pour le calendrier
 * Gère la navigation entre les périodes et le changement de vue
 */
const CalendarToolbarComponent: React.FC<CalendarToolbarProps> = ({
    view,
    dateRange,
    onViewChange,
    onPrevious,
    onNext,
    onToday,
    showViewSelector = true,
    showExportButton = false,
    onExport,
    className = ''
}) => {
    // Formatage du titre de la plage de dates
    const getDateRangeTitle = () => {
        if (!dateRange.start || !dateRange.end) return '';

        if (view === CalendarViewType.MONTH) {
            return format(dateRange.start, 'MMMM yyyy', { locale: fr });
        } else if (view === CalendarViewType.WEEK) {
            return `${format(dateRange.start, 'dd')} - ${format(dateRange.end, 'dd MMMM yyyy', { locale: fr })}`;
        } else if (view === CalendarViewType.DAY) {
            return format(dateRange.start, 'EEEE dd MMMM yyyy', { locale: fr });
        }

        return `${format(dateRange.start, 'dd/MM/yyyy')} - ${format(dateRange.end, 'dd/MM/yyyy')}`;
    };

    return (
        <div className={`flex flex-wrap items-center justify-between mb-4 ${className}`}>
            {/* Titre et navigation */}
            <div className="flex items-center space-x-2">
                <h2 className="text-xl font-semibold">{getDateRangeTitle()}</h2>
                <div className="flex space-x-1 ml-4">
                    <button
                        onClick={onPrevious}
                        className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                        aria-label="Période précédente"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <button
                        onClick={onToday}
                        className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
                    >
                        Aujourd'hui
                    </button>
                    <button
                        onClick={onNext}
                        className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                        aria-label="Période suivante"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Options de vue et export */}
            <div className="flex space-x-2 mt-2 sm:mt-0">
                {showViewSelector && (
                    <div className="flex rounded-md shadow-sm" role="group">
                        {VIEW_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={`px-3 py-1 text-sm font-medium ${view === option.value
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                    } ${option.value === VIEW_OPTIONS[0].value
                                        ? 'rounded-l-md'
                                        : option.value === VIEW_OPTIONS[VIEW_OPTIONS.length - 1].value
                                            ? 'rounded-r-md'
                                            : ''
                                    }`}
                                onClick={() => onViewChange(option.value)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                )}

                {showExportButton && onExport && (
                    <button
                        onClick={onExport}
                        className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Exporter
                    </button>
                )}
            </div>
        </div>
    );
};

// Utiliser memo pour éviter les rendus inutiles
export const CalendarToolbar = memo(CalendarToolbarComponent); 