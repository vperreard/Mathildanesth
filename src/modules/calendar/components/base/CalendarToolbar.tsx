import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { CalendarViewType } from '../../types/event';

interface CalendarToolbarProps {
    view: CalendarViewType;
    onViewChange: (view: CalendarViewType) => void;
    onNavigatePrevious: () => void;
    onNavigateNext: () => void;
    onNavigateToday: () => void;
    onRefresh?: () => void;
    isLoading?: boolean;
    currentMonthLabel?: string;
    className?: string;
    showViewSelector?: boolean;
    showRefreshButton?: boolean;
}

/**
 * Barre d'outils réutilisable pour les calendriers
 * Gère la navigation, le changement de vue et le rafraîchissement
 */
export const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
    view,
    onViewChange,
    onNavigatePrevious,
    onNavigateNext,
    onNavigateToday,
    onRefresh,
    isLoading = false,
    currentMonthLabel,
    className = '',
    showViewSelector = true,
    showRefreshButton = true
}) => {
    // Gestionnaire de changement de vue
    const handleViewChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        onViewChange(e.target.value as CalendarViewType);
    }, [onViewChange]);

    return (
        <div className={`flex flex-wrap items-center justify-between gap-2 mb-4 ${className}`}>
            {/* Groupe de navigation */}
            <div className="flex items-center gap-2">
                <div className="flex">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onNavigatePrevious}
                        aria-label="Précédent"
                        className="rounded-r-none"
                    >
                        <ChevronLeft size={16} />
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onNavigateToday}
                        aria-label="Aujourd'hui"
                        className="rounded-none border-x-0"
                    >
                        Aujourd'hui
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onNavigateNext}
                        aria-label="Suivant"
                        className="rounded-l-none"
                    >
                        <ChevronRight size={16} />
                    </Button>
                </div>

                {currentMonthLabel && (
                    <div className="text-lg font-medium ml-4">
                        {currentMonthLabel}
                    </div>
                )}
            </div>

            {/* Contrôles supplémentaires */}
            <div className="flex items-center gap-2">
                {showViewSelector && (
                    <select
                        value={view}
                        onChange={handleViewChange}
                        aria-label="Changer de vue"
                        className="form-select h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                    >
                        <option value={CalendarViewType.MONTH}>Mois</option>
                        <option value={CalendarViewType.WEEK}>Semaine</option>
                        <option value={CalendarViewType.DAY}>Jour</option>
                        <option value={CalendarViewType.LIST}>Liste</option>
                    </select>
                )}

                {showRefreshButton && onRefresh && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRefresh}
                        disabled={isLoading}
                        aria-label="Rafraîchir"
                    >
                        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    </Button>
                )}
            </div>
        </div>
    );
}; 