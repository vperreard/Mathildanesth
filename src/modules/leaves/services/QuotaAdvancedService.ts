import {
    QuotaTransferRule,
    QuotaTransferRuleType,
    QuotaTransferRequest,
    QuotaTransferResult,
    QuotaCarryOverRule,
    QuotaCarryOverRuleType,
    QuotaCarryOverCalculationRequest,
    QuotaCarryOverCalculationResult,
    CarryOverExpiryType,
    CarryOverExpiryConfig,
    SeasonalTransferRule,
    QuotaTransferSimulationRequest,
    QuotaTransferSimulationResult,
    EnhancedQuotaState,
    TransferHistoryItem,
    CarryOverHistoryItem,
    QuotaTransferReportOptions,
    QuotaTransferReportResult,
    QuotaTransferReportData,
    QuotaStatistics,
    QuotaAnnualCarryOverConfig
} from '../types/quota';
import { LeaveType, LeaveBalance } from '../types/leave';
import { fetchLeaveBalance } from './leaveService';
import {
    fetchActiveTransferRulesForUser,
    fetchActiveCarryOverRulesForUser,
    fetchTransferHistory,
    fetchCarryOverHistory
} from './quotaService';
import { AuditService, AuditActionType, AuditSeverity } from './AuditService';
import { eventBus, IntegrationEventType } from '../../integration/services/EventBusService';
import { formatDate, addMonths, getDaysUntil, isDateInFuture } from '../../../utils/dateUtils';
import { format, parse, parseISO } from 'date-fns';
import apiClient from '../../../utils/apiClient';
import { EventBusService } from '@/services/eventBusService';
import { AuditAction } from '@/services/AuditService';

/**
 * Service pour la gestion avancée des transferts et reports de quotas
 */
export class QuotaAdvancedService {
    private static instance: QuotaAdvancedService;
    private readonly apiBaseUrl: string = '/api/leaves/quotas';
    private readonly auditService: AuditService;

    /**
     * Obtenir l'instance du service (Singleton)
     */
    public static getInstance(): QuotaAdvancedService {
        if (!QuotaAdvancedService.instance) {
            QuotaAdvancedService.instance = new QuotaAdvancedService();
        }
        return QuotaAdvancedService.instance;
    }

    /**
     * Constructeur privé
     */
    private constructor() {
        this.auditService = AuditService.getInstance();
    }

    /**
     * Récupère toutes les règles de transfert de quotas applicables
     * @param userId ID de l'utilisateur
     * @returns Liste des règles de transfert actives
     */
    public async getActiveTransferRules(userId: string): Promise<QuotaTransferRule[]> {
        try {
            return await fetchActiveTransferRulesForUser(userId);
        } catch (error) {
            console.error('Erreur lors de la récupération des règles de transfert:', error);
            throw error;
        }
    }

    /**
     * Récupère toutes les règles de report de quotas applicables
     * @param userId ID de l'utilisateur
     * @returns Liste des règles de report actives
     */
    public async getActiveCarryOverRules(userId: string): Promise<QuotaCarryOverRule[]> {
        try {
            return await fetchActiveCarryOverRulesForUser(userId);
        } catch (error) {
            console.error('Erreur lors de la récupération des règles de report:', error);
            throw error;
        }
    }

    /**
     * Simule un transfert de quotas entre deux types de congés
     * @param request Requête de simulation
     * @returns Résultat de la simulation
     */
    public async simulateTransfer(request: QuotaTransferSimulationRequest): Promise<QuotaTransferSimulationResult> {
        try {
            // Récupérer les quotas actuels de l'utilisateur
            const balance = await fetchLeaveBalance(request.userId);

            // Récupérer les règles de transfert actives
            const rules = request.applyRules ? await this.getActiveTransferRules(request.userId) : [];

            // Trouver la règle applicable
            const applicableRule = rules.find(rule =>
                rule.sourceType === request.sourceType &&
                rule.targetType === request.targetType &&
                this.isRuleApplicable(rule)
            );

            // Vérifier si le transfert est possible
            const sourceQuota = this.getQuotaForType(balance, request.sourceType);
            if (request.amount > sourceQuota.remaining) {
                return {
                    sourceRemaining: sourceQuota.remaining,
                    targetAmount: 0,
                    appliedRatio: 1,
                    isValid: false,
                    messages: [`Quota insuffisant. Il vous reste ${sourceQuota.remaining} jours de ${this.getLeaveTypeLabel(request.sourceType)}.`]
                };
            }

            // Calculer le montant cible en appliquant le ratio
            const ratio = applicableRule ? applicableRule.ratio : 1;
            let targetAmount = request.amount * ratio;

            // Appliquer les limites de la règle si nécessaire
            if (applicableRule && applicableRule.maxAmount && targetAmount > applicableRule.maxAmount) {
                targetAmount = applicableRule.maxAmount;
            }

            // Préparer le résultat
            const result: QuotaTransferSimulationResult = {
                sourceRemaining: sourceQuota.remaining - request.amount,
                targetAmount,
                appliedRatio: ratio,
                appliedRule: applicableRule,
                isValid: true,
                messages: [
                    `Ce transfert convertira ${request.amount} jour(s) de ${this.getLeaveTypeLabel(request.sourceType)} en ${targetAmount} jour(s) de ${this.getLeaveTypeLabel(request.targetType)}.`
                ]
            };

            if (applicableRule) {
                result.messages.push(`Règle appliquée: ${applicableRule.description || 'Transfert standard'} (ratio: ${applicableRule.ratio})`);
            }

            return result;
        } catch (error) {
            console.error('Erreur lors de la simulation du transfert:', error);
            throw error;
        }
    }

    /**
     * Effectue un transfert de quotas entre deux types de congés
     * @param request Requête de transfert
     * @param currentUserId ID de l'utilisateur effectuant l'opération
     * @returns Résultat du transfert
     */
    public async executeTransfer(request: QuotaTransferRequest, currentUserId: string): Promise<QuotaTransferResult> {
        try {
            // Simuler d'abord pour vérifier que le transfert est possible
            const simulation = await this.simulateTransfer({
                userId: request.employeeId,
                sourceType: request.sourceType,
                targetType: request.targetType,
                amount: request.amount,
                applyRules: true
            });

            if (!simulation.isValid) {
                throw new Error(simulation.messages.join(' '));
            }

            // Préparation de la requête d'API
            const apiRequest = {
                ...request,
                applyRatio: true // Appliquer le ratio des règles côté serveur
            };

            // Effectuer le transfert via l'API
            const response = await fetch(`${this.apiBaseUrl}/transfer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiRequest)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => response.statusText);
                throw new Error(`Erreur lors du transfert de quotas: ${errorData}`);
            }

            const result = await response.json();

            // Journaliser l'action
            await this.auditService.createAuditEntry({
                actionType: AuditActionType.QUOTA_TRANSFERRED,
                userId: currentUserId,
                targetId: request.employeeId,
                targetType: 'quota',
                description: `Transfert de ${request.amount} jour(s) de ${this.getLeaveTypeLabel(request.sourceType)} vers ${this.getLeaveTypeLabel(request.targetType)}`,
                severity: AuditSeverity.MEDIUM,
                metadata: {
                    sourceType: request.sourceType,
                    targetType: request.targetType,
                    sourceAmount: request.amount,
                    targetAmount: simulation.targetAmount,
                    ratio: simulation.appliedRatio,
                    notes: request.notes
                }
            });

            // Publier un événement pour notification
            eventBus.publish({
                type: IntegrationEventType.QUOTA_TRANSFERRED,
                source: 'QuotaAdvancedService',
                payload: {
                    userId: request.employeeId,
                    sourceType: request.sourceType,
                    targetType: request.targetType,
                    sourceAmount: request.amount,
                    targetAmount: simulation.targetAmount,
                    transferId: result.transferId
                }
            });

            return result;
        } catch (error) {
            console.error('Erreur lors de l\'exécution du transfert:', error);
            throw error;
        }
    }

    /**
     * Simule un report de quotas pour un type de congé
     * @param request Requête de calcul
     * @returns Résultat du calcul de report
     */
    public async simulateCarryOver(request: QuotaCarryOverCalculationRequest): Promise<QuotaCarryOverCalculationResult> {
        try {
            // Récupérer les quotas actuels de l'utilisateur
            const balance = await fetchLeaveBalance(request.userId);

            // Récupérer les règles de report actives
            const rules = await this.getActiveCarryOverRules(request.userId);

            // Trouver la règle applicable pour ce type de congé
            const applicableRule = rules.find(rule =>
                rule.leaveType === request.leaveType &&
                rule.isActive
            );

            if (!applicableRule) {
                return {
                    originalRemaining: 0,
                    eligibleForCarryOver: 0,
                    carryOverAmount: 0,
                    expiryDate: new Date(),
                    message: `Aucune règle de report n'est applicable pour ce type de congé.`
                };
            }

            // Obtenir le quota restant pour le type de congé
            const sourceQuota = this.getQuotaForType(balance, request.leaveType);
            const originalRemaining = sourceQuota.remaining;

            if (originalRemaining <= 0) {
                return {
                    originalRemaining: 0,
                    eligibleForCarryOver: 0,
                    carryOverAmount: 0,
                    expiryDate: new Date(),
                    appliedRule: applicableRule,
                    message: `Vous n'avez pas de jours restants à reporter.`
                };
            }

            // Calculer le montant à reporter selon la règle
            let carryOverAmount = 0;

            switch (applicableRule.ruleType) {
                case QuotaCarryOverRuleType.PERCENTAGE:
                    carryOverAmount = Math.floor(originalRemaining * (applicableRule.value / 100));
                    break;
                case QuotaCarryOverRuleType.FIXED:
                    carryOverAmount = Math.min(originalRemaining, applicableRule.value);
                    break;
                case QuotaCarryOverRuleType.MAX_DAYS:
                    carryOverAmount = Math.min(originalRemaining, applicableRule.value);
                    break;
                case QuotaCarryOverRuleType.ALL:
                    carryOverAmount = originalRemaining;
                    break;
                default:
                    carryOverAmount = 0;
            }

            // Calculer la date d'expiration
            const now = new Date();
            const nextYear = request.toYear;
            let expiryDate: Date;

            if (applicableRule.expiryMonths > 0) {
                // Calculer la date d'expiration à partir du début de l'année cible
                const yearStart = new Date(nextYear, 0, 1);
                expiryDate = addMonths(yearStart, applicableRule.expiryMonths);
            } else {
                // Si pas d'expiration, mettre une date très lointaine
                expiryDate = new Date(nextYear + 10, 11, 31);
            }

            return {
                originalRemaining,
                eligibleForCarryOver: originalRemaining,
                carryOverAmount,
                expiryDate,
                appliedRule,
                message: `Vous pouvez reporter ${carryOverAmount} jour(s) sur votre quota de ${this.getLeaveTypeLabel(request.leaveType)} vers l'année ${request.toYear}.${applicableRule.expiryMonths > 0 ? ` Ces jours expireront le ${formatDate(expiryDate)}.` : ''}`
            };
        } catch (error) {
            console.error('Erreur lors de la simulation du report:', error);
            throw error;
        }
    }

    /**
     * Exécute un report de quotas pour un type de congé
     * @param request Requête de report
     * @param currentUserId ID de l'utilisateur effectuant l'opération
     * @returns Succès de l'opération
     */
    public async executeCarryOver(request: QuotaCarryOverCalculationRequest, currentUserId: string): Promise<boolean> {
        try {
            // Simuler d'abord pour vérifier que le report est possible
            const simulation = await this.simulateCarryOver(request);

            if (simulation.carryOverAmount <= 0) {
                throw new Error('Aucun jour à reporter.');
            }

            // Effectuer le report via l'API
            const response = await fetch(`${this.apiBaseUrl}/carry-over`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => response.statusText);
                throw new Error(`Erreur lors du report de quotas: ${errorData}`);
            }

            const result = await response.json();

            // Journaliser l'action
            await this.auditService.createAuditEntry({
                actionType: AuditActionType.QUOTA_CARRIED_OVER,
                userId: currentUserId,
                targetId: request.userId,
                targetType: 'quota',
                description: `Report de ${simulation.carryOverAmount} jour(s) de ${this.getLeaveTypeLabel(request.leaveType)} de ${request.fromYear} vers ${request.toYear}`,
                severity: AuditSeverity.MEDIUM,
                metadata: {
                    leaveType: request.leaveType,
                    fromYear: request.fromYear,
                    toYear: request.toYear,
                    amount: simulation.carryOverAmount,
                    expiryDate: simulation.expiryDate,
                    ruleId: simulation.appliedRule?.id
                }
            });

            // Publier un événement pour notification
            eventBus.publish({
                type: IntegrationEventType.QUOTA_CARRIED_OVER,
                source: 'QuotaAdvancedService',
                payload: {
                    userId: request.userId,
                    leaveType: request.leaveType,
                    fromYear: request.fromYear,
                    toYear: request.toYear,
                    amount: simulation.carryOverAmount,
                    expiryDate: simulation.expiryDate
                }
            });

            return true;
        } catch (error) {
            console.error('Erreur lors de l\'exécution du report:', error);
            throw error;
        }
    }

    /**
     * Récupère l'historique des transferts pour un utilisateur
     * @param userId ID de l'utilisateur
     * @returns Liste des transferts
     */
    public async getTransferHistory(userId: string): Promise<TransferHistoryItem[]> {
        try {
            const response = await fetch(`${this.apiBaseUrl}/transfer/history?userId=${userId}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => response.statusText);
                throw new Error(`Erreur lors de la récupération de l'historique des transferts: ${errorData}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'historique des transferts:', error);
            throw error;
        }
    }

    /**
     * Récupère l'historique des reports pour un utilisateur
     * @param userId ID de l'utilisateur
     * @returns Liste des reports
     */
    public async getCarryOverHistory(userId: string): Promise<CarryOverHistoryItem[]> {
        try {
            const response = await fetch(`${this.apiBaseUrl}/carry-over/history?userId=${userId}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => response.statusText);
                throw new Error(`Erreur lors de la récupération de l'historique des reports: ${errorData}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'historique des reports:', error);
            throw error;
        }
    }

    /**
     * Obtient un état détaillé des quotas incluant les transferts et reports
     * @param userId ID de l'utilisateur
     * @param year Année concernée
     * @returns État détaillé des quotas
     */
    public async getEnhancedQuotaState(userId: string, year: number = new Date().getFullYear()): Promise<EnhancedQuotaState[]> {
        try {
            // Récupérer les quotas de base
            const balance = await fetchLeaveBalance(userId);

            // Récupérer l'historique des transferts et reports
            const transferHistory = await this.getTransferHistory(userId);
            const carryOverHistory = await this.getCarryOverHistory(userId);

            // Filtrer les historiques pour l'année en cours
            const yearStart = new Date(year, 0, 1);
            const yearEnd = new Date(year, 11, 31, 23, 59, 59);

            const currentYearTransfers = transferHistory.filter(item => {
                const date = new Date(item.createdAt);
                return date >= yearStart && date <= yearEnd;
            });

            const currentYearCarryOvers = carryOverHistory.filter(item =>
                item.toYear === year && item.status === 'completed'
            );

            // Créer l'état amélioré pour chaque type de congé
            const enhancedQuotas: EnhancedQuotaState[] = [];

            for (const type of Object.values(LeaveType)) {
                const baseQuota = this.getQuotaForType(balance, type);

                // Calculer les totaux de transferts
                const transfersIn = currentYearTransfers.filter(t => t.targetType === type);
                const transfersOut = currentYearTransfers.filter(t => t.sourceType === type);

                const totalTransferredIn = transfersIn.reduce((sum, t) => sum + t.targetAmount, 0);
                const totalTransferredOut = transfersOut.reduce((sum, t) => sum + t.sourceAmount, 0);

                // Calculer les reports
                const carriedItems = currentYearCarryOvers.filter(c => c.leaveType === type);
                const totalCarriedOver = carriedItems.reduce((sum, c) => sum + c.carriedAmount, 0);

                // Identifier les quotas qui vont bientôt expirer
                const now = new Date();
                const expiringItems = carriedItems
                    .filter(c => isDateInFuture(c.expiryDate) && getDaysUntil(c.expiryDate) <= 30)
                    .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());

                let expiringCarryOver = undefined;

                if (expiringItems.length > 0) {
                    const earliest = expiringItems[0];
                    expiringCarryOver = {
                        amount: earliest.carriedAmount,
                        expiryDate: earliest.expiryDate,
                        daysUntilExpiry: getDaysUntil(earliest.expiryDate)
                    };
                }

                // Préparer les détails des transferts
                const transferItems = [
                    ...transfersIn.map(t => ({
                        type: 'in' as const,
                        relatedType: t.sourceType,
                        amount: t.targetAmount,
                        date: new Date(t.createdAt)
                    })),
                    ...transfersOut.map(t => ({
                        type: 'out' as const,
                        relatedType: t.targetType,
                        amount: t.sourceAmount,
                        date: new Date(t.createdAt)
                    }))
                ].sort((a, b) => b.date.getTime() - a.date.getTime()); // Plus récent d'abord

                // Préparer les détails des reports
                const carriedOverItems = carriedItems.map(c => ({
                    fromYear: c.fromYear,
                    amount: c.carriedAmount,
                    expiryDate: c.expiryDate
                }));

                // Construire l'objet final
                enhancedQuotas.push({
                    type,
                    total: baseQuota.total,
                    used: baseQuota.used,
                    pending: baseQuota.pending,
                    remaining: baseQuota.remaining,
                    totalCarriedOver,
                    totalTransferredIn,
                    totalTransferredOut,
                    carriedOverItems,
                    transferItems,
                    expiringCarryOver
                });
            }

            return enhancedQuotas;
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'état amélioré des quotas:', error);
            throw error;
        }
    }

    /**
     * Vérifie si une règle de transfert est applicable
     * @param rule Règle à vérifier
     * @returns true si la règle est applicable
     */
    private isRuleApplicable(rule: QuotaTransferRule): boolean {
        // Si pas de date de début/fin, toujours applicable
        if (!rule.startDate && !rule.endDate) {
            return true;
        }

        const now = new Date();

        // Vérifier la date de début
        if (rule.startDate && now < new Date(rule.startDate)) {
            return false;
        }

        // Vérifier la date de fin
        if (rule.endDate && now > new Date(rule.endDate)) {
            return false;
        }

        return true;
    }

    /**
     * Récupère les informations de quota pour un type de congé
     * @param balance Solde de congés
     * @param type Type de congé
     * @returns Quotas disponibles pour le type
     */
    private getQuotaForType(balance: LeaveBalance, type: LeaveType) {
        const typeInfo = balance.balances[type] || { initial: 0, used: 0, pending: 0, remaining: 0 };

        return {
            total: typeInfo.initial,
            used: typeInfo.used,
            pending: typeInfo.pending,
            remaining: typeInfo.remaining
        };
    }

    /**
     * Retourne le libellé d'un type de congé
     * @param type Type de congé
     * @returns Libellé
     */
    private getLeaveTypeLabel(type: LeaveType): string {
        const labels: Record<string, string> = {
            [LeaveType.CONGE_PAYE]: 'Congés payés',
            [LeaveType.RTT]: 'RTT',
            [LeaveType.MALADIE]: 'Maladie',
            [LeaveType.SANS_SOLDE]: 'Sans solde',
            [LeaveType.MATERNITE]: 'Maternité',
            [LeaveType.PATERNITE]: 'Paternité',
            [LeaveType.FORMATION]: 'Formation',
            [LeaveType.AUTRE]: 'Autre',
        };

        return labels[type] || type;
    }

    /**
     * Génère un rapport sur les transferts de quotas
     * @param options Options du rapport
     * @returns Résultat du rapport
     */
    async generateTransferReport(options: QuotaTransferReportOptions): Promise<QuotaTransferReportResult> {
        try {
            const response = await apiClient.post('/api/leaves/quotas/transfers/report', options);
            return response.data;
        } catch (error: any) {
            console.error('Erreur lors de la génération du rapport de transferts:', error);
            throw new Error(error.response?.data?.message || 'Erreur lors de la génération du rapport');
        }
    }

    /**
     * Exporte un rapport de transferts au format spécifié
     * @param options Options du rapport
     * @returns Blob contenant le fichier exporté
     */
    async exportTransferReport(options: QuotaTransferReportOptions): Promise<Blob> {
        const format = options.format || 'pdf';

        try {
            const response = await apiClient.post(
                `/api/leaves/quotas/transfers/export?format=${format}`,
                options,
                { responseType: 'blob' }
            );

            return response.data;
        } catch (error: any) {
            console.error(`Erreur lors de l'exportation du rapport au format ${format}:`, error);
            throw new Error(error.response?.data?.message || `Erreur lors de l'exportation du rapport`);
        }
    }

    /**
     * Récupère les statistiques de quotas pour un utilisateur ou département
     * @param userId ID utilisateur
     * @param departmentId ID département
     * @param year Année
     * @returns Statistiques de quotas
     */
    async getQuotaStatistics(userId?: string, departmentId?: string, year?: number): Promise<QuotaStatistics> {
        const currentYear = year || new Date().getFullYear();
        const queryParams = new URLSearchParams();

        if (userId) queryParams.append('userId', userId);
        if (departmentId) queryParams.append('departmentId', departmentId);
        queryParams.append('year', currentYear.toString());

        try {
            const response = await apiClient.get(`/api/leaves/quotas/statistics?${queryParams.toString()}`);
            return response.data;
        } catch (error: any) {
            console.error('Erreur lors de la récupération des statistiques de quotas:', error);
            throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des statistiques');
        }
    }

    /**
     * Récupère les configurations de report annuel pour tous les types de congés
     * @returns Liste des configurations
     */
    async getCarryOverConfigurations(): Promise<QuotaAnnualCarryOverConfig[]> {
        try {
            const response = await apiClient.get('/api/leaves/quotas/carry-overs/config');
            return response.data;
        } catch (error: any) {
            console.error('Erreur lors de la récupération des configurations de report:', error);
            throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des configurations');
        }
    }

    /**
     * Met à jour une configuration de report annuel
     * @param config Configuration à mettre à jour
     * @returns Configuration mise à jour
     */
    async updateCarryOverConfiguration(config: QuotaAnnualCarryOverConfig): Promise<QuotaAnnualCarryOverConfig> {
        try {
            const response = await apiClient.put('/api/leaves/quotas/carry-overs/config', config);

            // Journalisation de l'action
            AuditService.logAction(AuditAction.UPDATE_QUOTA_CONFIG, {
                leaveType: config.leaveType,
                configId: config.id,
                changes: {
                    maximumPercentage: config.maximumPercentage,
                    maximumDays: config.maximumDays,
                    expiryInDays: config.expiryInDays,
                    requiresApproval: config.requiresApproval,
                    isActive: config.isActive
                }
            });

            // Notification du changement de configuration
            EventBusService.publish('quota:config:updated', {
                configId: config.id,
                leaveType: config.leaveType,
                timestamp: new Date().toISOString()
            });

            return response.data;
        } catch (error: any) {
            console.error('Erreur lors de la mise à jour de la configuration de report:', error);
            throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour de la configuration');
        }
    }

    /**
     * Exécute le processus de report annuel automatique pour tous les utilisateurs
     * @param fromYear Année source
     * @param toYear Année destination
     * @returns Résultat du traitement
     */
    async executeAnnualCarryOver(fromYear: number, toYear: number): Promise<{
        success: boolean;
        processedUsers: number;
        totalCarriedDays: number;
        details: any[];
    }> {
        try {
            const response = await apiClient.post('/api/leaves/quotas/carry-overs/process-annual', {
                fromYear,
                toYear
            });

            // Journalisation de l'action
            AuditService.logAction(AuditAction.PROCESS_ANNUAL_CARRYOVER, {
                fromYear,
                toYear,
                processedUsers: response.data.processedUsers,
                totalCarriedDays: response.data.totalCarriedDays
            });

            // Notification du traitement terminé
            EventBusService.publish('quota:annual:processed', {
                fromYear,
                toYear,
                timestamp: new Date().toISOString(),
                success: response.data.success
            });

            return response.data;
        } catch (error: any) {
            console.error('Erreur lors du traitement du report annuel:', error);
            throw new Error(error.response?.data?.message || 'Erreur lors du traitement du report annuel');
        }
    }

    /**
     * Récupère les données pour le tableau de bord des quotas
     * @param year Année
     * @param departmentId ID département (optionnel)
     * @returns Données pour le tableau de bord
     */
    async getQuotaDashboardData(year?: number, departmentId?: string): Promise<{
        utilizationStats: any;
        transfersStats: any;
        carryOverStats: any;
        topUsers: any[];
    }> {
        const currentYear = year || new Date().getFullYear();
        const queryParams = new URLSearchParams();

        queryParams.append('year', currentYear.toString());
        if (departmentId) queryParams.append('departmentId', departmentId);

        try {
            const response = await apiClient.get(`/api/leaves/quotas/dashboard?${queryParams.toString()}`);
            return response.data;
        } catch (error: any) {
            console.error('Erreur lors de la récupération des données du tableau de bord:', error);
            throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des données');
        }
    }
}

// Exporter une instance du service
export const quotaAdvancedService = QuotaAdvancedService.getInstance(); 