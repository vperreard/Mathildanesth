import { renderHook, act } from '@testing-library/react';
import { useErrorHandler, ErrorSeverity } from '../useErrorHandler';
import { logError } from '../../services/errorLoggingService';

// Mock the error logging service
jest.mock('../../services/errorLoggingService', () => ({
  logError: jest.fn(),
}));

describe('useErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-06-04T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initial state', () => {
    it('should have no errors initially', () => {
      const { result } = renderHook(() => useErrorHandler());

      expect(result.current.errorState).toEqual({
        hasError: false,
        errors: {},
        globalError: undefined,
      });
    });
  });

  describe('setError', () => {
    it('should add an error with key', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.setError('validation', {
          message: 'Field is required',
          severity: 'error',
          field: 'email',
        });
      });

      expect(result.current.errorState.hasError).toBe(true);
      expect(result.current.errorState.errors.validation).toEqual({
        message: 'Field is required',
        severity: 'error',
        field: 'email',
        timestamp: new Date('2025-06-04T12:00:00Z'),
      });
    });

    it('should log error and critical severity errors', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.setError('api-error', {
          message: 'Server error',
          severity: 'error',
        });
      });

      expect(logError).toHaveBeenCalledWith(
        'api-error',
        expect.objectContaining({
          message: 'Server error',
          severity: 'error',
        })
      );
    });

    it('should not log info and warning severity errors', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.setError('info-msg', {
          message: 'Info message',
          severity: 'info',
        });
        result.current.setError('warn-msg', {
          message: 'Warning message',
          severity: 'warning',
        });
      });

      expect(logError).not.toHaveBeenCalled();
    });

    it('should set globalError for critical errors', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.setError('critical-error', {
          message: 'Critical failure',
          severity: 'critical',
        });
      });

      expect(result.current.errorState.globalError).toEqual({
        message: 'Critical failure',
        severity: 'critical',
        timestamp: new Date('2025-06-04T12:00:00Z'),
      });
    });
  });

  describe('setGlobalError', () => {
    it('should set global error and log it', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.setGlobalError({
          message: 'Global error occurred',
          severity: 'error',
          code: 'GLOBAL_001',
        });
      });

      expect(result.current.errorState.hasError).toBe(true);
      expect(result.current.errorState.globalError).toEqual({
        message: 'Global error occurred',
        severity: 'error',
        code: 'GLOBAL_001',
        timestamp: new Date('2025-06-04T12:00:00Z'),
      });

      expect(logError).toHaveBeenCalledWith(
        'global',
        expect.objectContaining({
          message: 'Global error occurred',
        })
      );
    });
  });

  describe('clearError', () => {
    it('should remove specific error', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.setError('error1', { message: 'Error 1', severity: 'error' });
        result.current.setError('error2', { message: 'Error 2', severity: 'error' });
      });

      act(() => {
        result.current.clearError('error1');
      });

      expect(result.current.errorState.errors.error1).toBeUndefined();
      expect(result.current.errorState.errors.error2).toBeDefined();
      expect(result.current.errorState.hasError).toBe(true);
    });

    it('should update hasError when all errors are cleared', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.setError('error1', { message: 'Error 1', severity: 'error' });
      });

      act(() => {
        result.current.clearError('error1');
      });

      expect(result.current.errorState.hasError).toBe(false);
    });
  });

  describe('clearGlobalError', () => {
    it('should clear global error', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.setGlobalError({ message: 'Global error', severity: 'error' });
        result.current.setError('local', { message: 'Local error', severity: 'error' });
      });

      act(() => {
        result.current.clearGlobalError();
      });

      expect(result.current.errorState.globalError).toBeUndefined();
      expect(result.current.errorState.hasError).toBe(true); // Still has local error
    });
  });

  describe('clearAllErrors', () => {
    it('should clear all errors and reset state', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.setGlobalError({ message: 'Global error', severity: 'error' });
        result.current.setError('error1', { message: 'Error 1', severity: 'error' });
        result.current.setError('error2', { message: 'Error 2', severity: 'error' });
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
    it('should return error message for key', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.setError('validation', { message: 'Invalid input', severity: 'error' });
      });

      expect(result.current.getErrorMessage('validation')).toBe('Invalid input');
    });

    it('should return empty string for non-existent key', () => {
      const { result } = renderHook(() => useErrorHandler());

      expect(result.current.getErrorMessage('nonexistent')).toBe('');
    });
  });

  describe('hasError', () => {
    it('should return true if specific error exists', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.setError('field', { message: 'Error', severity: 'error' });
      });

      expect(result.current.hasError('field')).toBe(true);
      expect(result.current.hasError('other')).toBe(false);
    });

    it('should return general error state when no key provided', () => {
      const { result } = renderHook(() => useErrorHandler());

      expect(result.current.hasError()).toBe(false);

      act(() => {
        result.current.setError('any', { message: 'Error', severity: 'error' });
      });

      expect(result.current.hasError()).toBe(true);
    });
  });

  describe('handleApiError', () => {
    it('should handle API error with response data', async () => {
      const { result } = renderHook(() => useErrorHandler());

      const apiError = {
        response: {
          status: 400,
          data: {
            message: 'Bad request',
            code: 'BAD_REQUEST',
            details: { field: 'email' },
          },
        },
        config: {
          url: '/api/users',
          method: 'POST',
        },
      };

      await act(async () => {
        await result.current.handleApiError(apiError, 'api');
      });

      expect(result.current.errorState.errors.api).toEqual({
        message: 'Bad request',
        code: 'BAD_REQUEST',
        severity: 'error',
        context: {
          status: 400,
          url: '/api/users',
          method: 'POST',
          field: 'email',
        },
        timestamp: expect.any(Date),
      });
    });

    it('should handle API error as critical for 5xx status', async () => {
      const { result } = renderHook(() => useErrorHandler());

      const apiError = {
        response: { status: 503 },
        message: 'Service unavailable',
      };

      await act(async () => {
        await result.current.handleApiError(apiError);
      });

      expect(result.current.errorState.globalError?.severity).toBe('critical');
    });

    it('should use fallback message for unknown errors', async () => {
      const { result } = renderHook(() => useErrorHandler());

      await act(async () => {
        await result.current.handleApiError({});
      });

      expect(result.current.errorState.globalError?.message).toBe('Une erreur est survenue');
      expect(result.current.errorState.globalError?.code).toBe('API_500');
    });
  });
});
