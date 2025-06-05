import { PrismaClient, OperatingRoom, OperatingSector, BlocRoomAssignment, Period, Site, Prisma, Leave, SchoolHolidayPeriod, PublicHoliday, LeaveType, ActivityCategory, ProfessionalRole, LeaveStatus } from '@prisma/client';

import { logger } from "../../../lib/logger";
import { prisma } from "@/lib/prisma";

// Définition des types pour les rapports
interface UtilizationDataBase {
    totalPlannedHours: number;
    numberOfProcedures: number;
    numberOfRooms: number;
    totalAvailableHours: number;
    occupancyRate: number;
    averageProcedureDurationMinutes: number;
}
export interface SectorCategoryUtilization extends UtilizationDataBase { category: string; }
export interface RoomTypeUtilization extends UtilizationDataBase { type: string; }

export interface RoomUtilizationReport {
    bySectorCategory: SectorCategoryUtilization[];
    byRoomType: RoomTypeUtilization[];
    summary: { startDate: string; endDate: string; siteId: string; };
}

export interface DutyDistributionStat {
    activityTypeCodeOrName: string; // From Attribution.type, assumed to match an ActivityType code/name
    // activityTypeName: string; // Potentially resolved if a direct match to ActivityType.name is found
    // activityTypeCategory: ActivityCategory; // Potentially resolved
    totalAssignments: number;
    distinctUsersCount: number;
    averageAssignmentsPerUser: number;
}

export interface UserDutyDistribution {
    userId: number;
    userName: string;
    totalDuties: number;
    distribution: Array<{
        activityTypeCodeOrName: string;
        count: number;
    }>;
}

export interface GuardDutyStatsResponse {
    byActivityType: DutyDistributionStat[];
    byUser: UserDutyDistribution[];
    summary: {
        startDate: string;
        endDate: string;
        siteId?: string;
        roles?: ProfessionalRole[];
        targetAssignmentTypes: string[]; // List of Attribution.type values considered as GARDE/ASTREINTE
        totalAssignments: number;
        totalUsersWithAssignments: number;
    };
}

export interface LeaveTrendPoint {
    date: string; // YYYY-MM-DD, YYYY-WW, or YYYY-MM depending on aggregation
    leaveCount: number; // Number of leave *days* overlapping this date/period, or leave *requests* starting
    // For simplicity, let's start with counting leave requests starting on the date for daily/monthly, or within the week for weekly.
}

export interface SpecialPeriod {
    type: 'SCHOOL_HOLIDAY' | 'PUBLIC_HOLIDAY';
    name: string;
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
}

export type LeavePeakAggregationUnit = 'DAY' | 'WEEK' | 'MONTH';

export interface LeavePeakAnalysisParams {
    startDate: Date;
    endDate: Date;
    aggregationUnit: LeavePeakAggregationUnit;
    leaveTypes?: LeaveType[];
    siteId?: string; // Si les congés sont liés à des sites ou si les vacances scolaires/fériés sont par site
}

export interface LeavePeakAnalysisResponse {
    leaveTrends: LeaveTrendPoint[];
    specialPeriods: SpecialPeriod[];
    summary: {
        startDate: string;
        endDate: string;
        aggregationUnit: LeavePeakAggregationUnit;
        leaveTypes?: LeaveType[];
        siteId?: string;
    };
}

// Le type ExtendedOperatingRoom n'est plus nécessaire si Prisma Client est à jour.
// const DEFAULT_STANDARD_OPERATIONAL_HOURS_PER_DAY = 10; // Déplacé à l'intérieur de la classe ou en config

export class AnalyticsService {
    // TODO: Cette valeur devrait provenir d'une configuration globale de l'application ou par site.
    private DEFAULT_STANDARD_OPERATIONAL_HOURS_PER_DAY = 10;

    constructor() { }

    private getPeriodDurationInHours(period: Period): number {
        // ACTION UTILISATEUR REQUISE: 
        // 1. Vérifier les membres exacts de l'enum `Period` dans votre `schema.prisma`.
        // 2. Mettre à jour les cas ci-dessous pour refléter ces membres et leurs durées réelles.
        switch (period) {
            case Period.MATIN: return 5;
            case Period.APRES_MIDI: return 5;
            // Si Period.JOURNEE_ENTIERE n'existe pas, adaptez avec la bonne valeur de votre enum Prisma
            case Period.JOURNEE_ENTIERE: return this.DEFAULT_STANDARD_OPERATIONAL_HOURS_PER_DAY;
            default:
                logger.warn(`Période non reconnue ou non configurée dans getPeriodDurationInHours: ${period}. Valeur par défaut 0h.`);
                return 0;
        }
    }

    public async getRoomUtilizationStats(
        siteId: string,
        startDate: Date,
        endDate: Date
    ): Promise<RoomUtilizationReport> {
        const roomAssignments = await prisma.blocRoomAssignment.findMany({
            where: { blocDayPlanning: { siteId, date: { gte: startDate, lte: endDate } } },
            include: {
                operatingRoom: {
                    include: {
                        operatingSector: true, // Correction: operatingSector au lieu de sector
                    },
                },
            },
        });

        const statsBySectorCategory: Record<string, SectorCategoryUtilization> = {};
        const statsByRoomType: Record<string, RoomTypeUtilization> = {};

        // Prisma Client est supposé à jour: OperatingRoom inclut `type`, OperatingSector inclut `category`.
        const allActiveRoomsInSite = await prisma.operatingRoom.findMany({
            where: { isActive: true, siteId: siteId, operatingSector: { isActive: true } }, // Assure que operatingSector est non-nul et lié au site implicitement par la salle
            include: { operatingSector: true }, // Correction: operatingSector
        });

        allActiveRoomsInSite.forEach(room => {
            // room.sector est non-nul ici grâce au filtre `sector: { siteId, isActive: true }`
            // et room.type, room.sector.category devraient exister grâce à `prisma generate`.
            if (room.operatingSector?.category) {
                const category = room.operatingSector.category;
                if (!statsBySectorCategory[category]) {
                    statsBySectorCategory[category] = {
                        category,
                        totalPlannedHours: 0,
                        numberOfProcedures: 0,
                        // Correction pour compter les salles par catégorie de secteur
                        numberOfRooms: allActiveRoomsInSite.filter(r => r.operatingSector?.category === category).length,
                        totalAvailableHours: 0,
                        occupancyRate: 0,
                        averageProcedureDurationMinutes: 0,
                    } as SectorCategoryUtilization;
                }
            }
            if (room.roomType) { // Correction: roomType au lieu de type
                const type = room.roomType;
                if (!statsByRoomType[type]) {
                    statsByRoomType[type] = {
                        type,
                        totalPlannedHours: 0,
                        numberOfProcedures: 0,
                        numberOfRooms: allActiveRoomsInSite.filter(r => r.roomType === type).length, // Correction: roomType
                        totalAvailableHours: 0,
                        occupancyRate: 0,
                        averageProcedureDurationMinutes: 0,
                    } as RoomTypeUtilization;
                }
            }
        });

        for (const attribution of roomAssignments) {
            // operatingRoom est non-nul sur BlocRoomAssignment, et sector est inclus.
            // type sur room et category sur room.sector devraient être disponibles.
            if (!attribution.operatingRoom) continue; // Sécurité, même si le schéma dit non-nul

            const room = attribution.operatingRoom;
            const sectorCategory = room.operatingSector?.category;
            const roomType = room.roomType; // Correction: roomType

            const plannedHours = this.getPeriodDurationInHours(attribution.period);

            if (sectorCategory && statsBySectorCategory[sectorCategory]) {
                statsBySectorCategory[sectorCategory].totalPlannedHours += plannedHours;
                statsBySectorCategory[sectorCategory].numberOfProcedures += 1;
            }
            if (roomType && statsByRoomType[roomType]) {
                statsByRoomType[roomType].totalPlannedHours += plannedHours;
                statsByRoomType[roomType].numberOfProcedures += 1;
            }
        }

        const daysInPeriod = Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24) + 1);
        const operationalHoursPerDay = this.DEFAULT_STANDARD_OPERATIONAL_HOURS_PER_DAY;

        Object.values(statsBySectorCategory).forEach(data => {
            data.totalAvailableHours = data.numberOfRooms * daysInPeriod * operationalHoursPerDay;
            data.occupancyRate = data.totalAvailableHours > 0 ? (data.totalPlannedHours / data.totalAvailableHours) : 0;
            data.averageProcedureDurationMinutes = data.numberOfProcedures > 0 ? (data.totalPlannedHours * 60) / data.numberOfProcedures : 0;
        });
        Object.values(statsByRoomType).forEach(data => {
            data.totalAvailableHours = data.numberOfRooms * daysInPeriod * operationalHoursPerDay;
            data.occupancyRate = data.totalAvailableHours > 0 ? (data.totalPlannedHours / data.totalAvailableHours) : 0;
            data.averageProcedureDurationMinutes = data.numberOfProcedures > 0 ? (data.totalPlannedHours * 60) / data.numberOfProcedures : 0;
        });

        return {
            bySectorCategory: Object.values(statsBySectorCategory),
            byRoomType: Object.values(statsByRoomType),
            summary: { startDate: startDate.toISOString().split('T')[0], endDate: endDate.toISOString().split('T')[0], siteId },
        };
    }

    public async getGuardDutyDistributionStats(
        startDate: Date,
        endDate: Date,
        siteId?: string,
        roles?: ProfessionalRole[],
        // Optional: explicit list of Attribution.type values if known by caller
        targetAssignmentTypesInput?: string[]
    ): Promise<GuardDutyStatsResponse> {

        let assignmentTypesToQuery: string[] = [];

        if (targetAssignmentTypesInput && targetAssignmentTypesInput.length > 0) {
            assignmentTypesToQuery = targetAssignmentTypesInput;
        } else {
            // Fallback: Query ActivityType table for codes/names in GARDE/ASTREINTE categories
            const relevantActivityTypes = await prisma.activityType.findMany({
                where: {
                    category: { in: [ActivityCategory.GARDE, ActivityCategory.ASTREINTE] },
                    // siteId: siteId // Add if ActivityType is site-specific and filter is needed here
                },
                select: { name: true, code: true }, // Assuming Attribution.type might match either name or code
            });
            // We need to decide if Attribution.type matches ActivityType.code or ActivityType.name
            // For this example, let's assume it can match EITHER (more flexible, but might need refinement)
            assignmentTypesToQuery = relevantActivityTypes.flatMap(at => [at.name, at.code].filter(Boolean) as string[]);
            if (assignmentTypesToQuery.length === 0) {
                // No relevant activity types found, so no attributions will match unless explicit types were given
                logger.warn("No ActivityTypes found for GARDE/ASTREINTE categories. getGuardDutyDistributionStats might return empty if no explicit targetAssignmentTypesInput are provided.");
            }
        }

        if (assignmentTypesToQuery.length === 0) { // Still empty, means no types to query
            return {
                byActivityType: [],
                byUser: [],
                summary: {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    siteId,
                    roles,
                    targetAssignmentTypes: [],
                    totalAssignments: 0,
                    totalUsersWithAssignments: 0,
                },
            };
        }

        const whereClause: Prisma.AssignmentWhereInput = {
            date: { gte: startDate, lte: endDate },
            type: { in: assignmentTypesToQuery }, // Filter by Attribution.type using the list derived from ActivityTypes
            user: roles && roles.length > 0 ? { professionalRole: { in: roles } } : undefined,
            siteId: siteId || undefined,
        };

        const attributions = await prisma.attribution.findMany({
            where: whereClause,
            include: {
                user: {
                    select: { id: true, nom: true, prenom: true, professionalRole: true },
                },
                // No direct include for ActivityType as it's not a direct relation on Attribution
            },
        });

        if (!attributions || attributions.length === 0) {
            return {
                byActivityType: [],
                byUser: [],
                summary: {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    siteId,
                    roles,
                    targetAssignmentTypes: assignmentTypesToQuery,
                    totalAssignments: 0,
                    totalUsersWithAssignments: 0,
                },
            };
        }

        // Using Attribution.type as the key for activity type stats
        const statsByAssignmentType: Record<string, Omit<DutyDistributionStat, 'averageAssignmentsPerUser'> & { userIds: Set<number> }> = {};
        const statsByUser: Record<number, UserDutyDistribution> = {}; // Adjusted type for simpler init

        let totalAssignments = 0;
        const allUserIdsWithAssignments = new Set<number>();

        for (const attribution of attributions) {
            if (!attribution.user || !attribution.type) continue; // Ensure user and type are present
            totalAssignments++;
            allUserIdsWithAssignments.add(attribution.userId!);
            const assignmentTypeKey = attribution.type;

            // Stats par type d'garde/vacation (Attribution.type)
            if (!statsByAssignmentType[assignmentTypeKey]) {
                statsByAssignmentType[assignmentTypeKey] = {
                    activityTypeCodeOrName: assignmentTypeKey,
                    totalAssignments: 0,
                    distinctUsersCount: 0,
                    userIds: new Set<number>(),
                };
            }
            statsByAssignmentType[assignmentTypeKey].totalAssignments++;
            statsByAssignmentType[assignmentTypeKey].userIds.add(attribution.userId!);

            // Stats par utilisateur
            if (!statsByUser[attribution.userId!]) {
                statsByUser[attribution.userId!] = {
                    userId: attribution.userId!,
                    userName: `${attribution.user.prenom} ${attribution.user.nom}`,
                    totalDuties: 0,
                    distribution: [],
                };
            }
            statsByUser[attribution.userId!].totalDuties++;
            let userDistEntry = statsByUser[attribution.userId!].distribution.find(d => d.activityTypeCodeOrName === assignmentTypeKey);
            if (!userDistEntry) {
                userDistEntry = { activityTypeCodeOrName: assignmentTypeKey, count: 0 };
                statsByUser[attribution.userId!].distribution.push(userDistEntry);
            }
            userDistEntry.count++;
        }

        const finalByActivityType = Object.values(statsByAssignmentType).map(stat => ({
            ...stat,
            distinctUsersCount: stat.userIds.size,
            averageAssignmentsPerUser: stat.userIds.size > 0 ? stat.totalAssignments / stat.userIds.size : 0,
            userIds: undefined,
        }));

        const finalByUser = Object.values(statsByUser).map(userStat => ({
            ...userStat,
            distribution: userStat.distribution.sort((a, b) => b.count - a.count),
        })).sort((a, b) => b.totalDuties - a.totalDuties);

        return {
            byActivityType: finalByActivityType.sort((a, b) => b.totalAssignments - a.totalAssignments),
            byUser: finalByUser,
            summary: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                siteId,
                roles,
                targetAssignmentTypes: assignmentTypesToQuery,
                totalAssignments,
                totalUsersWithAssignments: allUserIdsWithAssignments.size,
            },
        };
    }

    public async getLeavePeakAnalysis(
        params: LeavePeakAnalysisParams
    ): Promise<LeavePeakAnalysisResponse> {
        const { startDate, endDate, aggregationUnit, leaveTypes, siteId } = params;

        // 1. Fetch Leaves
        const leaveWhereClause: Prisma.LeaveWhereInput = {
            // On compte les congés qui *commencent* dans la période pour les tendances de demande
            // ou ceux qui sont *actifs* dans la période pour une vue de charge.
            // Pour "pics de demandes", on s'intéresse aux dates de début.
            startDate: { gte: startDate, lte: endDate },
            // endDate: { gte: startDate }, // Pourrait aussi être pertinent de voir les congés en cours
            status: { notIn: [LeaveStatus.REJECTED, LeaveStatus.CANCELLED] }, // On ne compte que les congés valides/en attente
            type: leaveTypes && leaveTypes.length > 0 ? { in: leaveTypes } : undefined,
            // TODO: Ajouter filtre par siteId si pertinent et si le modèle Leave a une relation avec Site
            // user: siteId ? { sites: { some: { id: siteId } } } : undefined, // Exemple si User a une relation many-to-many avec Site
        };

        const leaves = await prisma.leave.findMany({
            where: leaveWhereClause,
            select: {
                startDate: true,
                // countedDays: true, // Si on veut sommer les jours de congé plutôt que les demandes
            },
            orderBy: {
                startDate: 'asc',
            },
        });

        // 2. Aggregate Leaves based on aggregationUnit
        const trendPointsMap: Map<string, number> = new Map();

        for (const leave of leaves) {
            let key = '';
            const leaveStartDate = new Date(leave.startDate);
            if (aggregationUnit === 'DAY') {
                key = `${leaveStartDate.getFullYear()}-${String(leaveStartDate.getMonth() + 1).padStart(2, '0')}-${String(leaveStartDate.getDate()).padStart(2, '0')}`;
            } else if (aggregationUnit === 'MONTH') {
                key = `${leaveStartDate.getFullYear()}-${String(leaveStartDate.getMonth() + 1).padStart(2, '0')}`;
            } else { // WEEK
                // Calculate ISO week date (YYYY-WW)
                const tempDate = new Date(leaveStartDate.valueOf());
                tempDate.setDate(tempDate.getDate() + 3 - (tempDate.getDay() + 6) % 7); // Adjust to Thursday of the week
                const week1 = new Date(tempDate.getFullYear(), 0, 4);
                const weekNumber = 1 + Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
                key = `${tempDate.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
            }
            trendPointsMap.set(key, (trendPointsMap.get(key) || 0) + 1); // ou + leave.countedDays si on somme les jours
        }

        const leaveTrends: LeaveTrendPoint[] = Array.from(trendPointsMap.entries()).map(([date, count]) => ({
            date,
            leaveCount: count,
        })).sort((a, b) => a.date.localeCompare(b.date));

        // 3. Fetch SchoolHolidayPeriods
        const schoolHolidays = await prisma.schoolHolidayPeriod.findMany({
            where: {
                // Chevauchement avec la période demandée
                OR: [
                    { startDate: { lte: endDate }, endDate: { gte: startDate } },
                ],
                // TODO: Ajouter filtre par siteId/région si SchoolHolidayPeriod a cette information et si siteId est fourni
            },
        });

        // 4. Fetch PublicHolidays
        const publicHolidays = await prisma.publicHoliday.findMany({
            where: {
                date: { gte: startDate, lte: endDate },
                // TODO: Ajouter filtre par siteId/région si PublicHoliday a cette information et si siteId est fourni
            },
        });

        const specialPeriods: SpecialPeriod[] = [];
        schoolHolidays.forEach(sh => specialPeriods.push({
            type: 'SCHOOL_HOLIDAY',
            name: sh.name,
            startDate: sh.startDate.toISOString().split('T')[0],
            endDate: sh.endDate.toISOString().split('T')[0],
        }));
        publicHolidays.forEach(ph => specialPeriods.push({
            type: 'PUBLIC_HOLIDAY',
            name: ph.name,
            startDate: ph.date.toISOString().split('T')[0],
            endDate: ph.date.toISOString().split('T')[0], // Pour un jour férié, startDate = endDate
        }));

        return {
            leaveTrends,
            specialPeriods: specialPeriods.sort((a, b) => a.startDate.localeCompare(b.startDate)),
            summary: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                aggregationUnit,
                leaveTypes,
                siteId,
            },
        };
    }
}

export const analyticsService = new AnalyticsService(); 