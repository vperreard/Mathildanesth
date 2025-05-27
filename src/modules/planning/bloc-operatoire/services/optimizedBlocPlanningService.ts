import { prisma } from '@/lib/prisma';
import { PrismaCacheService } from '@/lib/prisma-cache-service';
import { logger } from '@/lib/logger';
import { 
    BlocDayPlanning, 
    BlocRoomAssignment, 
    BlocStaffAssignment,
    BlocPlanningConflict,
    DayOfWeek,
    WeekType,
    BlocPlanningStatus,
    LeaveStatus,
    ConflictSeverity,
    BlocStaffRole,
    Prisma
} from '@prisma/client';

jest.mock('@/lib/prisma');


interface CreateOrUpdatePlanningsParams {
    siteId: string;
    startDate: Date;
    endDate: Date;
    trameIds: number[];
    initiatorUserId: number;
}

/**
 * Service optimisé pour la gestion du planning du bloc opératoire
 * - Utilise le cache Redis pour les requêtes lourdes
 * - Évite les problèmes N+1 avec des requêtes optimisées
 * - Utilise des transactions pour les opérations atomiques
 */
export class OptimizedBlocPlanningService {
    
    /**
     * Récupère un planning avec toutes ses relations (optimisé avec cache)
     */
    async getBlocDayPlanningById(planningId: string) {
        // Vérifier le cache
        const cacheKey = `blocPlanning:${planningId}`;
        const cached = await PrismaCacheService.getCachedQueryResult(
            'BlocDayPlanning',
            'findUnique',
            { id: planningId }
        );
        
        if (cached) return cached;

        // Requête optimisée avec select spécifique pour éviter l'over-fetching
        const planning = await prisma.blocDayPlanning.findUnique({
            where: { id: planningId },
            select: {
                id: true,
                siteId: true,
                date: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                site: {
                    select: {
                        id: true,
                        name: true,
                        colorCode: true,
                        timezone: true
                    }
                },
                assignments: {
                    select: {
                        id: true,
                        period: true,
                        chirurgienId: true,
                        expectedSpecialty: true,
                        operatingRoom: {
                            select: {
                                id: true,
                                name: true,
                                number: true,
                                colorCode: true,
                                operatingSector: {
                                    select: {
                                        id: true,
                                        name: true,
                                        colorCode: true,
                                        category: true
                                    }
                                }
                            }
                        },
                        surgeon: {
                            select: {
                                id: true,
                                nom: true,
                                prenom: true,
                                email: true
                            }
                        },
                        staffAssignments: {
                            select: {
                                id: true,
                                role: true,
                                isPrimaryAnesthetist: true,
                                user: {
                                    select: {
                                        id: true,
                                        nom: true,
                                        prenom: true,
                                        email: true,
                                        professionalRole: true
                                    }
                                }
                            }
                        }
                    }
                },
                conflicts: {
                    select: {
                        id: true,
                        type: true,
                        message: true,
                        severity: true,
                        isResolved: true,
                        isForceResolved: true
                    }
                }
            }
        });

        // Mettre en cache
        if (planning) {
            await PrismaCacheService.cacheQueryResult(
                'BlocDayPlanning',
                'findUnique',
                { id: planningId },
                planning,
                300 // 5 minutes
            );
        }

        return planning;
    }

    /**
     * Récupère les plannings pour une période (avec cache)
     */
    async getBlocDayPlanningsBySiteAndDateRange(
        siteId: string, 
        startDate: Date, 
        endDate: Date
    ) {
        // Clé de cache basée sur les paramètres
        const cacheParams = { siteId, startDate: startDate.toISOString(), endDate: endDate.toISOString() };
        const cached = await PrismaCacheService.getCachedQueryResult(
            'BlocDayPlanning',
            'findMany',
            cacheParams
        );
        
        if (cached) return cached;

        // Requête optimisée
        const plannings = await prisma.blocDayPlanning.findMany({
            where: {
                siteId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            select: {
                id: true,
                date: true,
                status: true,
                _count: {
                    select: {
                        assignments: true,
                        conflicts: true
                    }
                }
            },
            orderBy: { date: 'asc' }
        });

        // Mettre en cache
        await PrismaCacheService.cacheQueryResult(
            'BlocDayPlanning',
            'findMany',
            cacheParams,
            plannings,
            300 // 5 minutes
        );

        return plannings;
    }

    /**
     * Crée ou met à jour les plannings avec transactions
     */
    async createOrUpdateBlocDayPlanningsFromTrames(
        params: CreateOrUpdatePlanningsParams
    ): Promise<BlocDayPlanning[]> {
        const { siteId, startDate, endDate, trameIds, initiatorUserId } = params;
        
        // Utiliser une transaction pour l'atomicité
        return await prisma.$transaction(async (tx) => {
            const generatedPlannings: BlocDayPlanning[] = [];

            // Requête optimisée pour récupérer toutes les données nécessaires en une fois
            const trames = await tx.blocTramePlanning.findMany({
                where: {
                    id: { in: trameIds },
                    isActive: true
                },
                select: {
                    id: true,
                    name: true,
                    affectations: {
                        select: {
                            id: true,
                            userId: true,
                            chirurgienId: true,
                            operatingRoomId: true,
                            jourSemaine: true,
                            typeSemaine: true,
                            periode: true,
                            typeAffectation: true,
                            roleInAffectation: true,
                            specialiteChir: true
                        }
                    }
                }
            });

            if (!trames.length) {
                logger.warn("Aucune trame active trouvée pour les IDs fournis");
                return [];
            }

            // Collecter tous les IDs pour une requête unique des absences
            const userIds = new Set<number>();
            const surgeonIds = new Set<number>();
            
            trames.forEach(trame => {
                trame.affectations.forEach(aff => {
                    if (aff.userId) userIds.add(aff.userId);
                    if (aff.chirurgienId) surgeonIds.add(aff.chirurgienId);
                });
            });

            // Une seule requête pour toutes les absences
            const absences = await tx.absence.findMany({
                where: {
                    OR: [
                        { userId: { in: Array.from(userIds) } },
                        { chirurgienId: { in: Array.from(surgeonIds) } }
                    ],
                    startDate: { lte: endDate },
                    endDate: { gte: startDate },
                    status: LeaveStatus.APPROVED
                },
                select: {
                    id: true,
                    userId: true,
                    chirurgienId: true,
                    startDate: true,
                    endDate: true
                }
            });

            // Créer un index des absences pour lookup rapide
            const absencesByUser = new Map<number, typeof absences>();
            const absencesBySurgeon = new Map<number, typeof absences>();
            
            absences.forEach(absence => {
                if (absence.userId) {
                    if (!absencesByUser.has(absence.userId)) {
                        absencesByUser.set(absence.userId, []);
                    }
                    absencesByUser.get(absence.userId)!.push(absence);
                }
                if (absence.chirurgienId) {
                    if (!absencesBySurgeon.has(absence.chirurgienId)) {
                        absencesBySurgeon.set(absence.chirurgienId, []);
                    }
                    absencesBySurgeon.get(absence.chirurgienId)!.push(absence);
                }
            });

            // Récupérer tous les plannings existants en une seule requête
            const existingPlannings = await tx.blocDayPlanning.findMany({
                where: {
                    siteId,
                    date: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                select: {
                    id: true,
                    date: true,
                    status: true
                }
            });

            // Créer un index des plannings existants
            const planningsByDate = new Map<string, typeof existingPlannings[0]>();
            existingPlannings.forEach(planning => {
                planningsByDate.set(planning.date.toISOString().split('T')[0], planning);
            });

            // Préparer les créations/mises à jour en batch
            const currentDate = new Date(startDate);
            const planningsToCreate: Prisma.BlocDayPlanningCreateManyInput[] = [];
            const assignmentsToCreate: Prisma.BlocRoomAssignmentCreateManyInput[] = [];
            const staffAssignmentsToCreate: Prisma.BlocStaffAssignmentCreateManyInput[] = [];

            while (currentDate <= endDate) {
                const dateStr = currentDate.toISOString().split('T')[0];
                const dayOfWeek = this.mapDateToDayOfWeek(currentDate);
                const weekType = this.getWeekType(currentDate);

                let existingPlanning = planningsByDate.get(dateStr);

                if (!existingPlanning) {
                    // Créer le planning
                    const newPlanningId = `${siteId}_${dateStr}`;
                    planningsToCreate.push({
                        id: newPlanningId,
                        siteId,
                        date: currentDate,
                        status: BlocPlanningStatus.DRAFT
                    });
                    
                    // Traiter les affectations pour ce nouveau planning
                    this.processTrameAffectations(
                        newPlanningId,
                        trames,
                        dayOfWeek,
                        weekType,
                        currentDate,
                        absencesByUser,
                        absencesBySurgeon,
                        assignmentsToCreate,
                        staffAssignmentsToCreate
                    );
                } else if (existingPlanning.status === BlocPlanningStatus.DRAFT) {
                    // Supprimer les anciennes données et recréer
                    await tx.blocPlanningConflict.deleteMany({ 
                        where: { blocDayPlanningId: existingPlanning.id } 
                    });
                    await tx.blocStaffAssignment.deleteMany({ 
                        where: { 
                            blocRoomAssignment: { 
                                blocDayPlanningId: existingPlanning.id 
                            } 
                        } 
                    });
                    await tx.blocRoomAssignment.deleteMany({ 
                        where: { blocDayPlanningId: existingPlanning.id } 
                    });

                    // Traiter les affectations
                    this.processTrameAffectations(
                        existingPlanning.id,
                        trames,
                        dayOfWeek,
                        weekType,
                        currentDate,
                        absencesByUser,
                        absencesBySurgeon,
                        assignmentsToCreate,
                        staffAssignmentsToCreate
                    );
                }

                currentDate.setDate(currentDate.getDate() + 1);
            }

            // Créer tous les nouveaux plannings en une fois
            if (planningsToCreate.length > 0) {
                await tx.blocDayPlanning.createMany({
                    data: planningsToCreate
                });
            }

            // Créer toutes les affectations en une fois
            if (assignmentsToCreate.length > 0) {
                await tx.blocRoomAssignment.createMany({
                    data: assignmentsToCreate
                });
            }

            // Créer tous les staff assignments en une fois
            if (staffAssignmentsToCreate.length > 0) {
                await tx.blocStaffAssignment.createMany({
                    data: staffAssignmentsToCreate
                });
            }

            // Invalider le cache pour ces plannings
            await PrismaCacheService.invalidateModelCache('BlocDayPlanning');

            // Récupérer les plannings finaux
            return await tx.blocDayPlanning.findMany({
                where: {
                    siteId,
                    date: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                include: {
                    assignments: {
                        include: {
                            staffAssignments: true
                        }
                    },
                    conflicts: true
                }
            });
        });
    }

    // Méthodes utilitaires privées
    private mapDateToDayOfWeek(date: Date): DayOfWeek {
        const day = date.getDay();
        const mapping: Record<number, DayOfWeek> = {
            0: DayOfWeek.SUNDAY,
            1: DayOfWeek.MONDAY,
            2: DayOfWeek.TUESDAY,
            3: DayOfWeek.WEDNESDAY,
            4: DayOfWeek.THURSDAY,
            5: DayOfWeek.FRIDAY,
            6: DayOfWeek.SATURDAY
        };
        return mapping[day];
    }

    private getWeekType(date: Date): WeekType {
        const weekNumber = Math.ceil((date.getDate() + 6 - date.getDay()) / 7);
        return weekNumber % 2 === 0 ? WeekType.EVEN : WeekType.ODD;
    }

    private processTrameAffectations(
        planningId: string,
        trames: any[],
        dayOfWeek: DayOfWeek,
        weekType: WeekType,
        currentDate: Date,
        absencesByUser: Map<number, any[]>,
        absencesBySurgeon: Map<number, any[]>,
        assignmentsToCreate: any[],
        staffAssignmentsToCreate: any[]
    ) {
        const roomPeriodAssignments = new Map<string, any>();

        trames.forEach(trame => {
            trame.affectations.forEach((aff: any) => {
                if (aff.jourSemaine !== dayOfWeek || 
                    (aff.typeSemaine !== WeekType.ALL && aff.typeSemaine !== weekType)) {
                    return;
                }

                // Vérifier les absences
                const userAbsences = aff.userId ? absencesByUser.get(aff.userId) || [] : [];
                const surgeonAbsences = aff.chirurgienId ? absencesBySurgeon.get(aff.chirurgienId) || [] : [];
                
                const isAbsent = userAbsences.some(abs => 
                    currentDate >= abs.startDate && currentDate <= abs.endDate
                ) || surgeonAbsences.some(abs => 
                    currentDate >= abs.startDate && currentDate <= abs.endDate
                );

                if (isAbsent) return;

                if (aff.typeAffectation === 'BLOC_OPERATION' && aff.operatingRoomId) {
                    const key = `${aff.operatingRoomId}_${aff.periode}`;
                    
                    if (!roomPeriodAssignments.has(key)) {
                        const assignmentId = `${planningId}_${key}`;
                        
                        assignmentsToCreate.push({
                            id: assignmentId,
                            blocDayPlanningId: planningId,
                            operatingRoomId: aff.operatingRoomId,
                            period: aff.periode,
                            chirurgienId: aff.chirurgienId,
                            expectedSpecialty: aff.specialiteChir,
                            sourceBlocTrameAffectationId: aff.id
                        });

                        roomPeriodAssignments.set(key, assignmentId);

                        if (aff.userId && aff.roleInAffectation) {
                            staffAssignmentsToCreate.push({
                                blocRoomAssignmentId: assignmentId,
                                userId: aff.userId,
                                role: aff.roleInAffectation,
                                isPrimaryAnesthetist: aff.roleInAffectation === 'ANESTHETISTE_PRINCIPAL_MAR'
                            });
                        }
                    }
                }
            });
        });
    }
}