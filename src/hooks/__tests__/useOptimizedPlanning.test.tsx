import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOptimizedPlanning } from '../useOptimizedPlanning';
import { Assignment } from '@/types/assignment';
import { startOfWeek, endOfWeek, format, addWeeks, subWeeks } from 'date-fns';

// Mock fetch
global.fetch = jest.fn();

// Mock lodash debounce
jest.mock('lodash', () => ({
    debounce: (fn: any) => {
        const debounced = (...args: any[]) => fn(...args);
        debounced.cancel = jest.fn();
        return debounced;
    }
}));

describe('useOptimizedPlanning', () => {
    let queryClient: QueryClient;
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

    const createWrapper = () => {
        return ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );
    };

    const mockAssignments: Assignment[] = [
        {
            id: 'assignment-1',
            userId: 'user-1',
            userName: 'John Doe',
            shiftType: 'JOUR',
            startDate: new Date('2025-01-15T08:00:00'),
            endDate: new Date('2025-01-15T20:00:00'),
            department: 'Surgery',
            status: 'CONFIRMED',
            roomId: 'room-1',
            sectorId: 'sector-1',
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: 'assignment-2',
            userId: 'user-2',
            userName: 'Jane Smith',
            shiftType: 'NUIT',
            startDate: new Date('2025-01-15T20:00:00'),
            endDate: new Date('2025-01-16T08:00:00'),
            department: 'Surgery',
            status: 'CONFIRMED',
            roomId: 'room-2',
            sectorId: 'sector-1',
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ];

    const mockPlanningResponse = {
        assignments: mockAssignments,
        users: [
            { id: 'user-1', name: 'John Doe' },
            { id: 'user-2', name: 'Jane Smith' }
        ],
        validation: {
            valid: true,
            violations: []
        }
    };

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false }
            }
        });

        jest.clearAllMocks();
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => mockPlanningResponse
        } as Response);
    });

    afterEach(() => {
        queryClient.clear();
    });

    describe('data loading', () => {
        it('should load planning data for week view', async () => {
            const week = new Date('2025-01-15');
            const { result } = renderHook(() => useOptimizedPlanning({ week, viewType: 'week' }), {
                wrapper: createWrapper()
            });

            expect(result.current.isLoading).toBe(true);

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.assignments).toEqual(mockAssignments);
            expect(result.current.users).toEqual(mockPlanningResponse.users);
            expect(result.current.validation).toEqual(mockPlanningResponse.validation);

            // Verify API call
            const expectedStart = format(startOfWeek(week, { weekStartsOn: 1 }), 'yyyy-MM-dd');
            const expectedEnd = format(endOfWeek(week, { weekStartsOn: 1 }), 'yyyy-MM-dd');
            
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining(`/api/planning/optimized?startDate=${expectedStart}&endDate=${expectedEnd}&viewType=week`),
                expect.objectContaining({
                    headers: {
                        'Cache-Control': 'max-age=300'
                    }
                })
            );
        });

        it('should load planning data for month view', async () => {
            const month = new Date('2025-01-15');
            const { result } = renderHook(() => useOptimizedPlanning({ month, viewType: 'month' }), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            const expectedStart = '2025-01-01';
            const expectedEnd = '2025-01-31';
            
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining(`startDate=${expectedStart}&endDate=${expectedEnd}&viewType=month`),
                expect.any(Object)
            );
        });

        it('should handle loading errors', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500
            } as Response);

            const { result } = renderHook(() => useOptimizedPlanning({ week: new Date() }), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(result.current.error).toBeDefined();
            });

            expect(result.current.error?.message).toBe('Erreur lors du chargement du planning');
            expect(result.current.assignments).toEqual([]);
        });
    });

    describe('prefetching', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should prefetch adjacent weeks when enablePrefetch is true', async () => {
            const week = new Date('2025-01-15');
            const { result } = renderHook(() => useOptimizedPlanning({ 
                week, 
                viewType: 'week',
                enablePrefetch: true 
            }), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // Advance timers to trigger prefetch
            act(() => {
                jest.advanceTimersByTime(150);
            });

            await waitFor(() => {
                // Should have made 3 calls: initial + 2 prefetch
                expect(mockFetch).toHaveBeenCalledTimes(3);
            });

            // Verify prefetch calls for previous and next week
            const prevWeek = subWeeks(week, 1);
            const nextWeek = addWeeks(week, 1);
            
            const prevWeekStart = format(startOfWeek(prevWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd');
            const nextWeekStart = format(startOfWeek(nextWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd');

            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining(`startDate=${prevWeekStart}`),
                expect.any(Object)
            );
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining(`startDate=${nextWeekStart}`),
                expect.any(Object)
            );
        });

        it('should not prefetch when enablePrefetch is false', async () => {
            const { result } = renderHook(() => useOptimizedPlanning({ 
                week: new Date(),
                viewType: 'week',
                enablePrefetch: false 
            }), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            act(() => {
                jest.advanceTimersByTime(200);
            });

            // Should only have initial call
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });
    });

    describe('local updates', () => {
        it('should update assignment locally and merge with server data', async () => {
            const { result } = renderHook(() => useOptimizedPlanning({ week: new Date() }), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            act(() => {
                result.current.updateAssignment('assignment-1', {
                    userName: 'Updated Name',
                    shiftType: 'NUIT'
                });
            });

            // Local update should be reflected immediately
            const updatedAssignment = result.current.getAssignmentById('assignment-1');
            expect(updatedAssignment?.userName).toBe('Updated Name');
            expect(updatedAssignment?.shiftType).toBe('NUIT');
            
            expect(result.current.hasUnsavedChanges).toBe(true);
            expect(result.current.pendingUpdatesCount).toBe(1);
        });

        it('should accumulate multiple updates for same assignment', async () => {
            const { result } = renderHook(() => useOptimizedPlanning({ week: new Date() }), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            act(() => {
                result.current.updateAssignment('assignment-1', { userName: 'First Update' });
                result.current.updateAssignment('assignment-1', { shiftType: 'NUIT' });
            });

            const assignment = result.current.getAssignmentById('assignment-1');
            expect(assignment?.userName).toBe('First Update');
            expect(assignment?.shiftType).toBe('NUIT');
            expect(result.current.pendingUpdatesCount).toBe(1); // Still one assignment
        });
    });

    describe('auto-save functionality', () => {
        it('should auto-save changes when autoSave is enabled', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ success: true })
            } as Response);

            const { result } = renderHook(() => useOptimizedPlanning({ 
                week: new Date(),
                autoSave: true,
                saveDelay: 100
            }), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            act(() => {
                result.current.updateAssignment('assignment-1', { userName: 'Auto Save Test' });
            });

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/planning/batch-update',
                    expect.objectContaining({
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            updates: [{
                                assignmentId: 'assignment-1',
                                changes: { userName: 'Auto Save Test' },
                                timestamp: expect.any(Number)
                            }]
                        })
                    })
                );
            });

            await waitFor(() => {
                expect(result.current.hasUnsavedChanges).toBe(false);
            });
        });

        it('should not auto-save when autoSave is disabled', async () => {
            const { result } = renderHook(() => useOptimizedPlanning({ 
                week: new Date(),
                autoSave: false
            }), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            const initialCallCount = mockFetch.mock.calls.length;

            act(() => {
                result.current.updateAssignment('assignment-1', { userName: 'No Auto Save' });
            });

            // Wait to ensure no auto-save happens
            await new Promise(resolve => setTimeout(resolve, 300));

            expect(mockFetch).toHaveBeenCalledTimes(initialCallCount);
            expect(result.current.hasUnsavedChanges).toBe(true);
        });
    });

    describe('manual save operations', () => {
        it('should save immediately with saveNow', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ success: true })
            } as Response);

            const { result } = renderHook(() => useOptimizedPlanning({ 
                week: new Date(),
                autoSave: false
            }), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            act(() => {
                result.current.updateAssignment('assignment-1', { userName: 'Save Now Test' });
            });

            await act(async () => {
                await result.current.saveNow();
            });

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/planning/batch-update',
                expect.any(Object)
            );
            expect(result.current.hasUnsavedChanges).toBe(false);
        });

        it('should handle save errors', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockPlanningResponse
            } as Response);

            const { result } = renderHook(() => useOptimizedPlanning({ week: new Date() }), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // Mock save failure
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500
            } as Response);

            act(() => {
                result.current.updateAssignment('assignment-1', { userName: 'Error Test' });
            });

            await act(async () => {
                try {
                    await result.current.saveNow();
                } catch (error) {
                    expect(error).toBeDefined();
                }
            });

            // Changes should still be pending after error
            expect(result.current.hasUnsavedChanges).toBe(true);
        });
    });

    describe('drag and drop operations', () => {
        it('should handle moveAssignment with optimistic updates', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ success: true })
            } as Response);

            const { result } = renderHook(() => useOptimizedPlanning({ week: new Date() }), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            const newDate = new Date('2025-01-16T08:00:00');
            
            act(() => {
                result.current.moveAssignment('assignment-1', 'user-2', newDate);
            });

            // Should immediately update locally
            const movedAssignment = result.current.getAssignmentById('assignment-1');
            expect(movedAssignment?.userId).toBe('user-2');
            expect(movedAssignment?.startDate).toEqual(newDate);
            expect(result.current.isSyncing).toBe(true);

            // Should trigger immediate save
            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/planning/batch-update',
                    expect.objectContaining({
                        body: expect.stringContaining('user-2')
                    })
                );
            });

            await waitFor(() => {
                expect(result.current.isSyncing).toBe(false);
            });
        });
    });

    describe('cancel operations', () => {
        it('should cancel all local changes', async () => {
            const { result } = renderHook(() => useOptimizedPlanning({ week: new Date() }), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            act(() => {
                result.current.updateAssignment('assignment-1', { userName: 'To Cancel' });
                result.current.updateAssignment('assignment-2', { shiftType: 'GARDE' });
            });

            expect(result.current.hasUnsavedChanges).toBe(true);
            expect(result.current.pendingUpdatesCount).toBe(2);

            act(() => {
                result.current.cancelLocalChanges();
            });

            expect(result.current.hasUnsavedChanges).toBe(false);
            expect(result.current.pendingUpdatesCount).toBe(0);

            // Assignments should revert to original
            const assignment1 = result.current.getAssignmentById('assignment-1');
            expect(assignment1?.userName).toBe('John Doe');
        });
    });

    describe('utility functions', () => {
        it('should get user assignments correctly', async () => {
            const { result } = renderHook(() => useOptimizedPlanning({ week: new Date() }), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            const user1Assignments = result.current.getUserAssignments('user-1');
            expect(user1Assignments).toHaveLength(1);
            expect(user1Assignments[0].id).toBe('assignment-1');

            const user2Assignments = result.current.getUserAssignments('user-2');
            expect(user2Assignments).toHaveLength(1);
            expect(user2Assignments[0].id).toBe('assignment-2');
        });

        it('should return undefined for non-existent assignment', async () => {
            const { result } = renderHook(() => useOptimizedPlanning({ week: new Date() }), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            const assignment = result.current.getAssignmentById('non-existent');
            expect(assignment).toBeUndefined();
        });
    });

    describe('cleanup', () => {
        it('should save pending changes on cleanup if autoSave is enabled', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ success: true })
            } as Response);

            const { result } = renderHook(() => useOptimizedPlanning({ 
                week: new Date(),
                autoSave: true
            }), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            act(() => {
                result.current.updateAssignment('assignment-1', { userName: 'Cleanup Test' });
            });

            const saveNowSpy = jest.spyOn(result.current, 'saveNow');

            act(() => {
                result.current.cleanup();
            });

            expect(saveNowSpy).toHaveBeenCalled();
        });

        it('should not save on cleanup if autoSave is disabled', async () => {
            const { result } = renderHook(() => useOptimizedPlanning({ 
                week: new Date(),
                autoSave: false
            }), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            act(() => {
                result.current.updateAssignment('assignment-1', { userName: 'No Save on Cleanup' });
            });

            const saveNowSpy = jest.spyOn(result.current, 'saveNow');

            act(() => {
                result.current.cleanup();
            });

            expect(saveNowSpy).not.toHaveBeenCalled();
        });
    });

    describe('edge cases', () => {
        it('should handle empty planning data', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ assignments: [], users: [] })
            } as Response);

            const { result } = renderHook(() => useOptimizedPlanning({ week: new Date() }), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.assignments).toEqual([]);
            expect(result.current.users).toEqual([]);
        });

        it('should handle malformed response data', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({}) // Missing expected fields
            } as Response);

            const { result } = renderHook(() => useOptimizedPlanning({ week: new Date() }), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.assignments).toEqual([]);
            expect(result.current.users).toEqual([]);
            expect(result.current.validation).toBeUndefined();
        });

        it('should not save when there are no pending updates', async () => {
            const { result } = renderHook(() => useOptimizedPlanning({ week: new Date() }), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            const initialCallCount = mockFetch.mock.calls.length;

            await act(async () => {
                await result.current.saveNow();
            });

            // Should not make additional call
            expect(mockFetch).toHaveBeenCalledTimes(initialCallCount);
        });
    });
});