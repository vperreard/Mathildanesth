// src/types/user.ts

// Correspondance avec l'enum Role de Prisma
export type Role = 'ADMIN_TOTAL' | 'ADMIN_PARTIEL' | 'USER';

// Rôle professionnel
export type ProfessionalRole = 'MAR' | 'IADE' | 'SECRETAIRE';

// Patterns de travail
export enum WorkPatternType {
    FULL_TIME = 'FULL_TIME',
    ALTERNATING_WEEKS = 'ALTERNATING_WEEKS',
    ALTERNATING_MONTHS = 'ALTERNATING_MONTHS',
    SPECIFIC_DAYS = 'SPECIFIC_DAYS'
}

// Types de semaines/mois
export enum WeekType {
    EVEN = 'EVEN',
    ODD = 'ODD',
    ALL = 'ALL'
}

// Enum pour les jours de la semaine (utilisé dans le frontend)
export enum DayOfWeek {
    LUNDI = "LUNDI",
    MARDI = "MARDI",
    MERCREDI = "MERCREDI",
    JEUDI = "JEUDI",
    VENDREDI = "VENDREDI",
    SAMEDI = "SAMEDI",
    DIMANCHE = "DIMANCHE",
}

// Interface User (ce que le frontend manipule, sans password)
export interface User {
    id: number;
    nom: string;
    prenom: string;
    login: string;
    email: string;
    alias?: string | null;
    phoneNumber?: string | null;
    role: Role;
    professionalRole: ProfessionalRole;
    // Champs existants
    tempsPartiel?: boolean;
    pourcentageTempsPartiel?: number | null;
    dateEntree?: Date | string | null;
    dateSortie?: Date | string | null;
    actif?: boolean;

    // Champs pour configuration détaillée du temps partiel
    workPattern?: WorkPatternType;
    workOnMonthType?: WeekType | null;

    // Nouveaux champs pour les jours spécifiques (frontend utilise string[])
    joursTravaillesSemainePaire?: DayOfWeek[]; // Tableau d'enums DayOfWeek
    joursTravaillesSemaineImpaire?: DayOfWeek[]; // Tableau d'enums DayOfWeek

    // Dates
    createdAt?: Date;
    updatedAt?: Date;
    mustChangePassword?: boolean;
}

// Interface pour les données du formulaire
export type UserFormData = Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'login' | 'dateEntree' | 'dateSortie'> & {
    dateEntree?: string | null;
    dateSortie?: string | null;
    password?: string; // Ajouter password pour la création/modification
    tempsPartiel?: boolean;
    pourcentageTempsPartiel?: number | null;
    workPattern?: WorkPatternType;
    workOnMonthType?: WeekType | null;
    joursTravaillesSemainePaire?: DayOfWeek[];
    joursTravaillesSemaineImpaire?: DayOfWeek[];
}; 