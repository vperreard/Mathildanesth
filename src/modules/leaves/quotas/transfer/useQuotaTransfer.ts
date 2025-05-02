import { useState, useCallback, useEffect } from 'react';
import {
    QuotaTransferRequest,
    QuotaTransferResult,
    QuotaTransferRule,
    QuotaTransferRuleType
} from '../../types/quota';
import { LeaveType, LeaveBalance } from '../../types/leave';
import { fetchLeaveBalance } from '../../services/leaveService';
import {
    fetchActiveTransferRulesForUser,
    transferQuota,
    previewQuotaTransfer,
    fetchTransferHistory
} from '../../services/quotaService';
import quotaApi from '../../api/quotaApi';
import { useAuth } from '@/context/AuthContext';
import { notification } from 'antd';
import { AuditAction } from '@/core/audit/AuditTypes';
import { useTranslation } from 'next-i18next';

/**
 * Options pour le hook useQuotaTransfer
 */
export interface UseQuotaTransferOptions {
    userId: string;
    year?: number;
    includeHistory?: boolean;
    maxHistoryItems?: number;
}

/**
 * Résultat de la simulation d'un transfert
 */
export interface TransferPreviewResult extends QuotaTransferResult {
    applicableRules: QuotaTransferRule[];
    transferRatio: number;
    sourceLabel: string;
    targetLabel: string;
    isAllowed: boolean;
    reasonNotAllowed?: string;
}

/**
 * Résultat retourné par le hook useQuotaTransfer
 */
export interface UseQuotaTransferReturn {
    // États
    loading: boolean;
    transferLoading: boolean;
    simulationLoading: boolean;
    historyLoading: boolean;
    error: Error | null;
    transferError: Error | null;

    // Données
    balance: LeaveBalance | null;
    transferRules: QuotaTransferRule[];
    transferHistory: any[];
    transferPreview: TransferPreviewResult | null;
    availableSourceTypes: LeaveType[];
    availableTargetTypes: {
        [sourceType: string]: LeaveType[];
    };

    // Méthodes
    refreshBalance: () => Promise<void>;
    refreshTransferRules: () => Promise<void>;
    refreshTransferHistory: () => Promise<void>;
    simulateTransfer: (request: QuotaTransferRequest) => Promise<TransferPreviewResult>;
    executeTransfer: (request: QuotaTransferRequest) => Promise<QuotaTransferResult>;

    // Utilitaires
    getTypeLabel: (type: LeaveType) => string;
    getRemainingDays: (type: LeaveType) => number;
    getMaxTransferableAmount: (sourceType: LeaveType, targetType: LeaveType) => number;
    getConversionRatio: (sourceType: LeaveType, targetType: LeaveType) => number;
    isTransferAllowed: (sourceType: LeaveType, targetType: LeaveType) => boolean;
    getReasonTransferNotAllowed: (sourceType: LeaveType, targetType: LeaveType) => string | null;
}

/**
 * Hook personnalisé pour gérer les transferts de quotas de congés
 */
export function useQuotaTransfer(options: UseQuotaTransferOptions): UseQuotaTransferReturn {
    const {
        userId,
        year = new Date().getFullYear(),
        includeHistory = false,
        maxHistoryItems = 5
    } = options;

    const { t } = useTranslation('leaves');
    const { user } = useAuth();

    // États
    const [loading, setLoading] = useState<boolean>(true);
    const [transferLoading, setTransferLoading] = useState<boolean>(false);
    const [simulationLoading, setSimulationLoading] = useState<boolean>(false);
    const [historyLoading, setHistoryLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const [transferError, setTransferError] = useState<Error | null>(null);

    const [balance, setBalance] = useState<LeaveBalance | null>(null);
    const [transferRules, setTransferRules] = useState<QuotaTransferRule[]>([]);
    const [transferHistory, setTransferHistory] = useState<any[]>([]);
    const [transferPreview, setTransferPreview] = useState<TransferPreviewResult | null>(null);

    /**
     * Labels pour les types de congés
     */
    const typeLabels: { [key in LeaveType]: string } = {
        [LeaveType.ANNUAL]: 'Congés annuels',
        [LeaveType.RECOVERY]: 'Récupération',
        [LeaveType.TRAINING]: 'Formation',
        [LeaveType.SICK]: 'Maladie',
        [LeaveType.MATERNITY]: 'Maternité',
        [LeaveType.SPECIAL]: 'Congés spéciaux',
        [LeaveType.UNPAID]: 'Sans solde',
        [LeaveType.OTHER]: 'Autre',
    };

    /**
     * Récupérer le solde des congés
     */
    const refreshBalance = useCallback(async (): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            const balanceData = await fetchLeaveBalance(userId);
            setBalance(balanceData);
        } catch (err) {
            setError(err as Error);
            console.error('Erreur lors de la récupération du solde des congés', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    /**
     * Récupérer les règles de transfert
     */
    const refreshTransferRules = useCallback(async (): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            const rules = await quotaApi.getTransferRules();
            setTransferRules(rules);
        } catch (err) {
            setError(err as Error);
            console.error('Erreur lors de la récupération des règles de transfert', err);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Récupérer l'historique des transferts
     */
    const refreshTransferHistory = useCallback(async (): Promise<void> => {
        if (!includeHistory) return;

        setHistoryLoading(true);
        setError(null);

        try {
            const history = await fetchTransferHistory(userId, maxHistoryItems);
            setTransferHistory(history);
        } catch (err) {
            setError(err as Error);
            console.error('Erreur lors de la récupération de l\'historique des transferts', err);
        } finally {
            setHistoryLoading(false);
        }
    }, [userId, includeHistory, maxHistoryItems]);

    /**
     * Simuler un transfert
     */
    const simulateTransfer = useCallback(async (request: QuotaTransferRequest): Promise<TransferPreviewResult> => {
        setSimulationLoading(true);
        setTransferError(null);

        try {
            const sourceType = request.sourceType;
            const targetType = request.targetType;

            // Trouver les règles applicables
            const applicableRules = transferRules.filter(rule =>
                rule.sourceType === sourceType &&
                rule.targetType === targetType &&
                rule.isActive
            );

            if (applicableRules.length === 0) {
                throw new Error(`Aucune règle de transfert n'est disponible pour ${getTypeLabel(sourceType)} vers ${getTypeLabel(targetType)}`);
            }

            // Prévisualiser le transfert
            const preview = await previewQuotaTransfer(request, applicableRules);

            // Extension de la prévisualisation avec des informations supplémentaires
            const extendedPreview: TransferPreviewResult = {
                ...preview,
                applicableRules,
                transferRatio: applicableRules[0]?.ratio || 1,
                sourceLabel: getTypeLabel(sourceType),
                targetLabel: getTypeLabel(targetType),
                isAllowed: isTransferAllowed(sourceType, targetType),
                reasonNotAllowed: getReasonTransferNotAllowed(sourceType, targetType) || undefined
            };

            setTransferPreview(extendedPreview);
            return extendedPreview;
        } catch (err) {
            setTransferError(err as Error);
            console.error('Erreur lors de la simulation du transfert', err);

            // Retourner un objet d'erreur
            return {
                success: false,
                sourceAmount: 0,
                targetAmount: 0,
                sourceRemaining: 0,
                targetTotal: 0,
                message: (err as Error).message,
                applicableRules: [],
                transferRatio: 1,
                sourceLabel: getTypeLabel(request.sourceType),
                targetLabel: getTypeLabel(request.targetType),
                isAllowed: false,
                reasonNotAllowed: (err as Error).message
            };
        } finally {
            setSimulationLoading(false);
        }
    }, [transferRules]);

    /**
     * Exécuter un transfert
     */
    const executeTransfer = useCallback(async (request: QuotaTransferRequest): Promise<QuotaTransferResult> => {
        setTransferLoading(true);
        setTransferError(null);

        try {
            // Vérifier si le transfert est autorisé
            if (!isTransferAllowed(request.sourceType, request.targetType)) {
                const reason = getReasonTransferNotAllowed(request.sourceType, request.targetType);
                throw new Error(reason || 'Transfert non autorisé');
            }

            // Exécuter le transfert
            const result = await transferQuota(request);

            // Rafraîchir le solde après le transfert
            await refreshBalance();

            // Rafraîchir l'historique si nécessaire
            if (includeHistory) {
                await refreshTransferHistory();
            }

            return result;
        } catch (err) {
            setTransferError(err as Error);
            console.error('Erreur lors de l\'exécution du transfert', err);

            return {
                success: false,
                sourceAmount: 0,
                targetAmount: 0,
                sourceRemaining: 0,
                targetTotal: 0,
                message: (err as Error).message
            };
        } finally {
            setTransferLoading(false);
        }
    }, [refreshBalance, refreshTransferHistory, includeHistory]);

    /**
     * Obtenir le label d'un type de congé
     */
    const getTypeLabel = useCallback((type: LeaveType): string => {
        return typeLabels[type] || 'Type inconnu';
    }, []);

    /**
     * Obtenir le nombre de jours restants pour un type de congé
     */
    const getRemainingDays = useCallback((type: LeaveType): number => {
        if (!balance) return 0;

        const details = balance.detailsByType[type] || { used: 0, pending: 0 };
        let total = 0;

        // Définir le total selon le type de congé
        switch (type) {
            case LeaveType.ANNUAL:
                total = balance.initialAllowance;
                break;
            case LeaveType.RECOVERY:
                total = balance.additionalAllowance;
                break;
            default:
                // Pour les autres types, on pourrait ajouter une logique spécifique
                total = 0;
        }

        return Math.max(0, total - (details.used || 0) - (details.pending || 0));
    }, [balance]);

    /**
     * Obtenir le montant maximum transférable
     */
    const getMaxTransferableAmount = useCallback((sourceType: LeaveType, targetType: LeaveType): number => {
        if (!balance) return 0;

        // Trouver les règles applicables
        const rule = transferRules.find(r =>
            r.sourceType === sourceType &&
            r.targetType === targetType &&
            r.isActive
        );

        if (!rule) return 0;

        // Récupérer le nombre de jours restants pour le type source
        const remaining = getRemainingDays(sourceType);

        // Appliquer la limite de la règle si elle existe
        return rule.maxAmount ? Math.min(remaining, rule.maxAmount) : remaining;
    }, [balance, transferRules, getRemainingDays]);

    /**
     * Obtenir le ratio de conversion entre deux types de congés
     */
    const getConversionRatio = useCallback((sourceType: LeaveType, targetType: LeaveType): number => {
        const rule = transferRules.find(r =>
            r.sourceType === sourceType &&
            r.targetType === targetType &&
            r.isActive
        );

        return rule?.ratio || 1.0;
    }, [transferRules]);

    /**
     * Vérifier si un transfert est autorisé
     */
    const isTransferAllowed = useCallback((sourceType: LeaveType, targetType: LeaveType): boolean => {
        // Vérifier si une règle de transfert existe
        const ruleExists = transferRules.some(r =>
            r.sourceType === sourceType &&
            r.targetType === targetType &&
            r.isActive
        );

        if (!ruleExists) return false;

        // Vérifier s'il y a des jours disponibles à transférer
        const hasRemainingDays = getRemainingDays(sourceType) > 0;

        return ruleExists && hasRemainingDays;
    }, [transferRules, getRemainingDays]);

    /**
     * Obtenir la raison pour laquelle un transfert n'est pas autorisé
     */
    const getReasonTransferNotAllowed = useCallback((sourceType: LeaveType, targetType: LeaveType): string | null => {
        // Vérifier si une règle de transfert existe
        const ruleExists = transferRules.some(r =>
            r.sourceType === sourceType &&
            r.targetType === targetType &&
            r.isActive
        );

        if (!ruleExists) {
            return `Aucune règle de transfert n'est disponible pour ${getTypeLabel(sourceType)} vers ${getTypeLabel(targetType)}`;
        }

        // Vérifier s'il y a des jours disponibles à transférer
        const remaining = getRemainingDays(sourceType);
        if (remaining <= 0) {
            return `Aucun jour disponible à transférer depuis ${getTypeLabel(sourceType)}`;
        }

        return null;
    }, [transferRules, getRemainingDays, getTypeLabel]);

    /**
     * Déterminer les types de congés sources disponibles
     */
    const getAvailableSourceTypes = useCallback((): LeaveType[] => {
        if (!balance) return [];

        return Object.values(LeaveType).filter(type => {
            const remaining = getRemainingDays(type);
            // Un type est disponible comme source s'il a des jours restants et au moins une règle
            return remaining > 0 && transferRules.some(r => r.sourceType === type && r.isActive);
        });
    }, [balance, getRemainingDays, transferRules]);

    /**
     * Déterminer les types de congés cibles disponibles par type source
     */
    const getAvailableTargetTypes = useCallback((): { [sourceType: string]: LeaveType[] } => {
        const result: { [sourceType: string]: LeaveType[] } = {};

        if (!balance) return result;

        // Pour chaque type de congé
        Object.values(LeaveType).forEach(sourceType => {
            // Trouver les règles où ce type est la source
            const targetTypes = transferRules
                .filter(r => r.sourceType === sourceType && r.isActive)
                .map(r => r.targetType);

            if (targetTypes.length > 0) {
                result[sourceType] = targetTypes;
            }
        });

        return result;
    }, [balance, transferRules]);

    // Chargement initial des données
    useEffect(() => {
        const init = async () => {
            await refreshBalance();
            await refreshTransferRules();
            if (includeHistory) {
                await refreshTransferHistory();
            }
        };

        init();
    }, [refreshBalance, refreshTransferRules, refreshTransferHistory, includeHistory]);

    return {
        // États
        loading,
        transferLoading,
        simulationLoading,
        historyLoading,
        error,
        transferError,

        // Données
        balance,
        transferRules,
        transferHistory,
        transferPreview,
        availableSourceTypes: getAvailableSourceTypes(),
        availableTargetTypes: getAvailableTargetTypes(),

        // Méthodes
        refreshBalance,
        refreshTransferRules,
        refreshTransferHistory,
        simulateTransfer,
        executeTransfer,

        // Utilitaires
        getTypeLabel,
        getRemainingDays,
        getMaxTransferableAmount,
        getConversionRatio,
        isTransferAllowed,
        getReasonTransferNotAllowed
    };
}

export default useQuotaTransfer; 