/**
 * Types et interfaces pour le module de planification du bloc opératoire
 */

// Statuts possibles pour une salle d'opération
export type OperatingRoomStatus = 'DISPONIBLE' | 'OCCUPE' | 'MAINTENANCE' | 'HORS_SERVICE';

// Niveaux de priorité pour les interventions
export type SurgeryPriority = 'NORMALE' | 'URGENTE' | 'SEMI_URGENTE';

// Statuts des interventions
export type SurgeryStatus = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';

/**
 * Interface définissant une salle d'opération
 */
export interface OperatingRoom {
    id: string;
    numero: string;
    nom: string;
    secteurId: string;
    description?: string;
    capacite?: {
        maxPatientsParJour?: number;
        dureeInterventionMoyenne?: number;
    };
    equipements?: string[];
    estActif: boolean;
    lastMaintenanceDate?: Date;
    nextMaintenanceDate?: Date;
    status?: OperatingRoomStatus;
}

/**
 * Interface définissant un secteur opératoire
 */
export interface OperatingSector {
    id: string;
    nom: string;
    description?: string;
    couleur: string;
    salles: string[]; // IDs des salles associées à ce secteur
    specialites?: string[];
    estActif: boolean;
    requiresSpecificSkills?: boolean;
    supervisionSpeciale?: boolean;
    responsableId?: string; // ID du responsable de secteur
}

/**
 * Interface définissant le profil d'un chirurgien
 */
export interface SurgeonProfile {
    id: string;
    userId: string;
    specialites: string[];
    competences: string[];
    preferences: {
        joursPreferesId?: string[]; // IDs des jours préférés
        sallesPreferesId?: string[]; // IDs des salles préférées
        heureDebutPreferee?: string; // Format "HH:MM"
        heureFinPreferee?: string; // Format "HH:MM"
        dureeInterventionMin?: number; // En minutes
        dureeInterventionMax?: number; // En minutes
        pauseEntreInterventions?: number; // En minutes
    };
    disponibilite: {
        joursDeTravail: number[]; // 0-6 (dimanche-samedi)
        heureDebut: string; // Format "HH:MM"
        heureFin: string; // Format "HH:MM"
    };
    congesId?: string[]; // IDs des périodes de congés
    estActif: boolean;
    dateCreation: Date;
    dateMiseAJour: Date;
}

/**
 * Interface définissant une assignation de salle d'opération
 */
export interface OperatingAssignment {
    id: string;
    date: string; // Format "YYYY-MM-DD"
    salleId: string;
    chirurgienId?: string;
    anesthesisteId?: string;
    infirmierId?: string[];
    heureDebut: string; // Format "HH:MM"
    heureFin: string; // Format "HH:MM"
    patient?: {
        id?: string;
        nom?: string;
        prenom?: string;
        age?: number;
        numeroPatient?: string;
    };
    typeIntervention?: string;
    description?: string;
    note?: string;
    priorite: SurgeryPriority;
    statut: SurgeryStatus;
    materielsRequis?: string[];
    creePar: string; // ID de l'utilisateur qui a créé l'assignation
    dateCreation: Date;
    dateMiseAJour: Date;
}

/**
 * Interface définissant une règle de supervision pour les salles d'opération
 */
export interface OperatingSupervisionRule {
    id: string;
    nom: string;
    description?: string;
    secteurId?: string;
    type: 'BASIQUE' | 'SPECIFIQUE' | 'EXCEPTION';
    conditions: {
        maxSallesParMAR: number;
        maxSallesExceptionnel?: number;
        supervisionInterne?: boolean;
        supervisionContigues?: boolean;
        competencesRequises?: string[];
        supervisionDepuisAutreSecteur?: string[];
        incompatibilites?: string[];
    };
    priorite: number;
    estActif: boolean;
}

/**
 * Interface définissant un planning journalier du bloc opératoire
 */
export interface OperatingDayPlanning {
    id: string;
    date: string; // Format "YYYY-MM-DD"
    assignations: OperatingAssignment[];
    validationStatus: 'BROUILLON' | 'PROPOSE' | 'VALIDE' | 'PUBLIE';
    validePar?: string;
    dateValidation?: Date;
    notes?: string;
    estVerrouille: boolean;
    dateCreation: Date;
    dateMiseAJour: Date;
} 