import React, { useState, useEffect } from 'react';
import { logger } from "../lib/logger";
import { useErrorHandler } from '../hooks/useErrorHandler';
import ErrorDisplay from './ErrorDisplay';

interface ErrorRetryProps<T = any> {
    children: React.ReactNode | ((result: T) => React.ReactNode);
    action: () => Promise<T>;
    fallback?: React.ReactNode;
    maxRetries?: number;
    retryDelay?: number;
    onSuccess?: (result: T) => void;
    onFinalFailure?: (error: Error) => void;
}

/**
 * Composant pour exécuter une action avec récupération automatique en cas d'erreur
 * 
 * Usage:
 * ```jsx
 * <ErrorRetry 
 *   action={() => fetchData()}
 *   maxRetries={3}
 *   retryDelay={1000}
 *   onSuccess={(data) => setData(data)}
 *   onFinalFailure={(error) => logger.error('Échec final:', { error: error })}
 * >
 *   <DataDisplay data={data} />
 * </ErrorRetry>
 * ```
 */
const ErrorRetry = <T = any>({
    children,
    action,
    fallback,
    maxRetries = 3,
    retryDelay = 2000,
    onSuccess,
    onFinalFailure,
}: ErrorRetryProps<T>) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [result, setResult] = useState<T | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [retryCount, setRetryCount] = useState<number>(0);
    const [retrying, setRetrying] = useState<boolean>(false);
    const { setError: setGlobalError } = useErrorHandler();

    const executeAction = async () => {
        setLoading(true);
        setError(null);

        try {
            const actionResult = await action();
            setResult(actionResult);
            setLoading(false);

            if (onSuccess) {
                onSuccess(actionResult);
            }
        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error(String(err));

            if (retryCount < maxRetries) {
                setRetrying(true);
                setRetryCount(prev => prev + 1);

                // Augmenter le délai exponentiellement pour éviter de surcharger le serveur
                const exponentialDelay = retryDelay * Math.pow(1.5, retryCount);

                setTimeout(() => {
                    setRetrying(false);
                    executeAction();
                }, exponentialDelay);
            } else {
                setLoading(false);
                setError(error);

                // Enregistrer l'erreur finale
                setGlobalError('error_retry_max_attempts', {
                    message: `L'opération a échoué après ${maxRetries} tentatives: ${error.message}`,
                    severity: 'error',
                    context: {
                        originalError: error.message,
                        stack: error.stack,
                        retryCount
                    }
                });

                if (onFinalFailure) {
                    onFinalFailure(error);
                }
            }
        }
    };

    const handleManualRetry = () => {
        // Réinitialiser le compteur pour les réessais manuels
        setRetryCount(0);
        executeAction();
    };

    useEffect(() => {
        executeAction();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading) {
        return (
            <div className="p-4 text-center">
                {retrying ? (
                    <div>
                        <svg className="animate-spin h-5 w-5 text-blue-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p>Nouvelle tentative {retryCount}/{maxRetries}...</p>
                    </div>
                ) : (
                    <svg className="animate-spin h-5 w-5 text-gray-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
            </div>
        );
    }

    if (error) {
        return fallback ? (
            <>{fallback}</>
        ) : (
            <ErrorDisplay
                error={error}
                resetError={handleManualRetry}
                severity="warning"
                title={`Échec après ${retryCount} tentative${retryCount > 1 ? 's' : ''}`}
            />
        );
    }

    // Si children est une fonction, l'appeler avec le résultat
    if (typeof children === 'function') {
        return <>{children(result as T)}</>;
    }
    return <>{children}</>;
};

export default ErrorRetry; 