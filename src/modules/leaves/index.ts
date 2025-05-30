/**
 * Index principal du module leaves
 * Export consolidé de tous les éléments du module congés
 */

// Types
export * from './types';

// Services
export * from './services/leaveService';
export * from './services/quotaService';
export * from './services/conflictDetectionService';
export * from './services/leaveCalculator';
export * from './services/conflictRecommendationService';
export * from './services/publicHolidayService';
export * from './services/notificationService';
export * from './services/recurringLeaveService';

// Hooks
export * from './hooks/useLeave';
export * from './hooks/useLeaveQuota';
export * from './hooks/useConflictDetection';
export * from './hooks/useLeaveValidation';
export * from './hooks/useLeaveCalculation';
export * from './hooks/useQuotaTransfer';

// Utils
export * from './utils/dateCalculations';
export * from './utils/leaveTypeUtils';
export * from './utils/recurringLeavesUtils';

// Components (réexportés seulement si nécessaire pour d'autres modules)
// Les composants sont généralement importés directement depuis leur chemin