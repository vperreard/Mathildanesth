import { prisma } from '@/lib/prisma';
import {
    LeaveRequest as Leave,
    LeaveFilters,
    PaginatedLeaveResults,
    LeaveType,
    LeaveStatus
} from '../types/leave';
import { LeaveQueryCacheService } from './LeaveQueryCacheService';
import { logger } from '@/lib/logger';
import { LeaveEvent } from '../types/cache';
import { formatDate, ISO_DATE_FORMAT } from '@/utils/dateUtils';

jest.mock('@/lib/prisma');


const prisma = prisma;
const cacheService = LeaveQueryCacheService.getInstance();

/**
 * Service amélioré pour les congés avec gestion du cache
 * Implémente les mêmes méthodes que le service original avec des optimisations
 */
export class EnhancedLeaveService {
    private static instance: EnhancedLeaveService;

    private constructor() { }

    /**
     * Obtenir l'instance unique du service
     */
    public static getInstance(): EnhancedLeaveService {
        if (!EnhancedLeaveService.instance) {
            EnhancedLeaveService.instance = new EnhancedLeaveService();
        }
        return EnhancedLeaveService.instance;
    }

    /**
     * Récupérer les demandes de congés avec filtres et pagination
     * Utilise le cache lorsque disponible
     */
    public async fetchLeaves(filters: LeaveFilters = {}): Promise<PaginatedLeaveResults> {
        const cacheKey = cacheService.generateListKey(filters);

        try {
            // Tenter de récupérer depuis le cache
            const cachedData = await cacheService.getCachedData<PaginatedLeaveResults>(cacheKey);
            if (cachedData) {
                logger.debug(`Données récupérées depuis le cache: ${cacheKey}`);
                return cachedData;
            }

            // Construction des paramètres de pagination
            const page = filters.page || 1;
            const limit = filters.limit || 50;
            const skip = (page - 1) * limit;

            // Construction des conditions de filtrage pour Prisma
            const where: any = {};

            if (filters.userId) {
                where.userId = filters.userId;
            }

            if (filters.departmentId) {
                where.departmentId = filters.departmentId;
            }

            if (filters.status) {
                if (Array.isArray(filters.status)) {
                    where.status = { in: filters.status };
                } else {
                    where.status = filters.status;
                }
            }

            if (filters.type) {
                if (Array.isArray(filters.type)) {
                    where.type = { in: filters.type };
                } else {
                    where.type = filters.type;
                }
            }

            if (filters.startDate) {
                where.startDate = { gte: filters.startDate };
            }

            if (filters.endDate) {
                where.endDate = { lte: filters.endDate };
            }

            if (filters.search) {
                where.OR = [
                    { userName: { contains: filters.search, mode: 'insensitive' } },
                    { reason: { contains: filters.search, mode: 'insensitive' } }
                ];
            }

            // Construction de l'ordre de tri
            const orderBy: any = {};
            if (filters.sortBy) {
                orderBy[filters.sortBy] = filters.sortOrder || 'desc';
            } else {
                orderBy.startDate = 'desc';
            }

            // Optimisation: sélectionner uniquement les champs nécessaires
            const select = {
                id: true,
                userId: true,
                userName: true,
                userEmail: true,
                departmentId: true,
                departmentName: true,
                startDate: true,
                endDate: true,
                halfDayStart: true,
                halfDayEnd: true,
                workingDaysCount: true,
                type: true,
                reason: true,
                status: true,
                requestDate: true,
                approverId: true,
                approverName: true,
                approvalDate: true,
                rejectionReason: true,
                cancellationReason: true,
                createdAt: true,
                updatedAt: true
            };

            // Exécution des requêtes en parallèle pour optimiser les performances
            const [total, items] = await Promise.all([
                prisma.leave.count({ where }),
                prisma.leave.findMany({
                    where,
                    select,
                    skip,
                    take: limit,
                    orderBy
                })
            ]);

            // Construction du résultat paginé
            const result: PaginatedLeaveResults = {
                items,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };

            // Mise en cache du résultat
            await cacheService.cacheData(cacheKey, result, 'LIST');

            return result;
        } catch (error) {
            logger.error(`Erreur lors de la récupération des congés`, { filters, error });
            throw error;
        }
    }

    /**
     * Récupérer un congé par son ID
     * Utilise le cache lorsque disponible
     */
    public async fetchLeaveById(leaveId: string): Promise<Leave | null> {
        const cacheKey = cacheService.generateDetailKey(leaveId);

        try {
            // Tenter de récupérer depuis le cache
            const cachedData = await cacheService.getCachedData<Leave>(cacheKey);
            if (cachedData) {
                logger.debug(`Détail du congé récupéré depuis le cache: ${leaveId}`);
                return cachedData;
            }

            // Récupérer depuis la base de données
            const leave = await prisma.leave.findUnique({
                where: { id: leaveId }
            });

            if (!leave) {
                return null;
            }

            // Mettre en cache le résultat
            await cacheService.cacheData(cacheKey, leave, 'DETAIL');

            return leave as unknown as Leave;
        } catch (error) {
            logger.error(`Erreur lors de la récupération du congé ${leaveId}`, { error });
            throw error;
        }
    }

    /**
     * Créer ou mettre à jour une demande de congés
     * Invalide le cache approprié
     */
    public async saveLeave(leave: Partial<Leave>): Promise<Leave> {
        try {
            let result;
            let eventType: LeaveEvent;

            if (leave.id) {
                // Mise à jour d'un congé existant
                const existingLeave = await prisma.leave.findUnique({
                    where: { id: leave.id }
                });

                if (!existingLeave) {
                    throw new Error(`Congé introuvable: ${leave.id}`);
                }

                // Convertir les dates pour Prisma
                const data = {
                    ...leave,
                    startDate: leave.startDate ? new Date(leave.startDate) : undefined,
                    endDate: leave.endDate ? new Date(leave.endDate) : undefined,
                    requestDate: leave.requestDate ? new Date(leave.requestDate) : undefined,
                    approvalDate: leave.approvalDate ? new Date(leave.approvalDate) : undefined,
                    updatedAt: new Date()
                };

                result = await prisma.leave.update({
                    where: { id: leave.id },
                    data
                });

                eventType = LeaveEvent.UPDATED;

                // Invalider le cache avec les données avant/après
                await cacheService.invalidateCache(eventType, {
                    before: existingLeave,
                    after: result
                });
            } else {
                // Création d'un nouveau congé
                const data = {
                    ...leave,
                    startDate: leave.startDate ? new Date(leave.startDate) : undefined,
                    endDate: leave.endDate ? new Date(leave.endDate) : undefined,
                    requestDate: leave.requestDate ? new Date(leave.requestDate) : undefined,
                    approvalDate: leave.approvalDate ? new Date(leave.approvalDate) : undefined,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                result = await prisma.leave.create({
                    data: data as any  // Cast to any pour éviter les erreurs de typage Prisma
                });

                eventType = LeaveEvent.CREATED;

                // Invalider le cache avec les nouvelles données
                await cacheService.invalidateCache(eventType, { leave: result });
            }

            return result as unknown as Leave;
        } catch (error) {
            logger.error(`Erreur lors de l'enregistrement du congé`, { leaveId: leave.id, error });
            throw error;
        }
    }

    /**
     * Changer le statut d'une demande de congés
     * Invalide le cache de manière sélective
     */
    public async updateLeaveStatus(
        leaveId: string,
        newStatus: LeaveStatus,
        comment?: string
    ): Promise<Leave> {
        try {
            // Récupérer le congé actuel
            const currentLeave = await prisma.leave.findUnique({
                where: { id: leaveId }
            });

            if (!currentLeave) {
                throw new Error(`Congé introuvable: ${leaveId}`);
            }

            const oldStatus = currentLeave.status as LeaveStatus;

            // Mettre à jour le statut
            const updatedLeave = await prisma.leave.update({
                where: { id: leaveId },
                data: {
                    status: newStatus,
                    ...(newStatus === LeaveStatus.APPROUVE ? { approvalDate: new Date() } : {}),
                    ...(newStatus === LeaveStatus.REJETE ? { rejectionReason: comment } : {}),
                    ...(newStatus === LeaveStatus.ANNULE ? { cancellationReason: comment } : {}),
                    updatedAt: new Date()
                }
            });

            // Invalider le cache pour ce changement de statut
            await cacheService.invalidateCache(LeaveEvent.STATUS_CHANGED, {
                leave: updatedLeave,
                oldStatus,
                newStatus
            });

            return updatedLeave as unknown as Leave;
        } catch (error) {
            logger.error(`Erreur lors de la mise à jour du statut du congé`, { leaveId, newStatus, error });
            throw error;
        }
    }

    /**
     * Supprimer une demande de congés
     * Invalide le cache approprié
     */
    public async deleteLeave(leaveId: string): Promise<boolean> {
        try {
            // Récupérer le congé avant suppression
            const leave = await prisma.leave.findUnique({
                where: { id: leaveId }
            });

            if (!leave) {
                return false;
            }

            // Supprimer le congé
            await prisma.leave.delete({
                where: { id: leaveId }
            });

            // Invalider le cache
            await cacheService.invalidateCache(LeaveEvent.DELETED, { leave });

            return true;
        } catch (error) {
            logger.error(`Erreur lors de la suppression du congé`, { leaveId, error });
            throw error;
        }
    }

    /**
     * Récupérer les congés d'un utilisateur spécifique
     * Utilise une stratégie de cache dédiée aux congés utilisateur
     */
    public async fetchUserLeaves(userId: string, year?: number): Promise<Leave[]> {
        const cacheKey = cacheService.generateUserLeavesKey(userId, year);

        try {
            // Tenter de récupérer depuis le cache
            const cachedData = await cacheService.getCachedData<Leave[]>(cacheKey);
            if (cachedData) {
                logger.debug(`Congés utilisateur récupérés depuis le cache: ${userId}`);
                return cachedData;
            }

            // Construire la requête
            const where: any = { userId };

            // Filtrer par année si spécifiée
            if (year) {
                const startOfYear = new Date(year, 0, 1);
                const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

                where.OR = [
                    { startDate: { gte: startOfYear, lte: endOfYear } },
                    { endDate: { gte: startOfYear, lte: endOfYear } },
                    {
                        AND: [
                            { startDate: { lte: startOfYear } },
                            { endDate: { gte: endOfYear } }
                        ]
                    }
                ];
            }

            // Récupérer les congés
            const leaves = await prisma.leave.findMany({
                where,
                orderBy: { startDate: 'desc' }
            });

            // Mettre en cache le résultat
            await cacheService.cacheData(cacheKey, leaves, 'USER_LEAVES');

            return leaves as unknown as Leave[];
        } catch (error) {
            logger.error(`Erreur lors de la récupération des congés utilisateur`, { userId, year, error });
            throw error;
        }
    }

    /**
     * Vérifier les congés pour conflits durant une période
     * Utilise un TTL court pour les données critiques
     */
    public async checkLeaveConflicts(
        startDate: Date,
        endDate: Date,
        userId: string,
        excludeLeaveId?: string
    ): Promise<Leave[]> {
        const formattedStart = formatDate(startDate, ISO_DATE_FORMAT);
        const formattedEnd = formatDate(endDate, ISO_DATE_FORMAT);
        const cacheKey = `leaves:conflicts:${userId}:${formattedStart}:${formattedEnd}${excludeLeaveId ? `:${excludeLeaveId}` : ''}`;

        try {
            // Tenter de récupérer depuis le cache
            const cachedData = await cacheService.getCachedData<Leave[]>(cacheKey);
            if (cachedData) {
                logger.debug(`Conflits récupérés depuis le cache`);
                return cachedData;
            }

            // Construire la requête pour trouver les congés qui chevauchent la période
            const where: any = {
                userId,
                OR: [
                    { startDate: { lte: endDate }, endDate: { gte: startDate } }
                ],
                status: { in: [LeaveStatus.EN_ATTENTE, LeaveStatus.APPROUVE] }
            };

            // Exclure le congé en cours d'édition si spécifié
            if (excludeLeaveId) {
                where.id = { not: excludeLeaveId };
            }

            // Récupérer les congés en conflit
            const conflicts = await prisma.leave.findMany({ where });

            // Mettre en cache le résultat
            await cacheService.cacheData(cacheKey, conflicts, 'CONFLICTS');

            return conflicts as unknown as Leave[];
        } catch (error) {
            logger.error(`Erreur lors de la vérification des conflits`, { startDate, endDate, userId, error });
            throw error;
        }
    }
}

// Exporter l'instance unique du service
export const enhancedLeaveService = EnhancedLeaveService.getInstance(); 