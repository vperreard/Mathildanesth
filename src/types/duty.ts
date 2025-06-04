/**
 * Énumération des types de garde
 */
export enum DutyType {
    /** Garde standard de jour */
    JOUR = "JOUR",
    /** Garde de nuit */
    NUIT = "NUIT",
    /** Garde de weekend */
    WEEKEND = "WEEKEND",
    /** Garde de jour férié */
    JOUR_FERIE = "JOUR_FERIE",
    /** Astreinte à domicile */
    ASTREINTE = "ASTREINTE",
    /** Garde aux urgences */
    URGENCES = "URGENCES",
    /** Garde de réanimation */
    REANIMATION = "REANIMATION",
    /** Garde pour un événement spécial */
    EVENEMENT_SPECIAL = "EVENEMENT_SPECIAL"
}

/**
 * Énumération des statuts de garde
 */
export enum DutyStatus {
    /** Garde planifiée */
    PLANIFIEE = "PLANIFIEE",
    /** Garde confirmée */
    CONFIRMEE = "CONFIRMEE",
    /** Garde en cours */
    EN_COURS = "EN_COURS",
    /** Garde terminée */
    TERMINEE = "TERMINEE",
    /** Garde annulée */
    ANNULEE = "ANNULEE",
    /** Garde modifiée */
    MODIFIEE = "MODIFIEE"
}

/**
 * Énumération des niveaux de priorité
 */
export enum PriorityLevel {
    /** Priorité basse */
    BASSE = "BASSE",
    /** Priorité normale */
    NORMALE = "NORMALE",
    /** Priorité haute */
    HAUTE = "HAUTE",
    /** Priorité critique */
    CRITIQUE = "CRITIQUE"
}

/**
 * Interface pour les gardes
 */
export interface Duty {
    /** Identifiant unique */
    id: string;
    /** Type de garde */
    type: DutyType;
    /** Service concerné */
    serviceId: string;
    /** Date et heure de début */
    startTime: Date;
    /** Date et heure de fin */
    endTime: Date;
    /** Médecin assigné */
    assignedDoctorId?: string;
    /** Liste des médecins assignés (si équipe) */
    assignedDoctorIds?: string[];
    /** Statut actuel */
    status: DutyStatus;
    /** Niveau de priorité */
    priorityLevel: PriorityLevel;
    /** Compétences spéciales requises */
    requiredSkills?: string[];
    /** Notes additionnelles */
    notes?: string;
    /** Récurrence (hebdomadaire, mensuelle, etc.) */
    recurrence?: {
        /** Type de récurrence */
        type: "QUOTIDIENNE" | "HEBDOMADAIRE" | "MENSUELLE" | "PERSONNALISEE";
        /** Intervalles (jours, semaines, mois) */
        interval: number;
        /** Jours concernés (0=dimanche, 6=samedi) */
        daysOfWeek?: number[];
        /** Date de fin de récurrence */
        endDate?: Date;
        /** Occurrences maximales */
        maxOccurrences?: number;
    };
    /** Substitution possible */
    substitutionAllowed: boolean;
    /** Échange possible */
    exchangeAllowed: boolean;
    /** Rémunération spécifique */
    compensation?: {
        /** Montant de base */
        baseAmount: number;
        /** Devise */
        currency: string;
        /** Bonus */
        bonus?: number;
        /** Heures supplémentaires */
        extraHours?: number;
    };
    /** Historique des modifications */
    changeHistory?: {
        /** Date du changement */
        timestamp: Date;
        /** Utilisateur ayant effectué le changement */
        userId: string;
        /** Description du changement */
        description: string;
        /** Ancien statut */
        previousStatus?: DutyStatus;
        /** Ancien médecin assigné */
        previousDoctorId?: string;
    }[];
    /** Date de création */
    createdAt: Date;
    /** Dernière mise à jour */
    updatedAt: Date;
    /** Créé par */
    createdBy: string;
    /** Dernière mise à jour par */
    updatedBy: string;
}

/**
 * Interface pour les préférences de garde d'un médecin
 */
export interface DutyPreference {
    /** Identifiant unique */
    id: string;
    /** Identifiant du médecin */
    doctorId: string;
    /** Services préférés */
    preferredServiceIds?: string[];
    /** Types de gardes préférés */
    preferredDutyTypes?: DutyType[];
    /** Jours préférés (0=dimanche, 6=samedi) */
    preferredDays?: number[];
    /** Horaires préférés */
    preferredTimeSlots?: {
        /** Heure de début */
        startTime: string;
        /** Heure de fin */
        endTime: string;
        /** Jours concernés */
        days: number[];
    }[];
    /** Maximum de gardes par mois */
    maxDutiesPerMonth?: number;
    /** Maximum de gardes de nuit par mois */
    maxNightDutiesPerMonth?: number;
    /** Maximum de gardes de weekend par mois */
    maxWeekendDutiesPerMonth?: number;
    /** Jours indisponibles */
    unavailableDates?: Date[];
    /** Services à éviter */
    avoidServiceIds?: string[];
    /** Types de gardes à éviter */
    avoidDutyTypes?: DutyType[];
    /** Coéquipiers préférés */
    preferredCoworkerIds?: string[];
    /** Notification anticipée requise (jours) */
    advanceNoticeRequired?: number;
    /** Spécialités préférées */
    preferredSpecialties?: string[];
    /** Notes additionnelles */
    notes?: string;
    /** Date de création */
    createdAt: Date;
    /** Dernière mise à jour */
    updatedAt: Date;
}

/**
 * Interface pour les indisponibilités spécifiques aux gardes et astreintes
 * 
 * Cette interface permet aux médecins de spécifier leurs indisponibilités
 * de manière granulaire (garde seule, astreinte seule, ou les deux)
 */
export interface DutyUnavailability {
    /** Identifiant unique */
    id: string;
    /** Identifiant du médecin */
    doctorId: string;
    /** Date et heure de début de l'indisponibilité */
    startDate: Date;
    /** Date et heure de fin de l'indisponibilité */
    endDate: Date;
    /** Type d'indisponibilité spécifique */
    unavailableFor: 'DUTY_ONLY' | 'ON_CALL_ONLY' | 'BOTH';
    /** Type de récurrence */
    recurrenceType?: 'NONE' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
    /** Détails de récurrence */
    recurrenceDetails?: {
        /** Jours de la semaine (0=dimanche, 6=samedi) */
        daysOfWeek?: number[];
        /** Intervalle (ex: toutes les 2 semaines) */
        interval?: number;
        /** Date de fin de récurrence */
        endRecurrenceDate?: Date;
        /** Exceptions à la récurrence */
        exceptions?: Date[];
    };
    /** Raison de l'indisponibilité */
    reason?: string;
    /** Statut de validation */
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    /** Priorité de la demande */
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    /** Utilisateur ayant approuvé */
    approvedBy?: string;
    /** Date d'approbation */
    approvedAt?: Date;
    /** Raison du rejet (si applicable) */
    rejectionReason?: string;
    /** Commentaires administratifs */
    adminComments?: string;
    /** Indique si l'indisponibilité est flexible */
    isFlexible?: boolean;
    /** Alternative proposée (si flexible) */
    alternativeProposal?: {
        /** Dates alternatives */
        alternativeDates?: Date[];
        /** Types alternatifs */
        alternativeTypes?: ('DUTY_ONLY' | 'ON_CALL_ONLY' | 'BOTH')[];
        /** Commentaire sur l'alternative */
        comments?: string;
    };
    /** Date de création */
    createdAt: Date;
    /** Dernière mise à jour */
    updatedAt: Date;
}

/**
 * Interface pour la création d'une indisponibilité de garde
 */
export type DutyUnavailabilityCreateData = Omit<DutyUnavailability,
    'id' | 'status' | 'approvedBy' | 'approvedAt' | 'rejectionReason' | 'adminComments' | 'createdAt' | 'updatedAt'>;

/**
 * Interface pour la mise à jour d'une indisponibilité de garde
 */
export type DutyUnavailabilityUpdateData = Partial<Omit<DutyUnavailability,
    'id' | 'doctorId' | 'createdAt' | 'updatedAt'>>;

/**
 * Interface pour le traitement admin d'une indisponibilité
 */
export interface DutyUnavailabilityProcessData {
    status: 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
    adminComments?: string;
    alternativeProposal?: DutyUnavailability['alternativeProposal'];
}

/**
 * Interface pour les filtres de recherche d'indisponibilités de garde
 */
export interface DutyUnavailabilityFilter {
    doctorId?: string;
    status?: DutyUnavailability['status'];
    unavailableFor?: DutyUnavailability['unavailableFor'];
    priority?: DutyUnavailability['priority'];
    startDate?: Date;
    endDate?: Date;
    recurrenceType?: DutyUnavailability['recurrenceType'];
}

/**
 * Interface pour les conflits avec les indisponibilités de garde
 */
export interface DutyUnavailabilityConflict {
    id: string;
    unavailabilityId: string;
    conflictType: 'EXISTING_DUTY' | 'EXISTING_ON_CALL' | 'LEAVE' | 'OTHER_UNAVAILABILITY';
    conflictItemId: string;
    conflictDate: Date;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    canBeResolved: boolean;
    resolution?: {
        type: 'MODIFY_UNAVAILABILITY' | 'MODIFY_EXISTING' | 'ACCEPT_CONFLICT';
        description: string;
        requiredActions: string[];
    };
    createdAt: Date;
}

/**
 * Interface pour les demandes de substitution
 */
export interface DutySubstitutionRequest {
    /** Identifiant unique */
    id: string;
    /** Identifiant de la garde */
    dutyId: string;
    /** Médecin demandeur */
    requestingDoctorId: string;
    /** Médecin remplaçant (si connu) */
    replacementDoctorId?: string;
    /** Date et heure de la demande */
    requestedAt: Date;
    /** Motif */
    reason: string;
    /** Statut */
    status: "EN_ATTENTE" | "APPROUVEE" | "REFUSEE" | "ANNULEE";
    /** Urgence */
    urgency: "NORMALE" | "URGENTE" | "CRITIQUE";
    /** Date limite de réponse */
    responseDeadline?: Date;
    /** Compensation offerte */
    compensationOffered?: {
        /** Type (financière, échange, faveur) */
        type: "FINANCIERE" | "ECHANGE" | "FAVEUR" | "AUCUNE";
        /** Description */
        description?: string;
        /** Montant (si financière) */
        amount?: number;
        /** Garde proposée en échange */
        exchangeDutyId?: string;
    };
    /** Répondants potentiels */
    potentialRespondents?: string[];
    /** Réponses reçues */
    responses?: {
        /** Médecin */
        doctorId: string;
        /** Acceptation */
        accepted: boolean;
        /** Commentaire */
        comment?: string;
        /** Date de réponse */
        respondedAt: Date;
        /** Contre-proposition */
        counterOffer?: {
            /** Type */
            type: string;
            /** Description */
            description: string;
        };
    }[];
    /** Approbation finale */
    finalApproval?: {
        /** Approuvé */
        approved: boolean;
        /** Approuvé par */
        approvedBy: string;
        /** Date d'approbation */
        approvedAt: Date;
        /** Commentaire */
        comment?: string;
    };
    /** Notification envoyée */
    notificationSent: boolean;
    /** Date de création */
    createdAt: Date;
    /** Dernière mise à jour */
    updatedAt: Date;
}

/**
 * Interface pour les rapports de garde
 */
export interface DutyReport {
    /** Identifiant unique */
    id: string;
    /** Identifiant de la garde */
    dutyId: string;
    /** Médecin ayant effectué la garde */
    doctorId: string;
    /** Service */
    serviceId: string;
    /** Heure réelle de début */
    actualStartTime: Date;
    /** Heure réelle de fin */
    actualEndTime: Date;
    /** Nombre de patients vus */
    patientsSeen: number;
    /** Procédures effectuées */
    proceduresPerformed?: {
        /** Type de procédure */
        type: string;
        /** Nombre */
        count: number;
        /** Commentaires */
        comments?: string;
    }[];
    /** Incidents signalés */
    incidents?: {
        /** Type d'incident */
        type: string;
        /** Description */
        description: string;
        /** Heure */
        time: Date;
        /** Actions prises */
        actionsToken: string;
        /** Suivi requis */
        followUpRequired: boolean;
    }[];
    /** Médicaments utilisés */
    medicationsAdministered?: {
        /** Nom du médicament */
        name: string;
        /** Quantité */
        quantity: number;
    }[];
    /** Charge de travail (1-5) */
    workloadRating: number;
    /** Notes générales */
    notes?: string;
    /** Patients nécessitant un suivi */
    patientsRequiringFollowUp?: {
        /** Identifiant du patient */
        patientId: string;
        /** Raison */
        reason: string;
        /** Priorité */
        priority: "BASSE" | "MOYENNE" | "HAUTE" | "CRITIQUE";
    }[];
    /** Suggestions d'amélioration */
    improvementSuggestions?: string;
    /** Problèmes de ressources */
    resourceIssues?: string[];
    /** Collaboration avec d'autres services */
    collaborationWithServices?: {
        /** Service */
        serviceId: string;
        /** Notes */
        notes: string;
    }[];
    /** Soumis */
    submitted: boolean;
    /** Date de soumission */
    submittedAt?: Date;
    /** Approuvé */
    approved?: boolean;
    /** Approuvé par */
    approvedBy?: string;
    /** Date d'approbation */
    approvedAt?: Date;
    /** Date de création */
    createdAt: Date;
    /** Dernière mise à jour */
    updatedAt: Date;
} 