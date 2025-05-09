import { PrismaClient, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import {
    OperatingRoom,
    OperatingSector,
    SupervisionRule,
    BlocDayPlanning,
    BlocRoomAssignment,
    BlocPlanningConflict,
    ValidationResult,
    BlocPlanningStatus,
    SupervisionRuleType,
    BlocPlanningSearchContext,
    BlocPeriod,
    BlocStaffRole
} from '../models/BlocModels';
import { OperatingRoomSchema, OperatingSectorSchema } from '../models/BlocModels';
import * as z from 'zod';

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
     * Récupère toutes les salles d'opération, triées par Site -> Secteur -> Salle
     */
    async getAllOperatingRooms(includeRelations = true): Promise<OperatingRoom[]> {
        try {
            const roomsData = await prisma.operatingRoom.findMany({
                where: {},
                include: includeRelations ? {
                    sector: {
                        include: {
                            site: true // Inclure le site pour pouvoir trier et l'afficher
                        }
                    }
                } : undefined,
                orderBy: [
                    { sector: { site: { displayOrder: 'asc' } } },
                    { sector: { displayOrder: 'asc' } },
                    { displayOrder: 'asc' },
                    { sector: { site: { name: 'asc' } } },
                    { sector: { name: 'asc' } },
                    { number: 'asc' }
                ]
            });

            const validatedRooms = roomsData.map(room => {
                const roomForValidation: OperatingRoom = {
                    id: room.id,
                    name: room.name,
                    number: room.number,
                    colorCode: room.colorCode,
                    isActive: room.isActive,
                    supervisionRules: (room.supervisionRules && typeof room.supervisionRules === 'object' && !Array.isArray(room.supervisionRules)) ? room.supervisionRules as Record<string, any> : {},
                    createdAt: room.createdAt,
                    updatedAt: room.updatedAt,
                    displayOrder: room.displayOrder,
                    sector: (room as any).sector?.name,
                    sectorId: room.sectorId,
                };
                // Utiliser safeParse pour gérer les erreurs de validation sans bloquer
                const parseResult = OperatingRoomSchema.safeParse(roomForValidation);
                if (!parseResult.success) {
                    console.warn(`Données invalides pour la salle ID ${room.id}, elle sera ignorée:`, parseResult.error.errors);
                    return null; // Ignorer les salles invalides
                }
                return parseResult.data;
            });
            // Filtrer les résultats null (salles ignorées)
            return validatedRooms.filter((room): room is OperatingRoom => room !== null);
        } catch (error) {
            // Catch les erreurs générales (ex: problème DB)
            console.error("Erreur lors de la récupération des salles d'opération: ", error);
            throw new Error("Impossible de récupérer les salles d'opération");
        }
    }

    /**
     * Récupère les salles d'opération actives
     */
    async getActiveOperatingRooms(includeRelations = true): Promise<OperatingRoom[]> {
        try {
            const roomsData = await prisma.operatingRoom.findMany({
                where: {
                    isActive: true
                },
                include: includeRelations ? {
                    sector: {
                        include: {
                            site: true
                        }
                    }
                } : undefined,
                orderBy: [
                    { sector: { site: { displayOrder: 'asc' } } },
                    { sector: { displayOrder: 'asc' } },
                    { displayOrder: 'asc' },
                    { sector: { site: { name: 'asc' } } },
                    { sector: { name: 'asc' } },
                    { number: 'asc' }
                ]
            });

            const validatedRooms = roomsData.map(room => {
                const roomForValidation: OperatingRoom = {
                    id: room.id,
                    name: room.name,
                    number: room.number,
                    colorCode: room.colorCode,
                    isActive: room.isActive,
                    supervisionRules: (room.supervisionRules && typeof room.supervisionRules === 'object' && !Array.isArray(room.supervisionRules)) ? room.supervisionRules as Record<string, any> : {},
                    createdAt: room.createdAt,
                    updatedAt: room.updatedAt,
                    displayOrder: room.displayOrder,
                    sector: (room as any).sector?.name,
                    sectorId: room.sectorId,
                };
                const parseResult = OperatingRoomSchema.safeParse(roomForValidation);
                if (!parseResult.success) {
                    console.warn(`Données invalides pour la salle active ID ${room.id}, elle sera ignorée:`, parseResult.error.errors);
                    return null;
                }
                return parseResult.data;
            });
            return validatedRooms.filter((room): room is OperatingRoom => room !== null);

        } catch (error) {
            console.error("Erreur lors de la récupération des salles d'opération actives: ", error);
            throw new Error("Impossible de récupérer les salles d'opération actives");
        }
    }

    /**
     * Récupère une salle d'opération par son ID
     */
    async getOperatingRoomById(id: number, includeRelations = true): Promise<OperatingRoom | null> {
        try {
            const roomData = await prisma.operatingRoom.findUnique({
                where: { id },
                include: includeRelations ? {
                    sector: {
                        include: {
                            site: true
                        }
                    }
                } : undefined
            });

            if (!roomData) return null;

            const roomForValidation: OperatingRoom = {
                id: roomData.id,
                name: roomData.name,
                number: roomData.number,
                colorCode: roomData.colorCode,
                isActive: roomData.isActive,
                supervisionRules: (roomData.supervisionRules && typeof roomData.supervisionRules === 'object' && !Array.isArray(roomData.supervisionRules)) ? roomData.supervisionRules as Record<string, any> : {},
                createdAt: roomData.createdAt,
                updatedAt: roomData.updatedAt,
                displayOrder: roomData.displayOrder,
                sector: includeRelations ? (roomData as any).sector?.name : undefined,
                sectorId: roomData.sectorId,
            };
            const parseResult = OperatingRoomSchema.safeParse(roomForValidation);
            if (!parseResult.success) {
                console.error(`Données invalides pour la salle ${id} reçues de la base:`, parseResult.error.errors);
                // On pourrait choisir de retourner null ou de jeter une erreur ici
                return null;
            }
            return parseResult.data;

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
            if (typeof data.sectorId !== 'number') {
                throw new Error("sectorId (number) is required to create an operating room and was not provided or was not a number.");
            }
            const sectorIdVerified: number = data.sectorId;

            // Vérifier que le secteur existe
            const sector = await prisma.operatingSector.findUnique({
                where: { id: sectorIdVerified }
            });

            if (!sector) {
                throw new Error(`Le secteur avec l'ID ${sectorIdVerified} n'existe pas`);
            }

            // Vérifier que le numéro de salle est unique
            const existingRoomWithNumber = await prisma.operatingRoom.findUnique({
                where: { number: data.number }
            });

            if (existingRoomWithNumber) {
                throw new Error(`Une salle avec le numéro ${data.number} existe déjà`);
            }

            const createData: Prisma.OperatingRoomUncheckedCreateInput = {
                name: data.name,
                number: data.number,
                sectorId: sectorIdVerified,
                colorCode: data.colorCode,
                isActive: data.isActive ?? true,
                supervisionRules: (data.supervisionRules && typeof data.supervisionRules === 'object' && !Array.isArray(data.supervisionRules)) ? data.supervisionRules : {},
                displayOrder: data.displayOrder ?? 0,
            };

            const newRoomRecord = await prisma.operatingRoom.create({
                data: createData
            });

            // Valider et transformer pour le type de retour Zod OperatingRoom
            const result = OperatingRoomSchema.parse({
                ...newRoomRecord,
                supervisionRules: (newRoomRecord.supervisionRules && typeof newRoomRecord.supervisionRules === 'object' && !Array.isArray(newRoomRecord.supervisionRules)) ? newRoomRecord.supervisionRules : {},
                sector: sector.name, // Ajouter le nom du secteur pour satisfaire OperatingRoomSchema si besoin
            });
            return result;

        } catch (error) {
            console.error("Erreur lors de la création de la salle d'opération:", error);
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
                where: { id },
                include: { sector: true } // Inclure le secteur pour avoir son nom
            });

            if (!existingRoom) {
                throw new Error(`La salle d'opération avec l'ID ${id} n'existe pas`);
            }

            // Si le numéro de salle est modifié, vérifier qu'il est unique
            if (data.number && data.number !== existingRoom.number) {
                const roomWithSameNumber = await prisma.operatingRoom.findUnique({
                    where: { number: data.number }
                });
                if (roomWithSameNumber && roomWithSameNumber.id !== id) {
                    throw new Error(`Une salle avec le numéro ${data.number} existe déjà`);
                }
            }

            let currentSectorName = existingRoom.sector.name;
            let currentSectorId = existingRoom.sectorId;

            const updatePayload: Prisma.OperatingRoomUpdateInput = {};

            if (data.name !== undefined) updatePayload.name = data.name;
            if (data.number !== undefined) updatePayload.number = data.number;
            if (data.colorCode !== undefined) updatePayload.colorCode = data.colorCode;
            if (data.isActive !== undefined) updatePayload.isActive = data.isActive;
            if (data.displayOrder !== undefined) updatePayload.displayOrder = data.displayOrder;

            if (data.sectorId !== undefined) {
                if (typeof data.sectorId !== 'number') {
                    throw new Error('sectorId must be a number if provided for update.');
                }
                if (data.sectorId !== existingRoom.sectorId) {
                    const newSector = await prisma.operatingSector.findUnique({
                        where: { id: data.sectorId }
                    });
                    if (!newSector) {
                        throw new Error(`Le secteur avec l'ID ${data.sectorId} n'existe pas`);
                    }
                    currentSectorName = newSector.name;
                    currentSectorId = newSector.id; // Mettre à jour l'ID du secteur pour le retour
                    updatePayload.sector = { connect: { id: data.sectorId } };
                } // Si sectorId est le même, on ne fait rien ici pour updatePayload.sector
            }

            if (data.hasOwnProperty('supervisionRules')) {
                if (data.supervisionRules === null || (typeof data.supervisionRules === 'object' && Object.keys(data.supervisionRules!).length === 0)) {
                    updatePayload.supervisionRules = Prisma.JsonNull;
                } else if (typeof data.supervisionRules === 'object' && !Array.isArray(data.supervisionRules)) {
                    updatePayload.supervisionRules = data.supervisionRules; // Assumes data.supervisionRules is already InputJsonValue compatible if object
                } else {
                    // Optionnel: Gérer le cas où supervisionRules n'est ni null, ni objet valide (ex: string, array)
                    // throw new Error('Invalid format for supervisionRules');
                }
            }

            const updatedRoomRecord = await prisma.operatingRoom.update({
                where: { id },
                data: updatePayload
            });

            // Valider et transformer pour le type de retour Zod OperatingRoom
            const result = OperatingRoomSchema.parse({
                ...updatedRoomRecord,
                supervisionRules: (updatedRoomRecord.supervisionRules && typeof updatedRoomRecord.supervisionRules === 'object' && !Array.isArray(updatedRoomRecord.supervisionRules)) ? updatedRoomRecord.supervisionRules : {},
                sector: currentSectorName,
                sectorId: currentSectorId
            });
            return result;

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
            const sectorsFromPrisma = await prisma.operatingSector.findMany({
                include: {
                    operatingRooms: includeRooms,
                    site: true // Inclure le site pour le tri
                },
                orderBy: [
                    { site: { displayOrder: 'asc' } },
                    { displayOrder: 'asc' },
                    { name: 'asc' }
                ]
            });

            const validatedSectors = sectorsFromPrisma.map(sectorPrisma => {
                // Le champ `site` est inclus pour le tri mais n'est pas dans OperatingSectorSchema
                const { site, ...sectorDataPrisma } = sectorPrisma;
                return OperatingSectorSchema.parse({
                    ...sectorDataPrisma,
                    description: sectorDataPrisma.description === null ? undefined : sectorDataPrisma.description,
                    siteId: sectorDataPrisma.siteId === null ? undefined : sectorDataPrisma.siteId,
                    // rules dans Prisma est JsonValue, Zod attend any avec un default.
                    // Si Prisma retourne null pour rules, on applique le default de Zod via le parse.
                    // Si Prisma retourne un objet JSON, il devrait être compatible avec z.any().
                    rules: sectorDataPrisma.rules === null ? { maxRoomsPerSupervisor: 2 } : sectorDataPrisma.rules,
                });
            });
            return validatedSectors;
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
            const sectorsFromPrisma = await prisma.operatingSector.findMany({
                where: {
                    isActive: true
                },
                include: {
                    operatingRooms: includeRooms ? {
                        where: {
                            isActive: true
                        }
                    } : false,
                    site: true // Inclure le site pour le tri
                },
                orderBy: [
                    { site: { displayOrder: 'asc' } },
                    { displayOrder: 'asc' },
                    { name: 'asc' }
                ]
            });

            const validatedSectors = sectorsFromPrisma.map(sectorPrisma => {
                const { site, ...sectorDataPrisma } = sectorPrisma;
                return OperatingSectorSchema.parse({
                    ...sectorDataPrisma,
                    description: sectorDataPrisma.description === null ? undefined : sectorDataPrisma.description,
                    siteId: sectorDataPrisma.siteId === null ? undefined : sectorDataPrisma.siteId,
                    rules: sectorDataPrisma.rules === null ? { maxRoomsPerSupervisor: 2 } : sectorDataPrisma.rules,
                });
            });
            return validatedSectors;
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
            const sectorPrisma = await prisma.operatingSector.findUnique({
                where: { id },
                include: {
                    operatingRooms: includeRooms,
                    site: true
                }
            });

            if (!sectorPrisma) return null;

            const { site, ...sectorDataPrisma } = sectorPrisma;
            return OperatingSectorSchema.parse({
                ...sectorDataPrisma,
                description: sectorDataPrisma.description === null ? undefined : sectorDataPrisma.description,
                siteId: sectorDataPrisma.siteId === null ? undefined : sectorDataPrisma.siteId,
                rules: sectorDataPrisma.rules === null ? { maxRoomsPerSupervisor: 2 } : sectorDataPrisma.rules,
            });
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
            // Vérifier que le nom du secteur est unique (optionnel, dépend des règles métier)
            // const existingSectorByName = await prisma.operatingSector.findUnique({ where: { name: data.name } });
            // if (existingSectorByName) { throw new Error(`Un secteur avec le nom ${data.name} existe déjà`); }

            const createDataPrisma: Prisma.OperatingSectorUncheckedCreateInput = {
                name: data.name, // Requis par Zod
                colorCode: data.colorCode ?? '#000000', // Default Zod
                isActive: data.isActive ?? true, // Default Zod
                description: data.description, // Optionnel Zod (string|undefined) -> Prisma (string|null)
                rules: data.rules ?? { maxRoomsPerSupervisor: 2 }, // Default Zod, Prisma attend JsonValue
                displayOrder: data.displayOrder ?? 0, // Default Zod
                siteId: data.siteId, // Optionnel Zod (string|undefined) -> Prisma (string|null)
            };

            const newSectorPrisma = await prisma.operatingSector.create({
                data: createDataPrisma
            });

            return OperatingSectorSchema.parse({
                ...newSectorPrisma,
                description: newSectorPrisma.description === null ? undefined : newSectorPrisma.description,
                siteId: newSectorPrisma.siteId === null ? undefined : newSectorPrisma.siteId,
                rules: newSectorPrisma.rules === null ? { maxRoomsPerSupervisor: 2 } : newSectorPrisma.rules,
            });
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
            const existingSector = await prisma.operatingSector.findUnique({
                where: { id }
            });

            if (!existingSector) {
                throw new Error(`Le secteur opératoire avec l'ID ${id} n'existe pas`);
            }

            // Si le nom du secteur est modifié, vérifier qu'il est unique (optionnel)
            // if (data.name && data.name !== existingSector.name) { ... }

            const updatePayload: Prisma.OperatingSectorUpdateInput = {};
            if (data.name !== undefined) updatePayload.name = data.name;
            if (data.colorCode !== undefined) updatePayload.colorCode = data.colorCode;
            if (data.isActive !== undefined) updatePayload.isActive = data.isActive;
            if (data.description !== undefined) updatePayload.description = data.description; // string | undefined
            if (data.displayOrder !== undefined) updatePayload.displayOrder = data.displayOrder;

            // Gérer la mise à jour de la relation site via siteId
            if (data.hasOwnProperty('siteId')) { // Vérifier si siteId est explicitement dans data
                if (data.siteId === null || data.siteId === undefined) { // Pour déconnecter ou si undefined est passé comme intention de vider
                    updatePayload.site = { disconnect: true };
                } else {
                    // Assurer que siteId est une chaîne valide si non null/undefined
                    if (typeof data.siteId === 'string') {
                        updatePayload.site = { connect: { id: data.siteId } };
                    } else {
                        // Gérer le cas où siteId est fourni mais n'est pas une chaîne (erreur de type)
                        // Cela ne devrait pas arriver si 'data' est bien typé selon OperatingSector
                        console.warn('Invalid siteId type for update, skipping site update.');
                    }
                }
            }

            if (data.hasOwnProperty('rules')) {
                if (data.rules === null || (typeof data.rules === 'object' && Object.keys(data.rules!).length === 0)) {
                    updatePayload.rules = Prisma.JsonNull;
                } else if (typeof data.rules === 'object' && !Array.isArray(data.rules)) {
                    updatePayload.rules = data.rules;
                }
            }

            const updatedSectorPrisma = await prisma.operatingSector.update({
                where: { id },
                data: updatePayload
            });

            return OperatingSectorSchema.parse({
                ...updatedSectorPrisma,
                description: updatedSectorPrisma.description === null ? undefined : updatedSectorPrisma.description,
                siteId: updatedSectorPrisma.siteId === null ? undefined : updatedSectorPrisma.siteId,
                rules: updatedSectorPrisma.rules === null ? { maxRoomsPerSupervisor: 2 } : updatedSectorPrisma.rules,
            });
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