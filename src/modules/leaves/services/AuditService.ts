/**
 * Service d'audit pour journaliser les actions sensibles dans le module de congés
 * Permet de garder une trace des opérations importantes pour la sécurité et la conformité
 */

import axios from 'axios';
import { logger } from "../../../lib/logger";
import { User } from '@/types/user';
import { eventBus, IntegrationEventType } from '../../integration/services/EventBusService';

/**
 * Types d'actions à auditer
 */
export enum AuditActionType {
    // Actions sur les congés
    LEAVE_CREATED = 'LEAVE_CREATED',
    LEAVE_UPDATED = 'LEAVE_UPDATED',
    LEAVE_APPROVED = 'LEAVE_APPROVED',
    LEAVE_REJECTED = 'LEAVE_REJECTED',
    LEAVE_CANCELLED = 'LEAVE_CANCELLED',
    LEAVE_DELETED = 'LEAVE_DELETED',

    // Actions sur les quotas
    QUOTA_UPDATED = 'QUOTA_UPDATED',
    QUOTA_TRANSFERRED = 'QUOTA_TRANSFERRED',
    QUOTA_CARRIED_OVER = 'QUOTA_CARRIED_OVER',

    // Actions sur les utilisateurs et permissions
    USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
    PERMISSION_GRANTED = 'PERMISSION_GRANTED',
    PERMISSION_REVOKED = 'PERMISSION_REVOKED',

    // Autres actions sensibles
    EXPORT_DATA = 'EXPORT_DATA',
    CONFIGURATION_CHANGED = 'CONFIGURATION_CHANGED',
    SYSTEM_ACCESS = 'SYSTEM_ACCESS'
}

/**
 * Niveau de criticité d'une action auditée
 */
export enum AuditSeverity {
    INFO = 'INFO',         // Information
    LOW = 'LOW',           // Bas
    MEDIUM = 'MEDIUM',     // Moyen
    HIGH = 'HIGH',         // Élevé
    CRITICAL = 'CRITICAL'  // Critique
}

/**
 * Structure d'une entrée d'audit
 */
export interface AuditEntry {
    id?: string;              // Identifiant unique (généré par le serveur)
    timestamp?: Date;         // Horodatage (généré par le serveur)
    actionType: AuditActionType; // Type d'action
    userId: string;           // ID de l'utilisateur ayant effectué l'action
    userRole?: string;        // Rôle de l'utilisateur
    targetId?: string;        // ID de l'objet cible (congé, utilisateur, etc.)
    targetType?: string;      // Type de l'objet cible
    description: string;      // Description détaillée de l'action
    severity: AuditSeverity;  // Niveau de criticité
    metadata?: Record<string, unknown>; // Métadonnées supplémentaires
    ipAddress?: string;       // Adresse IP de l'utilisateur
    userAgent?: string;       // User-Agent du navigateur
}

/**
 * Options de filtrage pour la recherche d'entrées d'audit
 */
export interface AuditSearchOptions {
    startDate?: Date;         // Date de début
    endDate?: Date;           // Date de fin
    actionTypes?: AuditActionType[]; // Types d'actions
    userIds?: string[];       // IDs des utilisateurs
    targetIds?: string[];     // IDs des cibles
    severity?: AuditSeverity[]; // Niveaux de criticité
    limit?: number;           // Limite de résultats
    offset?: number;          // Décalage pour pagination
    sortBy?: keyof AuditEntry; // Champ de tri
    sortOrder?: 'asc' | 'desc'; // Ordre de tri
}

/**
 * Résultat paginé pour la recherche d'entrées d'audit
 */
export interface PaginatedAuditResult {
    entries: AuditEntry[];    // Entrées d'audit
    totalCount: number;       // Nombre total d'entrées
    hasMore: boolean;         // Indique s'il y a plus de résultats
    nextOffset?: number;      // Prochain offset pour pagination
}

/**
 * Service principal pour l'audit
 */
export class AuditService {
    private static instance: AuditService;
    private readonly apiBaseUrl: string;
    private readonly defaultHeaders: Record<string, string>;
    private readonly debug: boolean = process.env.NODE_ENV === 'development';

    /**
     * Obtenir l'instance du service (Singleton)
     */
    public static getInstance(): AuditService {
        if (!AuditService.instance) {
            AuditService.instance = new AuditService();
        }
        return AuditService.instance;
    }

    /**
     * Constructeur privé
     */
    private constructor() {
        this.apiBaseUrl = '/api/audit';
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };

        // Initialiser les abonnements aux événements
        this.initEventSubscriptions();
    }

    /**
     * Initialiser les abonnements aux événements du bus
     */
    private initEventSubscriptions(): void {
        // S'abonner aux événements du bus pour créer automatiquement des entrées d'audit
        eventBus.subscribe(IntegrationEventType.LEAVE_CREATED, this.handleLeaveEvent.bind(this));
        eventBus.subscribe(IntegrationEventType.LEAVE_UPDATED, this.handleLeaveEvent.bind(this));
        eventBus.subscribe(IntegrationEventType.LEAVE_APPROVED, this.handleLeaveEvent.bind(this));
        eventBus.subscribe(IntegrationEventType.LEAVE_REJECTED, this.handleLeaveEvent.bind(this));
        eventBus.subscribe(IntegrationEventType.LEAVE_CANCELLED, this.handleLeaveEvent.bind(this));
        eventBus.subscribe(IntegrationEventType.LEAVE_DELETED, this.handleLeaveEvent.bind(this));
        eventBus.subscribe(IntegrationEventType.QUOTA_UPDATED, this.handleQuotaEvent.bind(this));
        eventBus.subscribe(IntegrationEventType.QUOTA_TRANSFERRED, this.handleQuotaEvent.bind(this));
        eventBus.subscribe(IntegrationEventType.QUOTA_CARRIED_OVER, this.handleQuotaEvent.bind(this));
        eventBus.subscribe(IntegrationEventType.AUDIT_ACTION, this.handleGenericAuditEvent.bind(this));

        if (this.debug) {
            logger.debug('[AuditService] Event subscriptions initialized');
        }
    }

    /**
     * Gérer un événement de congé
     */
    private async handleLeaveEvent(event: unknown): Promise<void> {
        try {
            const { type, payload, userId } = event;

            // Convertir le type d'événement d'intégration en type d'audit
            const auditActionType = this.mapIntegrationEventToAuditType(type);
            if (!auditActionType) return;

            // Créer une entrée d'audit
            await this.createAuditEntry({
                actionType: auditActionType,
                userId: userId || payload.userId,
                targetId: payload.id,
                targetType: 'leave',
                description: this.generateLeaveActionDescription(type, payload),
                severity: this.getActionSeverity(auditActionType),
                metadata: {
                    leaveType: payload.type,
                    leaveStatus: payload.status,
                    startDate: payload.startDate,
                    endDate: payload.endDate
                }
            });
        } catch (error: unknown) {
            logger.error(`[AuditService] Error handling leave event:`, { error: error });
        }
    }

    /**
     * Gérer un événement de quota
     */
    private async handleQuotaEvent(event: unknown): Promise<void> {
        try {
            const { type, payload, userId } = event;

            // Convertir le type d'événement d'intégration en type d'audit
            const auditActionType = this.mapIntegrationEventToAuditType(type);
            if (!auditActionType) return;

            // Créer une entrée d'audit
            await this.createAuditEntry({
                actionType: auditActionType,
                userId,
                targetId: payload.userId,
                targetType: 'quota',
                description: this.generateQuotaActionDescription(type, payload),
                severity: this.getActionSeverity(auditActionType),
                metadata: {
                    leaveType: payload.leaveType,
                    amount: payload.amount,
                    reason: payload.reason
                }
            });
        } catch (error: unknown) {
            logger.error(`[AuditService] Error handling quota event:`, { error: error });
        }
    }

    /**
     * Gérer un événement d'audit générique
     */
    private async handleGenericAuditEvent(event: unknown): Promise<void> {
        try {
            const { payload } = event;

            // Le payload contient directement les données d'audit
            await this.createAuditEntry(payload);
        } catch (error: unknown) {
            logger.error(`[AuditService] Error handling generic audit event:`, { error: error });
        }
    }

    /**
     * Convertir un type d'événement d'intégration en type d'audit
     */
    private mapIntegrationEventToAuditType(eventType: IntegrationEventType): AuditActionType | null {
        const mapping: Record<IntegrationEventType, AuditActionType> = {
            [IntegrationEventType.LEAVE_CREATED]: AuditActionType.LEAVE_CREATED,
            [IntegrationEventType.LEAVE_UPDATED]: AuditActionType.LEAVE_UPDATED,
            [IntegrationEventType.LEAVE_APPROVED]: AuditActionType.LEAVE_APPROVED,
            [IntegrationEventType.LEAVE_REJECTED]: AuditActionType.LEAVE_REJECTED,
            [IntegrationEventType.LEAVE_CANCELLED]: AuditActionType.LEAVE_CANCELLED,
            [IntegrationEventType.LEAVE_DELETED]: AuditActionType.LEAVE_DELETED,
            [IntegrationEventType.QUOTA_UPDATED]: AuditActionType.QUOTA_UPDATED,
            [IntegrationEventType.QUOTA_TRANSFERRED]: AuditActionType.QUOTA_TRANSFERRED,
            [IntegrationEventType.QUOTA_CARRIED_OVER]: AuditActionType.QUOTA_CARRIED_OVER,
            [IntegrationEventType.AUDIT_ACTION]: AuditActionType.SYSTEM_ACCESS,
            [IntegrationEventType.PLANNING_EVENT_CREATED]: null as unknown as AuditActionType,
            [IntegrationEventType.PLANNING_EVENT_UPDATED]: null as unknown as AuditActionType,
            [IntegrationEventType.PLANNING_EVENT_DELETED]: null as unknown as AuditActionType
        };

        return mapping[eventType] || null;
    }

    /**
     * Déterminer la sévérité d'une action
     */
    private getActionSeverity(actionType: AuditActionType): AuditSeverity {
        // Définir la sévérité pour chaque type d'action
        const severityMap: Record<AuditActionType, AuditSeverity> = {
            [AuditActionType.LEAVE_CREATED]: AuditSeverity.INFO,
            [AuditActionType.LEAVE_UPDATED]: AuditSeverity.LOW,
            [AuditActionType.LEAVE_APPROVED]: AuditSeverity.LOW,
            [AuditActionType.LEAVE_REJECTED]: AuditSeverity.LOW,
            [AuditActionType.LEAVE_CANCELLED]: AuditSeverity.LOW,
            [AuditActionType.LEAVE_DELETED]: AuditSeverity.MEDIUM,
            [AuditActionType.QUOTA_UPDATED]: AuditSeverity.MEDIUM,
            [AuditActionType.QUOTA_TRANSFERRED]: AuditSeverity.MEDIUM,
            [AuditActionType.QUOTA_CARRIED_OVER]: AuditSeverity.MEDIUM,
            [AuditActionType.USER_ROLE_CHANGED]: AuditSeverity.HIGH,
            [AuditActionType.PERMISSION_GRANTED]: AuditSeverity.HIGH,
            [AuditActionType.PERMISSION_REVOKED]: AuditSeverity.HIGH,
            [AuditActionType.EXPORT_DATA]: AuditSeverity.MEDIUM,
            [AuditActionType.CONFIGURATION_CHANGED]: AuditSeverity.HIGH,
            [AuditActionType.SYSTEM_ACCESS]: AuditSeverity.MEDIUM
        };

        return severityMap[actionType] || AuditSeverity.INFO;
    }

    /**
     * Générer une description pour une action sur un congé
     */
    private generateLeaveActionDescription(type: IntegrationEventType, payload: unknown): string {
        const actionVerb = type.split('_')[1]?.toLowerCase() || 'modifié';
        return `Congé ${actionVerb} - Type: ${payload.type}, Statut: ${payload.status}, Période: ${new Date(payload.startDate).toLocaleDateString()} au ${new Date(payload.endDate).toLocaleDateString()}`;
    }

    /**
     * Générer une description pour une action sur un quota
     */
    private generateQuotaActionDescription(type: IntegrationEventType, payload: unknown): string {
        switch (type) {
            case IntegrationEventType.QUOTA_UPDATED:
                return `Quota mis à jour - Type: ${payload.leaveType}, Quantité: ${payload.amount}`;
            case IntegrationEventType.QUOTA_TRANSFERRED:
                return `Transfert de quota - De: ${payload.fromLeaveType}, Vers: ${payload.toLeaveType}, Quantité: ${payload.amount}`;
            case IntegrationEventType.QUOTA_CARRIED_OVER:
                return `Report de quota - Type: ${payload.leaveType}, De: ${payload.fromYear}, Vers: ${payload.toYear}, Quantité: ${payload.amount}`;
            default:
                return `Action sur quota - Type: ${payload.leaveType}`;
        }
    }

    /**
     * Créer une nouvelle entrée d'audit
     */
    public async createAuditEntry(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<AuditEntry> {
        try {
            // Ajouter les informations du navigateur
            const enhancedEntry = {
                ...entry,
                userAgent: navigator.userAgent,
                // L'adresse IP sera ajoutée côté serveur
            };

            // Envoyer l'entrée à l'API
            const response = await axios.post(`${this.apiBaseUrl}/entries`, enhancedEntry, {
                headers: this.defaultHeaders
            });

            if (this.debug) {
                logger.debug(`[AuditService] Created audit entry: ${response.data.id}`, response.data);
            }

            return response.data;
        } catch (error: unknown) {
            logger.error('[AuditService] Error creating audit entry:', { error: error });
            throw error;
        }
    }

    /**
     * Rechercher des entrées d'audit
     */
    public async searchAuditEntries(options: AuditSearchOptions = {}): Promise<PaginatedAuditResult> {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/entries`, {
                headers: this.defaultHeaders,
                params: options
            });

            return response.data;
        } catch (error: unknown) {
            logger.error('[AuditService] Error searching audit entries:', { error: error });
            throw error;
        }
    }

    /**
     * Obtenir une entrée d'audit par ID
     */
    public async getAuditEntry(id: string): Promise<AuditEntry> {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/entries/${id}`, {
                headers: this.defaultHeaders
            });

            return response.data;
        } catch (error: unknown) {
            logger.error(`[AuditService] Error fetching audit entry ${id}:`, { error: error });
            throw error;
        }
    }

    /**
     * Enregistrer une action d'accès au système
     */
    public async logSystemAccess(userId: string, section: string, action: string, metadata: Record<string, unknown> = {}): Promise<void> {
        await this.createAuditEntry({
            actionType: AuditActionType.SYSTEM_ACCESS,
            userId,
            description: `Accès au système - Section: ${section}, Action: ${action}`,
            severity: AuditSeverity.INFO,
            metadata
        });
    }

    /**
     * Enregistrer un changement de rôle utilisateur
     */
    public async logUserRoleChange(changedBy: string, targetUserId: string, oldRole: string, newRole: string): Promise<void> {
        await this.createAuditEntry({
            actionType: AuditActionType.USER_ROLE_CHANGED,
            userId: changedBy,
            targetId: targetUserId,
            targetType: 'user',
            description: `Rôle modifié de ${oldRole} à ${newRole}`,
            severity: AuditSeverity.HIGH,
            metadata: {
                oldRole,
                newRole
            }
        });
    }

    /**
     * Enregistrer un changement de permission
     */
    public async logPermissionChange(changedBy: string, targetUserId: string, permission: string, granted: boolean): Promise<void> {
        await this.createAuditEntry({
            actionType: granted ? AuditActionType.PERMISSION_GRANTED : AuditActionType.PERMISSION_REVOKED,
            userId: changedBy,
            targetId: targetUserId,
            targetType: 'permission',
            description: `Permission ${permission} ${granted ? 'accordée' : 'retirée'}`,
            severity: AuditSeverity.HIGH,
            metadata: {
                permission,
                granted
            }
        });
    }

    /**
     * Enregistrer une exportation de données
     */
    public async logDataExport(userId: string, dataType: string, exportFormat: string, filters: Record<string, unknown> = {}): Promise<void> {
        await this.createAuditEntry({
            actionType: AuditActionType.EXPORT_DATA,
            userId,
            targetType: dataType,
            description: `Exportation de données - Type: ${dataType}, Format: ${exportFormat}`,
            severity: AuditSeverity.MEDIUM,
            metadata: {
                dataType,
                exportFormat,
                filters
            }
        });
    }

    /**
     * Enregistrer un changement de configuration
     */
    public async logConfigurationChange(userId: string, configKey: string, oldValue: unknown, newValue: unknown): Promise<void> {
        await this.createAuditEntry({
            actionType: AuditActionType.CONFIGURATION_CHANGED,
            userId,
            targetType: 'configuration',
            targetId: configKey,
            description: `Configuration modifiée - Clé: ${configKey}`,
            severity: AuditSeverity.HIGH,
            metadata: {
                configKey,
                oldValue,
                newValue
            }
        });
    }
}

// Exporter l'instance singleton
export const auditService = AuditService.getInstance(); 