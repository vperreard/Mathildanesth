import { LeaveType } from '../types/leave';
import eventService from '@/core/events/EventService';
import { EventType, QuotaEvent } from '@/core/events/EventTypes';
import { AuditService, AuditAction } from '@/services/AuditService';
import { CONFIG } from '@/config';
import apiClient from '../../../utils/apiClient';
import { LeaveBalance } from '../types/leave';

/**
 * Interface représentant un transfert de quota entre types de congés
 */
export interface QuotaTransfer {
    id?: string;
    userId: string;
    fromType: LeaveType;
    toType: LeaveType;
    amount: number;
    reason?: string;
    authorizedBy?: string;
    transferDate: Date;
}

/**
 * Interface représentant un report de quota d'une année à l'autre
 */
export interface QuotaCarryOver {
    id?: string;
    userId: string;
    leaveType: LeaveType;
    amount: number;
    fromYear: number;
    toYear: number;
    expiryDate?: Date;
    reason?: string;
    authorizedBy?: string;
    createdAt: Date;
}

/**
 * Interface pour les règles de transfert/report entre types de congés
 */
export interface QuotaTransferRule {
    fromType: LeaveType;
    toType: LeaveType;
    conversionRate: number; // 1 jour du type source = conversionRate jours du type destination
    maxTransferPercentage?: number; // Pourcentage maximum du quota source qui peut être transféré
    maxTransferDays?: number; // Nombre maximum de jours qui peuvent être transférés
    requiresApproval: boolean; // Indique si le transfert nécessite une approbation
    authorizedRoles?: string[]; // Rôles autorisés à approuver
    isEnabled?: boolean; // Si la règle est active
}

/**
 * Interface pour les règles de report annuel par type de congé
 */
export interface QuotaCarryOverRule {
    leaveType: LeaveType;
    maxCarryOverPercentage: number; // Pourcentage maximum du quota qui peut être reporté
    maxCarryOverDays?: number; // Nombre maximum de jours qui peuvent être reportés
    expiryInMonths?: number; // Durée de validité en mois, si non défini = pas d'expiration
    requiresApproval: boolean; // Indique si le report nécessite une approbation
    authorizedRoles?: string[]; // Rôles autorisés à approuver
}

/**
 * Interface pour les quotas de congés d'un utilisateur
 */
export interface UserQuota {
    userId: string;
    year: number;
    quotas: {
        [key in LeaveType]?: {
            total: number;
            used: number;
            pending: number;
            remaining: number;
            carryOver?: number;
            carryOverExpiry?: Date;
        };
    };
}

/**
 * Types d'erreurs de validation possibles pour les transferts et reports de quotas
 */
export enum QuotaValidationCode {
    SUCCESS = 'SUCCESS',
    INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
    EXCEEDED_LIMIT = 'EXCEEDED_LIMIT',
    INVALID_TRANSFER = 'INVALID_TRANSFER',
    INVALID_CARRY_OVER = 'INVALID_CARRY_OVER',
    INVALID_AMOUNT = 'INVALID_AMOUNT',
    INVALID_YEAR_RANGE = 'INVALID_YEAR_RANGE',
    CARRY_OVER_WINDOW_CLOSED = 'CARRY_OVER_WINDOW_CLOSED',
    ERROR = 'ERROR'
}

/**
 * Résultat de validation d'un transfert ou d'un report de quotas
 */
export interface QuotaValidationResult {
    valid: boolean;
    message: string;
    validationCode: QuotaValidationCode;
    details?: Record<string, unknown>;
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

export interface TransferRule {
    fromType: LeaveType;
    toType: LeaveType;
    conversionRate: number;
    maxTransferDays?: number;
    maxTransferPercentage?: number;
    requiresApproval: boolean;
    isEnabled?: boolean;
    sourceType?: LeaveType; // Ajout pour compatibilité
    destinationType?: LeaveType; // Ajout pour compatibilité
}

export interface TransferRequest {
    userId: string;
    sourceType: LeaveType;
    destinationType: LeaveType;
    days: number;
    reason: string;
    year: number;
}

export interface TransferResult {
    success: boolean;
    sourceBalance?: LeaveBalance;
    destinationBalance?: LeaveBalance;
    message?: string;
    error?: string;
}

export interface TransferHistory {
    id: string;
    userId: string;
    sourceType: LeaveType;
    destinationType: LeaveType;
    sourceDays: number;
    destinationDays: number;
    reason: string;
    date: string;
    year: number;
}

/**
 * Service de gestion des transferts de quotas de congés
 */
const QuotaTransferService = {
    /**
     * Récupère toutes les règles de transfert configurées
     * @returns Liste des règles de transfert
     */
    getTransferRules: async (): Promise<TransferRule[]> => {
        const response = await apiClient.get('/api/conges/quota-transfers/rules');
        return response.data;
    },

    /**
     * Récupère les règles de transfert spécifiques pour un type de congé source
     * @param sourceType Type de congé source
     * @returns Liste des règles de transfert disponibles
     */
    getTransferRulesForSourceType: async (sourceType: LeaveType): Promise<TransferRule[]> => {
        const response = await apiClient.get(`/api/conges/quota-transfers/rules/${sourceType}`);
        return response.data;
    },

    /**
     * Effectue un transfert de jours entre deux types de congés
     * @param transferRequest Détails du transfert à effectuer
     * @returns Résultat du transfert avec les soldes mis à jour
     */
    executeTransfer: async (transferRequest: TransferRequest): Promise<TransferResult> => {
        try {
            const response = await apiClient.post('/api/conges/quota-transfers/execute', transferRequest);
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                error: error.response?.data?.message || 'Erreur lors du transfert de jours'
            };
        }
    },

    /**
     * Simule un transfert sans l'exécuter réellement
     * @param transferRequest Détails du transfert à simuler
     * @returns Résultat de la simulation
     */
    simulateTransfer: async (transferRequest: TransferRequest): Promise<TransferResult> => {
        try {
            const response = await apiClient.post('/api/conges/quota-transfers/simulate', transferRequest);
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                error: error.response?.data?.message || 'Erreur lors de la simulation du transfert'
            };
        }
    },

    /**
     * Récupère l'historique des transferts pour un utilisateur
     * @param userId ID de l'utilisateur
     * @param year Année optionnelle pour filtrer les résultats
     * @returns Historique des transferts
     */
    getTransferHistory: async (userId: string, year?: number): Promise<TransferHistory[]> => {
        const params = year ? { year } : {};
        const response = await apiClient.get(`/api/conges/quota-transfers/history/${userId}`, { params });
        return response.data;
    },

    /**
     * Calcule le nombre de jours équivalents après application du taux de conversion
     * @param days Nombre de jours source
     * @param conversionRate Taux de conversion
     * @returns Nombre de jours après conversion
     */
    calculateConvertedDays: (days: number, conversionRate: number): number => {
        return parseFloat((days * conversionRate).toFixed(1));
    },

    /**
     * Vérifie si un transfert est possible selon les règles définies
     * @param sourceType Type de congé source
     * @param destinationType Type de congé destination
     * @param days Nombre de jours à transférer
     * @param availableDays Nombre de jours disponibles
     * @returns Validation et message d'erreur éventuel
     */
    validateTransfer: async (
        sourceType: LeaveType,
        destinationType: LeaveType,
        days: number,
        availableDays: number
    ): Promise<{ isValid: boolean; message?: string }> => {
        // Vérification basique si assez de jours disponibles
        if (days > availableDays) {
            return {
                isValid: false,
                message: `Solde insuffisant. Vous disposez de ${availableDays} jours.`
            };
        }

        try {
            // Récupérer les règles pour vérifier si le transfert est autorisé
            const rules = await QuotaTransferService.getTransferRules();
            const matchingRule = rules.find(
                rule => (rule.fromType === sourceType || rule.sourceType === sourceType) &&
                    (rule.toType === destinationType || rule.destinationType === destinationType) &&
                    rule.isEnabled
            );

            if (!matchingRule) {
                return {
                    isValid: false,
                    message: "Ce type de transfert n'est pas autorisé."
                };
            }

            if (matchingRule.maxTransferDays && days > matchingRule.maxTransferDays) {
                return {
                    isValid: false,
                    message: `Vous ne pouvez pas transférer plus de ${matchingRule.maxTransferDays} jours.`
                };
            }

            return { isValid: true };
        } catch (error: unknown) {
            return {
                isValid: false,
                message: "Impossible de valider le transfert. Veuillez réessayer."
            };
        }
    }
};

export default QuotaTransferService; 