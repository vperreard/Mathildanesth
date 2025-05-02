import { LeaveType } from '../types/leave';
import {
    QuotaTransferRule,
    QuotaCarryOverRule,
    QuotaTransferRequest,
    QuotaCarryOverRequest,
    QuotaTransaction,
    UserQuotaBalance,
    QuotaTransactionStatus,
    QuotaTransactionType,
    QuotaPeriod,
    QuotaCalculationResult,
    UserQuotaSummary
} from '../types/quota';
import { EventBusService } from '@/services/eventBusService';

/**
 * Événements émis par le service de gestion des quotas
 */
export enum QuotaManagementEvents {
    TRANSFER_REQUESTED = 'quota:transfer:requested',
    TRANSFER_PROCESSED = 'quota:transfer:processed',
    CARRY_OVER_REQUESTED = 'quota:carryover:requested',
    CARRY_OVER_PROCESSED = 'quota:carryover:processed',
    QUOTA_UPDATED = 'quota:updated',
    BALANCE_CHANGED = 'quota:balance:changed',
    TRANSACTION_CREATED = 'quota:transaction:created',
    ERROR_OCCURRED = 'quota:error'
}

/**
 * Service de gestion des quotas de congés
 * - Transferts entre types de congés
 * - Reports d'une période à l'autre
 * - Calcul des soldes
 * - Gestion des transactions
 */
export class QuotaManagementService {
    private static instance: QuotaManagementService;
    private eventBus: EventBusService;

    private constructor() {
        this.eventBus = EventBusService.getInstance();
    }

    /**
     * Obtenir l'instance unique du service (Singleton)
     */
    public static getInstance(): QuotaManagementService {
        if (!QuotaManagementService.instance) {
            QuotaManagementService.instance = new QuotaManagementService();
        }
        return QuotaManagementService.instance;
    }

    /**
     * Récupérer les règles de transfert pour un type de congé source
     * @param sourceType Type de congé source
     */
    public async getTransferRules(sourceType: LeaveType): Promise<QuotaTransferRule[]> {
        try {
            const response = await fetch(`/api/leaves/quota-transfers/rules/${sourceType}`);

            if (!response.ok) {
                throw new Error(`Erreur lors de la récupération des règles de transfert: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Échec de récupération des règles de transfert:', error);
            this.eventBus.publish(QuotaManagementEvents.ERROR_OCCURRED, {
                message: "Impossible de récupérer les règles de transfert",
                error
            });
            return [];
        }
    }

    /**
     * Récupérer les règles de report pour un type de congé
     * @param leaveType Type de congé
     */
    public async getCarryOverRules(leaveType: LeaveType): Promise<QuotaCarryOverRule[]> {
        try {
            const response = await fetch(`/api/leaves/quota-carryovers/rules/${leaveType}`);

            if (!response.ok) {
                throw new Error(`Erreur lors de la récupération des règles de report: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Échec de récupération des règles de report:', error);
            this.eventBus.publish(QuotaManagementEvents.ERROR_OCCURRED, {
                message: "Impossible de récupérer les règles de report",
                error
            });
            return [];
        }
    }

    /**
     * Récupérer les périodes de quota actives
     */
    public async getActivePeriods(): Promise<QuotaPeriod[]> {
        try {
            const response = await fetch('/api/leaves/quota-periods?active=true');

            if (!response.ok) {
                throw new Error(`Erreur lors de la récupération des périodes: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Échec de récupération des périodes actives:', error);
            this.eventBus.publish(QuotaManagementEvents.ERROR_OCCURRED, {
                message: "Impossible de récupérer les périodes actives",
                error
            });
            return [];
        }
    }

    /**
     * Récupérer le bilan des quotas d'un utilisateur
     * @param userId ID de l'utilisateur
     * @param periodId ID de la période (optionnel, utilise la période active par défaut)
     */
    public async getUserQuotaSummary(userId: string, periodId?: string): Promise<UserQuotaSummary | null> {
        try {
            const periodParam = periodId ? `&periodId=${periodId}` : '';
            const response = await fetch(`/api/leaves/quotas/summary?userId=${userId}${periodParam}`);

            if (!response.ok) {
                throw new Error(`Erreur lors de la récupération du bilan des quotas: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Échec de récupération du bilan des quotas:', error);
            this.eventBus.publish(QuotaManagementEvents.ERROR_OCCURRED, {
                message: "Impossible de récupérer le bilan des quotas",
                error
            });
            return null;
        }
    }

    /**
     * Récupérer l'historique des transactions d'un utilisateur
     * @param userId ID de l'utilisateur
     * @param periodId ID de la période (optionnel)
     */
    public async getUserTransactionHistory(
        userId: string,
        periodId?: string,
        transactionType?: QuotaTransactionType
    ): Promise<QuotaTransaction[]> {
        try {
            let url = `/api/leaves/quotas/transactions?userId=${userId}`;

            if (periodId) url += `&periodId=${periodId}`;
            if (transactionType) url += `&type=${transactionType}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Erreur lors de la récupération de l'historique: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Échec de récupération de l\'historique des transactions:', error);
            this.eventBus.publish(QuotaManagementEvents.ERROR_OCCURRED, {
                message: "Impossible de récupérer l'historique des transactions",
                error
            });
            return [];
        }
    }

    /**
     * Simuler un transfert de quota
     * @param userId ID de l'utilisateur
     * @param fromType Type de congé source
     * @param toType Type de congé destination
     * @param days Nombre de jours à transférer
     */
    public async simulateTransfer(
        userId: string,
        periodId: string,
        fromType: LeaveType,
        toType: LeaveType,
        days: number
    ): Promise<{
        isValid: boolean;
        sourceRemaining: number;
        resultingDays: number;
        conversionRate: number;
        message?: string;
        requiresApproval?: boolean;
    }> {
        try {
            const response = await fetch('/api/leaves/quota-transfers/simulate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    periodId,
                    fromType,
                    toType,
                    days
                }),
            });

            if (!response.ok) {
                throw new Error(`Erreur lors de la simulation du transfert: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Échec de la simulation du transfert:', error);
            this.eventBus.publish(QuotaManagementEvents.ERROR_OCCURRED, {
                message: "Impossible de simuler le transfert",
                error
            });
            return {
                isValid: false,
                sourceRemaining: 0,
                resultingDays: 0,
                conversionRate: 1,
                message: "Une erreur est survenue lors de la simulation"
            };
        }
    }

    /**
     * Demander un transfert de quota
     * @param userId ID de l'utilisateur
     * @param fromType Type de congé source
     * @param toType Type de congé destination
     * @param days Nombre de jours à transférer
     * @param comment Commentaire optionnel
     */
    public async requestTransfer(
        userId: string,
        periodId: string,
        fromType: LeaveType,
        toType: LeaveType,
        days: number,
        comment?: string
    ): Promise<QuotaTransferRequest | null> {
        try {
            const response = await fetch('/api/leaves/quota-transfers/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    periodId,
                    fromType,
                    toType,
                    requestedDays: days,
                    comment
                }),
            });

            if (!response.ok) {
                throw new Error(`Erreur lors de la demande de transfert: ${response.status}`);
            }

            const result = await response.json();

            this.eventBus.publish(QuotaManagementEvents.TRANSFER_REQUESTED, result);

            return result;
        } catch (error) {
            console.error('Échec de la demande de transfert:', error);
            this.eventBus.publish(QuotaManagementEvents.ERROR_OCCURRED, {
                message: "Impossible de créer la demande de transfert",
                error
            });
            return null;
        }
    }

    /**
     * Traiter une demande de transfert
     * @param transferRequestId ID de la demande de transfert
     * @param approve Approuver ou rejeter
     * @param approverUserId ID de l'utilisateur qui approuve/rejette
     * @param comment Commentaire optionnel
     */
    public async processTransferRequest(
        transferRequestId: string,
        approve: boolean,
        approverUserId: string,
        comment?: string
    ): Promise<boolean> {
        try {
            const response = await fetch(`/api/leaves/quota-transfers/${transferRequestId}/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    approve,
                    approverUserId,
                    comment
                }),
            });

            if (!response.ok) {
                throw new Error(`Erreur lors du traitement de la demande: ${response.status}`);
            }

            const result = await response.json();

            this.eventBus.publish(QuotaManagementEvents.TRANSFER_PROCESSED, result);

            return true;
        } catch (error) {
            console.error('Échec du traitement de la demande de transfert:', error);
            this.eventBus.publish(QuotaManagementEvents.ERROR_OCCURRED, {
                message: "Impossible de traiter la demande de transfert",
                error
            });
            return false;
        }
    }

    /**
     * Simuler un report de quota
     * @param userId ID de l'utilisateur
     * @param fromPeriodId ID de la période source
     * @param toPeriodId ID de la période destination
     * @param leaveType Type de congé
     * @param days Nombre de jours à reporter
     */
    public async simulateCarryOver(
        userId: string,
        fromPeriodId: string,
        toPeriodId: string,
        leaveType: LeaveType,
        days: number
    ): Promise<{
        isValid: boolean;
        eligibleDays: number;
        expirationDate?: string;
        message?: string;
        requiresApproval?: boolean;
    }> {
        try {
            const response = await fetch('/api/leaves/quota-carryovers/simulate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    fromPeriodId,
                    toPeriodId,
                    leaveType,
                    days
                }),
            });

            if (!response.ok) {
                throw new Error(`Erreur lors de la simulation du report: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Échec de la simulation du report:', error);
            this.eventBus.publish(QuotaManagementEvents.ERROR_OCCURRED, {
                message: "Impossible de simuler le report",
                error
            });
            return {
                isValid: false,
                eligibleDays: 0,
                message: "Une erreur est survenue lors de la simulation"
            };
        }
    }

    /**
     * Demander un report de quota
     * @param userId ID de l'utilisateur
     * @param fromPeriodId ID de la période source
     * @param toPeriodId ID de la période destination
     * @param leaveType Type de congé
     * @param days Nombre de jours à reporter
     * @param comment Commentaire optionnel
     */
    public async requestCarryOver(
        userId: string,
        fromPeriodId: string,
        toPeriodId: string,
        leaveType: LeaveType,
        days: number,
        comment?: string
    ): Promise<QuotaCarryOverRequest | null> {
        try {
            const response = await fetch('/api/leaves/quota-carryovers/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    fromPeriodId,
                    toPeriodId,
                    leaveType,
                    requestedDays: days,
                    comment
                }),
            });

            if (!response.ok) {
                throw new Error(`Erreur lors de la demande de report: ${response.status}`);
            }

            const result = await response.json();

            this.eventBus.publish(QuotaManagementEvents.CARRY_OVER_REQUESTED, result);

            return result;
        } catch (error) {
            console.error('Échec de la demande de report:', error);
            this.eventBus.publish(QuotaManagementEvents.ERROR_OCCURRED, {
                message: "Impossible de créer la demande de report",
                error
            });
            return null;
        }
    }

    /**
     * Traiter une demande de report
     * @param carryOverRequestId ID de la demande de report
     * @param approve Approuver ou rejeter
     * @param approverUserId ID de l'utilisateur qui approuve/rejette
     * @param comment Commentaire optionnel
     */
    public async processCarryOverRequest(
        carryOverRequestId: string,
        approve: boolean,
        approverUserId: string,
        comment?: string
    ): Promise<boolean> {
        try {
            const response = await fetch(`/api/leaves/quota-carryovers/${carryOverRequestId}/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    approve,
                    approverUserId,
                    comment
                }),
            });

            if (!response.ok) {
                throw new Error(`Erreur lors du traitement de la demande: ${response.status}`);
            }

            const result = await response.json();

            this.eventBus.publish(QuotaManagementEvents.CARRY_OVER_PROCESSED, result);

            return true;
        } catch (error) {
            console.error('Échec du traitement de la demande de report:', error);
            this.eventBus.publish(QuotaManagementEvents.ERROR_OCCURRED, {
                message: "Impossible de traiter la demande de report",
                error
            });
            return false;
        }
    }

    /**
     * Calculer la disponibilité d'un quota pour une demande de congé
     * @param userId ID de l'utilisateur
     * @param leaveType Type de congé
     * @param periodId ID de la période
     * @param requestedDays Jours demandés
     */
    public async calculateQuotaAvailability(
        userId: string,
        leaveType: LeaveType,
        periodId: string,
        requestedDays: number
    ): Promise<QuotaCalculationResult> {
        try {
            const response = await fetch('/api/leaves/quotas/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    leaveType,
                    periodId,
                    requestedDays
                }),
            });

            if (!response.ok) {
                throw new Error(`Erreur lors du calcul de disponibilité: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Échec du calcul de disponibilité:', error);
            this.eventBus.publish(QuotaManagementEvents.ERROR_OCCURRED, {
                message: "Impossible de calculer la disponibilité du quota",
                error
            });
            return {
                eligible: false,
                availableDays: 0,
                requestedDays,
                remaining: 0,
                requiresApproval: true,
                warningLevel: 'HIGH',
                message: "Une erreur est survenue lors du calcul"
            };
        }
    }

    /**
     * Notifier les utilisateurs des changements de quotas importants
     * (expirations à venir, reports disponibles, etc.)
     */
    public async notifyQuotaAlerts(userId: string, periodId?: string): Promise<void> {
        try {
            const summary = await this.getUserQuotaSummary(userId, periodId);

            if (!summary) return;

            // Alerter pour les quotas qui vont expirer bientôt
            for (const [leaveType, expiringItems] of Object.entries(summary.expiringDays)) {
                for (const item of expiringItems) {
                    // Si expiration dans moins de 30 jours
                    const expirationDate = new Date(item.expirationDate);
                    const daysUntilExpiry = Math.ceil((expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                    if (daysUntilExpiry <= 30) {
                        this.eventBus.publish('notification:create', {
                            userId,
                            type: 'quota:expiring',
                            title: `Expiration de quota à venir`,
                            message: `${item.days} jours de ${leaveType} vont expirer le ${new Date(item.expirationDate).toLocaleDateString()}`,
                            data: {
                                leaveType,
                                days: item.days,
                                expirationDate: item.expirationDate
                            },
                            priority: daysUntilExpiry <= 7 ? 'high' : 'medium'
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Erreur lors de la notification des alertes de quota:', error);
        }
    }

    /**
     * Mettre à jour manuellement un quota (ajustement administratif)
     * @param userId ID de l'utilisateur
     * @param leaveType Type de congé
     * @param periodId ID de la période
     * @param adjustmentDays Nombre de jours à ajouter (positif) ou retirer (négatif)
     * @param reason Raison de l'ajustement
     * @param adminId ID de l'administrateur effectuant l'ajustement
     */
    public async adjustQuotaBalance(
        userId: string,
        leaveType: LeaveType,
        periodId: string,
        adjustmentDays: number,
        reason: string,
        adminId: string
    ): Promise<boolean> {
        try {
            const response = await fetch('/api/leaves/quotas/adjust', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    leaveType,
                    periodId,
                    adjustmentDays,
                    reason,
                    adminId
                }),
            });

            if (!response.ok) {
                throw new Error(`Erreur lors de l'ajustement du quota: ${response.status}`);
            }

            const result = await response.json();

            this.eventBus.publish(QuotaManagementEvents.QUOTA_UPDATED, result);

            return true;
        } catch (error) {
            console.error('Échec de l\'ajustement du quota:', error);
            this.eventBus.publish(QuotaManagementEvents.ERROR_OCCURRED, {
                message: "Impossible d'ajuster le quota",
                error
            });
            return false;
        }
    }

    /**
     * S'abonner aux événements de quota
     * @param event Type d'événement
     * @param callback Fonction à appeler
     */
    public subscribe(event: QuotaManagementEvents, callback: (data: any) => void): () => void {
        this.eventBus.subscribe(event, callback);
        // Retourner une fonction pour se désabonner
        return () => {
            // Corriger le bug en utilisant le eventBus.unsubscribe correctement
            this.eventBus.unsubscribe(event, callback);
        };
    }
} 