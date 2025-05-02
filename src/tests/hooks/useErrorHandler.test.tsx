import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { logError } from '../../services/errorLoggingService';

// Mock du service de logging
jest.mock('../../services/errorLoggingService', () => ({
    logError: jest.fn(),
}));

describe('useErrorHandler Hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('devrait initialiser l\'état sans erreurs', () => {
        const { result } = renderHook(() => useErrorHandler());

        expect(result.current.errorState.hasError).toBe(false);
        expect(Object.keys(result.current.errorState.errors)).toHaveLength(0);
        expect(result.current.errorState.globalError).toBeUndefined();
    });

    test('devrait définir une erreur spécifique', () => {
        const { result } = renderHook(() => useErrorHandler());

        act(() => {
            result.current.setError('testError', {
                message: 'Test error message',
                severity: 'error',
            });
        });

        expect(result.current.errorState.hasError).toBe(true);
        expect(result.current.errorState.errors.testError).toBeDefined();
        expect(result.current.errorState.errors.testError.message).toBe('Test error message');
        expect(result.current.errorState.errors.testError.severity).toBe('error');
        expect(result.current.errorState.errors.testError.timestamp).toBeInstanceOf(Date);
        expect(logError).toHaveBeenCalledWith('testError', expect.objectContaining({
            message: 'Test error message',
            severity: 'error',
        }));
    });

    test('devrait définir une erreur globale pour les erreurs critiques', () => {
        const { result } = renderHook(() => useErrorHandler());

        act(() => {
            result.current.setError('criticalError', {
                message: 'Critical error',
                severity: 'critical',
            });
        });

        expect(result.current.errorState.hasError).toBe(true);
        expect(result.current.errorState.globalError).toBeDefined();
        expect(result.current.errorState.globalError?.message).toBe('Critical error');
        expect(result.current.errorState.globalError?.severity).toBe('critical');
    });

    test('devrait définir une erreur globale directement', () => {
        const { result } = renderHook(() => useErrorHandler());

        act(() => {
            result.current.setGlobalError({
                message: 'Global error message',
                severity: 'error',
            });
        });

        expect(result.current.errorState.hasError).toBe(true);
        expect(result.current.errorState.globalError).toBeDefined();
        expect(result.current.errorState.globalError?.message).toBe('Global error message');
        expect(logError).toHaveBeenCalledWith('global', expect.objectContaining({
            message: 'Global error message',
        }));
    });

    test('devrait effacer une erreur spécifique', () => {
        const { result } = renderHook(() => useErrorHandler());

        act(() => {
            result.current.setError('error1', {
                message: 'Error 1',
                severity: 'warning',
            });

            result.current.setError('error2', {
                message: 'Error 2',
                severity: 'error',
            });
        });

        expect(Object.keys(result.current.errorState.errors)).toHaveLength(2);

        act(() => {
            result.current.clearError('error1');
        });

        expect(Object.keys(result.current.errorState.errors)).toHaveLength(1);
        expect(result.current.errorState.errors.error1).toBeUndefined();
        expect(result.current.errorState.errors.error2).toBeDefined();
        expect(result.current.errorState.hasError).toBe(true);
    });

    test('devrait effacer une erreur globale', () => {
        const { result } = renderHook(() => useErrorHandler());

        act(() => {
            result.current.setGlobalError({
                message: 'Global error',
                severity: 'critical',
            });
        });

        expect(result.current.errorState.globalError).toBeDefined();

        act(() => {
            result.current.clearGlobalError();
        });

        expect(result.current.errorState.globalError).toBeUndefined();
        expect(result.current.errorState.hasError).toBe(false);
    });

    test('devrait effacer toutes les erreurs', () => {
        const { result } = renderHook(() => useErrorHandler());

        act(() => {
            result.current.setError('error1', {
                message: 'Error 1',
                severity: 'warning',
            });

            result.current.setGlobalError({
                message: 'Global error',
                severity: 'critical',
            });
        });

        expect(result.current.errorState.hasError).toBe(true);
        expect(Object.keys(result.current.errorState.errors)).toHaveLength(1);
        expect(result.current.errorState.globalError).toBeDefined();

        act(() => {
            result.current.clearAllErrors();
        });

        expect(result.current.errorState.hasError).toBe(false);
        expect(Object.keys(result.current.errorState.errors)).toHaveLength(0);
        expect(result.current.errorState.globalError).toBeUndefined();
    });

    test('devrait vérifier si une erreur existe', () => {
        const { result } = renderHook(() => useErrorHandler());

        expect(result.current.hasError('testError')).toBe(false);
        expect(result.current.hasError()).toBe(false);

        act(() => {
            result.current.setError('testError', {
                message: 'Test error',
                severity: 'warning',
            });
        });

        expect(result.current.hasError('testError')).toBe(true);
        expect(result.current.hasError()).toBe(true);
        expect(result.current.hasError('nonExistentError')).toBe(false);
    });

    test('devrait obtenir le message d\'erreur', () => {
        const { result } = renderHook(() => useErrorHandler());

        expect(result.current.getErrorMessage('testError')).toBe('');

        act(() => {
            result.current.setError('testError', {
                message: 'Test error message',
                severity: 'warning',
            });
        });

        expect(result.current.getErrorMessage('testError')).toBe('Test error message');
        expect(result.current.getErrorMessage('nonExistentError')).toBe('');
    });

    test('devrait gérer les erreurs API', async () => {
        const { result } = renderHook(() => useErrorHandler());

        const apiError = {
            response: {
                data: {
                    message: 'API error message',
                    code: 'API_ERROR',
                    details: { field: 'username' }
                },
                status: 400
            },
            config: {
                url: '/api/test',
                method: 'POST'
            }
        };

        await act(async () => {
            await result.current.handleApiError(apiError, 'apiError');
        });

        expect(result.current.errorState.errors.apiError).toBeDefined();
        expect(result.current.errorState.errors.apiError.message).toBe('API error message');
        expect(result.current.errorState.errors.apiError.code).toBe('API_ERROR');
        expect(result.current.errorState.errors.apiError.context).toEqual(
            expect.objectContaining({
                status: 400,
                url: '/api/test',
                method: 'POST',
                field: 'username'
            })
        );

        // Test erreur critique (500+)
        const criticalApiError = {
            response: {
                status: 500
            },
            message: 'Server error'
        };

        await act(async () => {
            await result.current.handleApiError(criticalApiError);
        });

        expect(result.current.errorState.globalError).toBeDefined();
        expect(result.current.errorState.globalError?.severity).toBe('critical');
        expect(result.current.errorState.globalError?.message).toBe('Server error');
    });

    test('devrait gérer la fonction de réessai (retry)', async () => {
        const { result } = renderHook(() => useErrorHandler());
        const retryFn = jest.fn().mockResolvedValue(undefined);

        act(() => {
            result.current.setError('retryableError', {
                message: 'Erreur avec fonction de réessai',
                severity: 'error',
                retry: retryFn
            });
        });

        expect(result.current.errorState.errors.retryableError).toBeDefined();
        expect(result.current.errorState.errors.retryableError.retry).toBe(retryFn);

        // Exécuter la fonction de réessai
        await act(async () => {
            await result.current.errorState.errors.retryableError.retry?.();
        });

        expect(retryFn).toHaveBeenCalledTimes(1);
    });

    test('devrait gérer les erreurs sans objet response', async () => {
        const { result } = renderHook(() => useErrorHandler());

        const simpleError = new Error('Erreur simple sans réponse API');

        await act(async () => {
            await result.current.handleApiError(simpleError);
        });

        expect(result.current.errorState.globalError).toBeDefined();
        expect(result.current.errorState.globalError?.message).toBe('Erreur simple sans réponse API');
        expect(result.current.errorState.globalError?.code).toBe('API_500');
        expect(result.current.errorState.globalError?.severity).toBe('critical');
    });

    test('devrait conserver l\'état d\'erreur global quand il y a des erreurs spécifiques', () => {
        const { result } = renderHook(() => useErrorHandler());

        // Ajouter une erreur globale
        act(() => {
            result.current.setGlobalError({
                message: 'Erreur globale',
                severity: 'critical'
            });
        });

        // Ajouter une erreur spécifique
        act(() => {
            result.current.setError('fieldError', {
                message: 'Erreur de champ',
                severity: 'warning',
                field: 'email'
            });
        });

        // Supprimer l'erreur spécifique
        act(() => {
            result.current.clearError('fieldError');
        });

        // L'état global d'erreur doit rester à true car l'erreur globale existe toujours
        expect(result.current.errorState.hasError).toBe(true);
        expect(result.current.errorState.globalError).toBeDefined();
        expect(Object.keys(result.current.errorState.errors)).toHaveLength(0);
    });
}); 