import { renderHook, act } from '@testing-library/react';
import { useErrorHandler, ErrorSeverity } from '../useErrorHandler';
import * as errorLoggingService from '../../services/errorLoggingService';

jest.mock('../../services/errorLoggingService', () => ({
  logError: jest.fn(),
}));

describe('useErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useErrorHandler());

      expect(result.current.errorState).toEqual({
        hasError: false,
        errors: {},
        globalError: undefined,
      });
      expect(result.current.hasError()).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set a specific error', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.setError('testKey', {
          message: 'Test error',
          severity: 'error' as ErrorSeverity,
        });
      });

      expect(result.current.errorState.hasError).toBe(true);
      expect(result.current.errorState.errors.testKey).toMatchObject({
        message: 'Test error',
        severity: 'error',
        timestamp: expect.any(Date),
      });
      expect(result.current.hasError('testKey')).toBe(true);
    });

    it('should set global error for critical severity', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.setError('criticalKey', {
          message: 'Critical error',
          severity: 'critical' as ErrorSeverity,
        });
      });

      expect(result.current.errorState.globalError).toMatchObject({
        message: 'Critical error',
        severity: 'critical',
      });
    });

    it('should log error for error and critical severity', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.setError('errorKey', {
          message: 'Error message',
          severity: 'error' as ErrorSeverity,
        });
      });

      expect(errorLoggingService.logError).toHaveBeenCalledWith(
        'errorKey',
        expect.objectContaining({
          message: 'Error message',
          severity: 'error',
        })
      );
    });

    it('should not log error for info and warning severity', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.setError('infoKey', {
          message: 'Info message',
          severity: 'info' as ErrorSeverity,
        });
      });

      expect(errorLoggingService.logError).not.toHaveBeenCalled();
    });

    it('should include optional fields', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.setError('detailedKey', {
          message: 'Detailed error',
          severity: 'error' as ErrorSeverity,
          code: 'ERR_001',
          field: 'username',
          context: { userId: 123 },
          retry: async () => {},
        });
      });

      const error = result.current.errorState.errors.detailedKey;
      expect(error).toMatchObject({
        message: 'Detailed error',
        code: 'ERR_001',
        field: 'username',
        context: { userId: 123 },
        retry: expect.any(Function),
      });
    });
  });

  describe('setGlobalError', () => {
    it('should set global error', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.setGlobalError({
          message: 'Global error',
          severity: 'critical' as ErrorSeverity,
        });
      });

      expect(result.current.errorState.globalError).toMatchObject({
        message: 'Global error',
        severity: 'critical',
      });
      expect(result.current.errorState.hasError).toBe(true);
    });

    it('should always log global errors', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.setGlobalError({
          message: 'Global info',
          severity: 'info' as ErrorSeverity,
        });
      });

      expect(errorLoggingService.logError).toHaveBeenCalledWith(
        'global',
        expect.objectContaining({
          message: 'Global info',
          severity: 'info',
        })
      );
    });
  });

  describe('clearError', () => {
    it('should clear specific error', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.setError('key1', {
          message: 'Error 1',
          severity: 'error' as ErrorSeverity,
        });
        result.current.setError('key2', {
          message: 'Error 2',
          severity: 'error' as ErrorSeverity,
        });
      });

      act(() => {
        result.current.clearError('key1');
      });

      expect(result.current.errorState.errors.key1).toBeUndefined();
      expect(result.current.errorState.errors.key2).toBeDefined();
      expect(result.current.hasError('key1')).toBe(false);
      expect(result.current.hasError('key2')).toBe(true);
    });

    it('should update hasError state correctly', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.setError('onlyKey', {
          message: 'Only error',
          severity: 'error' as ErrorSeverity,
        });
      });

      act(() => {
        result.current.clearError('onlyKey');
      });

      expect(result.current.errorState.hasError).toBe(false);
    });
  });

  describe('clearGlobalError', () => {
    it('should clear global error', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.setGlobalError({
          message: 'Global error',
          severity: 'critical' as ErrorSeverity,
        });
      });

      act(() => {
        result.current.clearGlobalError();
      });

      expect(result.current.errorState.globalError).toBeUndefined();
    });

    it('should maintain hasError if other errors exist', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.setError('specificKey', {
          message: 'Specific error',
          severity: 'error' as ErrorSeverity,
        });
        result.current.setGlobalError({
          message: 'Global error',
          severity: 'critical' as ErrorSeverity,
        });
      });

      act(() => {
        result.current.clearGlobalError();
      });

      expect(result.current.errorState.hasError).toBe(true);
      expect(result.current.errorState.globalError).toBeUndefined();
    });
  });

  describe('clearAllErrors', () => {
    it('should clear all errors', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.setError('key1', {
          message: 'Error 1',
          severity: 'error' as ErrorSeverity,
        });
        result.current.setGlobalError({
          message: 'Global error',
          severity: 'critical' as ErrorSeverity,
        });
      });

      act(() => {
        result.current.clearAllErrors();
      });

      expect(result.current.errorState).toEqual({
        hasError: false,
        errors: {},
        globalError: undefined,
      });
    });
  });

  describe('getErrorMessage', () => {
    it('should return error message for existing key', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.setError('testKey', {
          message: 'Test message',
          severity: 'error' as ErrorSeverity,
        });
      });

      expect(result.current.getErrorMessage('testKey')).toBe('Test message');
    });

    it('should return empty string for non-existing key', () => {
      const { result } = renderHook(() => useErrorHandler());

      expect(result.current.getErrorMessage('nonExistingKey')).toBe('');
    });
  });

  describe('hasError', () => {
    it('should return true for specific error when key exists', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.setError('testKey', {
          message: 'Test error',
          severity: 'error' as ErrorSeverity,
        });
      });

      expect(result.current.hasError('testKey')).toBe(true);
    });

    it('should return false for specific error when key does not exist', () => {
      const { result } = renderHook(() => useErrorHandler());

      expect(result.current.hasError('nonExistingKey')).toBe(false);
    });

    it('should return global error state when no key provided', () => {
      const { result } = renderHook(() => useErrorHandler());

      expect(result.current.hasError()).toBe(false);

      act(() => {
        result.current.setError('anyKey', {
          message: 'Any error',
          severity: 'error' as ErrorSeverity,
        });
      });

      expect(result.current.hasError()).toBe(true);
    });
  });

  describe('handleApiError', () => {
    it('should handle API error with response', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      const apiError = {
        response: {
          status: 404,
          data: {
            message: 'Resource not found',
            code: 'NOT_FOUND',
            details: { resource: 'user' },
          },
        },
        config: {
          url: '/api/users/123',
          method: 'GET',
        },
      };

      act(() => {
        result.current.handleApiError(apiError, 'apiKey');
      });

      const error = result.current.errorState.errors.apiKey;
      expect(error).toMatchObject({
        message: 'Resource not found',
        code: 'NOT_FOUND',
        severity: 'error',
        context: {
          status: 404,
          url: '/api/users/123',
          method: 'GET',
          resource: 'user',
        },
      });
    });

    it('should handle server error as critical', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      const serverError = {
        response: {
          status: 500,
          data: {
            message: 'Internal server error',
          },
        },
      };

      act(() => {
        result.current.handleApiError(serverError, 'serverKey');
      });

      expect(result.current.errorState.errors.serverKey.severity).toBe('critical');
    });

    it('should handle error without response', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      const networkError = {
        message: 'Network Error',
      };

      act(() => {
        result.current.handleApiError(networkError, 'networkKey');
      });

      const error = result.current.errorState.errors.networkKey;
      expect(error).toMatchObject({
        message: 'Network Error',
        code: 'API_500',
        severity: 'critical',
      });
    });

    it('should set as global error when no key provided', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      const apiError = {
        response: {
          status: 401,
          data: {
            message: 'Unauthorized',
          },
        },
      };

      act(() => {
        result.current.handleApiError(apiError);
      });

      expect(result.current.errorState.globalError).toMatchObject({
        message: 'Unauthorized',
        severity: 'error',
      });
    });
  });

  describe('Error state management', () => {
    it('should maintain error state consistency', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.setError('error1', {
          message: 'Error 1',
          severity: 'error' as ErrorSeverity,
        });
        result.current.setError('error2', {
          message: 'Error 2',
          severity: 'warning' as ErrorSeverity,
        });
        result.current.setGlobalError({
          message: 'Global error',
          severity: 'critical' as ErrorSeverity,
        });
      });

      expect(result.current.errorState.hasError).toBe(true);
      expect(Object.keys(result.current.errorState.errors)).toHaveLength(2);
      expect(result.current.errorState.globalError).toBeDefined();

      act(() => {
        result.current.clearError('error1');
      });

      expect(result.current.errorState.hasError).toBe(true);
      expect(Object.keys(result.current.errorState.errors)).toHaveLength(1);

      act(() => {
        result.current.clearError('error2');
      });

      expect(result.current.errorState.hasError).toBe(true); // Still has global error

      act(() => {
        result.current.clearGlobalError();
      });

      expect(result.current.errorState.hasError).toBe(false);
    });
  });

  describe('Retry and Fallback Scenarios', () => {
    it('should execute retry function when provided', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const retryFn = jest.fn().mockResolvedValue(undefined);

      act(() => {
        result.current.setError('retryable-error', {
          message: 'Retryable error',
          severity: 'error' as ErrorSeverity,
          retry: retryFn,
        });
      });

      const error = result.current.errorState.errors['retryable-error'];
      expect(error.retry).toBe(retryFn);

      // Execute retry function
      await act(async () => {
        if (error.retry) {
          await error.retry();
        }
      });

      expect(retryFn).toHaveBeenCalledTimes(1);
    });

    it('should support contextual error information for fallback strategies', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.setError('contextual-error', {
          message: 'Operation failed',
          severity: 'error' as ErrorSeverity,
          context: {
            operation: 'data-fetch',
            fallbackAvailable: true,
            fallbackUrl: '/api/cached-data',
            userAction: 'retry',
            timestamp: Date.now(),
          },
        });
      });

      const error = result.current.errorState.errors['contextual-error'];
      expect(error.context).toEqual({
        operation: 'data-fetch',
        fallbackAvailable: true,
        fallbackUrl: '/api/cached-data',
        userAction: 'retry',
        timestamp: expect.any(Number),
      });
    });
  });

  describe('Edge Cases and Error Boundaries', () => {
    it('should handle undefined retry functions gracefully', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      act(() => {
        result.current.setError('no-retry-error', {
          message: 'Error without retry',
          severity: 'error' as ErrorSeverity,
          retry: undefined,
        });
      });

      const error = result.current.errorState.errors['no-retry-error'];
      expect(error).toBeDefined();
      expect(error.retry).toBeUndefined();
    });

    it('should handle basic context objects', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      const basicContext = { operation: 'test', userId: 123 };
      
      act(() => {
        result.current.setError('context-error', {
          message: 'Error with context',
          severity: 'error' as ErrorSeverity,
          context: basicContext,
        });
      });

      const error = result.current.errorState.errors['context-error'];
      expect(error).toBeDefined();
      expect(error.context).toEqual(basicContext);
    });

    it('should handle overwriting errors', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      // Set initial error
      act(() => {
        result.current.setError('overwrite-error', {
          message: 'Original error',
          severity: 'warning' as ErrorSeverity,
        });
      });

      // Overwrite with new error
      act(() => {
        result.current.setError('overwrite-error', {
          message: 'Updated error',
          severity: 'error' as ErrorSeverity,
        });
      });

      const error = result.current.errorState.errors['overwrite-error'];
      expect(error).toBeDefined();
      expect(error.message).toBe('Updated error');
      expect(error.severity).toBe('error');
    });
  });
});