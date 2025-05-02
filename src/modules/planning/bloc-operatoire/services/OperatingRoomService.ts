import { v4 as uuidv4 } from 'uuid';
import { OperatingRoom, OperatingSector } from '../types';
import { logError } from '@/lib/logger';

/**
 * Service de gestion des salles d'opération
 * Permet de créer, lire, mettre à jour et supprimer des salles d'opération
 */
export class OperatingRoomService {
    private rooms: Map<string, OperatingRoom> = new Map();
    private sectors: Map<string, OperatingSector> = new Map();

    // Erreurs possibles
    private static readonly ERRORS = {
        ROOM_NOT_FOUND: 'Salle d\'opération non trouvée',
        SECTOR_NOT_FOUND: 'Secteur non trouvé',
        ROOM_IN_USE: 'La salle d\'opération est utilisée dans des plannings existants',
        CREATION_FAILED: 'Échec de la création de la salle d\'opération',
        UPDATE_FAILED: 'Échec de la mise à jour de la salle d\'opération',
        INVALID_DATA: 'Données de salle d\'opération invalides'
    };

    constructor() {
        this.loadData();
    }

    /**
     * Charge les données initiales (à remplacer par un appel API)
     * @private
     */
    private loadData(): void {
        // Cette méthode pourrait charger des données depuis une API ou un localStorage
        // Pour l'instant, c'est juste un placeholder
        try {
            // Simulation de chargement

            // Si dans un environnement de développement, on ajoute des données de test
            if (process.env.NODE_ENV === 'development') {
                this.initializeTestData();
            }
        } catch (error) {
            logError({
                message: 'Erreur lors du chargement des données des salles d\'opération',
                context: { error }
            });
        }
    }

    /**
     * Initialise des données de test (uniquement en développement)
     * @private
     */
    private initializeTestData(): void {
        // Créer quelques secteurs de test
        const secteur1: OperatingSector = {
            id: uuidv4(),
            nom: 'Orthopédie',
            description: 'Secteur dédié à l\'orthopédie',
            couleur: '#FF5733',
            salles: [],
            specialites: ['Orthopédie générale', 'Chirurgie du genou', 'Chirurgie de la hanche'],
            estActif: true
        };

        const secteur2: OperatingSector = {
            id: uuidv4(),
            nom: 'Cardiologie',
            description: 'Secteur dédié à la cardiologie',
            couleur: '#3385FF',
            salles: [],
            specialites: ['Cardiologie générale', 'Chirurgie cardiaque'],
            estActif: true
        };

        this.sectors.set(secteur1.id, secteur1);
        this.sectors.set(secteur2.id, secteur2);

        // Créer quelques salles de test pour chaque secteur
        const salle1: OperatingRoom = {
            id: uuidv4(),
            numero: '101',
            nom: 'Salle Orthopédie 1',
            secteurId: secteur1.id,
            description: 'Salle principale d\'orthopédie',
            equipements: ['Arthroscope', 'Table orthopédique'],
            estActif: true,
            status: 'DISPONIBLE'
        };

        const salle2: OperatingRoom = {
            id: uuidv4(),
            numero: '102',
            nom: 'Salle Orthopédie 2',
            secteurId: secteur1.id,
            description: 'Salle secondaire d\'orthopédie',
            equipements: ['Arthroscope', 'Table orthopédique', 'Équipement arthroscopie'],
            estActif: true,
            status: 'DISPONIBLE'
        };

        const salle3: OperatingRoom = {
            id: uuidv4(),
            numero: '201',
            nom: 'Salle Cardiologie 1',
            secteurId: secteur2.id,
            description: 'Salle principale de cardiologie',
            equipements: ['Moniteur cardiaque', 'Défibrillateur'],
            estActif: true,
            status: 'DISPONIBLE'
        };

        this.rooms.set(salle1.id, salle1);
        this.rooms.set(salle2.id, salle2);
        this.rooms.set(salle3.id, salle3);

        // Mettre à jour les références de salles dans les secteurs
        secteur1.salles.push(salle1.id, salle2.id);
        secteur2.salles.push(salle3.id);
    }

    /**
     * Récupère toutes les salles d'opération
     * @returns Liste des salles d'opération
     */
    public getAll(): OperatingRoom[] {
        return Array.from(this.rooms.values());
    }

    /**
     * Récupère une salle d'opération par son ID
     * @param id ID de la salle d'opération
     * @returns La salle d'opération ou null si non trouvée
     */
    public getById(id: string): OperatingRoom | null {
        return this.rooms.get(id) || null;
    }

    /**
     * Récupère les salles d'opération d'un secteur spécifique
     * @param sectorId ID du secteur
     * @returns Liste des salles d'opération du secteur
     */
    public getSectorRooms(sectorId: string): OperatingRoom[] {
        return Array.from(this.rooms.values()).filter(room => room.secteurId === sectorId);
    }

    /**
     * Crée une nouvelle salle d'opération
     * @param data Données de la salle d'opération (sans ID)
     * @returns La salle d'opération créée
     * @throws Erreur si la création échoue
     */
    public create(data: Omit<OperatingRoom, 'id'>): OperatingRoom {
        try {
            // Vérifier que le secteur existe
            const sector = this.sectors.get(data.secteurId);
            if (!sector) {
                throw new Error(OperatingRoomService.ERRORS.SECTOR_NOT_FOUND);
            }

            // Générer un ID unique
            const id = uuidv4();

            // Créer la salle
            const room: OperatingRoom = {
                ...data,
                id
            };

            // Ajouter à la Map
            this.rooms.set(id, room);

            // Mettre à jour le secteur
            sector.salles.push(id);

            return room;
        } catch (error) {
            logError({
                message: 'Erreur lors de la création d\'une salle d\'opération',
                context: { data, error }
            });
            throw error;
        }
    }

    /**
     * Met à jour une salle d'opération existante
     * @param id ID de la salle à mettre à jour
     * @param data Données partielles de mise à jour
     * @returns La salle d'opération mise à jour
     * @throws Erreur si la mise à jour échoue
     */
    public update(id: string, data: Partial<Omit<OperatingRoom, 'id'>>): OperatingRoom {
        try {
            // Vérifier que la salle existe
            const existingRoom = this.rooms.get(id);
            if (!existingRoom) {
                throw new Error(OperatingRoomService.ERRORS.ROOM_NOT_FOUND);
            }

            // Si on change de secteur, mettre à jour les références
            if (data.secteurId && data.secteurId !== existingRoom.secteurId) {
                // Vérifier que le nouveau secteur existe
                const newSector = this.sectors.get(data.secteurId);
                if (!newSector) {
                    throw new Error(OperatingRoomService.ERRORS.SECTOR_NOT_FOUND);
                }

                // Retirer la salle de l'ancien secteur
                const oldSector = this.sectors.get(existingRoom.secteurId);
                if (oldSector) {
                    oldSector.salles = oldSector.salles.filter(salleId => salleId !== id);
                }

                // Ajouter la salle au nouveau secteur
                newSector.salles.push(id);
            }

            // Mettre à jour la salle
            const updatedRoom: OperatingRoom = {
                ...existingRoom,
                ...data
            };

            // Enregistrer la mise à jour
            this.rooms.set(id, updatedRoom);

            return updatedRoom;
        } catch (error) {
            logError({
                message: `Erreur lors de la mise à jour de la salle d'opération ${id}`,
                context: { id, data, error }
            });
            throw error;
        }
    }

    /**
     * Supprime une salle d'opération
     * @param id ID de la salle à supprimer
     * @returns true si la suppression a réussi, false sinon
     * @throws Erreur si la suppression échoue
     */
    public delete(id: string): boolean {
        try {
            // Vérifier que la salle existe
            const room = this.rooms.get(id);
            if (!room) {
                return false;
            }

            // Ici, on pourrait vérifier si la salle est utilisée dans des plannings
            // Pour l'instant, on simule juste cette vérification
            const isUsedInPlannings = false; // À remplacer par une vérification réelle

            if (isUsedInPlannings) {
                throw new Error(OperatingRoomService.ERRORS.ROOM_IN_USE);
            }

            // Supprimer la référence dans le secteur
            const sector = this.sectors.get(room.secteurId);
            if (sector) {
                sector.salles = sector.salles.filter(salleId => salleId !== id);
            }

            // Supprimer la salle
            return this.rooms.delete(id);
        } catch (error) {
            logError({
                message: `Erreur lors de la suppression de la salle d'opération ${id}`,
                context: { id, error }
            });
            throw error;
        }
    }

    /**
     * Récupère tous les secteurs
     * @returns Liste des secteurs
     */
    public getAllSectors(): OperatingSector[] {
        return Array.from(this.sectors.values());
    }

    /**
     * Récupère un secteur par son ID
     * @param id ID du secteur
     * @returns Le secteur ou null si non trouvé
     */
    public getSectorById(id: string): OperatingSector | null {
        return this.sectors.get(id) || null;
    }

    /**
     * Vérifie si une salle est utilisée dans des plannings existants
     * @param roomId ID de la salle
     * @returns true si la salle est utilisée, false sinon
     */
    public isRoomUsedInPlannings(roomId: string): boolean {
        // Simulation - à remplacer par une vérification réelle
        return false;
    }
}

// Exporter une instance singleton du service
export const operatingRoomService = new OperatingRoomService(); 