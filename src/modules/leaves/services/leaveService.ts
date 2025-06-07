import {
  LeaveRequest as Leave,
  LeaveType,
  LeaveStatus,
  LeaveFilters,
  LeaveBalance,
  LeaveAllowanceCheckResult,
  PaginatedLeaveResults,
  LeaveStats,
  LeaveResponse,
  LeaveHistory,
  LeaveDocument,
  RecurringLeaveRequest,
} from '../types/leave';
import {
  ConflictCheckResult,
  LeaveConflict,
  ConflictRules,
  ConflictType,
  ConflictSeverity,
} from '../types/conflict';
import { WorkflowAction, WorkflowActionType, WorkflowRules } from '../types/request';

import { calculateLeaveCountedDays } from './leaveCalculator';
import { WorkSchedule } from '../../profiles/types/workSchedule';
import { Weekday } from '../../profiles/types/workSchedule';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { logError } from '@/services/errorLoggingService';
import { ErrorSeverity, ErrorDetails } from '@/hooks/useErrorHandler';
import { formatDate, parseDate, ISO_DATE_FORMAT } from '@/utils/dateUtils';
import apiClient from '../../../utils/apiClient';

const BASE_URL = '/conges';

/**
 * Helper pour construire ErrorDetails pour ce service
 */
const buildLeaveServiceErrorDetails = (
  error: unknown,
  context?: Record<string, unknown>
): Omit<ErrorDetails, 'timestamp' | 'retry'> => {
  let message = 'Erreur inconnue dans le service des congés.';
  let code = 'LEAVE_SERVICE_ERROR';
  const severity: ErrorSeverity = 'error'; // Par défaut

  if (error instanceof Error) {
    message = error.message;
    // Tenter d'extraire un code d'erreur si c'est une erreur API simulée ou autre
    if ((error as any).code) {
      code = (error as any).code;
    }
  }
  // On pourrait ajouter une logique pour déterminer la sévérité
  // en fonction du code ou du message si nécessaire.

  return {
    message: message,
    code: code,
    severity: severity,
    context: context || {},
  };
};

/**
 * Récupérer les demandes de congés avec filtres
 */
export const fetchLeaves = async (filters: LeaveFilters = {}): Promise<PaginatedLeaveResults> => {
  const operationKey = 'LeaveService.fetchLeaves';
  try {
    // Construire les paramètres de requête
    const params = new URLSearchParams();
    
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.departmentId) params.append('departmentId', filters.departmentId);
    if (filters.statuses) {
      if (Array.isArray(filters.statuses)) {
        filters.statuses.forEach(status => params.append('statuses', status));
      } else {
        params.append('statuses', filters.statuses);
      }
    }
    if (filters.types) {
      if (Array.isArray(filters.types)) {
        filters.types.forEach(type => params.append('types', type));
      } else {
        params.append('types', filters.types);
      }
    }
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
    if ((filters as any).page) params.append('page', String((filters as any).page));
    if ((filters as any).limit) params.append('limit', String((filters as any).limit));
    if ((filters as any).sortBy) params.append('sortBy', (filters as any).sortBy);
    if ((filters as any).sortOrder) params.append('sortOrder', (filters as any).sortOrder);

    const response = await fetch(`/api/leaves?${params.toString()}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => response.statusText);
      const error = new Error(
        `Erreur HTTP ${response.status} lors de la récupération des congés: ${errorData}`
      );
      (error as any).code = `HTTP_${response.status}`;
      throw error;
    }

    const result = await response.json();

    // Vérifier que le résultat a la structure attendue
    if (!result || typeof result !== 'object' || !Array.isArray(result.items)) {
      throw new Error('Réponse invalide du serveur');
    }

    return result;
  } catch (error: unknown) {
    const errorDetails = buildLeaveServiceErrorDetails(error, { filters });
    logError(operationKey, { ...errorDetails, timestamp: new Date() });
    throw error;
  }
};

/**
 * Récupérer une demande de congés par son ID
 */
export const fetchLeaveById = async (leaveId: string): Promise<Leave> => {
  const operationKey = 'LeaveService.fetchLeaveById';
  try {
    const response = await fetch(`/api/leaves/${leaveId}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => response.statusText);
      const error = new Error(
        `Erreur HTTP ${response.status} lors de la récupération du congé ${leaveId}: ${errorData}`
      );
      (error as any).code = `HTTP_${response.status}`;
      throw error;
    }

    return await response.json();
  } catch (error: unknown) {
    const errorDetails = buildLeaveServiceErrorDetails(error, { leaveId });
    logError(operationKey, { ...errorDetails, timestamp: new Date() });
    throw error;
  }
};

/**
 * Récupérer le solde de congés d'un utilisateur
 */
export const fetchLeaveBalance = async (userId: string): Promise<LeaveBalance> => {
  const operationKey = 'LeaveService.fetchLeaveBalance';
  try {
    const response = await fetch(`/api/leaves/balance?userId=${userId}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => response.statusText);
      const error = new Error(
        `Erreur HTTP ${response.status} lors de la récupération du solde pour ${userId}: ${errorData}`
      );
      (error as any).code = `HTTP_${response.status}`;
      throw error;
    }

    return await response.json();
  } catch (error: unknown) {
    const errorDetails = buildLeaveServiceErrorDetails(error, { userId });
    logError(operationKey, { ...errorDetails, timestamp: new Date() });
    throw error;
  }
};

/**
 * Récupérer les congés d'un utilisateur spécifique
 */
export const fetchUserLeaves = async (userId: string, year?: number): Promise<Leave[]> => {
  const operationKey = 'LeaveService.fetchUserLeaves';
  try {
    const params = new URLSearchParams();
    params.append('userId', userId);
    if (year !== undefined) {
      params.append('year', String(year));
    }

    const response = await fetch(`/api/leaves/user-leaves?${params.toString()}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => response.statusText);
      const error = new Error(
        `Erreur HTTP ${response.status} lors de la récupération des congés de l'utilisateur ${userId}: ${errorData}`
      );
      (error as any).code = `HTTP_${response.status}`;
      throw error;
    }

    return await response.json();
  } catch (error: unknown) {
    const errorDetails = buildLeaveServiceErrorDetails(error, { userId, year });
    logError(operationKey, { ...errorDetails, timestamp: new Date() });
    throw error;
  }
};

/**
 * Créer ou mettre à jour une demande de congés
 */
export const saveLeave = async (leave: Partial<Leave>): Promise<Leave> => {
  const operationKey = leave.id ? 'LeaveService.updateLeave' : 'LeaveService.createLeave';
  try {
    const method = leave.id ? 'PUT' : 'POST';
    const url = leave.id ? `/api/leaves/${leave.id}` : '/api/leaves';

    const payload = {
      ...leave,
      startDate: leave.startDate ? formatDate(leave.startDate, ISO_DATE_FORMAT) : undefined,
      endDate: leave.endDate ? formatDate(leave.endDate, ISO_DATE_FORMAT) : undefined,
      requestDate: leave.requestDate ? formatDate(leave.requestDate, ISO_DATE_FORMAT) : undefined,
    };

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => response.statusText);
      const error = new Error(
        `Erreur HTTP ${response.status} lors de l'enregistrement du congé: ${errorData}`
      );
      (error as any).code = `HTTP_${response.status}`;
      throw error;
    }

    return await response.json();
  } catch (error: unknown) {
    const errorDetails = buildLeaveServiceErrorDetails(error, { leaveId: leave.id });
    logError(operationKey, { ...errorDetails, timestamp: new Date() });
    throw error;
  }
};

/**
 * Soumettre une demande de congés pour approbation
 */
export const submitLeaveRequest = async (leaveData: Partial<Leave>): Promise<Leave> => {
  const operationKey = 'LeaveService.submitLeaveRequest';
  try {
    if (leaveData.status === LeaveStatus.PENDING) {
      return leaveData as Leave;
    }

    const leaveToSubmit = {
      ...leaveData,
      status: LeaveStatus.PENDING,
      requestDate: new Date(),
    };
    const payloadForSaveLeave = {
      ...leaveToSubmit,
      requestDate: formatDate(leaveToSubmit.requestDate, ISO_DATE_FORMAT),
    };

    return await saveLeave(payloadForSaveLeave);
  } catch (error: unknown) {
    const errorDetails = buildLeaveServiceErrorDetails(error, { leaveId: leaveData.id });
    logError(operationKey, { ...errorDetails, timestamp: new Date() });
    throw error;
  }
};

/**
 * Approuver une demande de congés
 */
export const approveLeave = async (leaveId: string, comment?: string): Promise<Leave> => {
  const operationKey = 'LeaveService.approveLeave';
  try {
    const response = await fetch(`/api/leaves/${leaveId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => response.statusText);
      const error = new Error(
        `Erreur HTTP ${response.status} lors de l'approbation du congé ${leaveId}: ${errorData}`
      );
      (error as any).code = `HTTP_${response.status}`;
      throw error;
    }

    return await response.json();
  } catch (error: unknown) {
    const errorDetails = buildLeaveServiceErrorDetails(error, { leaveId });
    logError(operationKey, { ...errorDetails, timestamp: new Date() });
    throw error;
  }
};

/**
 * Rejeter une demande de congés
 */
export const rejectLeave = async (leaveId: string, comment?: string): Promise<Leave> => {
  const operationKey = 'LeaveService.rejectLeave';
  try {
    const response = await fetch(`/api/leaves/${leaveId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => response.statusText);
      const error = new Error(
        `Erreur HTTP ${response.status} lors du rejet du congé ${leaveId}: ${errorData}`
      );
      (error as any).code = `HTTP_${response.status}`;
      throw error;
    }

    return await response.json();
  } catch (error: unknown) {
    const errorDetails = buildLeaveServiceErrorDetails(error, { leaveId });
    logError(operationKey, { ...errorDetails, timestamp: new Date() });
    throw error;
  }
};

/**
 * Annuler une demande de congés
 */
export const cancelLeave = async (leaveId: string, comment?: string): Promise<Leave> => {
  const operationKey = 'LeaveService.cancelLeave';
  try {
    const response = await fetch(`/api/leaves/${leaveId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => response.statusText);
      const error = new Error(
        `Erreur HTTP ${response.status} lors de l'annulation du congé ${leaveId}: ${errorData}`
      );
      (error as any).code = `HTTP_${response.status}`;
      throw error;
    }

    return await response.json();
  } catch (error: unknown) {
    const errorDetails = buildLeaveServiceErrorDetails(error, { leaveId });
    logError(operationKey, { ...errorDetails, timestamp: new Date() });
    throw error;
  }
};

/**
 * Vérifier les conflits potentiels pour une période de congés
 * 🔐 CORRECTION TODO CRITIQUE : Adapter pour vérifier les conflits avec les occurrences de congés récurrents
 */
export const checkLeaveConflicts = async (
  startDate: Date,
  endDate: Date,
  userId: string,
  leaveId?: string,
  checkRecurringOccurrences: boolean = true
): Promise<ConflictCheckResult> => {
  const operationKey = 'LeaveService.checkLeaveConflicts';
  try {
    const params = new URLSearchParams({
      startDate: formatDate(startDate, ISO_DATE_FORMAT),
      endDate: formatDate(endDate, ISO_DATE_FORMAT),
      userId,
      checkRecurringOccurrences: checkRecurringOccurrences.toString(),
    });

    if (leaveId) {
      params.append('leaveId', leaveId);
    }

    const response = await fetch(`/api/leaves/check-conflicts?${params.toString()}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => response.statusText);
      const error = new Error(
        `Erreur HTTP ${response.status} lors de la vérification des conflits: ${errorData}`
      );
      (error as any).code = `HTTP_${response.status}`;
      throw error;
    }

    const result = await response.json();

    // 🔐 VALIDATION SÉCURISÉE : Vérifier l'intégrité de la réponse
    if (!result || typeof result !== 'object') {
      throw new Error('Réponse invalide de la vérification de conflits');
    }

    return result;
  } catch (error: unknown) {
    const errorDetails = buildLeaveServiceErrorDetails(error, {
      startDate,
      endDate,
      userId,
      leaveId,
      checkRecurringOccurrences,
    });
    logError(operationKey, { ...errorDetails, timestamp: new Date() });
    throw error;
  }
};

/**
 * Vérifier si l'utilisateur a assez de jours de congés disponibles
 * 🔐 CORRECTION TODO CRITIQUE : Adapter pour vérifier les quotas en prenant en compte les occurrences de congés récurrents
 */
export const checkLeaveAllowance = async (
  userId: string,
  leaveType: LeaveType,
  countedDays: number,
  includeRecurringOccurrences: boolean = true
): Promise<LeaveAllowanceCheckResult> => {
  const operationKey = 'LeaveService.checkLeaveAllowance';
  try {
    const params = new URLSearchParams({
      userId,
      leaveType,
      countedDays: countedDays.toString(),
      includeRecurringOccurrences: includeRecurringOccurrences.toString(),
    });

    const response = await fetch(`/api/leaves/check-allowance?${params.toString()}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => response.statusText);
      const error = new Error(
        `Erreur HTTP ${response.status} lors de la vérification des droits: ${errorData}`
      );
      (error as any).code = `HTTP_${response.status}`;
      throw error;
    }

    const result = await response.json();

    // 🔐 VALIDATION SÉCURISÉE : Vérifier l'intégrité de la réponse
    if (!result || typeof result !== 'object' || typeof result.hasAllowance !== 'boolean') {
      throw new Error('Réponse invalide de la vérification des quotas');
    }

    return result;
  } catch (error: unknown) {
    const errorDetails = buildLeaveServiceErrorDetails(error, {
      userId,
      leaveType,
      countedDays,
      includeRecurringOccurrences
    });
    logError(operationKey, { ...errorDetails, timestamp: new Date() });
    throw error;
  }
};

/**
 * Calculer le nombre de jours de congés à partir des dates et du planning de travail
 * TODO: Adapter le calcul pour potentiellement utiliser une logique différente pour les congés récurrents (si nécessaire)
 */
// Version simplifiée pour les tests qui ne prend pas en compte le planning médical
export const calculateLeaveDaysSimple = (
  startDate: Date,
  endDate: Date,
  isHalfDay: boolean = false
): number => {
  if (isHalfDay) {
    return 0.5;
  }
  const days = differenceInDays(endDate, startDate) + 1;
  return days;
};

export const calculateLeaveDays = (
  startDate: Date,
  endDate: Date,
  planningMedical: WorkSchedule
): number => {
  const naturalDays = differenceInDays(endDate, startDate) + 1;

  let countedDays = 0;

  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();

    const weekdayMap: Record<number, string> = {
      0: 'SUNDAY',
      1: 'MONDAY',
      2: 'TUESDAY',
      3: 'WEDNESDAY',
      4: 'THURSDAY',
      5: 'FRIDAY',
      6: 'SATURDAY',
    };

    const weekday = weekdayMap[dayOfWeek];

    if (planningMedical.workingDays?.includes(weekday)) {
      countedDays++;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return countedDays;
};

/**
 * Formater une période de congés pour l'affichage
 */
export const formatLeavePeriod = (startDate: Date, endDate: Date): string => {
  if (startDate.getTime() === endDate.getTime()) {
    return format(startDate, 'dd/MM/yyyy');
  }

  return `${format(startDate, 'dd/MM/yyyy')} au ${format(endDate, 'dd/MM/yyyy')}`;
};

/**
 * Renvoie le libellé d'un type de congé
 */
export const getLeaveTypeLabel = (type: LeaveType): string => {
  const labels = {
    ANNUAL: 'Congé annuel',
    SICK: 'Maladie',
    MATERNITY: 'Maternité',
    PATERNITY: 'Paternité',
    UNPAID: 'Congé sans solde',
    SPECIAL: 'Congé spécial',
    TRAINING: 'Formation',
    RECOVERY: 'Récupération',
    COMPENSATORY: 'Récupération compensatoire',
    FAMILY: 'Congé familial',
    MEDICAL: 'Congé médical',
    OTHER: 'Autre',
  };
  return labels[type] || type;
};

/**
 * Renvoie le libellé d'un statut de congé
 */
export const getLeaveStatusLabel = (status: LeaveStatus): string => {
  const labels: Record<LeaveStatus, string> = {
    [LeaveStatus.DRAFT]: 'Brouillon',
    [LeaveStatus.PENDING]: 'En attente',
    [LeaveStatus.APPROVED]: 'Approuvé',
    [LeaveStatus.REJECTED]: 'Refusé',
    [LeaveStatus.CANCELLED]: 'Annulé',
  };

  return labels[status] || status;
};

/**
 * Créer une demande de congés récurrente
 * @param recurringRequest Demande de congés récurrente
 * @returns Demande créée avec les occurrences générées
 */
export const createRecurringLeaveRequest = async (
  recurringRequest: Partial<RecurringLeaveRequest>
): Promise<RecurringLeaveRequest> => {
  const operationKey = 'LeaveService.createRecurringLeaveRequest';
  try {
    const payload = {
      ...recurringRequest,
      patternStartDate: recurringRequest.patternStartDate
        ? formatDate(recurringRequest.patternStartDate, ISO_DATE_FORMAT)
        : undefined,
      patternEndDate: recurringRequest.patternEndDate
        ? formatDate(recurringRequest.patternEndDate, ISO_DATE_FORMAT)
        : undefined,
    };

    const response = await fetch('/api/leaves/recurring', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => response.statusText);
      const error = new Error(
        `Erreur HTTP ${response.status} lors de la création du congé récurrent: ${errorData}`
      );
      (error as any).code = `HTTP_${response.status}`;
      throw error;
    }

    return await response.json();
  } catch (error: unknown) {
    const errorDetails = buildLeaveServiceErrorDetails(error, { request: recurringRequest });
    logError(operationKey, { ...errorDetails, timestamp: new Date() });
    throw error;
  }
};

/**
 * Mettre à jour une demande de congés récurrente
 * @param recurringRequest Demande mise à jour
 * @returns Demande mise à jour
 */
export const updateRecurringLeaveRequest = async (
  recurringRequest: Partial<RecurringLeaveRequest>
): Promise<RecurringLeaveRequest> => {
  if (!recurringRequest.id) {
    throw new Error("L'identifiant de la demande récurrente est requis pour la mise à jour");
  }

  const operationKey = 'LeaveService.updateRecurringLeaveRequest';
  try {
    const payload = {
      ...recurringRequest,
      patternStartDate: recurringRequest.patternStartDate
        ? formatDate(recurringRequest.patternStartDate, ISO_DATE_FORMAT)
        : undefined,
      patternEndDate: recurringRequest.patternEndDate
        ? formatDate(recurringRequest.patternEndDate, ISO_DATE_FORMAT)
        : undefined,
    };

    const response = await fetch(`/api/leaves/recurring/${recurringRequest.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => response.statusText);
      const error = new Error(
        `Erreur HTTP ${response.status} lors de la mise à jour du congé récurrent: ${errorData}`
      );
      (error as any).code = `HTTP_${response.status}`;
      throw error;
    }

    return await response.json();
  } catch (error: unknown) {
    const errorDetails = buildLeaveServiceErrorDetails(error, { request: recurringRequest });
    logError(operationKey, { ...errorDetails, timestamp: new Date() });
    throw error;
  }
};

/**
 * Récupérer une demande de congés récurrente par son ID
 * @param id Identifiant de la demande
 * @returns Demande avec ses occurrences
 */
export const fetchRecurringLeaveRequestById = async (
  id: string
): Promise<RecurringLeaveRequest> => {
  const operationKey = 'LeaveService.fetchRecurringLeaveRequestById';
  try {
    const response = await fetch(`/api/leaves/recurring/${id}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => response.statusText);
      const error = new Error(
        `Erreur HTTP ${response.status} lors de la récupération du congé récurrent ${id}: ${errorData}`
      );
      (error as any).code = `HTTP_${response.status}`;
      throw error;
    }

    return await response.json();
  } catch (error: unknown) {
    const errorDetails = buildLeaveServiceErrorDetails(error, { id });
    logError(operationKey, { ...errorDetails, timestamp: new Date() });
    throw error;
  }
};

/**
 * Récupérer les demandes de congés récurrentes d'un utilisateur
 * @param userId Identifiant de l'utilisateur
 * @returns Liste des demandes récurrentes
 */
export const fetchRecurringLeaveRequestsByUser = async (
  userId: string
): Promise<RecurringLeaveRequest[]> => {
  const operationKey = 'LeaveService.fetchRecurringLeaveRequestsByUser';
  try {
    const response = await fetch(`/api/leaves/recurring?userId=${userId}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => response.statusText);
      const error = new Error(
        `Erreur HTTP ${response.status} lors de la récupération des congés récurrents pour ${userId}: ${errorData}`
      );
      (error as any).code = `HTTP_${response.status}`;
      throw error;
    }

    return await response.json();
  } catch (error: unknown) {
    const errorDetails = buildLeaveServiceErrorDetails(error, { userId });
    logError(operationKey, { ...errorDetails, timestamp: new Date() });
    throw error;
  }
};

/**
 * Supprimer une demande de congés récurrente
 * @param id Identifiant de la demande
 * @param deleteOccurrences Si true, supprime également les occurrences générées
 * @returns Résultat de la suppression
 */
export const deleteRecurringLeaveRequest = async (
  id: string,
  deleteOccurrences: boolean = true
): Promise<{ success: boolean; deletedOccurrences?: number }> => {
  const operationKey = 'LeaveService.deleteRecurringLeaveRequest';
  try {
    const response = await fetch(`/api/leaves/recurring/${id}?deleteOccurrences=${deleteOccurrences}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => response.statusText);
      const error = new Error(
        `Erreur HTTP ${response.status} lors de la suppression du congé récurrent ${id}: ${errorData}`
      );
      (error as any).code = `HTTP_${response.status}`;
      throw error;
    }

    return await response.json();
  } catch (error: unknown) {
    const errorDetails = buildLeaveServiceErrorDetails(error, { id, deleteOccurrences });
    logError(operationKey, { ...errorDetails, timestamp: new Date() });
    throw error;
  }
};

/**
 * Générer les occurrences d'une demande récurrente sans la sauvegarder
 * @param recurringRequest Demande récurrente
 * @returns Occurrences générées
 */
export const previewRecurringLeaveOccurrences = async (
  recurringRequest: Partial<RecurringLeaveRequest>
): Promise<Leave[]> => {
  const operationKey = 'LeaveService.previewRecurringLeaveOccurrences';
  try {
    const payload = {
      ...recurringRequest,
      patternStartDate: recurringRequest.patternStartDate
        ? formatDate(recurringRequest.patternStartDate, ISO_DATE_FORMAT)
        : undefined,
      patternEndDate: recurringRequest.patternEndDate
        ? formatDate(recurringRequest.patternEndDate, ISO_DATE_FORMAT)
        : undefined,
    };

    const response = await fetch('/api/leaves/recurring/preview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => response.statusText);
      const error = new Error(
        `Erreur HTTP ${response.status} lors de la prévisualisation des occurrences: ${errorData}`
      );
      (error as any).code = `HTTP_${response.status}`;
      throw error;
    }

    return await response.json();
  } catch (error: unknown) {
    const errorDetails = buildLeaveServiceErrorDetails(error, { request: recurringRequest });
    logError(operationKey, { ...errorDetails, timestamp: new Date() });
    throw error;
  }
};

/**
 * Vérifier les conflits pour une série de congés récurrents
 * @param recurringRequest Demande récurrente à vérifier
 * @returns Résultat de la vérification des conflits
 */
export const checkRecurringLeaveConflicts = async (
  recurringRequest: Partial<RecurringLeaveRequest>
): Promise<ConflictCheckResult> => {
  const operationKey = 'LeaveService.checkRecurringLeaveConflicts';
  try {
    const payload = {
      ...recurringRequest,
      patternStartDate: recurringRequest.patternStartDate
        ? formatDate(recurringRequest.patternStartDate, ISO_DATE_FORMAT)
        : undefined,
      patternEndDate: recurringRequest.patternEndDate
        ? formatDate(recurringRequest.patternEndDate, ISO_DATE_FORMAT)
        : undefined,
    };

    const response = await fetch('/api/leaves/recurring/conflicts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => response.statusText);
      const error = new Error(
        `Erreur HTTP ${response.status} lors de la vérification des conflits: ${errorData}`
      );
      (error as any).code = `HTTP_${response.status}`;
      throw error;
    }

    return await response.json();
  } catch (error: unknown) {
    const errorDetails = buildLeaveServiceErrorDetails(error, { request: recurringRequest });
    logError(operationKey, { ...errorDetails, timestamp: new Date() });
    throw error;
  }
};
