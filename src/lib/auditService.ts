import { prisma } from './prisma';

export interface AuditLogParams {
    action: string;
    entityId: string | number;
    entityType: string;
    userId?: number;
    details?: Record<string, any>;
}

/**
 * Service d'audit pour enregistrer les actions importantes dans le système
 */
class AuditService {
    private static instance: AuditService;

    private constructor() { }

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
     * Enregistre une action dans le journal d'audit
     */
    public async logAction(params: AuditLogParams): Promise<void> {
        try {
            const { action, entityId, entityType, userId, details } = params;

            // Enregistrer l'action dans la base de données
            await prisma.auditLog.create({
                data: {
                    action,
                    entityId: entityId.toString(),
                    entityType,
                    userId,
                    details: details ? JSON.stringify(details) : null,
                    timestamp: new Date()
                }
            });

            console.log(`Audit: ${action} sur ${entityType} ${entityId}`, details);
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement de l\'audit:', error);
            // Ne pas lever d'exception pour éviter de bloquer le flux principal
        }
    }

    /**
     * Récupère les dernières actions d'audit
     */
    public async getLatestActions(limit = 100): Promise<any[]> {
        try {
            return await prisma.auditLog.findMany({
                orderBy: {
                    timestamp: 'desc'
                },
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            nom: true,
                            prenom: true
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des audits:', error);
            return [];
        }
    }

    /**
     * Récupère les actions d'audit pour une entité spécifique
     */
    public async getActionsForEntity(
        entityType: string,
        entityId: string | number,
        limit = 50
    ): Promise<any[]> {
        try {
            return await prisma.auditLog.findMany({
                where: {
                    entityType,
                    entityId: entityId.toString()
                },
                orderBy: {
                    timestamp: 'desc'
                },
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            nom: true,
                            prenom: true
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des audits d\'entité:', error);
            return [];
        }
    }
}

export const auditService = AuditService.getInstance();

// Actions d'audit standardisées
export enum AuditAction {
    // Actions générales
    USER_LOGIN = 'USER_LOGIN',
    USER_LOGOUT = 'USER_LOGOUT',
    USER_CREATED = 'USER_CREATED',
    USER_UPDATED = 'USER_UPDATED',
    USER_DELETED = 'USER_DELETED',

    // Actions liées aux congés
    LEAVE_REQUESTED = 'LEAVE_REQUESTED',
    LEAVE_APPROVED = 'LEAVE_APPROVED',
    LEAVE_REJECTED = 'LEAVE_REJECTED',
    LEAVE_CANCELLED = 'LEAVE_CANCELLED',
    LEAVE_MODIFIED = 'LEAVE_MODIFIED',

    // Actions liées aux quotas
    QUOTA_UPDATED = 'QUOTA_UPDATED',
    QUOTA_TRANSFER = 'QUOTA_TRANSFER',
    QUOTA_CARRY_OVER = 'QUOTA_CARRY_OVER',

    // Actions liées aux plannings
    PLANNING_CREATED = 'PLANNING_CREATED',
    PLANNING_UPDATED = 'PLANNING_UPDATED',
    PLANNING_DELETED = 'PLANNING_DELETED',

    // Actions administratives
    SETTINGS_UPDATED = 'SETTINGS_UPDATED',
    PERMISSION_CHANGED = 'PERMISSION_CHANGED',
    DATA_EXPORTED = 'DATA_EXPORTED',
    DATA_IMPORTED = 'DATA_IMPORTED'
}

export default auditService; 