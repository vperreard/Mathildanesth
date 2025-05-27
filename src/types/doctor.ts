/**
 * Énumération des spécialités médicales
 */
export enum MedicalSpecialty {
    /** Médecine générale */
    MEDECINE_GENERALE = "MEDECINE_GENERALE",
    /** Cardiologie */
    CARDIOLOGIE = "CARDIOLOGIE",
    /** Dermatologie */
    DERMATOLOGIE = "DERMATOLOGIE",
    /** Endocrinologie */
    ENDOCRINOLOGIE = "ENDOCRINOLOGIE",
    /** Gastro-entérologie */
    GASTROENTEROLOGIE = "GASTROENTEROLOGIE",
    /** Gériatrie */
    GERIATRIE = "GERIATRIE",
    /** Gynécologie */
    GYNECOLOGIE = "GYNECOLOGIE",
    /** Hématologie */
    HEMATOLOGIE = "HEMATOLOGIE",
    /** Infectiologie */
    INFECTIOLOGIE = "INFECTIOLOGIE",
    /** Médecine interne */
    MEDECINE_INTERNE = "MEDECINE_INTERNE",
    /** Néphrologie */
    NEPHROLOGIE = "NEPHROLOGIE",
    /** Neurologie */
    NEUROLOGIE = "NEUROLOGIE",
    /** Oncologie */
    ONCOLOGIE = "ONCOLOGIE",
    /** Ophtalmologie */
    OPHTALMOLOGIE = "OPHTALMOLOGIE",
    /** Orthopédie */
    ORTHOPEDIE = "ORTHOPEDIE",
    /** Oto-rhino-laryngologie (ORL) */
    ORL = "ORL",
    /** Pédiatrie */
    PEDIATRIE = "PEDIATRIE",
    /** Pneumologie */
    PNEUMOLOGIE = "PNEUMOLOGIE",
    /** Psychiatrie */
    PSYCHIATRIE = "PSYCHIATRIE",
    /** Radiologie */
    RADIOLOGIE = "RADIOLOGIE",
    /** Rhumatologie */
    RHUMATOLOGIE = "RHUMATOLOGIE",
    /** Urologie */
    UROLOGIE = "UROLOGIE",
    /** Anesthésie-réanimation */
    ANESTHESIE_REANIMATION = "ANESTHESIE_REANIMATION",
    /** Chirurgie générale */
    CHIRURGIE_GENERALE = "CHIRURGIE_GENERALE",
    /** Chirurgie cardiaque */
    CHIRURGIE_CARDIAQUE = "CHIRURGIE_CARDIAQUE",
    /** Chirurgie pédiatrique */
    CHIRURGIE_PEDIATRIQUE = "CHIRURGIE_PEDIATRIQUE",
    /** Chirurgie plastique */
    CHIRURGIE_PLASTIQUE = "CHIRURGIE_PLASTIQUE",
    /** Chirurgie thoracique */
    CHIRURGIE_THORACIQUE = "CHIRURGIE_THORACIQUE",
    /** Chirurgie vasculaire */
    CHIRURGIE_VASCULAIRE = "CHIRURGIE_VASCULAIRE",
    /** Chirurgie maxillo-faciale */
    CHIRURGIE_MAXILLO_FACIALE = "CHIRURGIE_MAXILLO_FACIALE",
    /** Médecine d'urgence */
    MEDECINE_URGENCE = "MEDECINE_URGENCE",
    /** Médecine intensive et réanimation */
    REANIMATION = "REANIMATION",
    /** Médecine nucléaire */
    MEDECINE_NUCLEAIRE = "MEDECINE_NUCLEAIRE",
    /** Médecine physique et réadaptation */
    MEDECINE_PHYSIQUE_READAPTATION = "MEDECINE_PHYSIQUE_READAPTATION",
    /** Santé publique */
    SANTE_PUBLIQUE = "SANTE_PUBLIQUE",
}

/**
 * Énumération des grades médicaux
 */
export enum MedicalGrade {
    /** Interne */
    INTERNE = "INTERNE",
    /** Chef de clinique */
    CHEF_DE_CLINIQUE = "CHEF_DE_CLINIQUE",
    /** Praticien hospitalier */
    PRATICIEN_HOSPITALIER = "PRATICIEN_HOSPITALIER",
    /** Praticien hospitalier universitaire */
    PRATICIEN_HOSPITALIER_UNIVERSITAIRE = "PRATICIEN_HOSPITALIER_UNIVERSITAIRE",
    /** Professeur des universités - Praticien hospitalier */
    PROFESSEUR_UNIVERSITAIRE = "PROFESSEUR_UNIVERSITAIRE",
    /** Chef de service */
    CHEF_DE_SERVICE = "CHEF_DE_SERVICE"
}

/**
 * Énumération des statuts de disponibilité des médecins
 */
export enum DoctorAvailabilityStatus {
    /** Disponible pour les gardes */
    DISPONIBLE = "DISPONIBLE",
    /** Partiellement disponible */
    PARTIELLEMENT_DISPONIBLE = "PARTIELLEMENT_DISPONIBLE",
    /** Indisponible temporairement */
    INDISPONIBLE_TEMPORAIRE = "INDISPONIBLE_TEMPORAIRE",
    /** En congés */
    EN_CONGES = "EN_CONGES",
    /** En formation */
    EN_FORMATION = "EN_FORMATION",
    /** En arrêt maladie */
    ARRET_MALADIE = "ARRET_MALADIE",
    /** En congé maternité/paternité */
    CONGE_PARENTAL = "CONGE_PARENTAL",
    /** En détachement */
    DETACHEMENT = "DETACHEMENT"
}

/**
 * Interface pour les médecins
 */
export interface Doctor {
    /** Identifiant unique */
    id: string;
    /** Prénom */
    firstName: string;
    /** Nom */
    lastName: string;
    /** Numéro d'identification professionnel */
    rpps: string;
    /** Spécialité principale */
    specialty: MedicalSpecialty;
    /** Spécialités secondaires */
    secondarySpecialties?: MedicalSpecialty[];
    /** Grade actuel */
    grade: MedicalGrade;
    /** Établissements d'garde/vacation */
    facilityIds: string[];
    /** Service principal */
    primaryServiceId: string;
    /** Services secondaires */
    secondaryServiceIds?: string[];
    /** Date de début de fonction */
    startDate: Date;
    /** Date de fin de contrat (si applicable) */
    endDate?: Date;
    /** Taux d'occupation (pourcentage) */
    occupationRate: number;
    /** Email professionnel */
    email: string;
    /** Téléphone professionnel */
    phone: string;
    /** Téléphone mobile professionnel */
    mobilePhone?: string;
    /** Compétences spécifiques */
    skills?: string[];
    /** Certifications spéciales */
    certifications?: {
        /** Nom de la certification */
        name: string;
        /** Date d'obtention */
        obtainedAt: Date;
        /** Date d'expiration */
        expirationDate?: Date;
    }[];
    /** Langues parlées */
    languages?: {
        /** Code de la langue */
        code: string;
        /** Niveau de maîtrise (A1-C2) */
        level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
    }[];
    /** Statut de disponibilité */
    availabilityStatus: DoctorAvailabilityStatus;
    /** Date de fin d'indisponibilité */
    availabilityEndDate?: Date;
    /** Disponibilité pour les gardes */
    dutyAvailability?: {
        /** Maximum de gardes par mois */
        maxDutiesPerMonth: number;
        /** Types de gardes acceptés */
        acceptedDutyTypes: string[];
        /** Jours préférés */
        preferredDays?: number[];
        /** Services préférés */
        preferredServiceIds?: string[];
    };
    /** Préférences de notification */
    notificationPreferences?: {
        /** Email */
        email: boolean;
        /** SMS */
        sms: boolean;
        /** Application mobile */
        mobileApp: boolean;
        /** Délai de préavis souhaité (jours) */
        advanceNotice: number;
    };
    /** Évaluations et feedback */
    evaluations?: {
        /** Date */
        date: Date;
        /** Évaluateur */
        evaluatorId: string;
        /** Score (1-5) */
        score: number;
        /** Commentaires */
        comments?: string;
        /** Domaines d'amélioration */
        improvementAreas?: string[];
    }[];
    /** Formation universitaire */
    education?: {
        /** Institution */
        institution: string;
        /** Diplôme */
        degree: string;
        /** Année d'obtention */
        year: number;
    }[];
    /** Publications scientifiques */
    publications?: {
        /** Titre */
        title: string;
        /** Journal */
        journal: string;
        /** Année */
        year: number;
        /** DOI */
        doi?: string;
    }[];
    /** Activités d'enseignement */
    teachingActivities?: {
        /** Institution */
        institution: string;
        /** Cours */
        course: string;
        /** Heures par semaine */
        hoursPerWeek: number;
        /** Année académique */
        academicYear: string;
    }[];
    /** Nombre de gardes effectuées (mois en cours) */
    currentMonthDutyCount: number;
    /** Nombre de gardes effectuées (année en cours) */
    currentYearDutyCount: number;
    /** Historique des gardes */
    dutyHistory?: {
        /** Mois */
        month: number;
        /** Année */
        year: number;
        /** Nombre de gardes */
        count: number;
        /** Types de gardes */
        byType: Record<string, number>;
    }[];
    /** Charges administratives */
    administrativeRoles?: {
        /** Titre */
        title: string;
        /** Description */
        description?: string;
        /** Date de début */
        startDate: Date;
        /** Date de fin */
        endDate?: Date;
    }[];
    /** Adresse professionnelle */
    professionalAddress?: {
        /** Ligne 1 */
        line1: string;
        /** Ligne 2 */
        line2?: string;
        /** Code postal */
        postalCode: string;
        /** Ville */
        city: string;
        /** Pays */
        country: string;
    };
    /** Photo de profil (URL) */
    profilePhotoUrl?: string;
    /** Date de création */
    createdAt: Date;
    /** Dernière mise à jour */
    updatedAt: Date;
}

/**
 * Interface pour les statistiques d'un médecin
 */
export interface DoctorStatistics {
    /** Identifiant du médecin */
    doctorId: string;
    /** Période concernée */
    period: {
        /** Date de début */
        startDate: Date;
        /** Date de fin */
        endDate: Date;
    };
    /** Nombre total de gardes */
    totalDuties: number;
    /** Répartition par type de garde */
    dutiesByType: Record<string, number>;
    /** Répartition par service */
    dutiesByService: Record<string, number>;
    /** Heures totales de garde */
    totalDutyHours: number;
    /** Nombre moyen de patients par garde */
    averagePatientsPerDuty?: number;
    /** Temps de repos entre les gardes (moyenne en heures) */
    averageRestTimeBetweenDuties: number;
    /** Taux de gardes modifiées */
    dutyModificationRate: number;
    /** Taux de gardes de dernière minute */
    lastMinuteDutyRate: number;
    /** Taux de satisfaction exprimé (1-5) */
    satisfactionRating?: number;
    /** Taux de respect des préférences */
    preferenceRespectRate?: number;
    /** Nombre d'échanges de garde initiés */
    exchangesInitiated: number;
    /** Nombre d'échanges de garde acceptés */
    exchangesAccepted: number;
    /** Taux de rapports complétés */
    reportCompletionRate: number;
    /** Incidents signalés */
    reportedIncidents: number;
    /** Charge de travail déclarée (moyenne 1-5) */
    averageWorkloadRating?: number;
    /** Comparaison avec la moyenne des médecins de même spécialité */
    comparisonWithPeers?: {
        /** Nombre de gardes (pourcentage par rapport à la moyenne) */
        dutyCountPercentage: number;
        /** Heures de garde (pourcentage par rapport à la moyenne) */
        dutyHoursPercentage: number;
        /** Charge de travail (pourcentage par rapport à la moyenne) */
        workloadPercentage?: number;
    };
    /** Date de génération */
    generatedAt: Date;
}

/**
 * Interface pour l'historique de garde d'un médecin
 */
export interface DoctorDutyHistory {
    /** Identifiant unique */
    id: string;
    /** Identifiant du médecin */
    doctorId: string;
    /** Identifiant de la garde */
    dutyId: string;
    /** Date de début planifiée */
    plannedStartTime: Date;
    /** Date de fin planifiée */
    plannedEndTime: Date;
    /** Date de début effective */
    actualStartTime?: Date;
    /** Date de fin effective */
    actualEndTime?: Date;
    /** Type de garde */
    dutyType: string;
    /** Service concerné */
    serviceId: string;
    /** Évaluation de la garde (1-5) */
    rating?: number;
    /** Commentaires du médecin */
    comments?: string;
    /** Incidents rapportés */
    reportedIncidents?: string[];
    /** Nombre de patients vus */
    patientsSeen?: number;
    /** Date de création */
    createdAt: Date;
    /** Dernière mise à jour */
    updatedAt: Date;
}

/**
 * Interface pour les préférences de notification d'un médecin
 */
export interface DoctorNotificationPreferences {
    /** Identifiant unique */
    id: string;
    /** Identifiant du médecin */
    doctorId: string;
    /** Notifications email activées */
    emailEnabled: boolean;
    /** Notifications push activées */
    pushEnabled: boolean;
    /** Notifications SMS activées */
    smsEnabled: boolean;
    /** Préférences par type de notification */
    preferences: {
        /** Rappels de garde */
        dutyReminders: {
            /** Délai en heures avant la garde */
            reminderHours: number[];
            /** Canaux de notification */
            channels: ("EMAIL" | "PUSH" | "SMS")[];
        };
        /** Demandes d'échange */
        exchangeRequests: {
            /** Canaux de notification */
            channels: ("EMAIL" | "PUSH" | "SMS")[];
        };
        /** Nouvelles gardes/vacations */
        newAssignments: {
            /** Canaux de notification */
            channels: ("EMAIL" | "PUSH" | "SMS")[];
        };
        /** Modifications de planning */
        scheduleChanges: {
            /** Canaux de notification */
            channels: ("EMAIL" | "PUSH" | "SMS")[];
        };
    };
    /** Date de création */
    createdAt: Date;
    /** Dernière mise à jour */
    updatedAt: Date;
} 