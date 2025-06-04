import React from 'react';

/**
 * Composant pour afficher un indicateur de chargement pour le calendrier
 */
export const CalendarLoading: React.FC = () => {
    return (
        <div className="relative flex items-center justify-center min-h-[200px] w-full bg-white/80 rounded-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="sr-only">Chargement...</span>
        </div>
    );
};

export default CalendarLoading; 