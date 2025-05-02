"use client";

import React from 'react';
import ErrorDisplay from '../ErrorDisplay';

// Fallback pour le calendrier collectif
export const CalendarErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({
    error,
    resetError
}) => (
    <ErrorDisplay
        error={error}
        resetError={resetError}
        title="Erreur lors de l'affichage du calendrier"
        severity="warning"
    />
);

// Fallback pour le widget dashboard
export const DashboardWidgetErrorFallback: React.FC<{
    error: Error;
    resetError: () => void;
    widgetTitle?: string
}> = ({
    error,
    resetError,
    widgetTitle = 'Widget'
}) => (
        <ErrorDisplay
            error={error}
            resetError={resetError}
            title={`Erreur dans le widget '${widgetTitle}'`}
            severity="warning"
        />
    );

// Fallback pour le layout principal
export const LayoutErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({
    error,
    resetError
}) => (
    <div className="flex flex-col items-center justify-center h-full">
        <ErrorDisplay
            error={error}
            resetError={resetError}
            title="Erreur lors de l'affichage de la page"
        />
    </div>
);

// Fallback personnalisable (pour les tests ou usages spécifiques)
export const CustomErrorFallback: React.FC<{
    error: Error;
    resetError: () => void;
    message?: string;
    buttonText?: string;
}> = ({
    error,
    resetError,
    message = 'Message personnalisé',
    buttonText = 'Reset personnalisé'
}) => (
        <div>
            <p>{message}: {error.message}</p>
            <button onClick={resetError}>{buttonText}</button>
        </div>
    ); 