import { v4 as uuidv4 } from 'uuid';
import { OperatingSector, OperatingRoom } from '../types';
import { blocPlanningService, BlocPlanningService } from './blocPlanningService';
import { OperatingSector as BlocOperatingSector } from '../models/BlocModels';

/**
 * Service pour gérer les secteurs opératoires
 * Fournit les méthodes CRUD pour les secteurs
 */
export class OperatingSectorService {
    // Plus de map en mémoire ni de loadData

    // Instance du service réel
    private realService: BlocPlanningService;

    // Erreurs possibles
    private static readonly ERRORS = {
        SECTOR_NOT_FOUND: 'Secteur non trouvé',
        CREATION_FAILED: 'Échec de la création du secteur',
        UPDATE_FAILED: 'Échec de la mise à jour du secteur',
        DELETE_FAILED: 'Échec de la suppression du secteur',
        HAS_ROOMS: 'Impossible de supprimer un secteur qui contient des salles',
        INVALID_DATA: 'Données de secteur invalides',
        NOT_IMPLEMENTED: 'Fonctionnalité non implémentée avec le nouveau service'
    };

    constructor() {
        this.realService = blocPlanningService; // Utiliser l'instance exportée
    }

    /**
     * Récupère tous les secteurs triés depuis BlocPlanningService
     * @returns Liste de tous les secteurs mappés au type local
     */
    public async getAll(): Promise<OperatingSector[]> {
        try {
            const sectorsFromRealService: BlocOperatingSector[] = await this.realService.getAllOperatingSectors(false);

            return sectorsFromRealService.map(sectorPrisma => {
                const mappedSector: OperatingSector = {
                    id: sectorPrisma.id!.toString(), // id est number dans Zod, string ici. Assumons qu'il est défini.
                    nom: sectorPrisma.name,
                    description: sectorPrisma.description === null ? undefined : sectorPrisma.description,
                    couleur: sectorPrisma.colorCode || '#000000', // colorCode est string | null dans Zod
                    salles: [], // Laisser vide pour l'instant, car non inclus dans getAllOperatingSectors(false)
                    estActif: sectorPrisma.isActive,
                    // Les champs suivants ne sont pas dans BlocOperatingSector, donc undefined par défaut:
                    // specialites?: string[];
                    // requiresSpecificSkills?: boolean;
                    // supervisionSpeciale?: boolean;
                    // responsableId?: string;
                };
                return mappedSector;
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des secteurs via BlocPlanningService:', error);
            // Retourner un tableau vide ou jeter une erreur spécifique au service client
            return [];
        }
    }

    /**
     * Récupère un secteur par son ID
     * @param id ID du secteur à récupérer (string)
     * @returns Le secteur trouvé ou null s'il n'existe pas
     */
    public async getById(id: string): Promise<OperatingSector | null> {
        try {
            const numericId = parseInt(id, 10);
            if (isNaN(numericId)) {
                console.warn(`ID de secteur invalide fourni: ${id}`);
                return null;
            }
            const sectorPrisma = await this.realService.getOperatingSectorById(numericId, false);

            if (!sectorPrisma) {
                return null;
            }

            const mappedSector: OperatingSector = {
                id: sectorPrisma.id!.toString(),
                nom: sectorPrisma.name,
                description: sectorPrisma.description === null ? undefined : sectorPrisma.description,
                couleur: sectorPrisma.colorCode || '#000000',
                salles: [],
                estActif: sectorPrisma.isActive,
            };
            return mappedSector;
        } catch (error) {
            console.error(`Erreur lors de la récupération du secteur ${id} via BlocPlanningService:`, error);
            return null;
        }
    }

    /**
     * Récupère tous les secteurs actifs
     * @returns Liste des secteurs actifs
     */
    public async getActive(): Promise<OperatingSector[]> {
        // BlocPlanningService.getActiveOperatingSectors() fait déjà ce filtrage.
        // On pourrait appeler this.realService.getActiveOperatingSectors()
        // ou filtrer sur le résultat de getAll() ici.
        // Pour l'instant, filtrons le résultat mappé de getAll().
        const allSectors = await this.getAll();
        return allSectors.filter(sector => sector.estActif);
    }

    /**
     * Crée un nouveau secteur - NON IMPLÉMENTÉ AVEC LE NOUVEAU SERVICE
     */
    public create(data: Omit<OperatingSector, 'id'>): OperatingSector {
        console.warn('OperatingSectorService.create non implémenté avec le nouveau service de backend.');
        throw new Error(OperatingSectorService.ERRORS.NOT_IMPLEMENTED);
        // Logique de création avec this.realService.createOperatingSector(mappedData) serait nécessaire.
        // Il faudrait mapper `data` (type local) vers `BlocOperatingSector` (type Zod) pour l'envoyer.
    }

    /**
     * Met à jour un secteur existant - NON IMPLÉMENTÉ AVEC LE NOUVEAU SERVICE
     */
    public update(id: string, data: Partial<OperatingSector>): OperatingSector {
        console.warn('OperatingSectorService.update non implémenté avec le nouveau service de backend.');
        throw new Error(OperatingSectorService.ERRORS.NOT_IMPLEMENTED);
        // Logique de mise à jour avec this.realService.updateOperatingSector(numericId, mappedData)
    }

    /**
     * Supprime un secteur - NON IMPLÉMENTÉ AVEC LE NOUVEAU SERVICE
     */
    public delete(id: string): boolean {
        console.warn('OperatingSectorService.delete non implémenté avec le nouveau service de backend.');
        throw new Error(OperatingSectorService.ERRORS.NOT_IMPLEMENTED);
        // Logique de suppression avec this.realService.deleteOperatingSector(numericId)
    }

    // Les méthodes getWithRooms, getAllWithRooms, updateRooms sont également à adapter ou supprimer si non utilisées.
    // Pour l'instant, elles dépendent de operatingRoomService qui est aussi probablement mocké.
    // Je vais les commenter pour éviter des erreurs de compilation avec operatingRoomService si celui-ci est modifié/supprimé.

    /**
     * Récupère un secteur avec les salles associées - DÉPEND DE OPERATINGROOMSERVICE
     */
    /*
    public getWithRooms(id: string): (OperatingSector & { roomObjects: OperatingRoom[] }) | null {
        // ... ancienne logique ...
        // Nécessiterait d'appeler this.realService.getOperatingSectorById(numericId, true)
        // puis de mapper les salles aussi.
        console.warn('OperatingSectorService.getWithRooms non adapté au nouveau service.');
        return null; 
    }
    */

    /**
     * Récupère tous les secteurs avec leurs salles associées - DÉPEND DE OPERATINGROOMSERVICE
     */
    /*
    public getAllWithRooms(): (OperatingSector & { roomObjects: OperatingRoom[] })[] {
        // ... ancienne logique ...
        console.warn('OperatingSectorService.getAllWithRooms non adapté au nouveau service.');
        return [];
    }
    */

    /**
     * Met à jour les IDs des salles associées à un secteur - DÉPEND DE OPERATINGROOMSERVICE
     */
    /*
    public updateRooms(sectorId: string, roomIds: string[]): OperatingSector | null {
        // ... ancienne logique ...
        console.warn('OperatingSectorService.updateRooms non adapté au nouveau service.');
        return null;
    }
    */
}

// Exporter une instance pour une utilisation facile (singleton pattern simple)
// export const operatingSectorService = new OperatingSectorService(); // Déjà fait dans le hook 