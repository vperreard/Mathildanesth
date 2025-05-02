import { useState, useCallback, useEffect } from 'react';
import {
    QuotaCarryOverCalculationRequest,
    QuotaCarryOverCalculationResult,
    QuotaCarryOverRule,
    QuotaCarryOverRuleType
} from '../../types/quota';
import { LeaveType, LeaveBalance } from '../../types/leave';
import { fetchLeaveBalance } from '../../services/leaveService';
import {
    fetchActiveCarryOverRulesForUser,
    calculateCarryOver,
    executeCarryOver,
    fetchCarryOverHistory,
    simulateCarryOverCalculation
} from '../../services/quotaService';

/**
 * Options pour le hook useQuotaCarryOver
 */
export interface UseQuotaCarryOverOptions {
    userId: string;
    fromYear?: number;
    toYear?: number;
    includeHistory?: boolean;
    maxHistoryItems?: number;
    autoExecute?: boolean;  // Exécuter automatiquement le report à la fin de l'année
}

/**
 * Résultat de la simulation d'un report
 */
export interface CarryOverPreviewResult extends QuotaCarryOverCalculationResult {
    leaveType: LeaveType;
    typeLabel: string;
    isAllowed: boolean;
    reasonNotAllowed?: string;
    fromYear: number;
    toYear: number;
}

/**
 * Résultat retourné par le hook useQuotaCarryOver
 */
export interface UseQuotaCarryOverReturn {
    // États
    loading: boolean;
    carryOverLoading: boolean;
    simulationLoading: boolean;
    historyLoading: boolean;
    error: Error | null;
    carryOverError: Error | null;

    // Données
    balance: LeaveBalance | null;
    carryOverRules: QuotaCarryOverRule[];
    carryOverHistory: any[];
    carryOverPreviews: CarryOverPreviewResult[];
    eligibleTypes: LeaveType[];

    // Méthodes
    refreshBalance: () => Promise<void>;
    refreshCarryOverRules: () => Promise<void>;
    refreshCarryOverHistory: () => Promise<void>;
    simulateCarryOver: (request: QuotaCarryOverCalculationRequest) => Promise<CarryOverPreviewResult>;
    simulateAllCarryOvers: () => Promise<CarryOverPreviewResult[]>;
    executeCarryOver: (request: QuotaCarryOverCalculationRequest) => Promise<QuotaCarryOverCalculationResult>;
    executeAllCarryOvers: () => Promise<QuotaCarryOverCalculationResult[]>;

    // Utilitaires
    getTypeLabel: (type: LeaveType) => string;
    getRemainingDays: (type: LeaveType) => number;
    isCarryOverAllowed: (type: LeaveType) => boolean;
    getReasonCarryOverNotAllowed: (type: LeaveType) => string | null;
    getCarryOverRuleForType: (type: LeaveType) => QuotaCarryOverRule | null;
}

/**
 * Hook personnalisé pour gérer les reports de quotas de congés d'une année sur l'autre
 */
export function useQuotaCarryOver(options: UseQuotaCarryOverOptions): UseQuotaCarryOverReturn {
    const {
        userId,
        fromYear = new Date().getFullYear(),
        toYear = fromYear + 1,
        includeHistory = false,
        maxHistoryItems = 5,
        autoExecute = false
    } = options;

    // États
    const [loading, setLoading] = useState<boolean>(true);
    const [carryOverLoading, setCarryOverLoading] = useState<boolean>(false);
    const [simulationLoading, setSimulationLoading] = useState<boolean>(false);
    const [historyLoading, setHistoryLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const [carryOverError, setCarryOverError] = useState<Error | null>(null);

    const [balance, setBalance] = useState<LeaveBalance | null>(null);
    const [carryOverRules, setCarryOverRules] = useState<QuotaCarryOverRule[]>([]);
    const [carryOverHistory, setCarryOverHistory] = useState<any[]>([]);
    const [carryOverPreviews, setCarryOverPreviews] = useState<CarryOverPreviewResult[]>([]);

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
     * Récupérer les règles de report
     */
    const refreshCarryOverRules = useCallback(async (): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            const rules = await fetchActiveCarryOverRulesForUser(userId);
            setCarryOverRules(rules);
        } catch (err) {
            setError(err as Error);
            console.error('Erreur lors de la récupération des règles de report', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    /**
     * Récupérer l'historique des reports
     */
    const refreshCarryOverHistory = useCallback(async (): Promise<void> => {
        if (!includeHistory) return;

        setHistoryLoading(true);
        setError(null);

        try {
            const history = await fetchCarryOverHistory(userId, maxHistoryItems);
            setCarryOverHistory(history);
        } catch (err) {
            setError(err as Error);
            console.error('Erreur lors de la récupération de l\'historique des reports', err);
        } finally {
            setHistoryLoading(false);
        }
    }, [userId, includeHistory, maxHistoryItems]);

    /**
     * Simuler un report
     */
    const simulateCarryOver = useCallback(async (request: QuotaCarryOverCalculationRequest): Promise<CarryOverPreviewResult> => {
        setSimulationLoading(true);
        setCarryOverError(null);

        try {
            const leaveType = request.leaveType;

            // Trouver la règle applicable
            const rule = getCarryOverRuleForType(leaveType);

            if (!rule) {
                throw new Error(`Aucune règle de report n'est disponible pour ${getTypeLabel(leaveType)}`);
            }

            // Prévisualiser le report
            const preview = await calculateCarryOver(request);

            // Extension de la prévisualisation avec des informations supplémentaires
            const extendedPreview: CarryOverPreviewResult = {
                ...preview,
                leaveType,
                typeLabel: getTypeLabel(leaveType),
                isAllowed: isCarryOverAllowed(leaveType),
                reasonNotAllowed: getReasonCarryOverNotAllowed(leaveType),
                fromYear: request.fromYear,
                toYear: request.toYear
            };

            // Mettre à jour la liste des prévisualisations
            setCarryOverPreviews(prev => {
                const existing = prev.findIndex(p => p.leaveType === leaveType);
                if (existing >= 0) {
                    const updated = [...prev];
                    updated[existing] = extendedPreview;
                    return updated;
                }
                return [...prev, extendedPreview];
            });

            return extendedPreview;
        } catch (err) {
            setCarryOverError(err as Error);
            console.error('Erreur lors de la simulation du report', err);

            // Retourner un objet d'erreur
            return {
                originalRemaining: 0,
                eligibleForCarryOver: 0,
                carryOverAmount: 0,
                expiryDate: new Date(),
                message: (err as Error).message,
                leaveType: request.leaveType,
                typeLabel: getTypeLabel(request.leaveType),
                isAllowed: false,
                reasonNotAllowed: (err as Error).message,
                fromYear: request.fromYear,
                toYear: request.toYear
            };
        } finally {
            setSimulationLoading(false);
        }
    }, []);

    /**
     * Simuler tous les reports possibles
     */
    const simulateAllCarryOvers = useCallback(async (): Promise<CarryOverPreviewResult[]> => {
        setSimulationLoading(true);
        setCarryOverError(null);

        try {
            const previews: CarryOverPreviewResult[] = [];
            const types = eligibleTypes;

            for (const type of types) {
                const request: QuotaCarryOverCalculationRequest = {
                    userId,
                    leaveType: type,
                    fromYear,
                    toYear
                };

                try {
                    const preview = await simulateCarryOver(request);
                    previews.push(preview);
                } catch (err) {
                    console.error(`Erreur lors de la simulation du report pour ${getTypeLabel(type)}`, err);
                }
            }

            setCarryOverPreviews(previews);
            return previews;
        } catch (err) {
            setCarryOverError(err as Error);
            console.error('Erreur lors de la simulation des reports', err);
            return [];
        } finally {
            setSimulationLoading(false);
        }
    }, [userId, fromYear, toYear, simulateCarryOver]);

    /**
     * Exécuter un report
     */
    const executeCarryOver = useCallback(async (request: QuotaCarryOverCalculationRequest): Promise<QuotaCarryOverCalculationResult> => {
        setCarryOverLoading(true);
        setCarryOverError(null);

        try {
            // Vérifier si le report est autorisé
            if (!isCarryOverAllowed(request.leaveType)) {
                const reason = getReasonCarryOverNotAllowed(request.leaveType);
                throw new Error(reason || 'Report non autorisé');
            }

            // Exécuter le report
            const result = await executeCarryOver(request);

            // Rafraîchir le solde après le report
            await refreshBalance();

            // Rafraîchir l'historique si nécessaire
            if (includeHistory) {
                await refreshCarryOverHistory();
            }

            return result;
        } catch (err) {
            setCarryOverError(err as Error);
            console.error('Erreur lors de l\'exécution du report', err);

            return {
                originalRemaining: 0,
                eligibleForCarryOver: 0,
                carryOverAmount: 0,
                expiryDate: new Date(),
                message: (err as Error).message
            };
        } finally {
            setCarryOverLoading(false);
        }
    }, [refreshBalance, refreshCarryOverHistory, includeHistory]);

    /**
     * Exécuter tous les reports
     */
    const executeAllCarryOvers = useCallback(async (): Promise<QuotaCarryOverCalculationResult[]> => {
        setCarryOverLoading(true);
        setCarryOverError(null);

        try {
            const results: QuotaCarryOverCalculationResult[] = [];
            const previews = await simulateAllCarryOvers();

            // Pour chaque prévisualisation réussie, exécuter le report
            for (const preview of previews) {
                if (preview.isAllowed && preview.carryOverAmount > 0) {
                    const request: QuotaCarryOverCalculationRequest = {
                        userId,
                        leaveType: preview.leaveType,
                        fromYear: preview.fromYear,
                        toYear: preview.toYear
                    };

                    try {
                        const result = await executeCarryOver(request);
                        results.push(result);
                    } catch (err) {
                        console.error(`Erreur lors de l'exécution du report pour ${preview.typeLabel}`, err);
                    }
                }
            }

            return results;
        } catch (err) {
            setCarryOverError(err as Error);
            console.error('Erreur lors de l\'exécution des reports', err);
            return [];
        } finally {
            setCarryOverLoading(false);
        }
    }, [userId, simulateAllCarryOvers, executeCarryOver]);

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
     * Obtenir la règle de report pour un type de congé
     */
    const getCarryOverRuleForType = useCallback((type: LeaveType): QuotaCarryOverRule | null => {
        return carryOverRules.find(rule => rule.leaveType === type && rule.isActive) || null;
    }, [carryOverRules]);

    /**
     * Vérifier si un report est autorisé
     */
    const isCarryOverAllowed = useCallback((type: LeaveType): boolean => {
        // Vérifier si une règle de report existe
        const rule = getCarryOverRuleForType(type);
        if (!rule) return false;

        // Vérifier s'il y a des jours disponibles à reporter
        const remaining = getRemainingDays(type);
        if (remaining <= 0) return false;

        // Vérifier si le type est reportable
        return true;
    }, [getCarryOverRuleForType, getRemainingDays]);

    /**
     * Obtenir la raison pour laquelle un report n'est pas autorisé
     */
    const getReasonCarryOverNotAllowed = useCallback((type: LeaveType): string | null => {
        // Vérifier si une règle de report existe
        const rule = getCarryOverRuleForType(type);
        if (!rule) {
            return `Aucune règle de report n'est disponible pour ${getTypeLabel(type)}`;
        }

        // Vérifier s'il y a des jours disponibles à reporter
        const remaining = getRemainingDays(type);
        if (remaining <= 0) {
            return `Aucun jour disponible à reporter pour ${getTypeLabel(type)}`;
        }

        return null;
    }, [getCarryOverRuleForType, getRemainingDays, getTypeLabel]);

    /**
     * Déterminer les types de congés éligibles au report
     */
    const getEligibleTypes = useCallback((): LeaveType[] => {
        if (!balance) return [];

        return Object.values(LeaveType).filter(type => {
            const remaining = getRemainingDays(type);
            // Un type est éligible s'il a des jours restants et une règle de report
            return remaining > 0 && !!getCarryOverRuleForType(type);
        });
    }, [balance, getRemainingDays, getCarryOverRuleForType]);

    // Liste des types éligibles au report
    const eligibleTypes = getEligibleTypes();

    // Vérification pour le report automatique en fin d'année
    useEffect(() => {
        if (autoExecute) {
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            const currentDay = now.getDate();

            // Si nous sommes le dernier jour de l'année, exécuter le report automatique
            if (currentMonth === 11 && currentDay === 31) {
                executeAllCarryOvers();
            }
        }
    }, [autoExecute, executeAllCarryOvers]);

    // Chargement initial des données
    useEffect(() => {
        const init = async () => {
            await refreshBalance();
            await refreshCarryOverRules();
            if (includeHistory) {
                await refreshCarryOverHistory();
            }
        };

        init();
    }, [refreshBalance, refreshCarryOverRules, refreshCarryOverHistory, includeHistory]);

    return {
        // États
        loading,
        carryOverLoading,
        simulationLoading,
        historyLoading,
        error,
        carryOverError,

        // Données
        balance,
        carryOverRules,
        carryOverHistory,
        carryOverPreviews,
        eligibleTypes,

        // Méthodes
        refreshBalance,
        refreshCarryOverRules,
        refreshCarryOverHistory,
        simulateCarryOver,
        simulateAllCarryOvers,
        executeCarryOver,
        executeAllCarryOvers,

        // Utilitaires
        getTypeLabel,
        getRemainingDays,
        isCarryOverAllowed,
        getReasonCarryOverNotAllowed,
        getCarryOverRuleForType
    };
} 