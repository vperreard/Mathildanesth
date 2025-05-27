import { prisma } from '@/lib/prisma';
import { BlocPlanningStatus } from '@/modules/planning/bloc-operatoire/models/BlocModels';
import { getSession } from 'next-auth/react';
import { notifyUsers } from '@/modules/notifications/services/notificationService';

jest.mock('@/lib/prisma');


export interface AuditLogEntry {
    id: string;
    timestamp: Date;
    userId: string;
    userName: string;
    action: 'create' | 'update' | 'delete' | 'statusChange' | 'comment';
    targetType: 'assignment' | 'planning' | 'supervisor' | 'annotation';
    targetId: string;
    planningId: string;
    details: any;
}

export interface AuditTrailOptions {
    notifyAdmins?: boolean;
    notifyManagers?: boolean;
    notifySupervisors?: boolean;
    notifyAffectedUsers?: boolean;
    affectedUserIds?: string[];
    message?: string;
}

/**
 * Service pour enregistrer et consulter les logs d'audit pour les plannings du bloc opératoire
 */
export class PlanningAuditService {
    /**
     * Enregistre une action dans les logs d'audit et envoie des notifications si configuré
     */
    static async logAction(
        action: 'create' | 'update' | 'delete' | 'statusChange' | 'comment',
        targetType: 'assignment' | 'planning' | 'supervisor' | 'annotation',
        targetId: string,
        planningId: string,
        details: any,
        options: AuditTrailOptions = {}
    ): Promise<AuditLogEntry> {
        try {
            // Récupérer les informations de l'utilisateur actuel
            const session = await getSession();
            const userId = session?.user?.id || 'system';
            const userName = session?.user?.name || 'Système';

            // Créer l'entrée d'audit
            const auditEntry = await prisma.auditLog.create({
                data: {
                    userId,
                    userName,
                    action,
                    targetType,
                    targetId,
                    planningId,
                    details: JSON.stringify(details),
                },
            });

            // Gérer les notifications
            if (options.notifyAdmins || options.notifyManagers || options.notifySupervisors || options.notifyAffectedUsers) {
                await this.sendAuditNotifications(action, targetType, planningId, details, options);
            }

            return {
                ...auditEntry,
                details: JSON.parse(auditEntry.details),
            };
        } catch (error) {
            console.error('Erreur lors de la création du log d\'audit:', error);
            throw error;
        }
    }

    /**
     * Récupère l'historique des actions sur un planning
     */
    static async getAuditTrail(
        planningId: string,
        filters: {
            limit?: number;
            offset?: number;
            actionTypes?: string[];
            userId?: string;
            startDate?: Date;
            endDate?: Date;
        } = {}
    ): Promise<{ items: AuditLogEntry[]; total: number }> {
        try {
            const { limit = 10, offset = 0, actionTypes, userId, startDate, endDate } = filters;

            // Construire les conditions de filtrage
            const where: any = { planningId };

            if (actionTypes && actionTypes.length > 0) {
                where.action = { in: actionTypes };
            }

            if (userId) {
                where.userId = userId;
            }

            if (startDate || endDate) {
                where.timestamp = {};
                if (startDate) {
                    where.timestamp.gte = startDate;
                }
                if (endDate) {
                    where.timestamp.lte = endDate;
                }
            }

            // Compter le nombre total d'entrées
            const total = await prisma.auditLog.count({ where });

            // Récupérer les entrées paginées
            const items = await prisma.auditLog.findMany({
                where,
                orderBy: { timestamp: 'desc' },
                skip: offset,
                take: limit,
            });

            // Transformer les résultats pour parser les détails JSON
            const transformedItems = items.map(item => ({
                ...item,
                details: JSON.parse(item.details),
            }));

            return { items: transformedItems, total };
        } catch (error) {
            console.error('Erreur lors de la récupération des logs d\'audit:', error);
            throw error;
        }
    }

    /**
     * Envoie des notifications basées sur les actions d'audit
     */
    private static async sendAuditNotifications(
        action: string,
        targetType: string,
        planningId: string,
        details: any,
        options: AuditTrailOptions
    ): Promise<void> {
        try {
            // Récupérer les informations du planning pour inclure dans la notification
            const planning = await prisma.blocPlanning.findUnique({
                where: { id: planningId },
                select: { date: true, period: true, status: true },
            });

            if (!planning) return;

            // Déterminer le message de notification
            const message = options.message || this.generateDefaultMessage(action, targetType, planning);

            // Récupérer les IDs des utilisateurs à notifier
            const recipientIds: string[] = [];

            // Ajouter les utilisateurs affectés spécifiquement
            if (options.affectedUserIds && options.affectedUserIds.length > 0) {
                recipientIds.push(...options.affectedUserIds);
            }

            // Ajouter les administrateurs si demandé
            if (options.notifyAdmins) {
                const admins = await prisma.user.findMany({
                    where: { role: { in: ['ADMIN_TOTAL', 'ADMIN_PARTIEL'] } },
                    select: { id: true },
                });
                recipientIds.push(...admins.map(admin => admin.id));
            }

            // Ajouter les managers si demandé
            if (options.notifyManagers) {
                const managers = await prisma.user.findMany({
                    where: { role: 'MANAGER' },
                    select: { id: true },
                });
                recipientIds.push(...managers.map(manager => manager.id));
            }

            // Ajouter les superviseurs du bloc si demandé
            if (options.notifySupervisors) {
                const supervisors = await prisma.blocSupervisor.findMany({
                    where: { planningId },
                    select: { userId: true },
                });
                recipientIds.push(...supervisors.map(supervisor => supervisor.userId));
            }

            // S'il y a des destinataires, envoyer la notification
            if (recipientIds.length > 0) {
                // Déduplicater les IDs
                const uniqueRecipientIds = [...new Set(recipientIds)];

                // Créer les notifications
                await notifyUsers({
                    userIds: uniqueRecipientIds,
                    title: 'Modification de planning',
                    message,
                    type: 'planning',
                    linkUrl: `/bloc-operatoire/planning?date=${planning.date.toISOString().split('T')[0]}&period=${planning.period}`,
                    metadata: {
                        planningId,
                        action,
                        targetType,
                    }
                });
            }
        } catch (error) {
            console.error('Erreur lors de l\'envoi des notifications d\'audit:', error);
            // Ne pas faire échouer la fonction principale si les notifications échouent
        }
    }

    /**
     * Génère un message par défaut pour les notifications
     */
    private static generateDefaultMessage(action: string, targetType: string, planning: any): string {
        const date = new Date(planning.date).toLocaleDateString('fr-FR');
        const period = planning.period === 'MORNING' ? 'matin' : planning.period === 'AFTERNOON' ? 'après-midi' : planning.period;

        switch (action) {
            case 'create':
                return `Nouvelle ${targetType === 'assignment' ? 'affectation' : targetType === 'planning' ? 'planification' : targetType === 'supervisor' ? 'supervision' : 'annotation'} créée pour le planning du ${date} (${period}).`;

            case 'update':
                return `Modification d'${targetType === 'assignment' ? 'une affectation' : targetType === 'planning' ? 'un planning' : targetType === 'supervisor' ? 'une supervision' : 'une annotation'} pour le ${date} (${period}).`;

            case 'delete':
                return `Suppression d'${targetType === 'assignment' ? 'une affectation' : targetType === 'planning' ? 'un planning' : targetType === 'supervisor' ? 'une supervision' : 'une annotation'} pour le ${date} (${period}).`;

            case 'statusChange':
                const statusLabel = planning.status === BlocPlanningStatus.APPROVED
                    ? 'approuvé'
                    : planning.status === BlocPlanningStatus.REJECTED
                        ? 'rejeté'
                        : 'modifié';
                return `Le planning du ${date} (${period}) a été ${statusLabel}.`;

            case 'comment':
                return `Nouveau commentaire sur le planning du ${date} (${period}).`;

            default:
                return `Modification du planning du ${date} (${period}).`;
        }
    }
} 