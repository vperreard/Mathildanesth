import { PrismaClient, OperatingRoom, OperatingSector, BlocRoomAssignment, Period, Site, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

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
                console.warn(`Période non reconnue ou non configurée dans getPeriodDurationInHours: ${period}. Valeur par défaut 0h.`);
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
                operatingRoom: { // operatingRoom est non-nul dans BlocRoomAssignment schema
                    include: {
                        sector: true, // sector est optionnel sur OperatingRoom
                    },
                },
            },
        });

        const statsBySectorCategory: Record<string, SectorCategoryUtilization> = {};
        const statsByRoomType: Record<string, RoomTypeUtilization> = {};

        // Prisma Client est supposé à jour: OperatingRoom inclut `type`, OperatingSector inclut `category`.
        const allActiveRoomsInSite = await prisma.operatingRoom.findMany({
            where: { isActive: true, sector: { siteId, isActive: true } }, // Assure que sector est non-nul
            include: { sector: true }, // Inclus le secteur pour chaque salle
        });

        allActiveRoomsInSite.forEach(room => {
            // room.sector est non-nul ici grâce au filtre `sector: { siteId, isActive: true }`
            // et room.type, room.sector.category devraient exister grâce à `prisma generate`.
            if (room.sector?.category) { // Garder la vérification car sector peut être null si le filtre where change
                const category = room.sector.category;
                if (!statsBySectorCategory[category]) {
                    statsBySectorCategory[category] = {
                        category,
                        totalPlannedHours: 0,
                        numberOfProcedures: 0,
                        numberOfRooms: allActiveRoomsInSite.filter(r => r.sector?.category === category).length,
                        totalAvailableHours: 0,
                        occupancyRate: 0,
                        averageProcedureDurationMinutes: 0,
                    } as SectorCategoryUtilization;
                }
            }
            if (room.type) { // room.type est optionnel
                const type = room.type;
                if (!statsByRoomType[type]) {
                    statsByRoomType[type] = {
                        type,
                        totalPlannedHours: 0,
                        numberOfProcedures: 0,
                        numberOfRooms: allActiveRoomsInSite.filter(r => r.type === type).length,
                        totalAvailableHours: 0,
                        occupancyRate: 0,
                        averageProcedureDurationMinutes: 0,
                    } as RoomTypeUtilization;
                }
            }
        });

        for (const assignment of roomAssignments) {
            // operatingRoom est non-nul sur BlocRoomAssignment, et sector est inclus.
            // type sur room et category sur room.sector devraient être disponibles.
            if (!assignment.operatingRoom) continue; // Sécurité, même si le schéma dit non-nul

            const room = assignment.operatingRoom;
            const sectorCategory = room.sector?.category;
            const roomType = room.type;

            const plannedHours = this.getPeriodDurationInHours(assignment.period);

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
}

export const analyticsService = new AnalyticsService(); 