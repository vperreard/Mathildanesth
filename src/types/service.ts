/**
 * Représente un service hospitalier
 */
export interface Service {
    /** Identifiant unique du service */
    id: string;
    /** Nom du service */
    name: string;
    /** Code du service */
    code: string;
    /** Description du service */
    description?: string;
    /** Identifiant de l'établissement */
    facilityId: string;
    /** Nombre de lits */
    bedCount: number;
    /** Position physique (étage, aile...) */
    location?: string;
    /** Médecin chef de service */
    chiefDoctorId?: string;
    /** Liste des identifiants de médecins */
    doctorIds: string[];
    /** Types de garde requis pour ce service */
    requiredDutyTypes: string[];
    /** Nombre minimal de médecins requis par type de garde */
    minimumStaffingByDutyType: Record<string, number>;
    /** Compétences spécifiques requises */
    requiredSkills?: string[];
    /** Capacité à former des internes */
    teachingCapable: boolean;
    /** Niveau d'activité (échelle 1-5) */
    activityLevel: number;
    /** Types d'activités du service */
    activityTypes: string[];
    /** Heures d'ouverture (pour services non-24/7) */
    openingHours?: {
        /** Heure d'ouverture (format 24h) */
        open: string;
        /** Heure de fermeture (format 24h) */
        close: string;
        /** Jours d'ouverture (0=dimanche, 6=samedi) */
        days: number[];
    };
    /** Ouvert 24/7 */
    isOpen24x7: boolean;
    /** Accepte les urgences */
    acceptsEmergencies: boolean;
    /** Numéro de téléphone du service */
    phoneNumber?: string;
    /** Email du service */
    email?: string;
    /** Adresse pour les correspondances */
    mailingAddress?: string;
    /** Statut (actif, en maintenance, fermé) */
    status: "ACTIF" | "MAINTENANCE" | "FERME";
    /** Date de création */
    createdAt: Date;
    /** Dernière mise à jour */
    updatedAt: Date;
}

/**
 * Statistiques d'un service
 */
export interface ServiceStatistics {
    /** Identifiant du service */
    serviceId: string;
    /** Période de référence */
    period: {
        /** Date de début */
        startDate: Date;
        /** Date de fin */
        endDate: Date;
    };
    /** Nombre total de patients traités */
    patientCount: number;
    /** Durée moyenne de séjour (en jours) */
    averageStayDuration: number;
    /** Taux d'occupation des lits (%) */
    bedOccupancyRate: number;
    /** Nombre d'admissions sur la période */
    admissionCount: number;
    /** Nombre de sorties sur la période */
    dischargeCount: number;
    /** Taux de réadmission (%) */
    readmissionRate?: number;
    /** Nombre de gardes assurées */
    dutyCount: number;
    /** Répartition des types de gardes */
    dutyTypeDistribution: Record<string, number>;
    /** Incidents signalés */
    reportedIncidents: number;
    /** Évaluations moyennes des gardes (1-5) */
    averageDutyRating?: number;
    /** Date de génération des statistiques */
    generatedAt: Date;
}

/**
 * Configuration des gardes pour un service
 */
export interface ServiceDutyConfiguration {
    /** Identifiant unique */
    id: string;
    /** Identifiant du service */
    serviceId: string;
    /** Types de garde disponibles */
    availableDutyTypes: string[];
    /** Durée standard d'une garde (en heures) */
    standardDutyDuration: number;
    /** Horaires de début typiques */
    typicalStartTimes: string[];
    /** Configuration des équipes */
    staffingRequirements: {
        /** Type de garde */
        dutyType: string;
        /** Nombre de médecins requis */
        requiredDoctorCount: number;
        /** Spécialités requises */
        requiredSpecialties?: string[];
        /** Niveau d'expérience minimal */
        minimumExperienceLevel?: number;
        /** Compétences spécifiques requises */
        requiredSkills?: string[];
    }[];
    /** Règles de rotation */
    rotationRules?: {
        /** Jours minimaux entre deux gardes */
        minDaysBetweenDuties: number;
        /** Distribution équitable entre médecins */
        enforceEqualDistribution: boolean;
        /** Considérer les préférences des médecins */
        considerDoctorPreferences: boolean;
        /** Prioriser l'expérience pour certaines gardes */
        prioritizeExperienceForDutyTypes?: string[];
    };
    /** Procédures spécifiques */
    procedures?: string[];
    /** Date de création */
    createdAt: Date;
    /** Dernière mise à jour */
    updatedAt: Date;
}

/**
 * Interface pour les activités spécifiques d'un service
 */
export interface ServiceActivity {
    /** Identifiant unique */
    id: string;
    /** Identifiant du service */
    serviceId: string;
    /** Nom de l'activité */
    name: string;
    /** Description */
    description: string;
    /** Type d'activité */
    type: string;
    /** Fréquence (quotidienne, hebdomadaire, mensuelle) */
    frequency: "QUOTIDIENNE" | "HEBDOMADAIRE" | "MENSUELLE" | "AUTRE";
    /** Planification */
    planningMedical?: {
        /** Jours (0=dimanche, 6=samedi) */
        days?: number[];
        /** Heure de début */
        startTime?: string;
        /** Heure de fin */
        endTime?: string;
        /** Dates spécifiques pour les activités non récurrentes */
        specificDates?: Date[];
    };
    /** Ressources requises */
    requiredResources?: string[];
    /** Compétences requises */
    requiredSkills?: string[];
    /** Charge de travail estimée (heures) */
    estimatedWorkload?: number;
    /** Médecins responsables */
    responsibleDoctorIds?: string[];
    /** Statut (actif, en pause, terminé) */
    status: "ACTIF" | "EN_PAUSE" | "TERMINE";
    /** Date de création */
    createdAt: Date;
    /** Dernière mise à jour */
    updatedAt: Date;
} 