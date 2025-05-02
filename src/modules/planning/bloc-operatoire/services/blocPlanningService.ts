import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import {
    OperatingRoom,
    OperatingSector,
    SupervisionRule,
    BlocDayPlanning,
    BlocRoomAssignment,
    BlocSupervisor,
    BlocPlanningConflict,
    ValidationResult,
    BlocPlanningStatus,
    SupervisionRuleType,
    BlocPlanningSearchContext,
    BlocPeriod,
    BlocStaffRole
} from '../models/BlocModels';

// Instance Prisma
const prisma = new PrismaClient();

/**
 * Service de gestion du bloc opératoire
 */
export class BlocPlanningService {

    /**
     * GESTION DES SALLES D'OPÉRATION
     */

    /**
     * Récupère toutes les salles d'opération
     */
    async getAllOperatingRooms(includeSector = false): Promise<OperatingRoom[]> {
        try {
            const rooms = await prisma.operatingRoom.findMany({
                where: {},
                include: {
                    sector: includeSector
                },
                orderBy: {
                    number: 'asc'
                }
            });

            return rooms;
        } catch (error) {
            console.error('Erreur lors de la récupération des salles d\'opération:', error);
            throw new Error('Impossible de récupérer les salles d\'opération');
        }
    }

    /**
     * Récupère les salles d'opération actives
     */
    async getActiveOperatingRooms(includeSector = false): Promise<OperatingRoom[]> {
        try {
            const rooms = await prisma.operatingRoom.findMany({
                where: {
                    isActive: true
                },
                include: {
                    sector: includeSector
                },
                orderBy: {
                    number: 'asc'
                }
            });

            return rooms;
        } catch (error) {
            console.error('Erreur lors de la récupération des salles d\'opération actives:', error);
            throw new Error('Impossible de récupérer les salles d\'opération actives');
        }
    }

    /**
     * Récupère une salle d'opération par son ID
     */
    async getOperatingRoomById(id: number, includeSector = false): Promise<OperatingRoom | null> {
        try {
            const room = await prisma.operatingRoom.findUnique({
                where: { id },
                include: {
                    sector: includeSector
                }
            });

            return room;
        } catch (error) {
            console.error(`Erreur lors de la récupération de la salle d'opération ${id}:`, error);
            throw new Error(`Impossible de récupérer la salle d'opération ${id}`);
        }
    }

    /**
     * Crée une nouvelle salle d'opération
     */
    async createOperatingRoom(data: Omit<OperatingRoom, 'id' | 'createdAt' | 'updatedAt'>): Promise<OperatingRoom> {
        try {
            // Vérifier que le secteur existe
            const sector = await prisma.operatingSector.findUnique({
                where: { id: data.sectorId }
            });

            if (!sector) {
                throw new Error(`Le secteur avec l'ID ${data.sectorId} n'existe pas`);
            }

            // Vérifier que le numéro de salle est unique
            const existingRoom = await prisma.operatingRoom.findUnique({
                where: { number: data.number }
            });

            if (existingRoom) {
                throw new Error(`Une salle avec le numéro ${data.number} existe déjà`);
            }

            const newRoom = await prisma.operatingRoom.create({
                data: {
                    name: data.name,
                    number: data.number,
                    sectorId: data.sectorId,
                    colorCode: data.colorCode,
                    isActive: data.isActive,
                    supervisionRules: data.supervisionRules || {}
                }
            });

            return newRoom;
        } catch (error) {
            console.error('Erreur lors de la création de la salle d\'opération:', error);
            throw error;
        }
    }

    /**
     * Met à jour une salle d'opération
     */
    async updateOperatingRoom(id: number, data: Partial<Omit<OperatingRoom, 'id' | 'createdAt' | 'updatedAt'>>): Promise<OperatingRoom> {
        try {
            // Vérifier que la salle existe
            const existingRoom = await prisma.operatingRoom.findUnique({
                where: { id }
            });

            if (!existingRoom) {
                throw new Error(`La salle d'opération avec l'ID ${id} n'existe pas`);
            }

            // Si le numéro de salle est modifié, vérifier qu'il est unique
            if (data.number && data.number !== existingRoom.number) {
                const roomWithSameNumber = await prisma.operatingRoom.findUnique({
                    where: { number: data.number }
                });

                if (roomWithSameNumber) {
                    throw new Error(`Une salle avec le numéro ${data.number} existe déjà`);
                }
            }

            // Si le secteur est modifié, vérifier qu'il existe
            if (data.sectorId) {
                const sector = await prisma.operatingSector.findUnique({
                    where: { id: data.sectorId }
                });

                if (!sector) {
                    throw new Error(`Le secteur avec l'ID ${data.sectorId} n'existe pas`);
                }
            }

            const updatedRoom = await prisma.operatingRoom.update({
                where: { id },
                data
            });

            return updatedRoom;
        } catch (error) {
            console.error(`Erreur lors de la mise à jour de la salle d'opération ${id}:`, error);
            throw error;
        }
    }

    /**
     * Supprime une salle d'opération
     */
    async deleteOperatingRoom(id: number): Promise<void> {
        try {
            // Vérifier que la salle existe
            const existingRoom = await prisma.operatingRoom.findUnique({
                where: { id }
            });

            if (!existingRoom) {
                throw new Error(`La salle d'opération avec l'ID ${id} n'existe pas`);
            }

            // Vérifier que la salle n'est pas utilisée dans des plannings
            // Pour MVP, on ne vérifie pas ça initialement

            await prisma.operatingRoom.delete({
                where: { id }
            });
        } catch (error) {
            console.error(`Erreur lors de la suppression de la salle d'opération ${id}:`, error);
            throw error;
        }
    }

    /**
     * GESTION DES SECTEURS OPÉRATOIRES
     */

    /**
     * Récupère tous les secteurs opératoires
     */
    async getAllOperatingSectors(includeRooms = false): Promise<OperatingSector[]> {
        try {
            const sectors = await prisma.operatingSector.findMany({
                include: {
                    operatingRooms: includeRooms
                },
                orderBy: {
                    name: 'asc'
                }
            });

            return sectors;
        } catch (error) {
            console.error('Erreur lors de la récupération des secteurs opératoires:', error);
            throw new Error('Impossible de récupérer les secteurs opératoires');
        }
    }

    /**
     * Récupère les secteurs opératoires actifs
     */
    async getActiveOperatingSectors(includeRooms = false): Promise<OperatingSector[]> {
        try {
            const sectors = await prisma.operatingSector.findMany({
                where: {
                    isActive: true
                },
                include: {
                    operatingRooms: includeRooms ? {
                        where: {
                            isActive: true
                        }
                    } : false
                },
                orderBy: {
                    name: 'asc'
                }
            });

            return sectors;
        } catch (error) {
            console.error('Erreur lors de la récupération des secteurs opératoires actifs:', error);
            throw new Error('Impossible de récupérer les secteurs opératoires actifs');
        }
    }

    /**
     * Récupère un secteur opératoire par son ID
     */
    async getOperatingSectorById(id: number, includeRooms = false): Promise<OperatingSector | null> {
        try {
            const sector = await prisma.operatingSector.findUnique({
                where: { id },
                include: {
                    operatingRooms: includeRooms
                }
            });

            return sector;
        } catch (error) {
            console.error(`Erreur lors de la récupération du secteur opératoire ${id}:`, error);
            throw new Error(`Impossible de récupérer le secteur opératoire ${id}`);
        }
    }

    /**
     * Crée un nouveau secteur opératoire
     */
    async createOperatingSector(data: Omit<OperatingSector, 'id' | 'createdAt' | 'updatedAt'>): Promise<OperatingSector> {
        try {
            // Vérifier que le nom du secteur est unique
            const existingSector = await prisma.operatingSector.findUnique({
                where: { name: data.name }
            });

            if (existingSector) {
                throw new Error(`Un secteur avec le nom ${data.name} existe déjà`);
            }

            const newSector = await prisma.operatingSector.create({
                data: {
                    name: data.name,
                    colorCode: data.colorCode || '#000000',
                    isActive: data.isActive ?? true,
                    description: data.description,
                    rules: data.rules || { maxRoomsPerSupervisor: 2 }
                }
            });

            return newSector;
        } catch (error) {
            console.error('Erreur lors de la création du secteur opératoire:', error);
            throw error;
        }
    }

    /**
     * Met à jour un secteur opératoire
     */
    async updateOperatingSector(id: number, data: Partial<Omit<OperatingSector, 'id' | 'createdAt' | 'updatedAt'>>): Promise<OperatingSector> {
        try {
            // Vérifier que le secteur existe
            const existingSector = await prisma.operatingSector.findUnique({
                where: { id }
            });

            if (!existingSector) {
                throw new Error(`Le secteur opératoire avec l'ID ${id} n'existe pas`);
            }

            // Si le nom du secteur est modifié, vérifier qu'il est unique
            if (data.name && data.name !== existingSector.name) {
                const sectorWithSameName = await prisma.operatingSector.findUnique({
                    where: { name: data.name }
                });

                if (sectorWithSameName) {
                    throw new Error(`Un secteur avec le nom ${data.name} existe déjà`);
                }
            }

            const updatedSector = await prisma.operatingSector.update({
                where: { id },
                data
            });

            return updatedSector;
        } catch (error) {
            console.error(`Erreur lors de la mise à jour du secteur opératoire ${id}:`, error);
            throw error;
        }
    }

    /**
     * Supprime un secteur opératoire
     */
    async deleteOperatingSector(id: number): Promise<void> {
        try {
            // Vérifier que le secteur existe
            const existingSector = await prisma.operatingSector.findUnique({
                where: { id },
                include: {
                    operatingRooms: true
                }
            });

            if (!existingSector) {
                throw new Error(`Le secteur opératoire avec l'ID ${id} n'existe pas`);
            }

            // Vérifier qu'il n'y a pas de salles associées à ce secteur
            if (existingSector.operatingRooms.length > 0) {
                throw new Error(`Le secteur opératoire contient des salles et ne peut pas être supprimé`);
            }

            await prisma.operatingSector.delete({
                where: { id }
            });
        } catch (error) {
            console.error(`Erreur lors de la suppression du secteur opératoire ${id}:`, error);
            throw error;
        }
    }

    /**
     * GESTION DES PLANNINGS DU BLOC
     */

    /**
     * Récupère un planning du bloc pour une date spécifique
     */
    async getBlocPlanningByDate(date: Date): Promise<BlocDayPlanning | null> {
        // Pour le MVP, on implémente une version simplifiée
        // Dans une version complète, il faudrait utiliser une base de données
        return null; // À implémenter avec Prisma dans la version complète
    }

    /**
     * Recherche des plannings du bloc selon les critères
     */
    async searchBlocPlannings(context: BlocPlanningSearchContext): Promise<BlocDayPlanning[]> {
        // Pour le MVP, on implémente une version simplifiée
        // Dans une version complète, il faudrait utiliser une base de données
        return []; // À implémenter avec Prisma dans la version complète
    }

    /**
     * Crée un nouveau planning du bloc
     */
    async createBlocPlanning(planning: Omit<BlocDayPlanning, 'id' | 'createdAt' | 'updatedAt'>): Promise<BlocDayPlanning> {
        // Pour le MVP, on implémente une version simplifiée
        // Dans une version complète, il faudrait utiliser une base de données
        return {
            ...planning,
            id: uuidv4(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }

    /**
     * Met à jour un planning du bloc
     */
    async updateBlocPlanning(id: string, planning: Partial<Omit<BlocDayPlanning, 'id' | 'createdAt' | 'updatedAt'>>): Promise<BlocDayPlanning | null> {
        // Pour le MVP, on implémente une version simplifiée
        // Dans une version complète, il faudrait utiliser une base de données
        return null; // À implémenter avec Prisma dans la version complète
    }

    /**
     * Valide un planning du bloc
     */
    async validateBlocPlanning(id: string, userId: number): Promise<ValidationResult> {
        // Pour le MVP, on implémente des règles de validation simples
        // Dans une version complète, il faudrait vérifier les règles de supervision, etc.

        // Exemple simple de validation MVP
        return {
            isValid: true,
            conflicts: []
        };
    }

    /**
     * GESTION DES RÈGLES DE SUPERVISION
     */

    /**
     * Valide qu'un planning respecte la règle du nombre maximum de salles par superviseur
     */
    validateMaxRoomsPerSupervisor(planning: BlocDayPlanning, maxRooms: number = 2): BlocPlanningConflict[] {
        const conflicts: BlocPlanningConflict[] = [];

        // Structure pour suivre les MAR et leurs salles par période
        const marRoomsByPeriod: Record<BlocPeriod, Record<number, number[]>> = {
            [BlocPeriod.MORNING]: {},
            [BlocPeriod.AFTERNOON]: {},
            [BlocPeriod.FULL_DAY]: {}
        };

        // Analyser les assignations pour trouver les MAR et leurs salles
        planning.assignments.forEach(assignment => {
            // Vérifier la vacation du matin
            if (assignment.morningVacation) {
                const morningStaff = assignment.morningVacation.staff.filter(
                    s => s.role === BlocStaffRole.MAR
                );

                morningStaff.forEach(mar => {
                    if (!marRoomsByPeriod[BlocPeriod.MORNING][mar.userId]) {
                        marRoomsByPeriod[BlocPeriod.MORNING][mar.userId] = [];
                    }

                    if (!marRoomsByPeriod[BlocPeriod.MORNING][mar.userId].includes(assignment.roomId)) {
                        marRoomsByPeriod[BlocPeriod.MORNING][mar.userId].push(assignment.roomId);
                    }
                });
            }

            // Vérifier la vacation de l'après-midi
            if (assignment.afternoonVacation) {
                const afternoonStaff = assignment.afternoonVacation.staff.filter(
                    s => s.role === BlocStaffRole.MAR
                );

                afternoonStaff.forEach(mar => {
                    if (!marRoomsByPeriod[BlocPeriod.AFTERNOON][mar.userId]) {
                        marRoomsByPeriod[BlocPeriod.AFTERNOON][mar.userId] = [];
                    }

                    if (!marRoomsByPeriod[BlocPeriod.AFTERNOON][mar.userId].includes(assignment.roomId)) {
                        marRoomsByPeriod[BlocPeriod.AFTERNOON][mar.userId].push(assignment.roomId);
                    }
                });
            }

            // Si un MAR est assigné pour toute la journée, l'ajouter aux deux périodes
            const fullDayStaff = [
                ...(assignment.morningVacation?.staff || []),
                ...(assignment.afternoonVacation?.staff || [])
            ].filter(
                s => s.role === BlocStaffRole.MAR && s.periods.includes(BlocPeriod.FULL_DAY)
            );

            fullDayStaff.forEach(mar => {
                // Ajouter au suivi des périodes individuelles
                if (!marRoomsByPeriod[BlocPeriod.MORNING][mar.userId]) {
                    marRoomsByPeriod[BlocPeriod.MORNING][mar.userId] = [];
                }
                if (!marRoomsByPeriod[BlocPeriod.AFTERNOON][mar.userId]) {
                    marRoomsByPeriod[BlocPeriod.AFTERNOON][mar.userId] = [];
                }

                if (!marRoomsByPeriod[BlocPeriod.MORNING][mar.userId].includes(assignment.roomId)) {
                    marRoomsByPeriod[BlocPeriod.MORNING][mar.userId].push(assignment.roomId);
                }
                if (!marRoomsByPeriod[BlocPeriod.AFTERNOON][mar.userId].includes(assignment.roomId)) {
                    marRoomsByPeriod[BlocPeriod.AFTERNOON][mar.userId].push(assignment.roomId);
                }

                // Ajouter également au suivi de la journée complète
                if (!marRoomsByPeriod[BlocPeriod.FULL_DAY][mar.userId]) {
                    marRoomsByPeriod[BlocPeriod.FULL_DAY][mar.userId] = [];
                }
                if (!marRoomsByPeriod[BlocPeriod.FULL_DAY][mar.userId].includes(assignment.roomId)) {
                    marRoomsByPeriod[BlocPeriod.FULL_DAY][mar.userId].push(assignment.roomId);
                }
            });
        });

        // Vérifier les violations de la règle pour chaque période
        Object.entries(marRoomsByPeriod).forEach(([period, marRooms]) => {
            Object.entries(marRooms).forEach(([userId, roomIds]) => {
                if (roomIds.length > maxRooms) {
                    conflicts.push({
                        id: uuidv4(),
                        planningId: planning.id as string,
                        type: 'MAX_ROOMS_PER_SUPERVISOR',
                        message: `Le MAR (ID: ${userId}) est affecté à ${roomIds.length} salles durant la période ${period} (maximum autorisé: ${maxRooms})`,
                        severity: 'ERROR',
                        resolved: false,
                        createdAt: new Date()
                    });
                }
            });
        });

        return conflicts;
    }
}

// Exporter une instance par défaut
export const blocPlanningService = new BlocPlanningService(); 