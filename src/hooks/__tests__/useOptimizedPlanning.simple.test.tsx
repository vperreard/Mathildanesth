import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOptimizedPlanning } from '../useOptimizedPlanning';
import { Attribution } from '@/types/attribution';

// Mock date-fns avec des fonctions simples
jest.mock('date-fns', () => ({
    format: jest.fn((date: Date, formatStr: string) => {
        if (formatStr === 'yyyy-MM-dd') {
            return date.toISOString().split('T')[0];
        }
        return date.toISOString();
    }),
    startOfWeek: jest.fn((date: Date) => {
        const result = new Date(date);
        result.setHours(0, 0, 0, 0);
        return result;
    }),
    endOfWeek: jest.fn((date: Date) => {
        const result = new Date(date);
        result.setHours(23, 59, 59, 999);
        return result;
    }),
    addWeeks: jest.fn((date: Date, amount: number) => {
        const result = new Date(date);
        result.setDate(result.getDate() + amount * 7);
        return result;
    }),
    subWeeks: jest.fn((date: Date, amount: number) => {
        const result = new Date(date);
        result.setDate(result.getDate() - amount * 7);
        return result;
    })
}));

// Mock lodash debounce
jest.mock('lodash', () => ({
    debounce: (fn: any) => {
        const debounced = (...args: any[]) => fn(...args);
        debounced.cancel = jest.fn();
        return debounced;
    }
}));

describe('useOptimizedPlanning - Simple Tests', () => {
    let queryClient: QueryClient;

    const createWrapper = () => {
        return ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );
    };

    const mockAssignments: Attribution[] = [
        {
            id: 'attribution-1',
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
        }
    ];

    const mockPlanningResponse = {
        attributions: mockAssignments,
        users: [
            { id: 'user-1', name: 'John Doe' }
        ],
        validation: {
            valid: true,
            violations: []
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false, staleTime: 0, gcTime: 0 },
                mutations: { retry: false }
            }
        });

        // Setup global fetch mock
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => mockPlanningResponse
        } as Response);
    });

    afterEach(() => {
        // Skip queryClient.clear() for now due to compatibility issues
        jest.clearAllMocks();
    });

    describe('Basic functionality', () => {
        it('should provide hook interface', () => {
            const { result } = renderHook(() => useOptimizedPlanning({ 
                week: new Date(),
                enablePrefetch: false // Disable prefetch for simplicity
            }), {
                wrapper: createWrapper()
            });

            // Hook should provide required properties
            expect(result.current).toHaveProperty('attributions');
            expect(result.current).toHaveProperty('users');
            expect(result.current).toHaveProperty('isLoading');
            expect(result.current).toHaveProperty('error');
            expect(result.current).toHaveProperty('updateAssignment');
            expect(result.current).toHaveProperty('saveNow');
            expect(result.current).toHaveProperty('hasUnsavedChanges');
        });

        it('should start with empty data and loading false', () => {
            const { result } = renderHook(() => useOptimizedPlanning({ 
                week: new Date(),
                enablePrefetch: false
            }), {
                wrapper: createWrapper()
            });

            // Initial state
            expect(result.current.attributions).toEqual([]);
            expect(result.current.users).toEqual([]);
            expect(result.current.hasUnsavedChanges).toBe(false);
        });

        it('should handle local updates correctly', async () => {
            const { result } = renderHook(() => useOptimizedPlanning({ 
                week: new Date(),
                autoSave: false,
                enablePrefetch: false
            }), {
                wrapper: createWrapper()
            });

            // Wait for hook to initialize
            await waitFor(() => {
                expect(result.current.attributions).toEqual(mockAssignments);
            });

            // Test local update
            act(() => {
                result.current.updateAssignment('attribution-1', {
                    userName: 'Updated Name'
                });
            });

            expect(result.current.hasUnsavedChanges).toBe(true);
            
            // Check that attribution is updated locally
            const updatedAssignment = result.current.getAssignmentById('attribution-1');
            expect(updatedAssignment?.userName).toBe('Updated Name');
        });

        it('should cancel local changes', async () => {
            const { result } = renderHook(() => useOptimizedPlanning({ 
                week: new Date(),
                autoSave: false,
                enablePrefetch: false
            }), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(result.current.attributions).toEqual(mockAssignments);
            });

            // Make local update
            act(() => {
                result.current.updateAssignment('attribution-1', {
                    userName: 'Updated Name'
                });
            });

            expect(result.current.hasUnsavedChanges).toBe(true);

            // Cancel changes
            act(() => {
                result.current.cancelLocalChanges();
            });

            expect(result.current.hasUnsavedChanges).toBe(false);
            
            // Check that attribution reverted
            const revertedAssignment = result.current.getAssignmentById('attribution-1');
            expect(revertedAssignment?.userName).toBe('John Doe');
        });

        it('should get user assignments', async () => {
            const { result } = renderHook(() => useOptimizedPlanning({ 
                week: new Date(),
                enablePrefetch: false
            }), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(result.current.attributions).toEqual(mockAssignments);
            });

            const userAssignments = result.current.getUserAssignments('user-1');
            expect(userAssignments).toHaveLength(1);
            expect(userAssignments[0].id).toBe('attribution-1');
        });

        it('should return undefined for non-existent assignment', async () => {
            const { result } = renderHook(() => useOptimizedPlanning({ 
                week: new Date(),
                enablePrefetch: false
            }), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(result.current.attributions).toEqual(mockAssignments);
            });

            const nonExistentAssignment = result.current.getAssignmentById('non-existent');
            expect(nonExistentAssignment).toBeUndefined();
        });
    });

    describe('Save functionality', () => {
        it('should save changes manually', async () => {
            // Mock successful save response
            (global.fetch as jest.MockedFunction<typeof fetch>)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockPlanningResponse
                } as Response)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ success: true })
                } as Response);

            const { result } = renderHook(() => useOptimizedPlanning({ 
                week: new Date(),
                autoSave: false,
                enablePrefetch: false
            }), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(result.current.attributions).toEqual(mockAssignments);
            });

            // Make update
            act(() => {
                result.current.updateAssignment('attribution-1', {
                    userName: 'Test Save'
                });
            });

            expect(result.current.hasUnsavedChanges).toBe(true);

            // Save manually
            await act(async () => {
                await result.current.saveNow();
            });

            // Should have made save API call
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/planning/batch-update'),
                expect.objectContaining({
                    method: 'POST'
                })
            );
        });
    });
});