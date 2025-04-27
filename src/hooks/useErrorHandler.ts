import { useState, useCallback } from 'react';
import { logError } from '../services/errorLoggingService';

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface ErrorDetails {
    message: string;
    code?: string;
    field?: string;
    severity: ErrorSeverity;
    timestamp: Date;
    context?: Record<string, any>;
    retry?: () => Promise<void>;
}

export interface ErrorState {
    hasError: boolean;
    errors: Record<string, ErrorDetails>;
    globalError?: ErrorDetails;
}

export const useErrorHandler = () => {
    const [errorState, setErrorState] = useState<ErrorState>({
        hasError: false,
        errors: {},
    });

    const setError = useCallback((key: string, details: Omit<ErrorDetails, 'timestamp'>) => {
        const errorDetails: ErrorDetails = {
            ...details,
            timestamp: new Date(),
        };

        setErrorState(prev => ({
            hasError: true,
            errors: {
                ...prev.errors,
                [key]: errorDetails,
            },
            globalError: details.severity === 'critical' ? errorDetails : prev.globalError,
        }));

        // Envoyer au service de logging si c'est une erreur importante
        if (details.severity === 'error' || details.severity === 'critical') {
            logError(key, errorDetails);
        }

        return errorDetails;
    }, []);

    const setGlobalError = useCallback((details: Omit<ErrorDetails, 'timestamp'>) => {
        const errorDetails: ErrorDetails = {
            ...details,
            timestamp: new Date(),
        };

        setErrorState(prev => ({
            ...prev,
            hasError: true,
            globalError: errorDetails,
        }));

        // Toujours logger les erreurs globales
        logError('global', errorDetails);

        return errorDetails;
    }, []);

    const clearError = useCallback((key: string) => {
        setErrorState(prev => {
            const newErrors = { ...prev.errors };
            delete newErrors[key];

            return {
                ...prev,
                errors: newErrors,
                hasError: Object.keys(newErrors).length > 0 || !!prev.globalError,
            };
        });
    }, []);

    const clearGlobalError = useCallback(() => {
        setErrorState(prev => ({
            ...prev,
            globalError: undefined,
            hasError: Object.keys(prev.errors).length > 0,
        }));
    }, []);

    const clearAllErrors = useCallback(() => {
        setErrorState({
            hasError: false,
            errors: {},
            globalError: undefined,
        });
    }, []);

    const getErrorMessage = useCallback((key: string) => {
        return errorState.errors[key]?.message || '';
    }, [errorState.errors]);

    const hasError = useCallback((key?: string) => {
        if (key) {
            return !!errorState.errors[key];
        }
        return errorState.hasError;
    }, [errorState]);

    const handleApiError = useCallback(async (error: any, key?: string) => {
        const errorResponse = error.response?.data || {};
        const status = error.response?.status || 500;

        const errorDetails: Omit<ErrorDetails, 'timestamp'> = {
            message: errorResponse.message || error.message || 'Une erreur est survenue',
            code: errorResponse.code || `API_${status}`,
            severity: status >= 500 ? 'critical' : 'error',
            context: {
                status,
                url: error.config?.url,
                method: error.config?.method,
                ...errorResponse.details,
            },
        };

        if (key) {
            return setError(key, errorDetails);
        } else {
            return setGlobalError(errorDetails);
        }
    }, [setError, setGlobalError]);

    return {
        setError,
        setGlobalError,
        clearError,
        clearGlobalError,
        clearAllErrors,
        getErrorMessage,
        hasError,
        handleApiError,
        errorState,
    };
}; 