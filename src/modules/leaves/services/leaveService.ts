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
import {
  PrismaClient,
  Prisma,
  LeaveStatus as PrismaLeaveStatus,
  LeaveType as PrismaLeaveType,
  User as PrismaUser,
  Department as PrismaDepartment,
} from '@prisma/client';

// Importer l'instance partagée de Prisma
import { prisma } from '@/lib/prisma';

const BASE_URL = '/conges';

/**
 * Helper pour construire ErrorDetails pour ce service
 */
const buildLeaveServiceErrorDetails = (
  error: any,
  context?: Record<string, any>
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
 * @optimization Utilisation de take/skip pour la pagination et select pour les champs spécifiques
 */
export const fetchLeaves = async (filters: LeaveFilters = {}): Promise<PaginatedLeaveResults> => {
  const operationKey = 'LeaveService.fetchLeaves';
  try {
    const page = (filters as any).page || 1;
    const limit = (filters as any).limit || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.LeaveWhereInput = {};

    if (filters.userId) {
      where.userId = Number(filters.userId);
    }

    if (filters.departmentId) {
      where.user = {
        departmentId: filters.departmentId,
      };
    }

    if (filters.statuses) {
      if (Array.isArray(filters.statuses) && filters.statuses.length > 0) {
        where.status = { in: filters.statuses as PrismaLeaveStatus[] };
      } else if (!Array.isArray(filters.statuses)) {
        where.status = filters.statuses as PrismaLeaveStatus;
      }
    }

    if (filters.types) {
      if (Array.isArray(filters.types) && filters.types.length > 0) {
        where.type = { in: filters.types as PrismaLeaveType[] };
      } else if (!Array.isArray(filters.types)) {
        where.type = filters.types as PrismaLeaveType;
      }
    }

    if (filters.startDate && filters.endDate) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        { startDate: { gte: new Date(filters.startDate as string) } },
        { endDate: { lte: new Date(filters.endDate as string) } },
      ];
    } else if (filters.startDate) {
      where.startDate = { gte: new Date(filters.startDate as string) };
    } else if (filters.endDate) {
      where.endDate = { lte: new Date(filters.endDate as string) };
    }

    if (filters.searchTerm) {
      const searchCondition = {
        contains: filters.searchTerm,
        mode: 'insensitive',
      } as Prisma.StringFilter;
      where.OR = [
        { user: { prenom: searchCondition } },
        { user: { nom: searchCondition } },
        { reason: searchCondition },
      ];
    }

    const orderBy: Prisma.LeaveOrderByWithRelationInput[] = [];
    const localSortBy = (filters as any).sortBy;
    const localSortOrder = (filters as any).sortOrder;

    if (localSortBy) {
      if (['userName', 'userEmail', 'departmentName'].includes(localSortBy)) {
        if (localSortBy === 'userName') {
          orderBy.push({ user: { prenom: localSortOrder || 'desc' } });
          orderBy.push({ user: { nom: localSortOrder || 'desc' } });
        } else if (localSortBy === 'userEmail') {
          orderBy.push({ user: { email: localSortOrder || 'desc' } });
        } else if (localSortBy === 'departmentName') {
          orderBy.push({ user: { department: { name: localSortOrder || 'desc' } } });
        }
      } else {
        const validSortBy = localSortBy as keyof Prisma.LeaveOrderByWithRelationInput;
        orderBy.push({ [validSortBy]: localSortOrder || 'desc' });
      }
    } else {
      orderBy.push({ startDate: 'desc' });
    }

    const prismaSelect: Prisma.LeaveSelect = {
      id: true,
      userId: true,
      startDate: true,
      endDate: true,
      countedDays: true,
      type: true,
      reason: true,
      status: true,
      requestDate: true,
      approvedById: true,
      approvalDate: true,
      isRecurring: true,
      recurrencePattern: true,
      parentId: true,
      createdAt: true,
      updatedAt: true,
      user: {
        include: {
          department: true,
        },
      },
    };

    const total = await prisma.leave.count({ where });

    const prismaLeaves = await prisma.leave.findMany({
      where,
      select: prismaSelect,
      skip,
      take: limit,
      orderBy,
    });

    const items: Leave[] = prismaLeaves.map(leave => {
      const userWithDepartment = leave.user as PrismaUser & { department: PrismaDepartment | null };

      return {
        id: leave.id,
        userId: String(userWithDepartment.id),
        userName: `${userWithDepartment.prenom} ${userWithDepartment.nom}`,
        userEmail: userWithDepartment.email,
        departmentId: userWithDepartment.department?.id ?? '',
        departmentName: userWithDepartment.department?.name ?? '',
        startDate: formatDate(leave.startDate, ISO_DATE_FORMAT),
        endDate: formatDate(leave.endDate, ISO_DATE_FORMAT),
        halfDayStart: (leave as any).halfDayStart ?? undefined,
        halfDayEnd: (leave as any).halfDayEnd ?? undefined,
        workingDaysCount: leave.countedDays ?? 0,
        type: leave.type as LeaveType,
        reason: leave.reason ?? undefined,
        status: leave.status as LeaveStatus,
        requestDate: formatDate(leave.requestDate, ISO_DATE_FORMAT),
        approverId: leave.approvedById ? String(leave.approvedById) : undefined,
        approvalDate: leave.approvalDate
          ? formatDate(leave.approvalDate, ISO_DATE_FORMAT)
          : undefined,
        rejectionReason: (leave as any).rejectionReason ?? undefined,
        cancellationReason: (leave as any).cancellationReason ?? undefined,
        isRecurring: leave.isRecurring ?? undefined,
        recurrencePattern: leave.recurrencePattern
          ? JSON.parse(JSON.stringify(leave.recurrencePattern))
          : undefined,
        parentId: leave.parentId ?? undefined,
        createdAt: formatDate(leave.createdAt, ISO_DATE_FORMAT),
        updatedAt: formatDate(leave.updatedAt, ISO_DATE_FORMAT),
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
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
    const response = await fetch(`http://localhost:3000/api/conges/${leaveId}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => response.statusText);
      const error = new Error(
        `Erreur HTTP ${response.status} lors de la récupération du congé ${leaveId}: ${errorData}`
      );
      (error as any).code = `HTTP_${response.status}`;
      throw error;
    }

    return await response.json();
  } catch (error) {
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
    const response = await fetch(`http://localhost:3000/api/conges/balance?userId=${userId}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => response.statusText);
      const error = new Error(
        `Erreur HTTP ${response.status} lors de la récupération du solde pour ${userId}: ${errorData}`
      );
      (error as any).code = `HTTP_${response.status}`;
      throw error;
    }

    return await response.json();
  } catch (error) {
    const errorDetails = buildLeaveServiceErrorDetails(error, { userId });
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
    const url = leave.id ? `/api/conges/${leave.id}` : '/api/conges';

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
  } catch (error) {
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
  } catch (error) {
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
    const response = await fetch(`http://localhost:3000/api/conges/${leaveId}/approve`, {
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
  } catch (error) {
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
    const response = await fetch(`http://localhost:3000/api/conges/${leaveId}/reject`, {
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
  } catch (error) {
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
    const response = await fetch(`http://localhost:3000/api/conges/${leaveId}/cancel`, {
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
  } catch (error) {
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

    const response = await fetch(`http://localhost:3000/api/conges/check-conflicts?${params.toString()}`);

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
  } catch (error) {
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

    const response = await fetch(`http://localhost:3000/api/conges/check-allowance?${params.toString()}`);

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
  } catch (error) {
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

    const weekdayMap: Record<number, Weekday> = {
      0: Weekday.SUNDAY,
      1: Weekday.MONDAY,
      2: Weekday.TUESDAY,
      3: Weekday.WEDNESDAY,
      4: Weekday.THURSDAY,
      5: Weekday.FRIDAY,
      6: Weekday.SATURDAY,
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
  const labels: Record<LeaveType, string> = {
    [LeaveType.ANNUAL]: 'Congé annuel',
    [LeaveType.RECOVERY]: 'Récupération',
    [LeaveType.TRAINING]: 'Formation',
    [LeaveType.SICK]: 'Maladie',
    [LeaveType.MATERNITY]: 'Maternité',
    [LeaveType.PATERNITY]: 'Paternité',
    [LeaveType.PARENTAL]: 'Parental',
    [LeaveType.SPECIAL]: 'Congé spécial',
    [LeaveType.UNPAID]: 'Congé sans solde',
    [LeaveType.OTHER]: 'Autre',
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

    const response = await fetch('http://localhost:3000/api/conges/recurrents', {
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
  } catch (error) {
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

    const response = await fetch(`http://localhost:3000/api/conges/recurrents/${recurringRequest.id}`, {
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
  } catch (error) {
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
    const response = await fetch(`http://localhost:3000/api/conges/recurrents/${id}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => response.statusText);
      const error = new Error(
        `Erreur HTTP ${response.status} lors de la récupération du congé récurrent ${id}: ${errorData}`
      );
      (error as any).code = `HTTP_${response.status}`;
      throw error;
    }

    return await response.json();
  } catch (error) {
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
    const response = await fetch(`http://localhost:3000/api/conges/recurrents?userId=${userId}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => response.statusText);
      const error = new Error(
        `Erreur HTTP ${response.status} lors de la récupération des congés récurrents pour ${userId}: ${errorData}`
      );
      (error as any).code = `HTTP_${response.status}`;
      throw error;
    }

    return await response.json();
  } catch (error) {
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
    const response = await fetch(`http://localhost:3000/api/conges/recurrents/${id}?deleteOccurrences=${deleteOccurrences}`,
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
  } catch (error) {
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

    const response = await fetch('http://localhost:3000/api/conges/recurrents/preview', {
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
  } catch (error) {
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

    const response = await fetch('http://localhost:3000/api/conges/recurrents/conflicts', {
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
  } catch (error) {
    const errorDetails = buildLeaveServiceErrorDetails(error, { request: recurringRequest });
    logError(operationKey, { ...errorDetails, timestamp: new Date() });
    throw error;
  }
};
