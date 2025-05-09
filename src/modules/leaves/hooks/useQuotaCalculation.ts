import { useState, useEffect, useCallback } from 'react';
import { QuotaManagementService, QuotaManagementEvents } from '../services/QuotaManagementService';
import { LeaveType } from '../types/leave';
import { QuotaCalculationResult, QuotaTransferRule } from '../types/quota';

/**
 * Hook pour le calcul des quotas de congés disponibles
 * et la simulation de transferts
 */
export const useQuotaCalculation = (
    userId: string,
    periodId?: string,
) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [calculationResult, setCalculationResult] = useState<QuotaCalculationResult | null>(null);
    const [transferRules, setTransferRules] = useState<Record<LeaveType, QuotaTransferRule[]>>({} as Record<LeaveType, QuotaTransferRule[]>);

    const quotaService = QuotaManagementService.getInstance();

    /**
     * Vérifier la disponibilité d'un quota pour une demande de congé
     */
    const calculateAvailability = useCallback(async (
        leaveType: LeaveType,
        requestedDays: number,
        targetPeriodId?: string
    ) => {
        setLoading(true);
        setError(null);

        try {
            const result = await quotaService.calculateQuotaAvailability(
                userId,
                leaveType,
                targetPeriodId || periodId || '',
                requestedDays
            );

            setCalculationResult(result);
            return result;
        } catch (err: any) {
            const errorMessage = err?.message || 'Erreur lors du calcul de disponibilité';
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, [userId, periodId, quotaService]);

    /**
     * Récupérer les règles de transfert pour un type de congé
     */
    const loadTransferRules = useCallback(async (sourceType: LeaveType) => {
        setLoading(true);
        try {
            const rules = await quotaService.getTransferRules(sourceType);
            setTransferRules(prev => ({
                ...prev,
                [sourceType]: rules
            }));
            return rules;
        } catch (err: any) {
            setError(err?.message || 'Erreur lors de la récupération des règles');
            return [];
        } finally {
            setLoading(false);
        }
    }, [quotaService]);

    /**
     * Simuler un transfert de quota
     */
    const simulateTransfer = useCallback(async (
        fromType: LeaveType,
        toType: LeaveType,
        days: number,
        targetPeriodId?: string
    ) => {
        setLoading(true);
        setError(null);

        try {
            const result = await quotaService.simulateTransfer(
                userId,
                targetPeriodId || periodId || '',
                fromType,
                toType,
                days
            );

            return result;
        } catch (err: any) {
            const errorMessage = err?.message || 'Erreur lors de la simulation';
            setError(errorMessage);
            return {
                isValid: false,
                sourceRemaining: 0,
                resultingDays: 0,
                conversionRate: 1,
                message: errorMessage
            };
        } finally {
            setLoading(false);
        }
    }, [userId, periodId, quotaService]);

    /**
     * Demander un transfert de quota
     */
    const requestTransfer = useCallback(async (
        fromType: LeaveType,
        toType: LeaveType,
        days: number,
        comment?: string,
        targetPeriodId?: string
    ) => {
        setLoading(true);
        setError(null);

        try {
            const result = await quotaService.requestTransfer(
                userId,
                targetPeriodId || periodId || '',
                fromType,
                toType,
                days,
                comment
            );

            return result;
        } catch (err: any) {
            const errorMessage = err?.message || 'Erreur lors de la demande de transfert';
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, [userId, periodId, quotaService]);

    // Vérifier si un transfert est possible entre deux types
    const isTransferPossible = useCallback((fromType: LeaveType, toType: LeaveType): boolean => {
        if (!transferRules[fromType]) return false;

        return transferRules[fromType].some(rule =>
            rule.toType === toType && rule.isActive
        );
    }, [transferRules]);

    // Obtenir le taux de conversion entre deux types
    const getConversionRate = useCallback((fromType: LeaveType, toType: LeaveType): number => {
        if (!transferRules[fromType]) return 1;

        const rule = transferRules[fromType].find(r => r.toType === toType && r.isActive);
        return rule?.conversionRate || 1;
    }, [transferRules]);

    return {
        loading,
        error,
        calculationResult,
        transferRules,
        calculateAvailability,
        loadTransferRules,
        simulateTransfer,
        requestTransfer,
        isTransferPossible,
        getConversionRate
    };
}; 