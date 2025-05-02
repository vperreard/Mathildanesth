import { useState, useCallback } from 'react';
import { LeaveType } from '../types/leave';
import { QuotaCarryOverRule, QuotaCarryOverRequest } from '../types/quota';
import { QuotaManagementService } from '../services/quotaManagementService';

/**
 * Hook pour la gestion des reports de quotas d'une période à une autre
 */
export const useQuotaCarryOver = (
    userId: string
) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [carryOverRules, setCarryOverRules] = useState<Record<LeaveType, QuotaCarryOverRule[]>>({} as Record<LeaveType, QuotaCarryOverRule[]>);
    const [pendingRequests, setPendingRequests] = useState<QuotaCarryOverRequest[]>([]);

    const quotaService = QuotaManagementService.getInstance();

    /**
     * Charger les règles de report pour un type de congé
     */
    const loadCarryOverRules = useCallback(async (leaveType: LeaveType) => {
        setLoading(true);
        try {
            const rules = await quotaService.getCarryOverRules(leaveType);
            setCarryOverRules(prev => ({
                ...prev,
                [leaveType]: rules
            }));
            return rules;
        } catch (err: any) {
            setError(err?.message || 'Erreur lors de la récupération des règles de report');
            return [];
        } finally {
            setLoading(false);
        }
    }, [quotaService]);

    /**
     * Simuler un report de quota
     */
    const simulateCarryOver = useCallback(async (
        fromPeriodId: string,
        toPeriodId: string,
        leaveType: LeaveType,
        days: number
    ) => {
        setLoading(true);
        setError(null);

        try {
            const result = await quotaService.simulateCarryOver(
                userId,
                fromPeriodId,
                toPeriodId,
                leaveType,
                days
            );

            return result;
        } catch (err: any) {
            const errorMessage = err?.message || 'Erreur lors de la simulation du report';
            setError(errorMessage);
            return {
                isValid: false,
                eligibleDays: 0,
                message: errorMessage
            };
        } finally {
            setLoading(false);
        }
    }, [userId, quotaService]);

    /**
     * Demander un report de quota
     */
    const requestCarryOver = useCallback(async (
        fromPeriodId: string,
        toPeriodId: string,
        leaveType: LeaveType,
        days: number,
        comment?: string
    ) => {
        setLoading(true);
        setError(null);

        try {
            const result = await quotaService.requestCarryOver(
                userId,
                fromPeriodId,
                toPeriodId,
                leaveType,
                days,
                comment
            );

            if (result) {
                setPendingRequests(prev => [...prev, result]);
            }

            return result;
        } catch (err: any) {
            const errorMessage = err?.message || 'Erreur lors de la demande de report';
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, [userId, quotaService]);

    /**
     * Vérifier si un type de congé peut être reporté
     */
    const canCarryOver = useCallback((leaveType: LeaveType): boolean => {
        return !!carryOverRules[leaveType]?.some(rule => rule.isActive);
    }, [carryOverRules]);

    /**
     * Obtenir les règles actives pour un type de congé
     */
    const getActiveRules = useCallback((leaveType: LeaveType): QuotaCarryOverRule[] => {
        return carryOverRules[leaveType]?.filter(rule => rule.isActive) || [];
    }, [carryOverRules]);

    /**
     * Calculer le montant maximum reportable selon les règles
     */
    const getMaxCarryOverAmount = useCallback((
        leaveType: LeaveType,
        currentBalance: number
    ): number => {
        const rules = getActiveRules(leaveType);
        if (!rules.length) return 0;

        // Trouver la règle la plus restrictive
        let maxAmount = currentBalance;

        for (const rule of rules) {
            let ruleAmount = currentBalance;

            switch (rule.ruleType) {
                case 'PERCENTAGE':
                    ruleAmount = Math.floor(currentBalance * (rule.value / 100));
                    break;
                case 'FIXED':
                    ruleAmount = Math.min(rule.value, currentBalance);
                    break;
                case 'UNLIMITED':
                    ruleAmount = currentBalance;
                    break;
                case 'EXPIRABLE':
                    ruleAmount = Math.min(rule.value, currentBalance);
                    break;
            }

            // Appliquer également la limite maximale si définie
            if (rule.maxCarryOverDays !== undefined) {
                ruleAmount = Math.min(ruleAmount, rule.maxCarryOverDays);
            }

            // Conserver le montant le plus restrictif
            maxAmount = Math.min(maxAmount, ruleAmount);
        }

        return maxAmount;
    }, [getActiveRules]);

    return {
        loading,
        error,
        carryOverRules,
        pendingRequests,
        loadCarryOverRules,
        simulateCarryOver,
        requestCarryOver,
        canCarryOver,
        getActiveRules,
        getMaxCarryOverAmount
    };
}; 