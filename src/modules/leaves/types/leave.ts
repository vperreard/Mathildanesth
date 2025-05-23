import { User } from '@/types/user';

/**
 * Types pour la gestion des congés
 */

/**
 * Types de congés disponibles
 */
export enum LeaveType {
  ANNUAL = 'ANNUAL', // Congés annuels
  RECOVERY = 'RECOVERY', // Récupération
  TRAINING = 'TRAINING', // Formation
  SICK = 'SICK', // Maladie
  MATERNITY = 'MATERNITY', // Maternité
  SPECIAL = 'SPECIAL', // Congé spécial
  UNPAID = 'UNPAID', // Sans solde
  OTHER = 'OTHER', // Autre
  PATERNITY = 'PATERNITY', // Paternité
  PARENTAL = 'PARENTAL', // Parental
  // Les alias suivants sont commentés pour éviter les erreurs de duplication d'enum.
  // Leur utilisation dans le code doit être remplacée par les valeurs canoniques.
  // CONGE_PAYE = 'ANNUAL',
  // RTT = 'RECOVERY'
}

/**
 * Statuts possibles d'une demande de congés
 */
export enum LeaveStatus {
  PENDING = 'PENDING', // En attente de validation
  APPROVED = 'APPROVED', // Approuvé
  REJECTED = 'REJECTED', // Rejeté
  CANCELLED = 'CANCELLED', // Annulé
  DRAFT = 'DRAFT', // Brouillon (valeur propre)
  // Les alias suivants sont commentés.
  // Leur utilisation dans le code doit être remplacée par les valeurs canoniques.
  // APPROUVE = 'APPROVED',
  // REJETE = 'REJECTED'
}

/**
 * Types de fréquence pour les congés récurrents
 */
export enum RecurrenceFrequency {
  DAILY = 'DAILY', // Tous les jours
  WEEKLY = 'WEEKLY', // Toutes les semaines
  MONTHLY = 'MONTHLY', // Tous les mois
  YEARLY = 'YEARLY', // Tous les ans
}

/**
 * Types de fin de récurrence
 */
export enum RecurrenceEndType {
  NEVER = 'NEVER', // Pas de fin
  UNTIL_DATE = 'UNTIL_DATE', // Jusqu'à une date spécifique
  COUNT = 'COUNT', // Nombre d'occurrences
  // Les alias suivants sont commentés.
  // Leur utilisation dans le code doit être remplacée par les valeurs canoniques.
  // ON_DATE = 'UNTIL_DATE',    // Nom historique conservé pour compatibilité
  // AFTER_OCCURRENCES = 'COUNT' // Nom historique conservé pour compatibilité
}

/**
 * Configuration de récurrence pour les demandes de congés
 */
export interface RecurrencePattern {
  frequency: RecurrenceFrequency; // Fréquence (quotidien, hebdomadaire, etc.)
  interval: number; // Intervalle (tous les X jours, semaines, etc.)

  // Jours spécifiques de la semaine (pour récurrence hebdomadaire)
  daysOfWeek?: number[]; // 0 = dimanche, 1 = lundi, etc.
  // Alias legacy pour compatibilité avec les anciens tests/code
  weekdays?: number[]; // 0 = dimanche, 1 = lundi, etc.

  // Pour récurrence mensuelle
  dayOfMonth?: number; // Jour du mois (1-31)
  monthOfYear?: number; // Mois de l'année (1-12)
  weekOfMonth?: number; // Semaine du mois (1-5)

  // Conditions de fin
  endType: RecurrenceEndType; // Type de fin
  endDate?: Date; // Date de fin (si endType = UNTIL_DATE / ON_DATE)
  occurrences?: number; // Nombre d'occurrences (si endType = AFTER_OCCURRENCES)
  // Alias legacy utilisé dans certains tests
  endCount?: number;

  // Configuration supplémentaire
  skipHolidays?: boolean; // Ignorer les jours fériés
  skipWeekends?: boolean; // Ignorer les weekends
}

/**
 * Demi-journée ou journée complète
 */
export enum LeaveDuration {
  FULL_DAY = 'FULL_DAY', // Journée complète
  MORNING = 'MORNING', // Matin
  AFTERNOON = 'AFTERNOON', // Après-midi
}

/**
 * Types de documents acceptés pour les justificatifs de congés
 */
export enum LeaveDocumentType {
  CERTIFICAT_MEDICAL = 'CERTIFICAT_MEDICAL',
  ARRET_TRAVAIL = 'ARRET_TRAVAIL',
  CONVOCATION_OFFICIELLE = 'CONVOCATION_OFFICIELLE',
  ACTE_DECES = 'ACTE_DECES',
  AUTRE = 'AUTRE',
}

/**
 * Document associé à une demande de congé
 */
export interface LeaveDocument {
  id: string;
  leaveRequestId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  documentType: string;
  uploadDate: string;
  uploadedBy: string;
  url: string;
}

/**
 * Commentaire sur une demande de congé
 */
export interface LeaveComment {
  id: string;
  leaveRequestId: string;
  authorId: string;
  author: User;
  content: string;
  createdAt: string;
  updatedAt: string;
  isPrivate: boolean;
}

/**
 * Demande de congés
 */
export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  departmentId: string;
  departmentName: string;
  startDate: string;
  endDate: string;
  halfDayStart?: boolean;
  halfDayEnd?: boolean;
  workingDaysCount: number;
  type: LeaveType;
  reason?: string;
  status: LeaveStatus;
  requestDate: string;
  approverId?: string;
  approverName?: string;
  approvalDate?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  documents?: LeaveDocument[];
  history?: LeaveHistory[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Réponse à une demande de congés
 */
export interface LeaveResponse {
  status: LeaveStatus.APPROVED | LeaveStatus.REJECTED;
  comment?: string;
}

/**
 * Résultats paginés de recherche de congés
 */
export interface PaginatedLeaveResults {
  items: LeaveRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Solde de congés disponible
 */
export interface LeaveBalance {
  userId: string;
  year: number;
  balances: {
    [LeaveType.ANNUAL]: {
      initial: number;
      used: number;
      pending: number;
      remaining: number;
      acquired: number;
    };
    [LeaveType.RECOVERY]: {
      initial: number;
      used: number;
      pending: number;
      remaining: number;
      acquired: number;
    };
    [key: string]: {
      initial: number;
      used: number;
      pending: number;
      remaining: number;
      acquired: number;
    };
  };
  lastUpdated?: Date;
}

/**
 * Ajustement manuel du solde de congés
 */
export interface LeaveBalanceAdjustment {
  id: string;
  userId: string;
  leaveType: LeaveType;
  amount: number; // Positif pour ajout, négatif pour retrait
  reason?: string;
  appliedBy: string;
  appliedAt: Date;
}

/**
 * Statistiques de congés par période
 */
export interface LeaveStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  cancelledRequests: number;
  averageProcessingTime: number; // en heures
  totalWorkingDaysUsed: number;
  byType: {
    [key in LeaveType]?: number;
  };
  byDepartment?: {
    departmentId: string;
    departmentName: string;
    count: number;
  }[];
  byMonth?: {
    month: string;
    count: number;
  }[];
}

/**
 * Notification de congés
 */
export interface LeaveNotification {
  id: string;
  userId: string;
  leaveId: string;
  type: 'NEW_REQUEST' | 'STATUS_CHANGED' | 'REMINDER' | 'CONFLICT' | 'BALANCE_LOW';
  message: string;
  isRead: boolean;
  createdAt: Date;
}

/**
 * Jour férié ou férié d'entreprise
 */
export interface Holiday {
  id: string;
  name: string;
  date: string;
  isRecurring: boolean;
  isCompanyWide: boolean;
  description?: string;
}

/**
 * Types et interfaces pour la gestion des congés
 */

/**
 * Types de jours dans le cadre des congés
 * Utilisé pour catégoriser les jours dans les calculs de périodes de congés
 */
export type LeaveDayType =
  | 'REGULAR'         // Jour normal travaillé
  | 'WEEKEND'         // Jour de weekend
  | 'HOLIDAY'         // Jour férié
  | 'NON_WORKING'     // Jour non travaillé selon le planning
  | 'HALF_DAY'        // Demi-journée de congé (remplace HALF_DAY_WORKED)
  | 'FULL_DAY_WORKED' // Journée complète travaillée
  | 'HALF_DAY_WORKED'; // Ancienne valeur, maintenue pour rétrocompatibilité, à préférer HALF_DAY

/**
 * Détails d'un jour férié simplifié pour les calculs
 */
export interface PublicHolidayDetail {
  date: Date;
  name: string;
  isNational: boolean;
  description?: string;
}

/**
 * Détail d'un jour dans le calcul des congés
 */
export interface DayDetail {
  date: Date;
  type: LeaveDayType;
  isCounted: boolean;
  isHalfDay: boolean;
}

/**
 * Récapitulatif des calculs pour une semaine lors d'une demande de congés
 */
export interface WeeklyLeaveBreakdown {
  weekNumber: number;
  weekType: string;
  startDate: Date;
  endDate: Date;
  naturalDays: number;
  countedDays: number;
  halfDays: number;
  isWorkingWeek: boolean;
}

/**
 * Détails de calcul des jours de congés
 * (important pour la logique de décompte spécifique aux MARs et aux temps partiels)
 */
export interface LeaveCalculationDetails {
  // Nombre de jours naturels (y compris weekends et jours fériés)
  naturalDays: number;

  // Nombre de jours ouvrés (hors weekends et jours fériés)
  workDays: number;

  // Jours réellement décomptés (selon le planning)
  countedDays: number;

  // Nombre de demi-journées comptées
  halfDays: number;

  // Décompte par semaine (important pour l'alternance semaines paires/impaires)
  weeklyBreakdown: WeeklyLeaveBreakdown[];

  // Jours fériés inclus dans la période
  publicHolidays: PublicHolidayDetail[];

  // Pourcentage de temps de travail au moment de la demande
  workingTimePercentage: number;

  // Détails jour par jour
  dayDetails?: DayDetail[];
}

/**
 * Options pour le calcul de jours de congés
 */
export interface LeaveCalculationOptions {
  // Ignorer les jours fériés (défaut: true)
  skipHolidays?: boolean;

  // Indique si la demande concerne une demi-journée (défaut: false)
  // Ne s'applique que si startDate === endDate (un seul jour)
  isHalfDay?: boolean;

  // Période de la demi-journée (matin ou après-midi)
  // N'est pris en compte que si isHalfDay est true
  halfDayPeriod?: 'AM' | 'PM';

  // Compter les jours fériés tombant le weekend (défaut: false)
  countHolidaysOnWeekends?: boolean;

  // Forcer le rafraîchissement du cache de calcul (défaut: false)
  forceCacheRefresh?: boolean;
}

/**
 * Options pour la validation des dates de congés
 */
export interface LeaveDateValidationOptions {
  // Ignorer les jours fériés (défaut: true)
  skipHolidays?: boolean;

  // Autoriser les demi-journées (défaut: false)
  allowHalfDays?: boolean;

  // Autoriser les jours non travaillés (défaut: false)
  allowNonWorkingDays?: boolean;

  // Autoriser les périodes sans jours ouvrés (défaut: false)
  allowPeriodsWithNoWorkingDays?: boolean;

  // Nombre minimal de jours ouvrés requis
  minWorkingDays?: number;
}

/**
 * Interface pour une demande de congé (Définition principale)
 */
export interface Leave {
  id: string;
  userId: string;
  requestDate: Date;
  type: LeaveType;
  status: LeaveStatus;
  startDate: Date;
  endDate: Date;
  countedDays: number;
  comment?: string;
  reason?: string;
  parentRequestId?: string;
  isRecurring?: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

/**
 * Interface étendue pour les congés avec utilisateur (Seule définition gardée)
 */
export interface LeaveWithUser extends Leave {
  user: User;
}

/**
 * Historique des actions sur une demande de congé
 */
export interface LeaveHistory {
  id: string;
  leaveRequestId: string;
  action: 'CREATION' | 'SOUMISSION' | 'APPROBATION' | 'REJET' | 'ANNULATION' | 'MODIFICATION';
  timestamp: string;
  userId: string;
  userName: string;
  comment?: string;
  previousStatus?: LeaveStatus;
  newStatus: LeaveStatus;
}

/**
 * Interface pour les filtres de congés (Seule définition gardée)
 */
export interface LeaveFilters {
  userId?: string;
  departmentId?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  types?: LeaveType[];
  statuses?: LeaveStatus[];
  searchTerm?: string;
  isRecurring?: boolean;
}

/**
 * Interface pour un ajustement de solde de congés
 */
export interface LeaveBalanceAdjustment {
  userId: string;
  type: LeaveType;
  amount: number;
  reason?: string;
  date: Date;
  operatorId: string;
}

/**
 * Demande de congé récurrente
 */
export interface RecurringLeaveRequest extends Leave {
  recurrencePattern: RecurrencePattern;
  patternStartDate: Date;
  patternEndDate: Date;
  occurrences?: Leave[];
}

/**
 * Résultat de la vérification des droits à congés.
 */
export interface LeaveAllowanceCheckResult {
  isAllowed: boolean;
  remainingDays?: number; // Jours restants après la demande si elle était accordée
  requestedDays: number; // Jours demandés
  exceededDays?: number; // Jours excédentaires si la demande dépasse le solde
  message?: string; // Message explicatif optionnel (ex: "Solde insuffisant")
  balanceBefore?: number; // Solde avant la demande (optionnel)
  balanceAfter?: number; // Solde après la demande (optionnel, si isAllowed)
  quotaRuleApplied?: string; // Règle de quota spécifique appliquée (optionnel)
}
