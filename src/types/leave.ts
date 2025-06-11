/**
 * Types globaux pour la gestion des congés
 * Note: Ces types sont maintenant exportés depuis /src/modules/leaves/types/leave.ts
 * Ce fichier maintient seulement la rétrocompatibilité pour les imports existants
 */

// Re-export des types principaux depuis le module leaves
export type {
  LeaveType,
  LeaveStatus,
  RecurrenceFrequency,
  RecurrenceEndType,
  LeaveDuration,
  LeaveDocumentType,
} from '../modules/leaves/types/leave';

// Re-export des interfaces principales depuis le module leaves
export type {
  Leave,
  LeaveRequest,
  LeaveBalance,
  LeaveFilters,
  PaginatedLeaveResults,
  LeaveAllowanceCheckResult,
  LeaveDocument,
  LeaveComment,
  LeaveResponse,
  LeaveStats,
  LeaveNotification,
  Holiday,
  RecurrencePattern,
  LeaveWithUser,
  LeaveHistory,
  LeaveBalanceAdjustment,
  RecurringLeaveRequest,
  LeaveCalculationDetails,
  LeaveCalculationOptions,
  LeaveDateValidationOptions,
  DayDetail,
  WeeklyLeaveBreakdown,
  PublicHolidayDetail,
  LeaveDayType,
} from '../modules/leaves/types/leave';

/**
 * Interface de création de congé (rétrocompatibilité)
 */
export interface CreateLeaveRequest {
  userId: string;
  startDate: Date;
  endDate: Date;
  type: string;
  reason?: string;
}
