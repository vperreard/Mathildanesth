import React from 'react';

export const CalendarLoadingOverlay: React.FC = () => {
    return (
        <div className="calendar-loading-overlay">
            <div className="flex flex-col items-center justify-center h-full">
                <div className="calendar-loading-spinner mb-2"></div>
                <p className="text-sm text-gray-600">Chargement du calendrier...</p>
            </div>
        </div>
    );
}; 