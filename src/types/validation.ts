/**
 * Types d'erreurs de validation
 */
export enum ViolationType {
    /** Conflit d'horaire (médecin affecté plusieurs fois le même jour) */
    SCHEDULING_CONFLICT = 'SCHEDULING_CONFLICT',
    /** Repos minimum entre gardes/vacations non respecté */
    MIN_DAYS_BETWEEN_ASSIGNMENTS = 'MIN_DAYS_BETWEEN_ASSIGNMENTS',
    /** Nombre maximum d'gardes/vacations par mois dépassé */
    MAX_ASSIGNMENTS_PER_MONTH = 'MAX_ASSIGNMENTS_PER_MONTH',
    /** Nombre maximum d'gardes/vacations consécutives dépassé */
    MAX_CONSECUTIVE_ASSIGNMENTS = 'MAX_CONSECUTIVE_ASSIGNMENTS',
    /** Exigence pour jour spécial non respectée */
    SPECIAL_DAY_REQUIREMENT = 'SPECIAL_DAY_REQUIREMENT'
}

/**
 * Violation d'une règle de validation
 */
export interface Violation {
    /** Type de violation */
    type: ViolationType;

    /** Message d'erreur explicatif */
    message: string;

    /** Données supplémentaires sur la violation */
    data?: Record<string, any>;
}

/**
 * Résultat de la validation
 */
export interface ValidationResult {
    /** Indique si les gardes/vacations sont valides */
    isValid: boolean;

    /** Liste des violations détectées */
    violations: Violation[];
} 