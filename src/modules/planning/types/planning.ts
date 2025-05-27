/**
 * Représente un planning
 */
export interface Planning {
    id: string;
    userId: string;         // Utilisateur responsable
    startDate: Date;        // Date de début
    endDate: Date;          // Date de fin
    department: string;     // Service concerné
    isPublished: boolean;   // Statut de publication
    lastUpdatedFields?: string[]; // Champs modifiés lors de la dernière mise à jour
    affectedUsers?: string[]; // IDs des utilisateurs affectés par ce planning
    events?: PlanningEvent[]; // Événements du planning
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Type d'événement dans un planning
 */
export enum PlanningEventType {
    SHIFT = 'SHIFT',               // Poste de travail
    MEETING = 'MEETING',           // Réunion
    TRAINING = 'TRAINING',         // Formation
    LEAVE = 'LEAVE',               // Congé
    ABSENCE = 'ABSENCE',           // Autre absence
    ON_CALL = 'ON_CALL',           // Astreinte
    OTHER = 'OTHER'                // Autre
}

/**
 * Événement dans un planning
 */
export interface PlanningEvent {
    id: string;
    userId: string;             // Utilisateur concerné
    planningId: string;         // ID du planning
    type: PlanningEventType;    // Type d'événement
    title: string;              // Titre de l'événement
    description?: string;       // Description
    startDate: Date;            // Date et heure de début
    endDate: Date;              // Date et heure de fin
    location?: string;          // Localisation
    isRecurring?: boolean;      // Est-ce récurrent?
    recurrencePattern?: any;    // Modèle de récurrence (si récurrent)
    linkedLeaveId?: string;     // ID d'un congé lié (si type LEAVE)
    linkedAbsenceId?: string;   // ID d'une absence liée (si type ABSENCE)
    metadata?: Record<string, any>; // Métadonnées additionnelles
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Conflit dans un planning
 */
export interface PlanningConflict {
    id: string;
    userId: string;             // Utilisateur concerné
    planningId: string;         // ID du planning
    type: string;               // Type de conflit
    startDate: Date;            // Date et heure de début du conflit
    endDate: Date;              // Date et heure de fin du conflit
    events: string[];           // IDs des événements en conflit
    severity: 'info' | 'warning' | 'error'; // Sévérité du conflit
    isResolved: boolean;        // Conflit résolu ?
    resolution?: string;        // Méthode de résolution
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Statut de disponibilité
 */
export enum AvailabilityStatus {
    AVAILABLE = 'AVAILABLE',        // Disponible
    PARTIALLY_AVAILABLE = 'PARTIALLY_AVAILABLE', // Partiellement disponible
    UNAVAILABLE = 'UNAVAILABLE'     // Indisponible
}

/**
 * Représente la disponibilité d'un utilisateur sur une période
 */
export interface UserAvailability {
    userId: string;
    startDate: Date;
    endDate: Date;
    status: AvailabilityStatus;
    reason?: string;              // Raison de la disponibilité/indisponibilité
    availableHours?: number;      // Heures disponibles (si PARTIALLY_AVAILABLE)
    events?: string[];            // IDs des événements liés
}

/**
 * Modèle de planning
 */
export interface PlanningTemplate {
    id: string;
    name: string;                  // Nom du modèle
    description: string;           // Description
    department: string;            // Service concerné
    durationDays: number;          // Durée en jours
    events: PlanningTemplateEvent[]; // Événements du modèle
    createdBy: string;             // Créé par
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Événement dans un modèle de planning
 */
export interface PlanningTemplateEvent {
    id: string;
    type: PlanningEventType;       // Type d'événement
    title: string;                 // Titre
    description?: string;          // Description
    dayOffset: number;             // Jour relatif au début (0 = premier jour)
    startTime: string;             // Heure de début (format "HH:MM")
    endTime: string;               // Heure de fin (format "HH:MM")
    userRole?: string;             // Rôle utilisateur (si applicable)
    metadata?: Record<string, any>; // Métadonnées additionnelles
}

/**
 * Statistiques de planning
 */
export interface PlanningStatistics {
    id: string;
    planningId: string;            // ID du planning
    period: {
        startDate: Date;
        endDate: Date;
    };
    departmentId: string;          // ID du service
    userCount: number;             // Nombre d'utilisateurs
    eventCount: number;            // Nombre d'événements
    eventTypeDistribution: Record<PlanningEventType, number>; // Distribution par type
    averageHoursPerUser: number;   // Moyenne d'heures par utilisateur
    conflictCount: number;         // Nombre de conflits détectés
    userStats: UserPlanningStats[]; // Statistiques par utilisateur
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Statistiques de planning par utilisateur
 */
export interface UserPlanningStats {
    userId: string;
    totalHours: number;            // Heures totales
    eventCount: number;            // Nombre d'événements
    byType: Record<PlanningEventType, { count: number, hours: number }>; // Stats par type
    conflicts: number;             // Nombre de conflits
}

export default Planning; 