import { OperatingRoom, OperatingSector } from '../types';
import { logger } from "../../../../lib/logger";
import { blocPlanningService, BlocPlanningService } from './blocPlanningService';
import { OperatingRoom as BlocOperatingRoom } from '../models/BlocModels';

/**
 * Service pour gérer les salles opératoires
 */
export class OperatingRoomService {
    // Plus de map en mémoire ni de loadData

    // Instance du service réel
    private realService: BlocPlanningService;

    // Erreurs possibles
    private static readonly ERRORS = {
        ROOM_NOT_FOUND: 'Salle non trouvée',
        CREATION_FAILED: 'Échec de la création de la salle',
        UPDATE_FAILED: 'Échec de la mise à jour de la salle',
        DELETE_FAILED: 'Échec de la suppression de la salle',
        INVALID_DATA: 'Données de salle invalides',
        NOT_IMPLEMENTED: 'Fonctionnalité non implémentée avec le nouveau service'
    };

    constructor() {
        this.realService = blocPlanningService; // Utiliser l'instance exportée
    }

    /**
     * Récupère toutes les salles triées depuis BlocPlanningService
     * @returns Liste de toutes les salles mappées au type local
     */
    public async getAll(): Promise<OperatingRoom[]> {
        try {
            const roomsFromRealService: BlocOperatingRoom[] = await this.realService.getAllOperatingRooms(true);

            return roomsFromRealService.map(roomPrisma => {
                // Mapper de BlocOperatingRoom (model) vers OperatingRoom (type legacy)
                const mappedRoom: OperatingRoom = {
                    id: roomPrisma.id!.toString(),
                    numero: roomPrisma.number || '',
                    nom: roomPrisma.name,
                    secteurId: roomPrisma.sectorId ? roomPrisma.sectorId.toString() : '0',
                    description: undefined, // À compléter si nécessaire
                    estActif: roomPrisma.isActive
                };
                return mappedRoom;
            });
        } catch (error: unknown) {
            logger.error('Erreur lors de la récupération des salles via BlocPlanningService:', error instanceof Error ? error : new Error(String(error)));
            return [];
        }
    }

    /**
     * Récupère une salle par son ID
     * @param id ID de la salle à récupérer
     * @returns La salle trouvée ou null si elle n'existe pas
     */
    public async getById(id: string): Promise<OperatingRoom | null> {
        try {
            const numericId = parseInt(id, 10);
            if (isNaN(numericId)) {
                logger.warn(`ID de salle invalide fourni: ${id}`);
                return null;
            }

            // Utiliser getAllOperatingRooms et filtrer par ID
            const allRooms = await this.realService.getAllOperatingRooms(true);
            const roomPrisma = allRooms.find(room => room.id === numericId);

            if (!roomPrisma) {
                return null;
            }

            // Mapper de BlocOperatingRoom (model) vers OperatingRoom (type legacy)
            const mappedRoom: OperatingRoom = {
                id: roomPrisma.id!.toString(),
                numero: roomPrisma.number || '',
                nom: roomPrisma.name,
                secteurId: roomPrisma.sectorId ? roomPrisma.sectorId.toString() : '0',
                description: undefined, // À compléter si nécessaire
                estActif: roomPrisma.isActive
            };

            return mappedRoom;
        } catch (error: unknown) {
            logger.error(`Erreur lors de la récupération de la salle ${id} via BlocPlanningService:`, error instanceof Error ? error : new Error(String(error)));
            return null;
        }
    }

    /**
     * Récupère toutes les salles actives
     * @returns Liste des salles actives
     */
    public async getActive(): Promise<OperatingRoom[]> {
        try {
            const roomsFromRealService: BlocOperatingRoom[] = await this.realService.getActiveOperatingRooms(true);

            return roomsFromRealService.map(roomPrisma => {
                // Mapper de BlocOperatingRoom (model) vers OperatingRoom (type legacy)
                const mappedRoom: OperatingRoom = {
                    id: roomPrisma.id!.toString(),
                    numero: roomPrisma.number || '',
                    nom: roomPrisma.name,
                    secteurId: roomPrisma.sectorId ? roomPrisma.sectorId.toString() : '0',
                    description: undefined, // À compléter si nécessaire
                    estActif: roomPrisma.isActive
                };
                return mappedRoom;
            });
        } catch (error: unknown) {
            logger.error('Erreur lors de la récupération des salles actives:', error instanceof Error ? error : new Error(String(error)));
            return [];
        }
    }

    /**
     * Crée une nouvelle salle - NON IMPLÉMENTÉ AVEC LE NOUVEAU SERVICE
     */
    public create(data: Omit<OperatingRoom, 'id'>): OperatingRoom {
        logger.warn('OperatingRoomService.create non implémenté avec le nouveau service de backend.');
        throw new Error(OperatingRoomService.ERRORS.NOT_IMPLEMENTED);
    }

    /**
     * Met à jour une salle existante - NON IMPLÉMENTÉ AVEC LE NOUVEAU SERVICE
     */
    public update(id: string, data: Partial<Omit<OperatingRoom, 'id'>>): OperatingRoom {
        logger.warn('OperatingRoomService.update non implémenté avec le nouveau service de backend.');
        throw new Error(OperatingRoomService.ERRORS.NOT_IMPLEMENTED);
    }

    /**
     * Supprime une salle - NON IMPLÉMENTÉ AVEC LE NOUVEAU SERVICE
     */
    public delete(id: string): boolean {
        logger.warn('OperatingRoomService.delete non implémenté avec le nouveau service de backend.');
        throw new Error(OperatingRoomService.ERRORS.NOT_IMPLEMENTED);
    }

    /**
     * Récupère les salles par secteur
     * @param sectorId ID du secteur
     * @returns Liste des salles du secteur
     */
    public async getBySector(sectorId: string): Promise<OperatingRoom[]> {
        try {
            const allRooms = await this.getAll();
            return allRooms.filter(room => room.secteurId === sectorId);
        } catch (error: unknown) {
            logger.error(`Erreur lors de la récupération des salles pour le secteur ${sectorId}:`, error instanceof Error ? error : new Error(String(error)));
            return [];
        }
    }

    /**
     * Supprime toutes les salles d'un secteur - NON IMPLÉMENTÉ AVEC LE NOUVEAU SERVICE
     */
    public deleteAllFromSector(sectorId: string): boolean {
        logger.warn('OperatingRoomService.deleteAllFromSector non implémenté avec le nouveau service de backend.');
        throw new Error(OperatingRoomService.ERRORS.NOT_IMPLEMENTED);
    }
}

/* COMMENTAIRE: Les fonctions exportées ci-dessous semblent être une API alternative ou plus ancienne.
   Elles ne sont pas utilisées par les hooks useOperatingResourceQueries.
   Je les commente pour résoudre les erreurs de linter et se concentrer sur la logique de la classe.

export const createOperatingRoom = async (data: Omit<OperatingRoom, \'id\'>): Promise<OperatingRoom> => {
    // ... code original ...
};

export const updateOperatingRoom = async (id: number, data: Partial<Omit<OperatingRoom, \'id\'>>): Promise<OperatingRoom | null> => {
    // ... code original ...
};

export const deleteOperatingRoom = async (id: number): Promise<void> => {
    // ... code original ...
};

export const getOperatingRoomsBySector = async (sectorId: number): Promise<OperatingRoom[]> => {
    // ... code original ...
};

*/

// Instance exportée du service
export const operatingRoomService = new OperatingRoomService(); 