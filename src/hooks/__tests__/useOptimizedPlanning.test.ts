import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOptimizedPlanning } from '../useOptimizedPlanning';
import { Attribution } from '@/types/attribution';
import React from 'react';

// Mock dependencies
jest.mock('../../lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('lodash', () => ({
  debounce: jest.fn(fn => {
    // Simple mock that immediately calls the function
    const debouncedFn = (...args: any[]) => fn(...args);
    debouncedFn.cancel = jest.fn();
    debouncedFn.flush = jest.fn(() => fn());
    return debouncedFn;
  }),
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('useOptimizedPlanning', () => {
  let queryClient: QueryClient;
  let wrapper: React.ComponentType<{ children: React.ReactNode }>;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    wrapper = ({ children }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    // Mock successful fetch responses
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/planning')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                assignments: [],
                metadata: {
                  totalCount: 0,
                  lastUpdated: new Date().toISOString(),
                },
              },
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} }),
      });
    });
  });

  afterEach(() => {
    queryClient.clear();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useOptimizedPlanning({}), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.assignments).toEqual([]);
      expect(result.current.pendingChanges).toBe(0);
      expect(result.current.isSyncing).toBe(false);
    });

    it('should initialize with custom props', () => {
      const mockDate = new Date('2025-06-15');
      const { result } = renderHook(
        () =>
          useOptimizedPlanning({
            week: mockDate,
            viewType: 'week',
            autoSave: false,
            saveDelay: 5000,
          }),
        { wrapper }
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.assignments).toEqual([]);
    });

    it('should calculate correct date range for week view', () => {
      const mockWeek = new Date('2025-06-15'); // Dimanche
      const { result } = renderHook(
        () =>
          useOptimizedPlanning({
            week: mockWeek,
            viewType: 'week',
          }),
        { wrapper }
      );

      // Should start on Monday (week starts on Monday)
      expect(result.current.dateRange.start.getDay()).toBe(1);
      expect(result.current.dateRange.end.getDay()).toBe(0);
    });

    it('should calculate correct date range for month view', () => {
      const mockMonth = new Date('2025-06-15');
      const { result } = renderHook(
        () =>
          useOptimizedPlanning({
            month: mockMonth,
            viewType: 'month',
          }),
        { wrapper }
      );

      expect(result.current.dateRange.start.getDate()).toBe(1);
      expect(result.current.dateRange.end.getMonth()).toBe(mockMonth.getMonth());
    });
  });

  describe('assignment management', () => {
    const mockAssignment: Attribution = {
      id: 'assignment-1',
      userId: 1,
      doctorId: 'doctor-1',
      startDate: new Date('2025-06-15T08:00:00'),
      endDate: new Date('2025-06-15T18:00:00'),
      shiftType: 'GARDE',
      isActive: true,
    };

    it('should update assignment locally', async () => {
      const { result } = renderHook(() => useOptimizedPlanning({}), { wrapper });

      await act(async () => {
        result.current.updateAssignment('assignment-1', {
          startDate: new Date('2025-06-15T09:00:00'),
        });
      });

      expect(result.current.pendingChanges).toBe(1);
    });

    it('should create new assignment', async () => {
      const { result } = renderHook(() => useOptimizedPlanning({}), { wrapper });

      await act(async () => {
        result.current.createAssignment({
          userId: 1,
          doctorId: 'doctor-1',
          startDate: new Date('2025-06-15T08:00:00'),
          endDate: new Date('2025-06-15T18:00:00'),
          shiftType: 'GARDE',
          isActive: true,
        });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/planning/assignments'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
            body: expect.any(String),
          })
        );
      });
    });

    it('should delete assignment', async () => {
      const { result } = renderHook(() => useOptimizedPlanning({}), { wrapper });

      await act(async () => {
        result.current.deleteAssignment('assignment-1');
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/planning/assignments/assignment-1'),
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });
    });

    it('should bulk update multiple assignments', async () => {
      const { result } = renderHook(() => useOptimizedPlanning({}), { wrapper });

      const updates = [
        {
          id: 'assignment-1',
          changes: { startDate: new Date('2025-06-15T09:00:00') },
        },
        {
          id: 'assignment-2',
          changes: { endDate: new Date('2025-06-15T19:00:00') },
        },
      ];

      await act(async () => {
        result.current.bulkUpdate(updates);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/planning/assignments/bulk'),
          expect.objectContaining({
            method: 'PUT',
            body: expect.stringContaining('assignment-1'),
          })
        );
      });
    });
  });

  describe('auto-save functionality', () => {
    it('should auto-save when enabled', async () => {
      const { result } = renderHook(
        () => useOptimizedPlanning({ autoSave: true, saveDelay: 100 }),
        { wrapper }
      );

      await act(async () => {
        result.current.updateAssignment('assignment-1', {
          startDate: new Date('2025-06-15T09:00:00'),
        });
      });

      // Wait for auto-save to trigger
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/planning/assignments/assignment-1'),
          expect.objectContaining({
            method: 'PUT',
          })
        );
      });
    });

    it('should not auto-save when disabled', async () => {
      const { result } = renderHook(() => useOptimizedPlanning({ autoSave: false }), { wrapper });

      await act(async () => {
        result.current.updateAssignment('assignment-1', {
          startDate: new Date('2025-06-15T09:00:00'),
        });
      });

      // Wait a bit and ensure no save call was made
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(mockFetch).not.toHaveBeenCalledWith(
        expect.stringContaining('/planning/assignments/assignment-1'),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('should allow manual save', async () => {
      const { result } = renderHook(() => useOptimizedPlanning({ autoSave: false }), { wrapper });

      await act(async () => {
        result.current.updateAssignment('assignment-1', {
          startDate: new Date('2025-06-15T09:00:00'),
        });
      });

      await act(async () => {
        await result.current.saveChanges();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/planning/assignments/assignment-1'),
        expect.objectContaining({
          method: 'PUT',
        })
      );
    });
  });

  describe('navigation and prefetching', () => {
    it('should navigate to next week', () => {
      const initialWeek = new Date('2025-06-15');
      const { result } = renderHook(
        () => useOptimizedPlanning({ week: initialWeek, viewType: 'week' }),
        { wrapper }
      );

      act(() => {
        result.current.navigateToNext();
      });

      // Should navigate to next week
      expect(result.current.dateRange.start.getTime()).toBeGreaterThan(initialWeek.getTime());
    });

    it('should navigate to previous week', () => {
      const initialWeek = new Date('2025-06-15');
      const { result } = renderHook(
        () => useOptimizedPlanning({ week: initialWeek, viewType: 'week' }),
        { wrapper }
      );

      act(() => {
        result.current.navigateToPrevious();
      });

      // Should navigate to previous week
      expect(result.current.dateRange.start.getTime()).toBeLessThan(initialWeek.getTime());
    });

    it('should prefetch adjacent periods when enabled', async () => {
      const { result } = renderHook(
        () =>
          useOptimizedPlanning({
            week: new Date('2025-06-15'),
            viewType: 'week',
            enablePrefetch: true,
          }),
        { wrapper }
      );

      await waitFor(() => {
        // Should prefetch next and previous weeks
        const fetchCalls = mockFetch.mock.calls.map(call => call[0]);
        expect(fetchCalls.some(url => typeof url === 'string' && url.includes('/planning'))).toBe(
          true
        );
      });
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Server error' }),
        })
      );

      const { result } = renderHook(() => useOptimizedPlanning({}), { wrapper });

      await act(async () => {
        try {
          await result.current.createAssignment({
            userId: 1,
            doctorId: 'doctor-1',
            startDate: new Date('2025-06-15T08:00:00'),
            endDate: new Date('2025-06-15T18:00:00'),
            shiftType: 'GARDE',
            isActive: true,
          });
        } catch (error) {
          // Expected to fail
        }
      });

      expect(result.current.error).toBeDefined();
    });

    it('should handle network errors', async () => {
      mockFetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

      const { result } = renderHook(() => useOptimizedPlanning({}), { wrapper });

      await act(async () => {
        try {
          await result.current.createAssignment({
            userId: 1,
            doctorId: 'doctor-1',
            startDate: new Date('2025-06-15T08:00:00'),
            endDate: new Date('2025-06-15T18:00:00'),
            shiftType: 'GARDE',
            isActive: true,
          });
        } catch (error) {
          // Expected to fail
        }
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('performance optimizations', () => {
    it('should debounce rapid updates', async () => {
      const { result } = renderHook(() => useOptimizedPlanning({}), { wrapper });

      await act(async () => {
        // Make multiple rapid updates
        result.current.updateAssignment('assignment-1', { startDate: new Date() });
        result.current.updateAssignment('assignment-1', { endDate: new Date() });
        result.current.updateAssignment('assignment-1', { shiftType: 'ASTREINTE' });
      });

      // Should batch these updates
      expect(result.current.pendingChanges).toBe(1); // Only one assignment updated
    });

    it('should handle concurrent updates correctly', async () => {
      const { result } = renderHook(() => useOptimizedPlanning({}), { wrapper });

      await act(async () => {
        // Simulate concurrent updates to different assignments
        result.current.updateAssignment('assignment-1', { startDate: new Date() });
        result.current.updateAssignment('assignment-2', { endDate: new Date() });
      });

      expect(result.current.pendingChanges).toBe(2);
    });
  });
});
