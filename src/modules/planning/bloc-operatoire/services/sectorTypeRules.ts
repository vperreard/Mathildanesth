/**
 * Service de règles spécifiques pour les catégories de secteurs et types de salles
 * Ce service contient les règles métier spécifiques à chaque type de secteur et de salle
 */

import { SECTOR_CATEGORY_TYPES } from '../constants/sectorCategoryTypes';
import { ROOM_TYPES } from '../constants/roomTypes';

/**
 * Interface pour les règles spécifiques au type de secteur
 */
export interface SectorTypeRules {
    maxRoomsPerSupervisor: number;
    requiresSpecialistSupervision: boolean;
    requiresContiguousRooms: boolean;
    allowedRoomTypes: string[];
    requiredCompetences: string[];
}

/**
 * Interface pour les règles spécifiques au type de salle
 */
export interface RoomTypeRules {
    requiresDedicatedSupervision: boolean;
    maxPatientsPerDay: number;
    averageProcedureDuration: number; // en minutes
    allowedSpecialties: string[];
    requiredEquipment: string[];
}

/**
 * Règles spécifiques pour chaque catégorie de secteur
 */
export const SECTOR_CATEGORY_RULES: Record<string, SectorTypeRules> = {
    [SECTOR_CATEGORY_TYPES.STANDARD]: {
        maxRoomsPerSupervisor: 2,
        requiresSpecialistSupervision: false,
        requiresContiguousRooms: true,
        allowedRoomTypes: [ROOM_TYPES.STANDARD, ROOM_TYPES.CONSULTATION],
        requiredCompetences: []
    },
    [SECTOR_CATEGORY_TYPES.HYPERASEPTIQUE]: {
        maxRoomsPerSupervisor: 1,
        requiresSpecialistSupervision: true,
        requiresContiguousRooms: true,
        allowedRoomTypes: [ROOM_TYPES.STANDARD],
        requiredCompetences: ['Asepsie avancée']
    },
    [SECTOR_CATEGORY_TYPES.OPHTALMOLOGIE]: {
        maxRoomsPerSupervisor: 3,
        requiresSpecialistSupervision: true,
        requiresContiguousRooms: true,
        allowedRoomTypes: [ROOM_TYPES.STANDARD, ROOM_TYPES.CONSULTATION],
        requiredCompetences: ['Ophtalmologie']
    },
    [SECTOR_CATEGORY_TYPES.ENDOSCOPIE]: {
        maxRoomsPerSupervisor: 4,
        requiresSpecialistSupervision: true,
        requiresContiguousRooms: false,
        allowedRoomTypes: [ROOM_TYPES.STANDARD, ROOM_TYPES.CONSULTATION],
        requiredCompetences: ['Endoscopie']
    }
};

/**
 * Règles spécifiques pour chaque type de salle
 */
export const ROOM_TYPE_RULES: Record<string, RoomTypeRules> = {
    [ROOM_TYPES.STANDARD]: {
        requiresDedicatedSupervision: false,
        maxPatientsPerDay: 8,
        averageProcedureDuration: 60,
        allowedSpecialties: ['*'], // Toutes les spécialités
        requiredEquipment: []
    },
    [ROOM_TYPES.FIV]: {
        requiresDedicatedSupervision: true,
        maxPatientsPerDay: 6,
        averageProcedureDuration: 90,
        allowedSpecialties: ['Gynécologie', 'Obstétrique', 'PMA'],
        requiredEquipment: ['Équipement FIV', 'Microscope']
    },
    [ROOM_TYPES.CONSULTATION]: {
        requiresDedicatedSupervision: false,
        maxPatientsPerDay: 15,
        averageProcedureDuration: 30,
        allowedSpecialties: ['*'], // Toutes les spécialités
        requiredEquipment: ['Équipement de diagnostic']
    }
};

/**
 * Service pour obtenir les règles en fonction de la catégorie de secteur et du type de salle
 */
export class SectorTypeRulesService {
    /**
     * Retourne les règles spécifiques pour une catégorie de secteur
     * @param category La catégorie de secteur
     * @returns Les règles applicables à cette catégorie
     */
    public getSectorRules(category: string): SectorTypeRules {
        return SECTOR_CATEGORY_RULES[category] || SECTOR_CATEGORY_RULES[SECTOR_CATEGORY_TYPES.STANDARD];
    }

    /**
     * Retourne les règles spécifiques pour un type de salle
     * @param type Le type de salle
     * @returns Les règles applicables à ce type
     */
    public getRoomRules(type: string): RoomTypeRules {
        return ROOM_TYPE_RULES[type] || ROOM_TYPE_RULES[ROOM_TYPES.STANDARD];
    }

    /**
     * Vérifie si un type de salle est autorisé dans une catégorie de secteur
     * @param roomType Le type de salle
     * @param sectorCategory La catégorie de secteur
     * @returns true si le type de salle est autorisé dans ce secteur
     */
    public isRoomTypeAllowedInSector(roomType: string, sectorCategory: string): boolean {
        const sectorRules = this.getSectorRules(sectorCategory);
        return sectorRules.allowedRoomTypes.includes(roomType);
    }

    /**
     * Vérifie si une spécialité est autorisée dans un type de salle
     * @param specialty La spécialité
     * @param roomType Le type de salle
     * @returns true si la spécialité est autorisée dans ce type de salle
     */
    public isSpecialtyAllowedInRoomType(specialty: string, roomType: string): boolean {
        const roomRules = this.getRoomRules(roomType);
        return roomRules.allowedSpecialties.includes('*') || roomRules.allowedSpecialties.includes(specialty);
    }

    /**
     * Retourne le nombre maximum de salles qu'un superviseur peut gérer dans une catégorie de secteur
     * @param category La catégorie de secteur
     * @returns Le nombre maximum de salles
     */
    public getMaxRoomsPerSupervisor(category: string): number {
        return this.getSectorRules(category).maxRoomsPerSupervisor;
    }

    /**
     * Vérifie si des salles sont contiguës (adjacentes)
     * @param roomIds Les IDs des salles à vérifier
     * @returns true si les salles sont contiguës
     */
    public areRoomsContiguous(roomIds: number[]): boolean {
        // Dans une implémentation réelle, cette fonction utiliserait une logique
        // plus sophistiquée pour déterminer si les salles sont adjacentes.
        // Pour cet exemple, nous supposons qu'elles le sont si leurs IDs sont consécutifs.

        // Trier les IDs
        const sortedIds = [...roomIds].sort((a, b) => a - b);

        // Vérifier si tous les IDs sont consécutifs
        for (let i = 1; i < sortedIds.length; i++) {
            if (sortedIds[i] !== sortedIds[i - 1] + 1) {
                return false;
            }
        }

        return true;
    }
}

// Exporter une instance du service
export const sectorTypeRulesService = new SectorTypeRulesService(); 