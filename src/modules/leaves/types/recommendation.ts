import { ConflictSeverity, ConflictType, LeaveConflict, ConflictResolution } from './conflict';

/**
 * Types pour le système de recommandation de résolution des conflits
 */

/**
 * Type de priorité pour la résolution des conflits
 */
export enum ConflictPriority {
    VERY_LOW = 1,      // Priorité très basse
    LOW = 2,           // Priorité basse
    MEDIUM = 3,        // Priorité moyenne
    HIGH = 4,          // Priorité élevée
    VERY_HIGH = 5      // Priorité très élevée
}

/**
 * Stratégies de résolution possibles
 */
export enum ResolutionStrategy {
    APPROVE = 'APPROVE',                      // Approuver malgré le conflit
    REJECT = 'REJECT',                        // Rejeter la demande
    RESCHEDULE_BEFORE = 'RESCHEDULE_BEFORE',  // Reprogrammer avant la période demandée
    RESCHEDULE_AFTER = 'RESCHEDULE_AFTER',    // Reprogrammer après la période demandée
    SHORTEN = 'SHORTEN',                      // Raccourcir la période de congé
    SPLIT = 'SPLIT',                          // Diviser la période en plusieurs congés
    SWAP = 'SWAP',                            // Échanger avec un autre congé
    REASSIGN = 'REASSIGN',                    // Réassigner des responsabilités
    MANUAL = 'MANUAL'                         // Résolution manuelle requise
}

/**
 * Recommandation pour la résolution d'un conflit
 */
export interface ConflictRecommendation {
    conflictId: string;                      // ID du conflit concerné
    priority: ConflictPriority;              // Priorité de la recommandation
    strategies: {                            // Stratégies recommandées
        strategy: ResolutionStrategy;          // Type de stratégie
        description: string;                   // Description de la stratégie
        confidence: number;                    // Niveau de confiance (0-100%)
        alternativeDates?: {                   // Dates alternatives proposées si applicable
            startDate: string;
            endDate: string;
        }[];
        affectedUsers?: string[];             // Utilisateurs affectés par la résolution
        additionalActions?: string[];         // Actions supplémentaires à effectuer
        metadata?: Record<string, any>;       // Métadonnées spécifiques à la stratégie
    }[];
    automaticResolution: boolean;            // Si la résolution peut être appliquée automatiquement
    explanation: string;                     // Explication de la recommandation
    resolutionStatus?: 'PENDING' | 'APPLIED' | 'REJECTED'; // État de la résolution
    appliedStrategy?: ResolutionStrategy;    // Stratégie appliquée si résolue
    resolutionData?: ConflictResolution;     // Données de résolution si appliquée
}

/**
 * Résultat de l'analyse des conflits et recommandations
 */
export interface ConflictAnalysisResult {
    recommendations: ConflictRecommendation[];     // Recommandations pour les conflits
    automatedResolutionsCount: number;             // Nombre de résolutions automatiques
    manualResolutionsCount: number;                // Nombre de résolutions manuelles nécessaires
    priorityDistribution: Record<ConflictPriority, number>; // Distribution des priorités
    highestPriorityConflicts: ConflictRecommendation[];   // Conflits les plus prioritaires
}

/**
 * Règles pour déterminer les priorités et stratégies de résolution
 */
export interface ConflictResolutionRules {
    // Règles de priorité par type de conflit et sévérité
    priorityRules: {
        [key in ConflictType]?: {
            [severity in ConflictSeverity]?: ConflictPriority;
        };
    };

    // Règles de priorité par rôle utilisateur
    userRolePriorities?: Record<string, ConflictPriority>;

    // Stratégies préférées par type de conflit
    preferredStrategies?: {
        [key in ConflictType]?: ResolutionStrategy[];
    };

    // Seuils pour l'application automatique des résolutions
    autoResolutionThresholds?: {
        minConfidence: number;               // Confiance minimale pour résolution auto (0-100%)
        maxSeverity: ConflictSeverity;       // Sévérité maximale pour résolution auto
        enabledStrategies: ResolutionStrategy[]; // Stratégies autorisées en auto
    };

    // Périodes spéciales avec priorités modifiées
    specialPeriods?: {
        name: string;
        startDate: string;
        endDate: string;
        priorityModifier: number;            // Modificateur de priorité (+/-)
    }[];

    // Règles spécifiques par département
    departmentSpecificRules?: Record<string, Partial<ConflictResolutionRules>>;
}

/**
 * Options pour le système de recommandation
 */
export interface RecommendationOptions {
    rules: ConflictResolutionRules;                // Règles de résolution
    maxRecommendationsPerConflict?: number;        // Nombre max de recommandations par conflit
    enableAutoResolution?: boolean;                // Activer la résolution automatique
    learnFromPastResolutions?: boolean;            // Apprendre des résolutions passées
    considerWorkload?: boolean;                    // Considérer la charge de travail
    considerUserHistory?: boolean;                 // Considérer l'historique utilisateur
    considerTeamBalance?: boolean;                 // Considérer l'équilibre d'équipe
    explanationLevel?: 'NONE' | 'BASIC' | 'DETAILED'; // Niveau de détail des explications
} 