import React from 'react';
import { ErrorSeverity } from '../hooks/useErrorHandler';

interface ErrorDisplayProps {
    error: Error;
    resetError?: () => void;
    severity?: ErrorSeverity;
    title?: string;
    showDetails?: boolean;
}

/**
 * Composant pour afficher les erreurs de manière standardisée
 */
const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
    error,
    resetError,
    severity = 'error',
    title,
    showDetails = false,
}) => {
    // Déterminer le titre en fonction de la sévérité
    const errorTitle = title || {
        info: 'Information',
        warning: 'Attention',
        error: 'Une erreur est survenue',
        critical: 'Erreur critique',
    }[severity];

    // Classes CSS en fonction de la sévérité
    const severityClasses = {
        info: 'bg-blue-100 text-blue-800 border-blue-300',
        warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        error: 'bg-red-100 text-red-800 border-red-300',
        critical: 'bg-red-200 text-red-900 border-red-400',
    }[severity];

    return (
        <div className={`rounded-md p-4 border ${severityClasses} my-4`}>
            <div className="flex items-center">
                <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 9V5a1 1 0 112 0v4a1 1 0 11-2 0zm0 6a1 1 0 112 0 1 1 0 01-2 0z"
                        clipRule="evenodd"
                    />
                </svg>
                <h3 className="text-lg font-medium">{errorTitle}</h3>
            </div>

            <div className="mt-2">
                <p className="text-sm">{error.message}</p>

                {showDetails && error.stack && (
                    <details className="mt-2">
                        <summary className="text-sm cursor-pointer">Détails techniques</summary>
                        <pre className="mt-2 text-xs overflow-auto p-2 bg-gray-50 border border-gray-200 rounded">
                            {error.stack}
                        </pre>
                    </details>
                )}

                {resetError && (
                    <div className="mt-4">
                        <button
                            type="button"
                            onClick={resetError}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Réessayer
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ErrorDisplay; 