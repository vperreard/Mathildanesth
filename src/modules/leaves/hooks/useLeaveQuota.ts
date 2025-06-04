import { useState, useCallback, useEffect } from 'react';
import { LeaveType, LeaveBalance, LeaveAllowanceCheckResult } from '../types/leave';
import { fetchLeaveBalance, checkLeaveAllowance } from '../services/leaveService';
import {
    QuotaTransferRequest,
    QuotaTransferResult,
    QuotaTransferRule,
    QuotaCarryOverCalculationRequest,
    QuotaCarryOverCalculationResult
} from '../types/quota';
import {
    fetchActiveTransferRulesForUser,
    transferQuota,
    previewQuotaTransfer,
    fetchTransferHistory,
    fetchActiveCarryOverRulesForUser,
    calculateCarryOver,
    executeCarryOver,
    fetchCarryOverHistory,
    simulateQuotaTransfer,
    simulateCarryOverCalculation
} from '../services/quotaService';
import { formatDate } from '@/utils/dateUtils';
import { WorkSchedule } from '../../profiles/types/workSchedule';
import { calculateLeaveCountedDays } from '../services/leaveCalculator';
import { calculateAnnualLeaveAllowance } from '../../profiles/services/workScheduleService';

/**
 * Interface pour les résultats du calcul de quota de congés
 */
export interface QuotaCalculationResult {
    // Indique si le quota est respecté
    isValid: boolean;
    // Message explicatif (erreur ou confirmation)
    message: string;
    // Jours demandés
    requestedDays: number;
    // Jours disponibles
    availableDays: number;
    // Type de congé concerné
    leaveType: LeaveType;
}

/**
 * Interface pour les quotas par type de congé
 */
export interface LeaveTypeQuota {
    type: LeaveType;
    label: string;
    total: number;
    used: number;
    pending: number;
    remaining: number;
    // Nouvelles propriétés pour les quotas reportés et transférés
    carriedOver?: number;        // Montant reporté de l'année précédente
    transferred?: number;        // Montant net transféré (positif = reçu, négatif = donné)
    expiryDate?: Date;           // Date d'expiration des jours reportés
}

/**
 * Interface pour les options du hook
 */
export interface UseLeaveQuotaOptions {
    userId: string;
    year?: number;
    userSchedule?: WorkSchedule;
}

/**
 * Interface pour les paramètres de vérification de quota
 */
export interface CheckQuotaParams {
    startDate: Date | null;
    endDate: Date | null;
    leaveType: LeaveType;
    userId: string;
}

/**
 * Interface pour les paramètres de transfert de quota
 */
export interface TransferQuotaParams {
    userId: string;
    sourceType: LeaveType;
    targetType: LeaveType;
    sourceAmount: number;
    comment?: string;
}

/**
 * Interface pour les paramètres de calcul de report
 */
export interface CalculateCarryOverParams {
    userId: string;
    leaveType: LeaveType;
    fromYear: number;
    toYear: number;
}

/**
 * Interface pour le retour du hook
 */
export interface UseLeaveQuotaReturn {
    // Chargement en cours
    loading: boolean;
    // Erreur éventuelle
    error: Error | null;
    // Quotas par type de congé
    quotasByType: LeaveTypeQuota[];
    // Solde global
    totalBalance: {
        total: number;
        used: number;
        pending: number;
        remaining: number;
    };
    // Vérifier si une demande respecte les quotas
    checkQuota: (params: CheckQuotaParams) => Promise<QuotaCalculationResult>;
    // Rafraîchir les données
    refreshQuotas: (userId: string) => Promise<void>;
    // Obtenir le quota pour un type spécifique
    getQuotaForType: (type: LeaveType) => LeaveTypeQuota | null;

    // Nouvelles fonctionnalités de transfert et report
    transferRules: QuotaTransferRule[];
    transferQuota: (params: TransferQuotaParams) => Promise<QuotaTransferResult>;
    previewTransfer: (params: TransferQuotaParams) => Promise<QuotaTransferResult>;
    calculateCarryOver: (params: CalculateCarryOverParams) => Promise<QuotaCarryOverCalculationResult>;
    executeCarryOver: (params: CalculateCarryOverParams) => Promise<boolean>;
}

/**
 * Interface pour les informations de quota
 */
export interface QuotaInfo {
    type: LeaveType;
    label: string;
    total: number;
    used: number;
    pending: number;
    remaining: number;
}

/**
 * Hook personnalisé pour la gestion des quotas de congés
 * 
 * Ce hook permet de :
 * - Récupérer les quotas de congés par type
 * - Vérifier si une demande respecte les quotas disponibles
 * - Calculer les jours restants pour chaque type de congé
 * - Visualiser l'état des quotas pour l'utilisateur
 * - Effectuer des transferts de quotas entre différents types
 * - Calculer et exécuter des reports de quotas d'une année sur l'autre
 * 
 * @param options Options de configuration
 * @returns Interface de gestion des quotas
 */
export const useLeaveQuota = ({ userId, year = new Date().getFullYear(), userSchedule }: UseLeaveQuotaOptions): UseLeaveQuotaReturn => {
    const [quotasByType, setQuotasByType] = useState<LeaveTypeQuota[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
    const [totalBalance, setTotalBalance] = useState<{
        total: number;
        used: number;
        pending: number;
        remaining: number;
    }>({ total: 0, used: 0, pending: 0, remaining: 0 });
    const [transferRules, setTransferRules] = useState<QuotaTransferRule[]>([]);

    /**
     * Convertit les informations de solde en quotas par type de congé
     */
    const processBalanceData = useCallback((balance: LeaveBalance): void => {
        // Base par défaut pour les types de congés
        const baseQuotas: { [key in LeaveType]?: number } = {
            [LeaveType.ANNUAL]: balance.initialAllowance,
            [LeaveType.RECOVERY]: 0,
            [LeaveType.TRAINING]: 5, // Exemple : 5 jours de formation par an
            [LeaveType.SICK]: 0, // Illimité, à ajuster selon les règles métier
            [LeaveType.MATERNITY]: 0, // Spécial, à ajuster selon les règles métier
            [LeaveType.SPECIAL]: 0, // Spécial, à ajuster selon les règles métier
            [LeaveType.UNPAID]: 0, // Illimité, à ajuster selon les règles métier
            [LeaveType.OTHER]: 0, // À ajuster selon les règles métier
        };

        // Labels pour les types de congés
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

        // Générer les quotas par type
        const quotas: LeaveTypeQuota[] = Object.values(LeaveType).map(type => {
            const details = balance.detailsByType[type] || { used: 0, pending: 0 };
            const total = baseQuotas[type] || 0;
            const used = details.used || 0;
            const pending = details.pending || 0;
            const remaining = Math.max(0, total - used - pending);

            return {
                type,
                label: typeLabels[type],
                total,
                used,
                pending,
                remaining
            };
        });

        // Mettre à jour l'état
        setQuotasByType(quotas);

        // Calculer le total
        setTotalBalance({
            total: balance.initialAllowance + balance.additionalAllowance,
            used: balance.used,
            pending: balance.pending,
            remaining: balance.remaining
        });
    }, []);

    /**
     * Rafraîchit les données de quotas
     */
    const refreshQuotas = useCallback(async (userId: string): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            const balance = await fetchLeaveBalance(userId);
            setLeaveBalance(balance);
            processBalanceData(balance);

            // Récupérer les règles de transfert actives pour l'utilisateur
            const rules = await fetchActiveTransferRulesForUser(userId);
            setTransferRules(rules);
        } catch (err) {
            setError(err as Error);
            console.error('Erreur lors de la récupération des quotas de congés', err);
        } finally {
            setLoading(false);
        }
    }, [processBalanceData]);

    /**
     * Récupère le quota pour un type spécifique
     */
    const getQuotaForType = useCallback((type: LeaveType): LeaveTypeQuota | null => {
        return quotasByType.find(quota => quota.type === type) || null;
    }, [quotasByType]);

    /**
     * Vérifie si une demande respecte les quotas
     */
    const checkQuota = useCallback(async (params: CheckQuotaParams): Promise<QuotaCalculationResult> => {
        const { startDate, endDate, leaveType, userId } = params;

        if (!startDate || !endDate) {
            return {
                isValid: false,
                message: 'Les dates de début et de fin sont requises.',
                requestedDays: 0,
                availableDays: 0,
                leaveType
            };
        }

        try {
            // Calculer le nombre réel de jours à décompter
            // Utiliser userSchedule si fourni, sinon tenter d'utiliser workSchedule du leaveBalance
            const planningMedical = userSchedule || leaveBalance?.workSchedule;

            if (!planningMedical) {
                return {
                    isValid: false,
                    message: 'Impossible de vérifier les quotas : planning de travail non disponible',
                    requestedDays: 0,
                    availableDays: 0,
                    leaveType
                };
            }

            const calculationDetails = await calculateLeaveCountedDays(startDate, endDate, planningMedical);

            if (!calculationDetails) {
                return {
                    isValid: false,
                    message: 'Erreur lors du calcul des jours de congés',
                    requestedDays: 0,
                    availableDays: 0,
                    leaveType
                };
            }

            // Obtenir le nombre de jours comptés
            const countedDays = calculationDetails.countedDays;

            // Vérifier auprès du service si l'utilisateur a assez de jours disponibles
            const allowanceCheckResult = await checkLeaveAllowance(userId, leaveType, countedDays);

            // Récupérer le quota pour ce type
            const typeQuota = getQuotaForType(leaveType);
            const availableDays = typeQuota?.remaining || 0;

            return {
                isValid: allowanceCheckResult.isAllowed,
                message: allowanceCheckResult.isAllowed
                    ? `Demande valide. ${countedDays} jour(s) seront décomptés.`
                    : `Quota insuffisant. Il vous reste ${availableDays} jour(s) pour ce type de congé.`,
                requestedDays: countedDays,
                availableDays,
                leaveType
            };
        } catch (error) {
            console.error('Erreur lors de la vérification des quotas', error);
            return {
                isValid: false,
                message: 'Une erreur est survenue lors de la vérification des quotas.',
                requestedDays: 0,
                availableDays: 0,
                leaveType
            };
        }
    }, [leaveBalance?.workSchedule, getQuotaForType, userSchedule]);

    /**
     * Effectue un transfert de quotas
     */
    const transferQuotaHandler = useCallback(async (params: TransferQuotaParams): Promise<QuotaTransferResult> => {
        try {
            const request: QuotaTransferRequest = {
                userId: params.userId,
                sourceType: params.sourceType,
                targetType: params.targetType,
                sourceAmount: params.sourceAmount,
                comment: params.comment
            };

            let result: QuotaTransferResult;

            if (leaveBalance?.useSimulation) {
                // Utiliser la simulation pour le développement
                result = await simulateQuotaTransfer(request, transferRules);
            } else {
                // Appeler l'API réelle
                result = await transferQuota(request);
            }

            // Si le transfert est réussi, rafraîchir les quotas
            if (result.success) {
                await refreshQuotas(params.userId);
            }

            return result;
        } catch (err) {
            const error = err as Error;
            console.error('Erreur lors du transfert de quotas :', error);
            throw error;
        }
    }, [transferRules, refreshQuotas, leaveBalance?.useSimulation]);

    /**
     * Simule un transfert de quotas sans l'effectuer
     */
    const previewTransferHandler = useCallback(async (params: TransferQuotaParams): Promise<QuotaTransferResult> => {
        try {
            const request: QuotaTransferRequest = {
                userId: params.userId,
                sourceType: params.sourceType,
                targetType: params.targetType,
                sourceAmount: params.sourceAmount,
                comment: params.comment
            };

            if (leaveBalance?.useSimulation) {
                // Utiliser la simulation pour le développement
                return await simulateQuotaTransfer(request, transferRules);
            } else {
                // Appeler l'API réelle
                return await previewQuotaTransfer(request);
            }
        } catch (err) {
            const error = err as Error;
            console.error('Erreur lors de la simulation du transfert :', error);
            throw error;
        }
    }, [transferRules, leaveBalance?.useSimulation]);

    /**
     * Calcule le report de quotas
     */
    const calculateCarryOverHandler = useCallback(async (params: CalculateCarryOverParams): Promise<QuotaCarryOverCalculationResult> => {
        try {
            const request: QuotaCarryOverCalculationRequest = {
                userId: params.userId,
                leaveType: params.leaveType,
                fromYear: params.fromYear,
                toYear: params.toYear
            };

            if (leaveBalance?.useSimulation) {
                // Utiliser la simulation pour le développement
                return await simulateCarryOverCalculation(request);
            } else {
                // Appeler l'API réelle
                return await calculateCarryOver(request);
            }
        } catch (err) {
            const error = err as Error;
            console.error('Erreur lors du calcul du report :', error);
            throw error;
        }
    }, [leaveBalance?.useSimulation]);

    /**
     * Exécute le report de quotas
     */
    const executeCarryOverHandler = useCallback(async (params: CalculateCarryOverParams): Promise<boolean> => {
        try {
            const request: QuotaCarryOverCalculationRequest = {
                userId: params.userId,
                leaveType: params.leaveType,
                fromYear: params.fromYear,
                toYear: params.toYear
            };

            if (leaveBalance?.useSimulation) {
                // En mode simulation, on calcule simplement sans exécuter
                await simulateCarryOverCalculation(request);
                return true;
            } else {
                // Appeler l'API réelle
                const result = await executeCarryOver(request);

                // Rafraîchir les quotas après l'exécution
                await refreshQuotas(params.userId);

                return !!result.id;
            }
        } catch (err) {
            const error = err as Error;
            console.error('Erreur lors de l\'exécution du report :', error);
            throw error;
        }
    }, [refreshQuotas, leaveBalance?.useSimulation]);

    // Retourner l'interface du hook
    return {
        loading,
        error,
        quotasByType,
        totalBalance,
        checkQuota,
        refreshQuotas,
        getQuotaForType,

        // Nouvelles fonctionnalités
        transferRules,
        transferQuota: transferQuotaHandler,
        previewTransfer: previewTransferHandler,
        calculateCarryOver: calculateCarryOverHandler,
        executeCarryOver: executeCarryOverHandler
    };
} 