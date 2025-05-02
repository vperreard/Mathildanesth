/**
 * Hook pour la gestion des transferts de quotas de congés
 */
import { useState, useCallback, useEffect } from 'react';
import { LeaveBalance, LeaveType } from '../types/leave';
import QuotaTransferService, {
    TransferRule,
    TransferRequest,
    TransferResult,
    TransferHistory
} from '../services/QuotaTransferService';
import { useAuth } from '../../auth/hooks/useAuth';
import { useToast } from '../../../components/ui/toast/useToast';
import { useLeaveBalance } from './useLeaveBalance';

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
 * Interface pour un transfert de quota
 */
export interface QuotaTransfer {
    userId: string;
    fromType?: LeaveType;
    toType?: LeaveType;
    sourceType?: LeaveType; // Pour compatibilité avec l'API quotaService
    targetType?: LeaveType; // Pour compatibilité avec l'API quotaService
    amount: number;
    sourceAmount?: number; // Pour compatibilité avec l'API quotaService
    reason?: string;
    comment?: string; // Pour compatibilité avec l'API quotaService
    transferDate?: Date;
    authorizedBy?: string;
}

/**
 * Interface pour un report de quota
 */
export interface QuotaCarryOver {
    userId: string;
    leaveType: LeaveType;
    fromYear: number;
    toYear: number;
    amount: number;
    reason?: string;
    expiryDate?: Date;
    authorizedBy?: string;
    createdAt?: Date;
}

/**
 * Résultat d'une opération de validation de quota
 */
export interface QuotaValidationResult {
    valid: boolean;
    success?: boolean; // Pour compatibilité avec l'API quotaService
    message: string;
    validationCode?: string;
    details?: Record<string, any>;
    sourceAmount?: number;
    targetAmount?: number;
    sourceRemaining?: number;
    targetTotal?: number;
}

/**
 * Résultat de la simulation d'un transfert
 */
export interface TransferPreviewResult extends QuotaValidationResult {
    applicableRules?: any[];
    transferRatio?: number;
    sourceLabel?: string;
    targetLabel?: string;
    isAllowed?: boolean;
    reasonNotAllowed?: string;
}

interface SimulationResult {
    sourceType: LeaveType;
    targetType: LeaveType;
    days: number;
    sourceDeducted: number;
    sourceAfter: number;
    targetBefore: number;
    targetAdded: number;
    targetAfter: number;
}

interface UseQuotaTransferProps {
    userId: string;
}

export interface UseQuotaTransferReturn {
    loading: boolean;
    error: Error | null;
    simulationResult: SimulationResult | null;
    transferHistory: any[];
    simulateTransfer: (fromType: LeaveType, toType: LeaveType, days: number) => Promise<void>;
    transferQuota: (fromType: LeaveType, toType: LeaveType, days: number, reason: string) => Promise<boolean>;
    fetchTransferHistory: () => Promise<void>;
    getTransferRules: () => TransferRule[];
}

export const useQuotaTransfer = (options?: UseQuotaTransferProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const { getUserBalances, refreshUserBalances } = useLeaveBalance();

    const userId = options?.userId || user?.id || '';

    const [isLoading, setIsLoading] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transferRules, setTransferRules] = useState<TransferRule[]>([]);
    const [availableSourceTypes, setAvailableSourceTypes] = useState<LeaveType[]>([]);
    const [availableDestinationTypes, setAvailableDestinationTypes] = useState<LeaveType[]>([]);
    const [simulationResult, setSimulationResult] = useState<TransferResult | null>(null);
    const [transferHistory, setTransferHistory] = useState<TransferHistory[]>([]);
    const [userBalances, setUserBalances] = useState<LeaveBalance[]>([]);

    // Chargement des règles de transfert et des soldes
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setIsLoading(true);
                const [rules, balances] = await Promise.all([
                    QuotaTransferService.getTransferRules(),
                    getUserBalances(userId)
                ]);

                setTransferRules(rules);
                setUserBalances(balances);

                // Déterminer les types de congés qui peuvent être utilisés comme source
                const sourcesTypes = rules
                    .filter(rule => rule.isEnabled)
                    .map(rule => rule.fromType || rule.sourceType)
                    .filter(Boolean)
                    .filter((type, index, self) => type && self.indexOf(type) === index) as LeaveType[];

                setAvailableSourceTypes(sourcesTypes);
                setError(null);
            } catch (err) {
                setError("Erreur lors du chargement des données de transfert");
                toast({
                    title: "Erreur",
                    description: "Impossible de charger les règles de transfert",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        };

        if (userId) {
            loadInitialData();
        }
    }, [userId, getUserBalances, toast]);

    // Mise à jour des types de destination disponibles en fonction du type source sélectionné
    const updateAvailableDestinationTypes = useCallback((sourceType: LeaveType) => {
        const destinationTypes = transferRules
            .filter(rule => (rule.fromType === sourceType || rule.sourceType === sourceType) && rule.isEnabled)
            .map(rule => rule.toType || rule.destinationType)
            .filter(Boolean) as LeaveType[];

        setAvailableDestinationTypes(destinationTypes);
    }, [transferRules]);

    // Obtention de la règle de transfert spécifique
    const getTransferRule = useCallback((sourceType: LeaveType, destinationType: LeaveType): TransferRule | undefined => {
        return transferRules.find(
            rule => (rule.fromType === sourceType || rule.sourceType === sourceType) &&
                (rule.toType === destinationType || rule.destinationType === destinationType) &&
                rule.isEnabled
        );
    }, [transferRules]);

    // Obtention du solde pour un type de congé
    const getBalanceForType = useCallback((type: LeaveType): LeaveBalance | undefined => {
        return userBalances.find(balance => balance.leaveType === type);
    }, [userBalances]);

    // Simulation d'un transfert
    const simulateTransfer = useCallback(async (
        fromType: LeaveType,
        toType: LeaveType,
        days: number
    ): Promise<void> => {
        if (!userId) {
            setError("Utilisateur non authentifié");
            return;
        }

        try {
            setIsSimulating(true);
            setError(null);

            const transferRequest: TransferRequest = {
                userId,
                sourceType: fromType,
                destinationType: toType,
                days,
                reason: "Simulation",
                year: new Date().getFullYear()
            };

            const result = await QuotaTransferService.simulateTransfer(transferRequest);
            setSimulationResult(result);
        } catch (error) {
            setError("Erreur lors de la simulation du transfert");
            console.error('Erreur de simulation:', error);
        } finally {
            setIsSimulating(false);
        }
    }, [userId]);

    // Exécution d'un transfert
    const transferQuota = useCallback(async (
        fromType: LeaveType,
        toType: LeaveType,
        days: number,
        reason: string
    ): Promise<boolean> => {
        if (!userId) {
            setError("Utilisateur non authentifié");
            return false;
        }

        try {
            setIsLoading(true);
            setError(null);

            const transferRequest: TransferRequest = {
                userId,
                sourceType: fromType,
                destinationType: toType,
                days,
                reason,
                year: new Date().getFullYear()
            };

            const result = await QuotaTransferService.executeTransfer(transferRequest);

            if (result.success) {
                // Rafraîchir les soldes après un transfert réussi
                await refreshUserBalances(userId);

                // Rafraîchir l'historique
                await loadTransferHistory();

                toast({
                    title: "Transfert réussi",
                    description: "Vos jours ont été transférés avec succès",
                    variant: "default"
                });

                return true;
            } else {
                setError(result.error || "Erreur lors du transfert");
                toast({
                    title: "Erreur",
                    description: result.error || "Erreur lors du transfert",
                    variant: "destructive"
                });
                return false;
            }
        } catch (error) {
            const errorMessage = "Erreur lors de l'exécution du transfert";
            setError(errorMessage);
            toast({
                title: "Erreur",
                description: errorMessage,
                variant: "destructive"
            });
            return false;
        } finally {
            setIsLoading(false);
            setSimulationResult(null);
        }
    }, [userId, refreshUserBalances, toast]);

    // Chargement de l'historique des transferts
    const loadTransferHistory = useCallback(async () => {
        if (!userId) return;

        try {
            setIsLoading(true);
            const history = await QuotaTransferService.getTransferHistory(userId);
            setTransferHistory(history);
        } catch (error) {
            setError("Erreur lors du chargement de l'historique des transferts");
            toast({
                title: "Erreur",
                description: "Impossible de charger l'historique des transferts",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }, [userId, toast]);

    // Calcul des jours équivalents après application du taux de conversion
    const calculateConvertedDays = useCallback((days: number, sourceType: LeaveType, destinationType: LeaveType): number => {
        const rule = getTransferRule(sourceType, destinationType);
        if (!rule) return 0;

        return QuotaTransferService.calculateConvertedDays(days, rule.conversionRate);
    }, [getTransferRule]);

    // Méthodes pour compatibilité avec QuotaTransferForm
    const getTransferRules = useCallback(() => {
        return transferRules;
    }, [transferRules]);

    return {
        // État
        loading: isLoading,
        error: error ? new Error(error) : null,
        transferRules,
        availableSourceTypes,
        availableDestinationTypes,
        simulationResult,
        transferHistory,
        isLoading,
        isSimulating,

        // Méthodes
        updateAvailableDestinationTypes,
        getTransferRule,
        getBalanceForType,
        simulateTransfer,
        transferQuota,
        fetchTransferHistory: loadTransferHistory,
        calculateConvertedDays,
        getTransferRules
    };
}; 