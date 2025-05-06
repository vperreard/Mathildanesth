import { v4 as uuidv4 } from 'uuid';
import { OperatingSector, OperatingRoom } from '../types';
import { operatingRoomService } from './OperatingRoomService';

/**
 * Service pour gérer les secteurs opératoires
 * Fournit les méthodes CRUD pour les secteurs
 */
export class OperatingSectorService {
    private sectors: Map<string, OperatingSector> = new Map();

    // Erreurs possibles
    private static readonly ERRORS = {
        SECTOR_NOT_FOUND: 'Secteur non trouvé',
        CREATION_FAILED: 'Échec de la création du secteur',
        UPDATE_FAILED: 'Échec de la mise à jour du secteur',
        DELETE_FAILED: 'Échec de la suppression du secteur',
        HAS_ROOMS: 'Impossible de supprimer un secteur qui contient des salles',
        INVALID_DATA: 'Données de secteur invalides'
    };

    constructor() {
        this.loadData();
    }

    /**
     * Charge les données initiales des secteurs
     */
    private loadData(): void {
        try {
            // Secteurs initiaux pour les tests
            const initialSectors: OperatingSector[] = [
                {
                    id: uuidv4(),
                    nom: 'Chirurgie Générale',
                    description: 'Secteur principal pour la chirurgie générale',
                    couleur: '#4f46e5', // indigo
                    estActif: true,
                    salles: []
                },
                {
                    id: uuidv4(),
                    nom: 'Orthopédie',
                    description: 'Secteur dédié à la chirurgie orthopédique',
                    couleur: '#059669', // emerald
                    estActif: true,
                    salles: []
                },
                {
                    id: uuidv4(),
                    nom: 'Cardiologie',
                    description: 'Interventions cardiaques et vasculaires',
                    couleur: '#dc2626', // red
                    estActif: true,
                    salles: []
                },
                {
                    id: uuidv4(),
                    nom: 'Neurochirurgie',
                    description: 'Interventions neurologiques spécialisées',
                    couleur: '#7c3aed', // violet
                    estActif: true,
                    salles: []
                },
                {
                    id: uuidv4(),
                    nom: 'Pédiatrie',
                    description: 'Chirurgie pour enfants',
                    couleur: '#0ea5e9', // sky
                    estActif: false,
                    salles: []
                }
            ];

            // Ajouter les secteurs à la Map
            initialSectors.forEach(sector => {
                this.sectors.set(sector.id, sector);
            });

            console.log(`${initialSectors.length} secteurs chargés avec succès`);
        } catch (error) {
            console.error('Erreur lors du chargement des données initiales des secteurs', error);
        }
    }

    /**
     * Récupère tous les secteurs
     * @returns Liste de tous les secteurs
     */
    public getAll(): OperatingSector[] {
        return Array.from(this.sectors.values());
    }

    /**
     * Récupère un secteur par son ID
     * @param id ID du secteur à récupérer
     * @returns Le secteur trouvé ou null s'il n'existe pas
     */
    public getById(id: string): OperatingSector | null {
        const sector = this.sectors.get(id);
        return sector || null;
    }

    /**
     * Récupère tous les secteurs actifs
     * @returns Liste des secteurs actifs
     */
    public getActive(): OperatingSector[] {
        return this.getAll().filter(sector => sector.estActif);
    }

    /**
     * Crée un nouveau secteur
     * @param data Données du secteur à créer
     * @returns Le secteur créé
     */
    public create(data: Omit<OperatingSector, 'id'>): OperatingSector {
        try {
            // Créer un nouvel ID unique pour le secteur
            const id = uuidv4();

            // Créer le secteur avec ses données
            const newSector: OperatingSector = {
                id,
                ...data,
                salles: data.salles || [] // S'assurer que salles existe
            };

            // Ajouter à la Map
            this.sectors.set(id, newSector);

            console.log(`Secteur '${newSector.nom}' créé avec succès (ID: ${id})`);
            return newSector;
        } catch (error) {
            console.error(`Erreur lors de la création du secteur: ${data.nom}`, error);
            throw new Error(OperatingSectorService.ERRORS.CREATION_FAILED);
        }
    }

    /**
     * Met à jour un secteur existant
     * @param id ID du secteur à mettre à jour
     * @param data Données partielles du secteur à mettre à jour
     * @returns Le secteur mis à jour ou null si non trouvé
     */
    public update(id: string, data: Partial<OperatingSector>): OperatingSector {
        try {
            const existingSector = this.sectors.get(id);

            if (!existingSector) {
                console.warn(`Tentative de mise à jour d'un secteur inexistant (ID: ${id})`);
                throw new Error(OperatingSectorService.ERRORS.SECTOR_NOT_FOUND);
            }

            // Mettre à jour le secteur
            const updatedSector: OperatingSector = {
                ...existingSector,
                ...data,
                id, // S'assurer que l'ID n'est pas modifié
                salles: data.salles || existingSector.salles // Maintenir les salles existantes si non spécifiées
            };

            // Enregistrer la mise à jour
            this.sectors.set(id, updatedSector);

            console.log(`Secteur '${updatedSector.nom}' mis à jour avec succès (ID: ${id})`);
            return updatedSector;
        } catch (error) {
            console.error(`Erreur lors de la mise à jour du secteur (ID: ${id})`, error);
            throw new Error(OperatingSectorService.ERRORS.UPDATE_FAILED);
        }
    }

    /**
     * Supprime un secteur
     * @param id ID du secteur à supprimer
     * @returns true si la suppression a réussi, false sinon
     */
    public delete(id: string): boolean {
        try {
            const sector = this.sectors.get(id);

            if (!sector) {
                console.warn(`Tentative de suppression d'un secteur inexistant (ID: ${id})`);
                return false;
            }

            // Vérifier si des salles sont associées à ce secteur
            const rooms = operatingRoomService.getSectorRooms(id);
            if (rooms.length > 0) {
                console.warn(`Impossible de supprimer le secteur '${sector.nom}' car il contient ${rooms.length} salle(s)`);
                throw new Error(OperatingSectorService.ERRORS.HAS_ROOMS);
            }

            // Supprimer le secteur
            const result = this.sectors.delete(id);

            if (result) {
                console.log(`Secteur '${sector.nom}' supprimé avec succès (ID: ${id})`);
            }

            return result;
        } catch (error) {
            console.error(`Erreur lors de la suppression du secteur (ID: ${id})`, error);
            throw new Error(OperatingSectorService.ERRORS.DELETE_FAILED);
        }
    }

    /**
     * Récupère un secteur avec les salles associées
     * @param id ID du secteur
     * @returns Le secteur avec ses salles ou null si non trouvé
     */
    public getWithRooms(id: string): (OperatingSector & { roomObjects: OperatingRoom[] }) | null {
        const sector = this.getById(id);

        if (!sector) {
            return null;
        }

        const roomObjects = operatingRoomService.getSectorRooms(id);

        return {
            ...sector,
            roomObjects
        };
    }

    /**
     * Récupère tous les secteurs avec leurs salles associées
     * @returns Liste des secteurs avec leurs salles
     */
    public getAllWithRooms(): (OperatingSector & { roomObjects: OperatingRoom[] })[] {
        return this.getAll().map(sector => {
            const roomObjects = operatingRoomService.getSectorRooms(sector.id);
            return {
                ...sector,
                roomObjects
            };
        });
    }

    /**
     * Met à jour les IDs des salles associées à un secteur
     * @param sectorId ID du secteur
     * @param roomIds Liste des IDs de salles
     * @returns Le secteur mis à jour ou null si non trouvé
     */
    public updateRooms(sectorId: string, roomIds: string[]): OperatingSector | null {
        const sector = this.getById(sectorId);

        if (!sector) {
            return null;
        }

        const updatedSector = {
            ...sector,
            salles: roomIds
        };

        this.sectors.set(sectorId, updatedSector);
        return updatedSector;
    }
}

// Export d'une instance unique du service (pattern Singleton)
export const operatingSectorService = new OperatingSectorService(); 