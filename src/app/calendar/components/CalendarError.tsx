import React from 'react';

interface CalendarErrorProps {
    error: Error;
}

/**
 * Composant pour afficher les erreurs du calendrier de manière standardisée
 */
export const CalendarError: React.FC<CalendarErrorProps> = ({ error }) => {
    return (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 my-2 rounded-md">
            <div className="flex">
                <div className="flex-shrink-0">
                    <svg
                        className="h-5 w-5 text-red-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </div>
                <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                        Erreur calendrier
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                        <p>{error.message}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarError; 