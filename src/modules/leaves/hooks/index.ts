/**
 * Index des hooks du module leaves
 * Exports centralisés pour une utilisation cohérente
 */

// Hooks principaux
export { useLeave } from './useLeave';
export { useConflictDetection } from './useConflictDetection';
export { useLeaveValidation } from './useLeaveValidation';
export { useDateValidation } from './useDateValidation';

// Hooks de données
export { useLeaveData } from './useLeaveData';
export { useLeaveQueries } from './useLeaveQueries';
export { useLeaveTypes } from './useLeaveTypes';

// Hooks de calcul
export { useLeaveCalculation } from './useLeaveCalculation';
export { useLeaveQuota } from './useLeaveQuota';
export { useQuotaCalculation } from './useQuotaCalculation';
export { useQuotaCarryOver } from './useQuotaCarryOver';

// Hooks de règles et validation
export { useConflictRules } from './useConflictRules';
export { useLeaveRulesValidation } from './useLeaveRulesValidation';
export { useRecurringLeaveValidation } from './useRecurringLeaveValidation';

// Hooks de filtrage et tri
export { useLeaveListFilteringSorting } from './useLeaveListFilteringSorting';
export { useDebounceFilters } from './useDebounceFilters';

// Hooks de notifications et analytics
export { useNotifications } from './useNotifications';
export { useLeaveConflictNotification } from './useLeaveConflictNotification';
export { useLeaveConflictAnalytics } from './useLeaveConflictAnalytics';
export { useConflictRecommendation } from './useConflictRecommendation';

// Hooks de rapports et historique
export { useQuotaHistory } from './useQuotaHistory';
export { useQuotaTransfer } from './useQuotaTransfer';
export { useQuotaTransferReport } from './useQuotaTransferReport';

// Types pour les hooks
export type {
    UseConflictDetectionProps,
    UseConflictDetectionReturn
} from './useConflictDetection';

export type {
    DateValidationOptions,
    DateValidationError,
    DateValidationResult
} from './useDateValidation';

export type {
    DateValidationErrorType,
    DateRange,
    ValidationContext
} from './useLeaveValidation';