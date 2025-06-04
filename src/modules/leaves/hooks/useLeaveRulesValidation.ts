import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RuleEngineV2 } from '@/modules/dynamicRules/v2/services/RuleEngineV2';
import { RuleContext } from '@/modules/dynamicRules/v2/types/ruleV2.types';
import { LeaveRequest } from '../types/leave';
import { RuleSeverity } from '@/types/rules';
import { ShiftType } from '@/types/common';
import { differenceInDays } from 'date-fns';

interface LeaveValidationResult {
    isValid: boolean;
    violations: Array<{
        ruleId: string;
        ruleName: string;
        message: string;
        severity: RuleSeverity;
    }>;
    suggestions: string[];
}

interface UseLeaveRulesValidationOptions {
    autoValidate?: boolean;
    includeWarnings?: boolean;
}

export function useLeaveRulesValidation(options: UseLeaveRulesValidationOptions = {}) {
    const { autoValidate = true, includeWarnings = true } = options;
    const [isValidating, setIsValidating] = useState(false);
    const [lastValidation, setLastValidation] = useState<LeaveValidationResult | null>(null);

    const ruleEngine = new RuleEngineV2();

    // Initialiser le moteur de règles
    const { isLoading: isInitializing } = useQuery({
        queryKey: ['leave-rule-engine-init'],
        queryFn: async () => {
            await ruleEngine.initialize();
            return true;
        },
        staleTime: Infinity
    });

    // Créer le contexte de règle pour une demande de congé
    const createLeaveRuleContext = useCallback((
        leaveRequest: Partial<LeaveRequest>,
        existingLeaves: LeaveRequest[] = []
    ): RuleContext => {
        const startDate = new Date(leaveRequest.startDate || new Date());
        const endDate = new Date(leaveRequest.endDate || new Date());
        const duration = differenceInDays(endDate, startDate) + 1;

        return {
            date: startDate,
            user: leaveRequest.userId ? {
                id: leaveRequest.userId,
                name: leaveRequest.userName || '',
                // Les autres champs seront remplis par le moteur de règles si nécessaire
            } : undefined,
            leave: {
                type: leaveRequest.type,
                startDate,
                endDate,
                duration,
                reason: leaveRequest.reason,
                status: leaveRequest.status
            },
            planning: {
                existingLeaves: existingLeaves.map(leave => ({
                    userId: leave.userId,
                    type: leave.type,
                    startDate: new Date(leave.startDate),
                    endDate: new Date(leave.endDate),
                    status: leave.status
                }))
            },
            metrics: {
                remainingQuota: leaveRequest.quotaAvailable || 0,
                usedQuota: leaveRequest.quotaUsed || 0,
                pendingRequests: existingLeaves.filter(l => l.status === 'PENDING').length
            }
        };
    }, []);

    // Valider une demande de congé
    const validateLeaveRequest = useCallback(async (
        leaveRequest: Partial<LeaveRequest>,
        existingLeaves: LeaveRequest[] = []
    ): Promise<LeaveValidationResult> => {
        if (isInitializing) {
            return { isValid: true, violations: [], suggestions: [] };
        }

        setIsValidating(true);
        try {
            const context = createLeaveRuleContext(leaveRequest, existingLeaves);
            const results = await ruleEngine.evaluate(context, 'validation');
            
            const violations: LeaveValidationResult['violations'] = [];
            const suggestions = new Set<string>();

            for (const result of results) {
                if (!result.passed && result.actions) {
                    for (const action of result.actions) {
                        if (action.type === 'validate') {
                            const severity = action.parameters.severity as RuleSeverity;
                            
                            // Inclure les warnings si demandé
                            if (severity === RuleSeverity.ERROR || 
                                (includeWarnings && severity === RuleSeverity.WARNING)) {
                                violations.push({
                                    ruleId: result.ruleId,
                                    ruleName: result.ruleName,
                                    message: action.parameters.message || 
                                            `Violation de la règle: ${result.ruleName}`,
                                    severity
                                });
                            }
                        } else if (action.type === 'notify' && action.parameters.suggestion) {
                            suggestions.add(action.parameters.suggestion);
                        }
                    }
                }
            }

            // Ajouter des suggestions basées sur les violations
            if (violations.length > 0) {
                suggestions.add('Vérifiez votre solde de congés disponible');
                suggestions.add('Consultez le calendrier d\'équipe pour éviter les conflits');
                
                if (violations.some(v => v.message.includes('période critique'))) {
                    suggestions.add('Cette période est critique, essayez de décaler vos dates');
                }
            }

            const validationResult: LeaveValidationResult = {
                isValid: violations.filter(v => v.severity === RuleSeverity.ERROR).length === 0,
                violations,
                suggestions: Array.from(suggestions)
            };

            setLastValidation(validationResult);
            return validationResult;

        } catch (error) {
            console.error('Erreur lors de la validation des congés:', error);
            return { isValid: true, violations: [], suggestions: [] };
        } finally {
            setIsValidating(false);
        }
    }, [isInitializing, createLeaveRuleContext, ruleEngine, includeWarnings]);

    // Obtenir des suggestions pour une période donnée
    const getSuggestionsForPeriod = useCallback(async (
        startDate: Date,
        endDate: Date,
        userId: string,
        existingLeaves: LeaveRequest[] = []
    ): Promise<string[]> => {
        if (isInitializing) return [];

        try {
            const context = createLeaveRuleContext({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                userId
            }, existingLeaves);

            const results = await ruleEngine.evaluate(context, 'generation');
            const suggestions = new Set<string>();

            for (const result of results) {
                if (result.actions) {
                    for (const action of result.actions) {
                        if (action.type === 'notify' && action.parameters.suggestion) {
                            suggestions.add(action.parameters.suggestion);
                        }
                    }
                }
            }

            // Ajouter des suggestions génériques
            if (suggestions.size === 0) {
                suggestions.add('Cette période semble disponible pour vos congés');
            }

            return Array.from(suggestions);
        } catch (error) {
            console.error('Erreur lors de la récupération des suggestions:', error);
            return [];
        }
    }, [isInitializing, createLeaveRuleContext, ruleEngine]);

    // Vérifier les conflits potentiels
    const checkConflicts = useCallback(async (
        leaveRequest: Partial<LeaveRequest>,
        existingLeaves: LeaveRequest[] = []
    ): Promise<{
        hasConflicts: boolean;
        conflicts: Array<{
            type: string;
            message: string;
            affectedLeaves: string[];
        }>;
    }> => {
        if (isInitializing) {
            return { hasConflicts: false, conflicts: [] };
        }

        try {
            const context = createLeaveRuleContext(leaveRequest, existingLeaves);
            const results = await ruleEngine.evaluate(context, 'validation');
            
            const conflicts: Array<{
                type: string;
                message: string;
                affectedLeaves: string[];
            }> = [];

            for (const result of results) {
                if (!result.passed && result.metadata?.conflictType) {
                    conflicts.push({
                        type: result.metadata.conflictType,
                        message: result.metadata.conflictMessage || 'Conflit détecté',
                        affectedLeaves: result.metadata.affectedLeaves || []
                    });
                }
            }

            return {
                hasConflicts: conflicts.length > 0,
                conflicts
            };
        } catch (error) {
            console.error('Erreur lors de la vérification des conflits:', error);
            return { hasConflicts: false, conflicts: [] };
        }
    }, [isInitializing, createLeaveRuleContext, ruleEngine]);

    return {
        // État
        isValidating,
        isInitializing,
        lastValidation,
        
        // Actions
        validateLeaveRequest,
        getSuggestionsForPeriod,
        checkConflicts,
        
        // Utils
        clearValidation: () => setLastValidation(null),
        hasErrors: lastValidation ? 
            lastValidation.violations.some(v => v.severity === RuleSeverity.ERROR) : 
            false,
        hasWarnings: lastValidation ? 
            lastValidation.violations.some(v => v.severity === RuleSeverity.WARNING) : 
            false
    };
}