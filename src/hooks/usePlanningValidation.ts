import { useState, useCallback } from 'react';
import { Assignment, RuleViolation, ValidationResult } from '@/types/assignment';
import { RuleEngineV2 } from '@/modules/dynamicRules/v2/services/RuleEngineV2';
import { RuleContext } from '@/modules/dynamicRules/v2/types/ruleV2.types';
import { RuleSeverity } from '@/types/rules';
import { useQuery, useMutation } from '@tanstack/react-query';

interface UsePlanningValidationOptions {
    autoValidate?: boolean;
    debounceMs?: number;
}

interface ValidationState {
    isValidating: boolean;
    violations: RuleViolation[];
    lastValidation?: Date;
    error?: Error;
}

export function usePlanningValidation(options: UsePlanningValidationOptions = {}) {
    const { autoValidate = true, debounceMs = 500 } = options;
    const [validationState, setValidationState] = useState<ValidationState>({
        isValidating: false,
        violations: []
    });

    const ruleEngine = new RuleEngineV2();

    // Initialiser le moteur de règles
    const { isLoading: isInitializing } = useQuery({
        queryKey: ['rule-engine-init'],
        queryFn: async () => {
            await ruleEngine.initialize();
            return true;
        },
        staleTime: Infinity
    });

    // Créer le contexte de règle pour une affectation
    const createRuleContext = useCallback((
        assignment: Assignment,
        allAssignments: Assignment[]
    ): RuleContext => {
        return {
            date: assignment.startDate,
            assignment: {
                type: assignment.shiftType,
                startDate: assignment.startDate,
                endDate: assignment.endDate,
                userId: assignment.userId,
                location: assignment.notes
            },
            planning: {
                existingAssignments: allAssignments.filter(a => a.id !== assignment.id),
                proposedAssignments: [assignment]
            }
        };
    }, []);

    // Valider une seule affectation
    const validateAssignment = useCallback(async (
        assignment: Assignment,
        allAssignments: Assignment[]
    ): Promise<RuleViolation[]> => {
        if (isInitializing) return [];

        try {
            const context = createRuleContext(assignment, allAssignments);
            const results = await ruleEngine.evaluate(context, 'validation');
            const violations: RuleViolation[] = [];

            for (const result of results) {
                if (!result.passed && result.actions) {
                    for (const action of result.actions) {
                        if (action.type === 'validate' && action.parameters.severity) {
                            violations.push({
                                id: `rule-${result.ruleId}-${Date.now()}-${Math.random()}`,
                                type: action.parameters.violationType || 'RULE_VIOLATION',
                                severity: action.parameters.severity as RuleSeverity,
                                message: action.parameters.message || `Règle "${result.ruleName}" non respectée`,
                                affectedAssignments: [assignment.id],
                                metadata: {
                                    ruleId: result.ruleId,
                                    ruleName: result.ruleName,
                                    ruleDescription: action.parameters.description
                                }
                            });
                        }
                    }
                }
            }

            return violations;
        } catch (error) {
            console.error('Error validating assignment:', error);
            return [];
        }
    }, [isInitializing, createRuleContext, ruleEngine]);

    // Valider tout le planning
    const validatePlanning = useCallback(async (
        assignments: Assignment[]
    ): Promise<ValidationResult> => {
        setValidationState(prev => ({ ...prev, isValidating: true, error: undefined }));

        try {
            const allViolations: RuleViolation[] = [];
            
            // Valider chaque affectation
            for (const assignment of assignments) {
                const violations = await validateAssignment(assignment, assignments);
                allViolations.push(...violations);
            }

            // Déduplicquer les violations similaires
            const uniqueViolations = allViolations.reduce((acc, violation) => {
                const key = `${violation.type}-${violation.message}-${violation.affectedAssignments.join(',')}`;
                if (!acc.has(key)) {
                    acc.set(key, violation);
                }
                return acc;
            }, new Map<string, RuleViolation>());

            const violations = Array.from(uniqueViolations.values());

            setValidationState({
                isValidating: false,
                violations,
                lastValidation: new Date()
            });

            return {
                valid: violations.length === 0,
                violations,
                metrics: {
                    totalViolations: violations.length,
                    criticalViolations: violations.filter(v => v.severity === RuleSeverity.ERROR).length,
                    warnings: violations.filter(v => v.severity === RuleSeverity.WARNING).length
                }
            };
        } catch (error) {
            const err = error as Error;
            setValidationState(prev => ({ 
                ...prev, 
                isValidating: false, 
                error: err 
            }));
            
            throw err;
        }
    }, [validateAssignment]);

    // Mutation pour valider de manière asynchrone
    const validateMutation = useMutation({
        mutationFn: validatePlanning
    });

    // Valider en temps réel avec debounce
    const validateWithDebounce = useCallback(
        debounce((assignments: Assignment[]) => {
            if (autoValidate) {
                validateMutation.mutate(assignments);
            }
        }, debounceMs),
        [autoValidate, validateMutation, debounceMs]
    );

    // Obtenir les suggestions de correction pour une violation
    const getSuggestions = useCallback(async (
        violation: RuleViolation,
        assignments: Assignment[]
    ): Promise<string[]> => {
        // Logique pour générer des suggestions basées sur le type de violation
        const suggestions: string[] = [];

        switch (violation.type) {
            case 'MIN_INTERVAL':
                suggestions.push('Augmenter l\'intervalle entre les gardes');
                suggestions.push('Réaffecter à un autre praticien');
                break;
            case 'FATIGUE':
                suggestions.push('Réduire le nombre d\'affectations pour ce praticien');
                suggestions.push('Prévoir des jours de repos supplémentaires');
                break;
            case 'CONSECUTIVE_ASSIGNMENTS':
                suggestions.push('Insérer un jour de repos entre les affectations');
                suggestions.push('Redistribuer les affectations sur d\'autres praticiens');
                break;
            default:
                suggestions.push('Vérifier les règles de planning configurées');
        }

        return suggestions;
    }, []);

    return {
        // État
        isValidating: validationState.isValidating || validateMutation.isPending,
        violations: validationState.violations,
        lastValidation: validationState.lastValidation,
        error: validationState.error || validateMutation.error,
        
        // Actions
        validateAssignment,
        validatePlanning,
        validateWithDebounce,
        getSuggestions,
        
        // Utils
        hasViolations: validationState.violations.length > 0,
        hasCriticalViolations: validationState.violations.some(v => v.severity === RuleSeverity.ERROR),
        violationsByAssignment: (assignmentId: string) => 
            validationState.violations.filter(v => v.affectedAssignments.includes(assignmentId))
    };
}

// Fonction utilitaire de debounce
function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}