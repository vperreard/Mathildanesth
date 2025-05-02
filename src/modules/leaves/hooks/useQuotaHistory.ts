import { useState, useEffect, useCallback } from 'react';
import { QuotaTransaction, QuotaTransactionType, UserQuotaSummary } from '../types/quota';
import { QuotaManagementService, QuotaManagementEvents } from '../services/quotaManagementService';
import { LeaveType } from '../types/leave';

/**
 * Hook pour accéder à l'historique des quotas et des transactions
 */
export const useQuotaHistory = (
    userId: string,
    periodId?: string,
) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<QuotaTransaction[]>([]);
    const [quotaSummary, setQuotaSummary] = useState<UserQuotaSummary | null>(null);
    const [activePeriods, setActivePeriods] = useState<{ id: string, name: string }[]>([]);

    const quotaService = QuotaManagementService.getInstance();

    /**
     * Charger le résumé des quotas de l'utilisateur
     */
    const loadQuotaSummary = useCallback(async (targetPeriodId?: string) => {
        setLoading(true);
        setError(null);

        try {
            const summary = await quotaService.getUserQuotaSummary(
                userId,
                targetPeriodId || periodId
            );

            if (summary) {
                setQuotaSummary(summary);
            }

            return summary;
        } catch (err: any) {
            const errorMessage = err?.message || 'Erreur lors du chargement du résumé des quotas';
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, [userId, periodId, quotaService]);

    /**
     * Charger l'historique des transactions
     */
    const loadTransactionHistory = useCallback(async (
        targetPeriodId?: string,
        transactionType?: QuotaTransactionType
    ) => {
        setLoading(true);
        setError(null);

        try {
            const history = await quotaService.getUserTransactionHistory(
                userId,
                targetPeriodId || periodId,
                transactionType
            );

            setTransactions(history);
            return history;
        } catch (err: any) {
            const errorMessage = err?.message || 'Erreur lors du chargement de l\'historique';
            setError(errorMessage);
            return [];
        } finally {
            setLoading(false);
        }
    }, [userId, periodId, quotaService]);

    /**
     * Charger les périodes actives
     */
    const loadActivePeriods = useCallback(async () => {
        setLoading(true);
        try {
            const periods = await quotaService.getActivePeriods();
            setActivePeriods(periods.map(p => ({
                id: p.id,
                name: p.name
            })));
            return periods;
        } catch (err: any) {
            setError(err?.message || 'Erreur lors du chargement des périodes');
            return [];
        } finally {
            setLoading(false);
        }
    }, [quotaService]);

    // Filtrer les transactions par type
    const getTransactionsByType = useCallback((type: QuotaTransactionType): QuotaTransaction[] => {
        return transactions.filter(t => t.transactionType === type);
    }, [transactions]);

    // Obtenir les transferts (entrée et sortie)
    const getTransferTransactions = useCallback((): {
        incoming: QuotaTransaction[];
        outgoing: QuotaTransaction[];
    } => {
        const transfers = transactions.filter(t => t.transactionType === QuotaTransactionType.TRANSFER);

        return {
            incoming: transfers.filter(t => t.targetLeaveType !== undefined),
            outgoing: transfers.filter(t => t.targetLeaveType === undefined)
        };
    }, [transactions]);

    // Obtenir le solde actuel pour un type de congé
    const getCurrentBalance = useCallback((leaveType: LeaveType): number => {
        if (!quotaSummary) return 0;

        const balance = quotaSummary.balances.find(b => b.leaveType === leaveType);
        return balance?.currentBalance || 0;
    }, [quotaSummary]);

    // Obtenir les jours qui vont expirer pour un type de congé
    const getExpiringDays = useCallback((leaveType: LeaveType): {
        days: number;
        expirationDate: string;
    }[] => {
        if (!quotaSummary) return [];

        return quotaSummary.expiringDays[leaveType] || [];
    }, [quotaSummary]);

    // Rafraîchir toutes les données
    const refreshAll = useCallback(async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadQuotaSummary(),
                loadTransactionHistory(),
                loadActivePeriods()
            ]);
        } catch (err: any) {
            setError(err?.message || 'Erreur lors de la mise à jour des données');
        } finally {
            setLoading(false);
        }
    }, [loadQuotaSummary, loadTransactionHistory, loadActivePeriods]);

    // S'abonner aux événements de mise à jour des quotas
    useEffect(() => {
        // Se désabonner à la destruction du composant
        const unsubscribeQuotaUpdated = quotaService.subscribe(
            QuotaManagementEvents.QUOTA_UPDATED,
            () => refreshAll()
        );

        const unsubscribeTransactionCreated = quotaService.subscribe(
            QuotaManagementEvents.TRANSACTION_CREATED,
            () => refreshAll()
        );

        const unsubscribeBalanceChanged = quotaService.subscribe(
            QuotaManagementEvents.BALANCE_CHANGED,
            () => loadQuotaSummary()
        );

        // Charger les données initiales
        refreshAll();

        return () => {
            unsubscribeQuotaUpdated();
            unsubscribeTransactionCreated();
            unsubscribeBalanceChanged();
        };
    }, [userId, periodId, quotaService, refreshAll, loadQuotaSummary]);

    return {
        loading,
        error,
        transactions,
        quotaSummary,
        activePeriods,
        loadQuotaSummary,
        loadTransactionHistory,
        loadActivePeriods,
        getTransactionsByType,
        getTransferTransactions,
        getCurrentBalance,
        getExpiringDays,
        refreshAll
    };
}; 