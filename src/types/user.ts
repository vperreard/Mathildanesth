// src/types/user.ts

/**
 * Types relatifs aux utilisateurs
 */

/**
 * Jours de la semaine
 */
export enum Weekday {
    LUNDI = "LUNDI",
    MARDI = "MARDI",
    MERCREDI = "MERCREDI",
    JEUDI = "JEUDI",
    VENDREDI = "VENDREDI",
    SAMEDI = "SAMEDI",
    DIMANCHE = "DIMANCHE"
}

/**
 * Niveau d'expérience
 */
export enum ExperienceLevel {
    JUNIOR = 'JUNIOR',
    INTERMEDIATE = 'INTERMEDIATE',
    SENIOR = 'SENIOR',
    EXPERT = 'EXPERT'
}

/**
 * Rôles utilisateur dans l'application
 */
export enum UserRole {
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    UTILISATEUR = 'UTILISATEUR',
    MÉDECIN = 'MÉDECIN',
    SUPERVISEUR = 'SUPERVISEUR',
    PLANIFICATEUR = 'PLANIFICATEUR',
    CONSULTANT = 'CONSULTANT',
    DOCTOR = 'DOCTOR'
}

/**
 * Correspondance avec l'enum Role de Prisma
 */
export type Role = 'ADMIN_TOTAL' | 'ADMIN_PARTIEL' | 'USER';

/**
 * Rôle professionnel
 */
export type ProfessionalRole = 'MAR' | 'IADE' | 'SECRETAIRE';

/**
 * Informations de base d'un utilisateur
 */
export interface UserBasic {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    profilePicture?: string;
}

/**
 * Utilisateur complet
 */
export interface User {
    id: string;
    prenom: string;
    nom: string;
    firstName?: string;
    lastName?: string;
    email: string;
    role: UserRole | string;
    departmentId?: string;
    specialtyId?: string;
    specialties?: string[];
    leaves?: Leave[];
    isActive?: boolean;
    phoneNumber?: string;
    experienceLevel?: ExperienceLevel;
    hireDate?: Date;
    profilePictureUrl?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Préférences utilisateur
 */
export interface UserPreferences {
    userId: string;
    theme: 'light' | 'dark' | 'system';
    emailNotifications: boolean;
    pushNotifications: boolean;
    displayMode: 'compact' | 'comfortable';
    autoSave: boolean;
    language: string;
}

/**
 * Patterns de travail
 */
export enum WorkPatternType {
    FULL_TIME = 'FULL_TIME',
    ALTERNATING_WEEKS = 'ALTERNATING_WEEKS',
    ALTERNATING_MONTHS = 'ALTERNATING_MONTHS',
    SPECIFIC_DAYS = 'SPECIFIC_DAYS'
}

/**
 * Types de semaines/mois
 */
export enum WeekType {
    EVEN = 'EVEN',
    ODD = 'ODD',
    ALL = 'ALL'
}

/**
 * Types de congés
 */
export enum LeaveType {
    VACATION = 'VACATION',
    SICK = 'SICK',
    MATERNITY = 'MATERNITY',
    PATERNITY = 'PATERNITY',
    UNPAID = 'UNPAID',
    OTHER = 'OTHER'
}

/**
 * Statuts des congés
 */
export enum LeaveStatus {
    APPROVED = 'APPROVED',
    PENDING = 'PENDING',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED'
}

/**
 * Informations d'authentification
 */
export interface AuthUser {
    user: User;
    token: string;
    refreshToken: string;
}

/**
 * Données de connexion
 */
export interface LoginCredentials {
    email: string;
    password: string;
}

/**
 * Réponse d'authentification
 */
export interface AuthResponse {
    user: User;
    token: string;
    refreshToken: string;
    expiresAt: number;
}

/**
 * Demande de réinitialisation de mot de passe
 */
export interface PasswordResetRequest {
    email: string;
}

/**
 * Mise à jour de mot de passe
 */
export interface PasswordUpdate {
    currentPassword: string;
    newPassword: string;
}

/**
 * Données pour la création d'un nouvel utilisateur
 */
export interface UserCreateData {
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    employeeId?: string;
    department?: string;
    position?: string;
    managerId?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    dateOfHire?: string;
    specialties?: string[];
    experienceLevel?: ExperienceLevel;
    professionalRole?: ProfessionalRole;
    password?: string;
}

/**
 * Données pour la mise à jour d'un utilisateur
 */
export interface UserUpdateData {
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    department?: string;
    position?: string;
    managerId?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    dateOfHire?: string;
    isActive?: boolean;
    profilePicture?: string;
    specialties?: string[];
    experienceLevel?: ExperienceLevel;
    professionalRole?: ProfessionalRole;
    dateEntree?: string;
    dateSortie?: string;
}

/**
 * Congé
 */
export interface Leave {
    id: string;
    userId: string;
    startDate: Date;
    endDate: Date;
    type: LeaveType;
    status: LeaveStatus;
    reason?: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Interface pour les données du formulaire utilisateur
 */
export interface UserFormData {
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    employeeId?: string;
    department?: string;
    position?: string;
    managerId?: string;
    isActive?: boolean;
    phoneNumber?: string;
    dateOfBirth?: string | null;
    dateOfHire?: string | null;
    specialties?: string[];
    experienceLevel?: ExperienceLevel;
    professionalRole?: ProfessionalRole;
    dateEntree?: string | null;
    dateSortie?: string | null;
    password?: string;
    tempsPartiel?: boolean;
    pourcentageTempsPartiel?: number | null;
    workPattern?: WorkPatternType;
    workOnMonthType?: WeekType | null;
    joursTravaillesSemainePaire?: Weekday[];
    joursTravaillesSemaineImpaire?: Weekday[];
}

/**
 * Types liés aux utilisateurs de l'application
 */

export interface UserSession {
    userId: string;
    token: string;
    expiresAt: Date;
    lastActivity: Date;
    ipAddress?: string;
    userAgent?: string;
}

export interface UserPermission {
    id: string;
    name: string;
    description: string;
}

export interface UserWithRoles extends User {
    roles: Role[];
}

export interface UserActivityLog {
    id: string;
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}