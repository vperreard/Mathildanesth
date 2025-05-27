import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePlanningValidation } from '../usePlanningValidation';
import { Assignment } from '@/types/assignment';
import { RuleSeverity } from '@/types/rules';
import { RuleEngineV2 } from '@/modules/dynamicRules/v2/services/RuleEngineV2';

// Mock RuleEngineV2
jest.mock('@/modules/dynamicRules/v2/services/RuleEngineV2');

describe('usePlanningValidation', () => {
    let queryClient: QueryClient;
    let mockRuleEngine: jest.Mocked<RuleEngineV2>;

    const createWrapper = () => {
        return ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );
    };

    const mockAssignment: Assignment = {
        id: 'assignment-1',
        userId: 'user-1',
        userName: 'John Doe',
        shiftType: 'JOUR',
        startDate: new Date('2025-01-15T08:00:00'),
        endDate: new Date('2025-01-15T20:00:00'),
        department: 'Surgery',
        status: 'CONFIRMED',
        notes: 'Bloc A',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const mockAssignments: Assignment[] = [
        mockAssignment,
        {
            ...mockAssignment,
            id: 'assignment-2',
            userId: 'user-2',
            userName: 'Jane Smith'
        }
    ];

    beforeEach(() => {
    jest.clearAllMocks();
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false }
            }
        });

        // Reset mocks
        jest.clearAllMocks();
        
        // Setup RuleEngineV2 mock
        mockRuleEngine = {
            initialize: jest.fn().mockResolvedValue(undefined),
            evaluate: jest.fn().mockResolvedValue([]),
            cleanup: jest.fn()
        } as any;

        (RuleEngineV2 as jest.MockedClass<typeof RuleEngineV2>).mockImplementation(() => mockRuleEngine);
    });

    afterEach(() => {
        queryClient.clear();
    });

    describe('initialization', () => {
        it('should initialize rule engine on mount', async () => {
            const { result } = renderHook(() => usePlanningValidation(), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(mockRuleEngine.initialize).toHaveBeenCalled();
            });

            expect(result.current.isValidating).toBe(false);
            expect(result.current.violations).toEqual([]);
        });

        it('should handle initialization errors gracefully', async () => {
            mockRuleEngine.initialize.mockRejectedValue(new Error('Init failed'));

            const { result } = renderHook(() => usePlanningValidation(), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(result.current.error).toBeUndefined();
            });
        });
    });

    describe('validateAssignment', () => {
        it('should validate a single assignment successfully', async () => {
            const mockViolation = {
                ruleId: 'rule-1',
                ruleName: 'Min Interval Rule',
                passed: false,
                actions: [{
                    type: 'validate',
                    parameters: {
                        severity: RuleSeverity.WARNING,
                        message: 'Interval trop court',
                        violationType: 'MIN_INTERVAL'
                    }
                }]
            };

            mockRuleEngine.evaluate.mockResolvedValue([mockViolation]);

            const { result } = renderHook(() => usePlanningValidation(), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(mockRuleEngine.initialize).toHaveBeenCalled();
            });

            let violations;
            await act(async () => {
                violations = await result.current.validateAssignment(mockAssignment, mockAssignments);
            });

            expect(violations).toHaveLength(1);
            expect(violations[0]).toMatchObject({
                type: 'MIN_INTERVAL',
                severity: RuleSeverity.WARNING,
                message: 'Interval trop court',
                affectedAssignments: ['assignment-1']
            });
        });

        it('should return empty violations array when all rules pass', async () => {
            mockRuleEngine.evaluate.mockResolvedValue([{
                ruleId: 'rule-1',
                ruleName: 'Test Rule',
                passed: true,
                actions: []
            }]);

            const { result } = renderHook(() => usePlanningValidation(), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(mockRuleEngine.initialize).toHaveBeenCalled();
            });

            let violations;
            await act(async () => {
                violations = await result.current.validateAssignment(mockAssignment, mockAssignments);
            });

            expect(violations).toEqual([]);
        });

        it('should handle evaluation errors gracefully', async () => {
            mockRuleEngine.evaluate.mockRejectedValue(new Error('Evaluation failed'));

            const { result } = renderHook(() => usePlanningValidation(), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(mockRuleEngine.initialize).toHaveBeenCalled();
            });

            let violations;
            await act(async () => {
                violations = await result.current.validateAssignment(mockAssignment, mockAssignments);
            });

            expect(violations).toEqual([]);
        });

        it('should skip validation if engine is still initializing', async () => {
            // Mock slow initialization
            mockRuleEngine.initialize.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

            const { result } = renderHook(() => usePlanningValidation(), {
                wrapper: createWrapper()
            });

            let violations;
            await act(async () => {
                violations = await result.current.validateAssignment(mockAssignment, mockAssignments);
            });

            expect(violations).toEqual([]);
            expect(mockRuleEngine.evaluate).not.toHaveBeenCalled();
        });
    });

    describe('validatePlanning', () => {
        it('should validate entire planning and update state', async () => {
            const mockViolations = [
                {
                    ruleId: 'rule-1',
                    ruleName: 'Fatigue Rule',
                    passed: false,
                    actions: [{
                        type: 'validate',
                        parameters: {
                            severity: RuleSeverity.ERROR,
                            message: 'Trop de gardes consécutives',
                            violationType: 'FATIGUE'
                        }
                    }]
                }
            ];

            mockRuleEngine.evaluate.mockResolvedValue(mockViolations);

            const { result } = renderHook(() => usePlanningValidation(), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(mockRuleEngine.initialize).toHaveBeenCalled();
            });

            let validationResult;
            await act(async () => {
                validationResult = await result.current.validatePlanning(mockAssignments);
            });

            expect(validationResult).toMatchObject({
                valid: false,
                violations: expect.arrayContaining([
                    expect.objectContaining({
                        type: 'FATIGUE',
                        severity: RuleSeverity.ERROR
                    })
                ]),
                metrics: {
                    totalViolations: 2, // One per assignment
                    criticalViolations: 2,
                    warnings: 0
                }
            });

            expect(result.current.violations).toHaveLength(2);
            expect(result.current.hasViolations).toBe(true);
            expect(result.current.hasCriticalViolations).toBe(true);
        });

        it('should deduplicate similar violations', async () => {
            const duplicateViolation = {
                ruleId: 'rule-1',
                ruleName: 'Same Rule',
                passed: false,
                actions: [{
                    type: 'validate',
                    parameters: {
                        severity: RuleSeverity.WARNING,
                        message: 'Same message',
                        violationType: 'SAME_TYPE'
                    }
                }]
            };

            // Return same violation for both assignments
            mockRuleEngine.evaluate.mockResolvedValue([duplicateViolation]);

            const { result } = renderHook(() => usePlanningValidation(), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(mockRuleEngine.initialize).toHaveBeenCalled();
            });

            await act(async () => {
                await result.current.validatePlanning(mockAssignments);
            });

            // Should have 2 violations (one per assignment) as they have different affected assignments
            expect(result.current.violations).toHaveLength(2);
        });

        it('should update isValidating state during validation', async () => {
            mockRuleEngine.evaluate.mockImplementation(() => 
                new Promise(resolve => setTimeout(() => resolve([]), 100))
            );

            const { result } = renderHook(() => usePlanningValidation(), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(mockRuleEngine.initialize).toHaveBeenCalled();
            });

            expect(result.current.isValidating).toBe(false);

            const validationPromise = act(async () => {
                await result.current.validatePlanning(mockAssignments);
            });

            expect(result.current.isValidating).toBe(true);

            await validationPromise;

            expect(result.current.isValidating).toBe(false);
        });

        it('should handle validation errors and update error state', async () => {
            const error = new Error('Validation failed');
            mockRuleEngine.evaluate.mockRejectedValue(error);

            const { result } = renderHook(() => usePlanningValidation(), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(mockRuleEngine.initialize).toHaveBeenCalled();
            });

            await act(async () => {
                try {
                    await result.current.validatePlanning(mockAssignments);
                } catch (err) {
                    expect(err).toBe(error);
                }
            });

            expect(result.current.error).toBe(error);
        });
    });

    describe('validateWithDebounce', () => {
        beforeEach(() => {
    jest.clearAllMocks();
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should debounce validation calls', async () => {
            const { result } = renderHook(() => usePlanningValidation({ autoValidate: true, debounceMs: 500 }), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(mockRuleEngine.initialize).toHaveBeenCalled();
            });

            // Call validateWithDebounce multiple times rapidly
            act(() => {
                result.current.validateWithDebounce(mockAssignments);
                result.current.validateWithDebounce(mockAssignments);
                result.current.validateWithDebounce(mockAssignments);
            });

            // Validation should not be called yet
            expect(mockRuleEngine.evaluate).not.toHaveBeenCalled();

            // Fast forward past debounce delay
            act(() => {
                jest.advanceTimersByTime(500);
            });

            await waitFor(() => {
                // Should only be called once despite multiple invocations
                expect(mockRuleEngine.evaluate).toHaveBeenCalledTimes(2); // Once per assignment
            });
        });

        it('should not validate if autoValidate is false', async () => {
            const { result } = renderHook(() => usePlanningValidation({ autoValidate: false }), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(mockRuleEngine.initialize).toHaveBeenCalled();
            });

            act(() => {
                result.current.validateWithDebounce(mockAssignments);
            });

            act(() => {
                jest.advanceTimersByTime(1000);
            });

            expect(mockRuleEngine.evaluate).not.toHaveBeenCalled();
        });
    });

    describe('getSuggestions', () => {
        it('should provide suggestions for MIN_INTERVAL violations', async () => {
            const violation = {
                id: 'violation-1',
                type: 'MIN_INTERVAL',
                severity: RuleSeverity.WARNING,
                message: 'Interval too short',
                affectedAssignments: ['assignment-1']
            };

            const { result } = renderHook(() => usePlanningValidation(), {
                wrapper: createWrapper()
            });

            let suggestions;
            await act(async () => {
                suggestions = await result.current.getSuggestions(violation, mockAssignments);
            });

            expect(suggestions).toContain('Augmenter l\'intervalle entre les gardes');
            expect(suggestions).toContain('Réaffecter à un autre praticien');
        });

        it('should provide suggestions for FATIGUE violations', async () => {
            const violation = {
                id: 'violation-1',
                type: 'FATIGUE',
                severity: RuleSeverity.ERROR,
                message: 'Too many consecutive shifts',
                affectedAssignments: ['assignment-1']
            };

            const { result } = renderHook(() => usePlanningValidation(), {
                wrapper: createWrapper()
            });

            let suggestions;
            await act(async () => {
                suggestions = await result.current.getSuggestions(violation, mockAssignments);
            });

            expect(suggestions).toContain('Réduire le nombre d\'affectations pour ce praticien');
            expect(suggestions).toContain('Prévoir des jours de repos supplémentaires');
        });

        it('should provide default suggestions for unknown violation types', async () => {
            const violation = {
                id: 'violation-1',
                type: 'UNKNOWN_TYPE',
                severity: RuleSeverity.INFO,
                message: 'Unknown violation',
                affectedAssignments: ['assignment-1']
            };

            const { result } = renderHook(() => usePlanningValidation(), {
                wrapper: createWrapper()
            });

            let suggestions;
            await act(async () => {
                suggestions = await result.current.getSuggestions(violation, mockAssignments);
            });

            expect(suggestions).toContain('Vérifier les règles de planning configurées');
        });
    });

    describe('utility functions', () => {
        it('should correctly filter violations by assignment', async () => {
            const violations = [
                {
                    ruleId: 'rule-1',
                    ruleName: 'Rule 1',
                    passed: false,
                    actions: [{
                        type: 'validate',
                        parameters: {
                            severity: RuleSeverity.WARNING,
                            message: 'Violation 1',
                            violationType: 'TYPE_1'
                        }
                    }]
                },
                {
                    ruleId: 'rule-2',
                    ruleName: 'Rule 2',
                    passed: false,
                    actions: [{
                        type: 'validate',
                        parameters: {
                            severity: RuleSeverity.ERROR,
                            message: 'Violation 2',
                            violationType: 'TYPE_2'
                        }
                    }]
                }
            ];

            mockRuleEngine.evaluate
                .mockResolvedValueOnce([violations[0]]) // For assignment-1
                .mockResolvedValueOnce([violations[1]]); // For assignment-2

            const { result } = renderHook(() => usePlanningValidation(), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(mockRuleEngine.initialize).toHaveBeenCalled();
            });

            await act(async () => {
                await result.current.validatePlanning(mockAssignments);
            });

            const assignment1Violations = result.current.violationsByAssignment('assignment-1');
            const assignment2Violations = result.current.violationsByAssignment('assignment-2');

            expect(assignment1Violations).toHaveLength(1);
            expect(assignment1Violations[0].type).toBe('TYPE_1');
            
            expect(assignment2Violations).toHaveLength(1);
            expect(assignment2Violations[0].type).toBe('TYPE_2');
        });

        it('should track lastValidation timestamp', async () => {
            const { result } = renderHook(() => usePlanningValidation(), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(mockRuleEngine.initialize).toHaveBeenCalled();
            });

            expect(result.current.lastValidation).toBeUndefined();

            const beforeValidation = new Date();
            
            await act(async () => {
                await result.current.validatePlanning(mockAssignments);
            });

            expect(result.current.lastValidation).toBeDefined();
            expect(result.current.lastValidation!.getTime()).toBeGreaterThanOrEqual(beforeValidation.getTime());
        });
    });

    describe('edge cases', () => {
        it('should handle empty assignments array', async () => {
            const { result } = renderHook(() => usePlanningValidation(), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(mockRuleEngine.initialize).toHaveBeenCalled();
            });

            let validationResult;
            await act(async () => {
                validationResult = await result.current.validatePlanning([]);
            });

            expect(validationResult).toMatchObject({
                valid: true,
                violations: [],
                metrics: {
                    totalViolations: 0,
                    criticalViolations: 0,
                    warnings: 0
                }
            });
        });

        it('should handle violations without actions', async () => {
            mockRuleEngine.evaluate.mockResolvedValue([{
                ruleId: 'rule-1',
                ruleName: 'No Actions Rule',
                passed: false,
                actions: undefined
            }]);

            const { result } = renderHook(() => usePlanningValidation(), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(mockRuleEngine.initialize).toHaveBeenCalled();
            });

            let violations;
            await act(async () => {
                violations = await result.current.validateAssignment(mockAssignment, mockAssignments);
            });

            expect(violations).toEqual([]);
        });

        it('should handle actions without validate type', async () => {
            mockRuleEngine.evaluate.mockResolvedValue([{
                ruleId: 'rule-1',
                ruleName: 'Other Action Rule',
                passed: false,
                actions: [{
                    type: 'notify',
                    parameters: {}
                }]
            }]);

            const { result } = renderHook(() => usePlanningValidation(), {
                wrapper: createWrapper()
            });

            await waitFor(() => {
                expect(mockRuleEngine.initialize).toHaveBeenCalled();
            });

            let violations;
            await act(async () => {
                violations = await result.current.validateAssignment(mockAssignment, mockAssignments);
            });

            expect(violations).toEqual([]);
        });
    });
});