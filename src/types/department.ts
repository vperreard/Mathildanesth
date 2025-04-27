/**
 * Représente un département médical dans l'établissement
 */
export interface Department {
    /** Identifiant unique du département */
    id: string;
    /** Nom du département */
    name: string;
    /** Description du département */
    description: string;
    /** Liste des identifiants des médecins affectés au département */
    doctorIds: string[];
    /** Exigences de garde pour ce département */
    shiftRequirements: ShiftRequirement[];
    /** Date de création du département */
    createdAt: Date;
    /** Dernière mise à jour du département */
    updatedAt: Date;
}

/**
 * Définit les exigences de garde pour un département
 */
export interface ShiftRequirement {
    /** Type de garde (jour, nuit, weekend, etc.) */
    shiftType: string;
    /** Nombre de médecins requis pour ce type de garde */
    doctorsRequired: number;
    /** Spécialités requises pour cette garde */
    requiredSpecialties?: string[];
    /** Jours de la semaine concernés (0-6, où 0 est dimanche) */
    daysOfWeek: number[];
    /** Indique si cette exigence s'applique aux jours fériés */
    includeHolidays: boolean;
}

/**
 * Représente un service médical pouvant regrouper plusieurs départements
 */
export interface Service {
    /** Identifiant unique du service */
    id: string;
    /** Nom du service */
    name: string;
    /** Description du service */
    description: string;
    /** Liste des identifiants des départements rattachés à ce service */
    departmentIds: string[];
    /** Identifiant du médecin chef de service */
    headDoctorId: string;
} 