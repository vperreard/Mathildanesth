/**
 * Types d'actions enregistrées dans l'audit
 */
export enum AuditAction {
    USER_LOGIN = 'user:login',
    USER_LOGOUT = 'user:logout',
    USER_CREATED = 'user:created',
    USER_UPDATED = 'user:updated',
    USER_DELETED = 'user:deleted',

    LEAVE_CREATED = 'leave:created',
    LEAVE_UPDATED = 'leave:updated',
    LEAVE_APPROVED = 'leave:approved',
    LEAVE_REJECTED = 'leave:rejected',
    LEAVE_CANCELLED = 'leave:cancelled',

    QUOTA_UPDATED = 'quota:updated',
    QUOTA_TRANSFER = 'quota:transfer',
    QUOTA_CARRY_OVER = 'quota:carry_over',

    PERMISSION_GRANTED = 'permission:granted',
    PERMISSION_REVOKED = 'permission:revoked',

    SETTING_UPDATED = 'setting:updated',

    REPORT_GENERATED = 'report:generated',

    SYSTEM_UPDATED = 'system:updated',
    
    RATE_LIMIT_EXCEEDED = 'security:rate_limit_exceeded'
}

// 🔧 CORRECTION TYPE ANY : Types spécifiques pour les détails d'audit
type AuditDetails =
    | UserAuditDetails
    | LeaveAuditDetails
    | QuotaAuditDetails
    | PermissionAuditDetails
    | SettingAuditDetails
    | ReportAuditDetails
    | SystemAuditDetails
    | Record<string, unknown>; // Fallback pour les cas non typés

interface UserAuditDetails {
    previousRole?: string;
    newRole?: string;
    changedFields?: string[];
    resetPassword?: boolean;
}

interface LeaveAuditDetails {
    leaveType?: string;
    startDate?: string;
    endDate?: string;
    previousStatus?: string;
    newStatus?: string;
    reason?: string;
}

interface QuotaAuditDetails {
    previousQuota?: number;
    newQuota?: number;
    transferAmount?: number;
    targetUserId?: string;
}

interface PermissionAuditDetails {
    permission?: string;
    granted?: boolean;
    scope?: string;
}

interface SettingAuditDetails {
    settingKey?: string;
    previousValue?: unknown;
    newValue?: unknown;
}

interface ReportAuditDetails {
    reportType?: string;
    filters?: Record<string, unknown>;
    exportFormat?: string;
}

interface SystemAuditDetails {
    component?: string;
    version?: string;
    configChanges?: Record<string, unknown>;
}

/**
 * Interface pour les entrées d'audit
 */
export interface AuditEntry {
    id?: string;
    timestamp?: Date;
    action: AuditAction;
    userId?: string;
    entityId: string;
    entityType: string;
    details?: AuditDetails; // 🔧 PLUS DE TYPE ANY
    ip?: string;
    userAgent?: string;
}

/**
 * Service d'audit pour enregistrer et consulter les actions sensibles
 */
export class AuditService {
    private static instance: AuditService;
    private isDebugMode: boolean;

    private constructor() {
        this.isDebugMode = process.env.NODE_ENV === 'development';
    }

    /**
     * Obtient l'instance unique du service d'audit
     */
    public static getInstance(): AuditService {
        if (!AuditService.instance) {
            AuditService.instance = new AuditService();
        }
        return AuditService.instance;
    }

    /**
     * Enregistre une action dans l'audit
     */
    public async logAction(entry: AuditEntry): Promise<AuditEntry> {
        const completeEntry: AuditEntry = {
            ...entry,
            timestamp: entry.timestamp || new Date(),
            id: entry.id || `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };

        if (this.isDebugMode) {
            console.debug('[AuditService] Action enregistrée:', completeEntry);
        }

        try {
            // Dans un environnement de production, nous enverrions à l'API
            await this.sendToAuditAPI(completeEntry);
            return completeEntry;
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement de l\'audit:', error);
            // En cas d'erreur, nous essayons de stocker localement pour synchronisation ultérieure
            this.storeLocally(completeEntry);
            return completeEntry;
        }
    }

    /**
     * Récupère l'historique d'audit pour une entité donnée
     */
    public async getAuditHistory(
        entityType: string,
        entityId: string,
        options?: {
            limit?: number;
            offset?: number;
            startDate?: Date;
            endDate?: Date;
            actions?: AuditAction[];
        }
    ): Promise<AuditEntry[]> {
        // Construction des paramètres de requête
        const queryParams = new URLSearchParams();
        queryParams.append('entityType', entityType);
        queryParams.append('entityId', entityId);

        if (options?.limit) {
            queryParams.append('limit', options.limit.toString());
        }

        if (options?.offset) {
            queryParams.append('offset', options.offset.toString());
        }

        if (options?.startDate) {
            queryParams.append('startDate', options.startDate.toISOString());
        }

        if (options?.endDate) {
            queryParams.append('endDate', options.endDate.toISOString());
        }

        if (options?.actions && options.actions.length > 0) {
            queryParams.append('actions', options.actions.join(','));
        }

        try {
            const response = await fetch(`http://localhost:3000/api/audit?${queryParams.toString()}`);
            if (!response.ok) {
                throw new Error(`Erreur lors de la récupération de l'audit: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Erreur dans getAuditHistory:', error);
            return [];
        }
    }

    /**
     * Récupère l'historique d'audit pour un utilisateur
     */
    public async getUserAuditHistory(
        userId: string,
        options?: {
            limit?: number;
            offset?: number;
            startDate?: Date;
            endDate?: Date;
            actions?: AuditAction[];
        }
    ): Promise<AuditEntry[]> {
        // Construction des paramètres de requête
        const queryParams = new URLSearchParams();
        queryParams.append('userId', userId);

        if (options?.limit) {
            queryParams.append('limit', options.limit.toString());
        }

        if (options?.offset) {
            queryParams.append('offset', options.offset.toString());
        }

        if (options?.startDate) {
            queryParams.append('startDate', options.startDate.toISOString());
        }

        if (options?.endDate) {
            queryParams.append('endDate', options.endDate.toISOString());
        }

        if (options?.actions && options.actions.length > 0) {
            queryParams.append('actions', options.actions.join(','));
        }

        try {
            const response = await fetch(`http://localhost:3000/api/audit/user?${queryParams.toString()}`);
            if (!response.ok) {
                throw new Error(`Erreur lors de la récupération de l'audit: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Erreur dans getUserAuditHistory:', error);
            return [];
        }
    }

    /**
     * Active ou désactive le mode debug
     */
    public setDebugMode(enabled: boolean): void {
        this.isDebugMode = enabled;
    }

    /**
     * Envoie une entrée d'audit à l'API
     */
    private async sendToAuditAPI(entry: AuditEntry): Promise<void> {
        try {
            const response = await fetch('http://localhost:3000/api/audit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(entry)
            });

            if (!response.ok) {
                throw new Error(`Erreur lors de l'enregistrement de l'audit: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Erreur dans sendToAuditAPI:', error);
            throw error;
        }
    }

    /**
     * Stocke une entrée d'audit localement si l'envoi à l'API échoue
     */
    private storeLocally(entry: AuditEntry): void {
        try {
            // Récupérer les entrées existantes
            const pendingEntries = JSON.parse(
                localStorage.getItem('pendingAuditEntries') || '[]'
            ) as AuditEntry[];

            // Ajouter la nouvelle entrée
            pendingEntries.push(entry);

            // Limiter le nombre d'entrées en attente (pour éviter de surcharger le localStorage)
            const maxPendingEntries = 100;
            const trimmedEntries = pendingEntries.slice(-maxPendingEntries);

            // Sauvegarder
            localStorage.setItem('pendingAuditEntries', JSON.stringify(trimmedEntries));

            if (this.isDebugMode) {
                console.debug(`[AuditService] Entrée stockée localement. ${trimmedEntries.length} entrées en attente.`);
            }
        } catch (error) {
            console.error('Erreur lors du stockage local de l\'audit:', error);
        }
    }

    /**
     * Synchronise les entrées d'audit stockées localement avec le serveur
     */
    public async syncPendingEntries(): Promise<number> {
        try {
            // Récupérer les entrées en attente
            const pendingEntries = JSON.parse(
                localStorage.getItem('pendingAuditEntries') || '[]'
            ) as AuditEntry[];

            if (pendingEntries.length === 0) {
                return 0;
            }

            // Envoyer les entrées par lots
            const batchSize = 20;
            let syncedCount = 0;

            for (let i = 0; i < pendingEntries.length; i += batchSize) {
                const batch = pendingEntries.slice(i, i + batchSize);

                try {
                    const response = await fetch('http://localhost:3000/api/audit/batch', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(batch)
                    });

                    if (response.ok) {
                        syncedCount += batch.length;
                    } else {
                        break; // Arrêter si une synchronisation échoue
                    }
                } catch (error) {
                    console.error('Erreur lors de la synchronisation du lot:', error);
                    break;
                }
            }

            // Mettre à jour la liste des entrées en attente
            if (syncedCount > 0) {
                const remainingEntries = pendingEntries.slice(syncedCount);
                localStorage.setItem('pendingAuditEntries', JSON.stringify(remainingEntries));

                if (this.isDebugMode) {
                    console.debug(`[AuditService] ${syncedCount} entrées synchronisées. ${remainingEntries.length} entrées restantes.`);
                }
            }

            return syncedCount;
        } catch (error) {
            console.error('Erreur lors de la synchronisation des entrées d\'audit:', error);
            return 0;
        }
    }
}

export const auditService = AuditService.getInstance();
export default auditService; 