import { LeaveType } from '../types/leave';

/**
 * Types pour le système de gestion des quotas de congés
 */

/**
 * Types de règles pour les transferts de quotas
 */
export enum QuotaTransferRuleType {
    STANDARD = 'STANDARD',       // Règle standard entre types de congés
    SPECIAL = 'SPECIAL',         // Règle spéciale (périodes spécifiques)
    ROLE_BASED = 'ROLE_BASED',   // Règle basée sur le rôle utilisateur
    DEPARTMENT = 'DEPARTMENT'    // Règle spécifique à un département
}

/**
 * Types de règles pour les reports de quotas
 */
export enum QuotaCarryOverRuleType {
    PERCENTAGE = 'PERCENTAGE',   // Report d'un pourcentage du quota restant
    FIXED = 'FIXED',             // Report d'un nombre fixe de jours
    UNLIMITED = 'UNLIMITED',     // Report illimité (tout le reste)
    EXPIRABLE = 'EXPIRABLE'      // Report avec date d'expiration
}

/**
 * Statut d'une demande de transfert ou report
 */
export enum QuotaTransactionStatus {
    PENDING = 'PENDING',         // En attente d'approbation
    APPROVED = 'APPROVED',       // Approuvé
    REJECTED = 'REJECTED',       // Rejeté
    CANCELLED = 'CANCELLED',     // Annulé
    EXPIRED = 'EXPIRED',         // Expiré (pour les reports)
    COMPLETED = 'COMPLETED'      // Traitement terminé
}

/**
 * Type de transaction de quota
 */
export enum QuotaTransactionType {
    INITIAL_GRANT = 'INITIAL_GRANT',      // Attribution initiale
    TRANSFER = 'TRANSFER',                // Transfert entre types de congés
    CARRY_OVER = 'CARRY_OVER',            // Report à l'année suivante
    ADJUSTMENT = 'ADJUSTMENT',            // Ajustement manuel (RH)
    EXPIRATION = 'EXPIRATION',            // Expiration d'un quota
    USAGE = 'USAGE',                      // Utilisation (congé pris)
    CANCELLATION = 'CANCELLATION'         // Annulation d'une transaction
}

/**
 * Période de quota (généralement annuelle)
 */
export interface QuotaPeriod {
    id: string;
    name: string;                 // Nom de la période (ex: "Année 2025")
    startDate: string;            // Date de début
    endDate: string;              // Date de fin
    isActive: boolean;            // Si la période est active
    carryOverDeadline?: string;   // Date limite pour les reports
}

/**
 * Définition d'un quota pour un type de congé
 */
export interface QuotaDefinition {
    id: string;
    periodId: string;             // ID de la période
    leaveType: LeaveType;         // Type de congé
    baseAmount: number;           // Montant de base (jours)
    accumulationRate?: number;    // Taux d'accumulation (jours/mois)
    maximumAmount?: number;       // Montant maximum
    minimumUsage?: number;        // Utilisation minimale obligatoire
    carryOverLimit?: number;      // Limite de report
    departmentId?: string;        // Département (si spécifique)
    userRoles?: string[];         // Rôles utilisateurs (si spécifique)
    isDefault: boolean;           // Si c'est la définition par défaut
    rules?: QuotaRuleSet;         // Règles associées
}

/**
 * Ensemble de règles pour un quota
 */
export interface QuotaRuleSet {
    transferRules: QuotaTransferRule[];    // Règles de transfert
    carryOverRules: QuotaCarryOverRule[];  // Règles de report
}

/**
 * Règle de transfert de quota
 */
export interface QuotaTransferRule {
    id: string;
    fromType: LeaveType;                // Type source
    toType: LeaveType;                  // Type destination
    conversionRate: number;             // Taux de conversion (1 jour source = X jours destination)
    maxTransferDays?: number;           // Maximum de jours transférables
    maxTransferPercentage?: number;     // Maximum de pourcentage transférable
    requiresApproval: boolean;          // Nécessite approbation
    authorizedRoles?: string[];         // Rôles autorisés à approuver
    ruleType: QuotaTransferRuleType;    // Type de règle
    departmentId?: string;              // Département spécifique
    applicableUserRoles?: string[];     // Rôles utilisateurs applicables
    minimumRemainingDays?: number;      // Jours minimum à conserver
    isActive: boolean;                  // Si la règle est active
    metadata?: Record<string, any>;     // Métadonnées additionnelles
}

/**
 * Règle de report de quota
 */
export interface QuotaCarryOverRule {
    id: string;
    leaveType: LeaveType;                   // Type de congé
    ruleType: QuotaCarryOverRuleType;       // Type de règle de report
    value: number;                          // Valeur (pourcentage ou jours)
    requiresApproval: boolean;              // Nécessite approbation
    maxCarryOverDays?: number;              // Maximum de jours reportables
    expirationDays?: number;                // Jours avant expiration
    authorizedRoles?: string[];             // Rôles autorisés à approuver
    departmentId?: string;                  // Département spécifique
    applicableUserRoles?: string[];         // Rôles utilisateurs applicables
    isActive: boolean;                      // Si la règle est active
    metadata?: Record<string, any>;         // Métadonnées additionnelles
}

/**
 * Balance de quota pour un utilisateur
 */
export interface UserQuotaBalance {
    id: string;
    userId: string;                  // ID de l'utilisateur
    periodId: string;                // ID de la période
    leaveType: LeaveType;            // Type de congé
    initialBalance: number;          // Solde initial
    currentBalance: number;          // Solde actuel
    usedDays: number;                // Jours utilisés
    pendingDays: number;             // Jours en attente d'approbation
    adjustedDays: number;            // Jours ajustés (manuellement)
    transferredInDays: number;       // Jours transférés entrés
    transferredOutDays: number;      // Jours transférés sortis
    carriedOverDays: number;         // Jours reportés de la période précédente
    expiringDays: number;            // Jours qui vont expirer
    expirationDate?: string;         // Date d'expiration
    lastUpdated: string;             // Dernière mise à jour
}

/**
 * Transaction de quota (historique)
 */
export interface QuotaTransaction {
    id: string;
    userId: string;                        // ID de l'utilisateur
    periodId: string;                      // ID de la période
    transactionType: QuotaTransactionType; // Type de transaction
    leaveType: LeaveType;                  // Type de congé concerné
    targetLeaveType?: LeaveType;           // Type de congé cible (pour transferts)
    amount: number;                        // Montant (jours)
    resultingBalance: number;              // Solde résultant
    status: QuotaTransactionStatus;        // Statut
    requestDate: string;                   // Date de demande
    processDate?: string;                  // Date de traitement
    approvedBy?: string;                   // Approuvé par
    expirationDate?: string;               // Date d'expiration (pour reports)
    relatedTransactionId?: string;         // Transaction liée
    relatedLeaveId?: string;               // Congé lié
    comment?: string;                      // Commentaire
    metadata?: Record<string, any>;        // Métadonnées
}

/**
 * Demande de transfert de quota
 */
export interface QuotaTransferRequest {
    id: string;
    userId: string;                      // Utilisateur demandeur
    periodId: string;                    // Période concernée
    fromType: LeaveType;                 // Type source
    toType: LeaveType;                   // Type destination
    requestedDays: number;               // Jours demandés
    conversionRate: number;              // Taux de conversion
    resultingDays: number;               // Jours résultants
    status: QuotaTransactionStatus;      // Statut
    requestDate: string;                 // Date de demande
    processDate?: string;                // Date de traitement
    approvedBy?: string;                 // Approuvé par
    transactionId?: string;              // ID de la transaction créée
    comment?: string;                    // Commentaire
}

/**
 * Demande de report de quota
 */
export interface QuotaCarryOverRequest {
    id: string;
    userId: string;                      // Utilisateur demandeur
    fromPeriodId: string;                // Période source
    toPeriodId: string;                  // Période destination
    leaveType: LeaveType;                // Type de congé
    requestedDays: number;               // Jours demandés
    status: QuotaTransactionStatus;      // Statut
    expirationDate?: string;             // Date d'expiration
    requestDate: string;                 // Date de demande
    processDate?: string;                // Date de traitement
    approvedBy?: string;                 // Approuvé par
    transactionId?: string;              // ID de la transaction créée
    comment?: string;                    // Commentaire
}

/**
 * Résumé des quotas d'un utilisateur
 */
export interface UserQuotaSummary {
    userId: string;                          // ID de l'utilisateur
    periodId: string;                        // ID de la période
    balances: UserQuotaBalance[];            // Balances par type de congé
    pendingTransfers: QuotaTransferRequest[]; // Transferts en attente
    pendingCarryOvers: QuotaCarryOverRequest[]; // Reports en attente
    availableDays: Record<LeaveType, number>; // Jours disponibles par type
    usedDays: Record<LeaveType, number>;      // Jours utilisés par type
    pendingDays: Record<LeaveType, number>;   // Jours en attente par type
    expiringDays: Record<LeaveType, { days: number, expirationDate: string }[]>; // Jours qui vont expirer
}

/**
 * Résultat de calcul de quota
 */
export interface QuotaCalculationResult {
    eligible: boolean;                     // Si l'utilisateur est éligible
    availableDays: number;                 // Jours disponibles
    requestedDays: number;                 // Jours demandés
    remaining: number;                     // Jours restants après demande
    exceededBy?: number;                   // Dépassement (si applicable)
    requiresApproval: boolean;             // Si une approbation spéciale est nécessaire
    warningLevel?: 'LOW' | 'MEDIUM' | 'HIGH'; // Niveau d'avertissement
    message?: string;                      // Message explicatif
    details?: {                            // Détails du calcul
        initialBalance: number;
        adjustments: number;
        used: number;
        pending: number;
        carriedOver: number;
        transferredIn: number;
        transferredOut: number;
    };
}

/**
 * Types supplémentaires pour le système de transfert et report de quotas
 */

/**
 * Types pour les employés et quotas
 */
export interface EmployeeQuota {
    employeeId: string;
    leaveType: LeaveType;
    year: number;
    initial: number;
    used: number;
    remaining: number;
    pending: number;
}

/**
 * Ajustement de quota
 */
export interface QuotaAdjustment {
    id: string;
    employeeId: string;
    leaveType: LeaveType;
    amount: number;
    reason: string;
    date: string;
    appliedBy: string;
}

/**
 * Demande de transfert de quota
 */
export interface QuotaTransferRequest {
    userId: string;
    sourceType: LeaveType;
    targetType: LeaveType;
    sourceAmount: number;
    comment?: string;
}

/**
 * Résultat d'un transfert de quota
 */
export interface QuotaTransferResult {
    success: boolean;
    sourceAmount: number;
    targetAmount: number;
    sourceRemaining: number;
    targetTotal: number;
    message?: string;
}

/**
 * Configuration des règles de report annuel de quotas
 */
export interface QuotaAnnualCarryOverConfig {
    id?: string;
    leaveType: LeaveType;
    maximumPercentage: number;
    maximumDays?: number;
    expiryInDays?: number;
    requiresApproval: boolean;
    authorizedRoles: string[];
    isActive: boolean;
}

/**
 * Réponse d'historique de transfert
 */
export interface TransferHistoryResponse {
    id: string;
    date: string;
    sourceType: LeaveType;
    targetType: LeaveType;
    sourceAmount: number;
    targetAmount: number;
    status: string;
    approvalDate?: string;
    approvedBy?: string;
}

/**
 * Options pour les rapports de transferts de quotas
 */
export interface QuotaTransferReportOptions {
    startDate?: string;
    endDate?: string;
    leaveTypes?: LeaveType[];
    departments?: string[];
    status?: string[];
    groupBy?: 'user' | 'department' | 'leaveType' | 'month';
    format?: 'pdf' | 'csv' | 'excel';
}

/**
 * Type de rapport de transfert de quotas
 */
export interface QuotaTransferReportData {
    id: string;
    userId: string;
    userName: string;
    departmentId?: string;
    departmentName?: string;
    fromType: LeaveType;
    toType: LeaveType;
    amount: number;
    convertedAmount: number;
    transferDate: string;
    status: string;
    approvalDate?: string;
    approvedById?: string;
    approvedByName?: string;
    reason?: string;
}

/**
 * Résultat d'un rapport de transfert de quotas
 */
export interface QuotaTransferReportResult {
    data: QuotaTransferReportData[];
    summary: {
        totalTransfers: number;
        totalDays: number;
        byLeaveType: {
            leaveType: LeaveType;
            count: number;
            days: number;
        }[];
        byDepartment?: {
            departmentId: string;
            departmentName: string;
            count: number;
            days: number;
        }[];
        byMonth?: {
            month: string;
            count: number;
            days: number;
        }[];
        byStatus: {
            status: string;
            count: number;
            days: number;
        }[];
    };
}

/**
 * Statistiques des quotas de congés pour le reporting
 */
export interface QuotaStatistics {
    totalInitial: number;
    totalUsed: number;
    totalPending: number;
    totalRemaining: number;
    totalTransfersIn: number;
    totalTransfersOut: number;
    totalCarriedOver: number;
    totalExpired: number;
    utilizationRate: number; // pourcentage d'utilisation
    byLeaveType: {
        leaveType: LeaveType;
        initial: number;
        used: number;
        remaining: number;
        transfersIn: number;
        transfersOut: number;
        carriedOver: number;
    }[];
}

/**
 * Demande de calcul de report de quota
 */
export interface QuotaCarryOverCalculationRequest {
    userId: string;
    leaveType: LeaveType;
    fromYear: number;
    toYear: number;
    amount?: number; // Si non spécifié, utilise le montant maximal autorisé
    comment?: string;
}

/**
 * Résultat d'un calcul de report de quota
 */
export interface QuotaCarryOverCalculationResult {
    success?: boolean;
    originalRemaining: number; // Solde restant sur l'année source
    eligibleForCarryOver: number; // Montant éligible au report
    carryOverAmount: number; // Montant réellement reporté
    expiryDate?: Date; // Date d'expiration pour les reports limités dans le temps
    message?: string; // Message explicatif
}

/**
 * Types pour les règles de période spéciale (à définir)
 */
export enum SpecialPeriodRuleType {
    SUMMER = 'SUMMER',
    WINTER = 'WINTER',
    HOLIDAYS = 'HOLIDAYS', // Exemple ajouté
    OTHER = 'OTHER'        // Exemple ajouté
}

/**
 * Règle pour les périodes spéciales affectant les quotas
 */
export interface SpecialPeriodRule {
    id: string;
    name: string;
    description?: string;
    periodType: SpecialPeriodRuleType; // Utilisation de l'enum défini ci-dessus
    startDay: number;
    startMonth: number;
    endDay: number;
    endMonth: number;
    specificYear?: number; // Si applicable seulement à une année spécifique
    minimumQuotaGuaranteed?: number; // Quota minimum garanti pendant cette période
    priorityRules?: string[]; // Règles de priorité spécifiques pendant cette période
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
} 