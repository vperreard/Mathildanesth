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
    LeaveDocument
} from '../types/leave';
import {
    ConflictCheckResult,
    LeaveConflict,
    ConflictRules,
    ConflictType,
    ConflictSeverity
} from '../types/conflict';
import {
    WorkflowAction,
    WorkflowActionType,
    WorkflowRules
} from '../types/request';

import { calculateLeaveCountedDays } from './leaveCalculator';
import { WorkSchedule } from '../../profiles/types/workSchedule';
import { Weekday } from '../../profiles/types/workSchedule';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { logError } from '@/services/errorLoggingService';
import { ErrorSeverity, ErrorDetails } from '@/hooks/useErrorHandler';
import { formatDate, parseDate, ISO_DATE_FORMAT } from '@/utils/dateUtils';
import apiClient from '../../../utils/apiClient';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BASE_URL = '/leaves';

/**
 * Helper pour construire ErrorDetails pour ce service
 */
const buildLeaveServiceErrorDetails = (error: any, context?: Record<string, any>): Omit<ErrorDetails, 'timestamp' | 'retry'> => {
    let message = 'Erreur inconnue dans le service des congés.';
    let code = 'LEAVE_SERVICE_ERROR';
    let severity: ErrorSeverity = 'error'; // Par défaut

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
        // Construire les paramètres de pagination
        const page = filters.page || 1;
        const limit = filters.limit || 50;
        const skip = (page - 1) * limit;

        // Construire les conditions de filtrage pour Prisma
        const where: any = {};

        if (filters.userId) {
            where.userId = filters.userId;
        }

        if (filters.departmentId) {
            where.departmentId = filters.departmentId;
        }

        if (filters.status) {
            if (Array.isArray(filters.status)) {
                where.status = { in: filters.status };
            } else {
                where.status = filters.status;
            }
        }

        if (filters.type) {
            if (Array.isArray(filters.type)) {
                where.type = { in: filters.type };
            } else {
                where.type = filters.type;
            }
        }

        if (filters.startDate) {
            where.startDate = {
                gte: filters.startDate
            };
        }

        if (filters.endDate) {
            where.endDate = {
                lte: filters.endDate
            };
        }

        if (filters.search) {
            where.OR = [
                { userName: { contains: filters.search, mode: 'insensitive' } },
                { reason: { contains: filters.search, mode: 'insensitive' } }
            ];
        }

        // Définir l'ordre de tri
        const orderBy: any = {};
        if (filters.sortBy) {
            orderBy[filters.sortBy] = filters.sortOrder || 'desc';
        } else {
            orderBy.startDate = 'desc';
        }

        // Optimisation: sélectionner uniquement les champs nécessaires pour la demande de congés
        const select = {
            id: true,
            userId: true,
            userName: true,
            userEmail: true,
            departmentId: true,
            departmentName: true,
            startDate: true,
            endDate: true,
            halfDayStart: true,
            halfDayEnd: true,
            workingDaysCount: true,
            type: true,
            reason: true,
            status: true,
            requestDate: true,
            approverId: true,
            approverName: true,
            approvalDate: true,
            rejectionReason: true,
            cancellationReason: true,
            createdAt: true,
            updatedAt: true
        };

        // Obtenir le total sans pagination pour le comptage
        const total = await prisma.leave.count({ where });

        // Récupérer les données paginées
        const leaves = await prisma.leave.findMany({
            where,
            select,
            skip,
            take: limit,
            orderBy
        });

        return {
            items: leaves,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
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
        const response = await fetch(`/api/leaves/${leaveId}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.statusText);
            const error = new Error(`Erreur HTTP ${response.status} lors de la récupération du congé ${leaveId}: ${errorData}`);
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
        const response = await fetch(`/api/leaves/balance?userId=${userId}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.statusText);
            const error = new Error(`Erreur HTTP ${response.status} lors de la récupération du solde pour ${userId}: ${errorData}`);
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
        const url = leave.id ? `/api/leaves/${leave.id}` : '/api/leaves';

        // Assurer que les dates sont au format ISO string pour l'API
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
            const error = new Error(`Erreur HTTP ${response.status} lors de l'enregistrement du congé: ${errorData}`);
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
export const submitLeaveRequest = async (leave: Partial<Leave>): Promise<Leave> => {
    const operationKey = 'LeaveService.submitLeaveRequest';
    try {
        // Si la demande est déjà en attente, aucune action requise
        if (leave.status === LeaveStatus.EN_ATTENTE) {
            return leave as Leave;
        }

        const leaveToSubmit = {
            ...leave,
            status: LeaveStatus.PENDING,
            requestDate: new Date()
        };
        return await saveLeave(leaveToSubmit);
    } catch (error) {
        const errorDetails = buildLeaveServiceErrorDetails(error, { leaveId: leave.id });
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
            const error = new Error(`Erreur HTTP ${response.status} lors de l'approbation du congé ${leaveId}: ${errorData}`);
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
        const response = await fetch(`/api/leaves/${leaveId}/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ comment }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.statusText);
            const error = new Error(`Erreur HTTP ${response.status} lors du rejet du congé ${leaveId}: ${errorData}`);
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
        const response = await fetch(`/api/leaves/${leaveId}/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ comment }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.statusText);
            const error = new Error(`Erreur HTTP ${response.status} lors de l'annulation du congé ${leaveId}: ${errorData}`);
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
 * TODO: Adapter pour vérifier les conflits avec les occurrences de congés récurrents
 */
export const checkLeaveConflicts = async (
    startDate: Date,
    endDate: Date,
    userId: string,
    leaveId?: string
): Promise<ConflictCheckResult> => {
    const operationKey = 'LeaveService.checkLeaveConflicts';
    try {
        const params = new URLSearchParams({
            startDate: formatDate(startDate, ISO_DATE_FORMAT),
            endDate: formatDate(endDate, ISO_DATE_FORMAT),
            userId,
        });

        if (leaveId) {
            params.append('leaveId', leaveId);
        }

        const response = await fetch(`/api/leaves/check-conflicts?${params.toString()}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.statusText);
            const error = new Error(`Erreur HTTP ${response.status} lors de la vérification des conflits: ${errorData}`);
            (error as any).code = `HTTP_${response.status}`;
            throw error;
        }

        return await response.json();
    } catch (error) {
        const errorDetails = buildLeaveServiceErrorDetails(error, { startDate, endDate, userId, leaveId });
        logError(operationKey, { ...errorDetails, timestamp: new Date() });
        throw error;
    }
};

/**
 * Vérifier si l'utilisateur a assez de jours de congés disponibles
 * TODO: Adapter pour vérifier les quotas en prenant en compte les occurrences de congés récurrents
 */
export const checkLeaveAllowance = async (
    userId: string,
    leaveType: LeaveType,
    countedDays: number
): Promise<LeaveAllowanceCheckResult> => {
    const operationKey = 'LeaveService.checkLeaveAllowance';
    try {
        const params = new URLSearchParams({
            userId,
            leaveType,
            countedDays: countedDays.toString(),
        });

        const response = await fetch(`/api/leaves/check-allowance?${params.toString()}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.statusText);
            const error = new Error(`Erreur HTTP ${response.status} lors de la vérification des droits: ${errorData}`);
            (error as any).code = `HTTP_${response.status}`;
            throw error;
        }

        return await response.json();
    } catch (error) {
        const errorDetails = buildLeaveServiceErrorDetails(error, { userId, leaveType, countedDays });
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
    schedule: WorkSchedule
): number => {
    // Ici, on pourrait appeler calculateLeaveCountedDays de leaveCalculator.ts
    // qui utilise la logique métier complexe (semaines paires/impaires, temps partiel, etc.)
    // Pour l'instant, implémentation simplifiée pour les tests

    // Nombre de jours naturels (différence en jours entre dates)
    const naturalDays = differenceInDays(endDate, startDate) + 1;

    // Pour un temps plein, on compte les jours ouvrés selon le planning
    // Cette logique pourrait être beaucoup plus complexe (fériés, etc.)
    let countedDays = 0;

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        // Si le jour est un jour de travail dans le planning
        const dayOfWeek = currentDate.getDay(); // 0 = Dimanche, 1 = Lundi, etc.

        // Conversion du jour de la semaine au format Weekday de l'enum
        const weekdayMap: Record<number, Weekday> = {
            0: Weekday.SUNDAY,
            1: Weekday.MONDAY,
            2: Weekday.TUESDAY,
            3: Weekday.WEDNESDAY,
            4: Weekday.THURSDAY,
            5: Weekday.FRIDAY,
            6: Weekday.SATURDAY
        };

        const weekday = weekdayMap[dayOfWeek];

        // Si ce jour est un jour travaillé selon le planning de l'utilisateur
        if (schedule.workingDays?.includes(weekday)) {
            countedDays++;
        }

        // Passer au jour suivant
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return countedDays;
};

/**
 * Formater une période de congés pour l'affichage
 */
export const formatLeavePeriod = (startDate: Date, endDate: Date): string => {
    // Si même jour, on affiche juste la date
    if (startDate.getTime() === endDate.getTime()) {
        return format(startDate, 'dd/MM/yyyy');
    }

    // Sinon, on affiche la période complète
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
        [LeaveType.SPECIAL]: 'Congé spécial',
        [LeaveType.UNPAID]: 'Congé sans solde',
        [LeaveType.OTHER]: 'Autre'
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
        [LeaveStatus.CANCELLED]: 'Annulé'
    };

    return labels[status] || status;
};

/**
 * Créer une demande de congés récurrente
 * @param recurringRequest Demande de congés récurrente
 * @returns Demande créée avec les occurrences générées
 */
export const createRecurringLeaveRequest = async (recurringRequest: Partial<RecurringLeaveRequest>): Promise<RecurringLeaveRequest> => {
    const operationKey = 'LeaveService.createRecurringLeaveRequest';
    try {
        // Formater les dates pour l'API
        const payload = {
            ...recurringRequest,
            patternStartDate: recurringRequest.patternStartDate ? formatDate(recurringRequest.patternStartDate, ISO_DATE_FORMAT) : undefined,
            patternEndDate: recurringRequest.patternEndDate ? formatDate(recurringRequest.patternEndDate, ISO_DATE_FORMAT) : undefined,
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
            const error = new Error(`Erreur HTTP ${response.status} lors de la création du congé récurrent: ${errorData}`);
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
export const updateRecurringLeaveRequest = async (recurringRequest: Partial<RecurringLeaveRequest>): Promise<RecurringLeaveRequest> => {
    if (!recurringRequest.id) {
        throw new Error('L\'identifiant de la demande récurrente est requis pour la mise à jour');
    }

    const operationKey = 'LeaveService.updateRecurringLeaveRequest';
    try {
        // Formater les dates pour l'API
        const payload = {
            ...recurringRequest,
            patternStartDate: recurringRequest.patternStartDate ? formatDate(recurringRequest.patternStartDate, ISO_DATE_FORMAT) : undefined,
            patternEndDate: recurringRequest.patternEndDate ? formatDate(recurringRequest.patternEndDate, ISO_DATE_FORMAT) : undefined,
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
            const error = new Error(`Erreur HTTP ${response.status} lors de la mise à jour du congé récurrent: ${errorData}`);
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
export const fetchRecurringLeaveRequestById = async (id: string): Promise<RecurringLeaveRequest> => {
    const operationKey = 'LeaveService.fetchRecurringLeaveRequestById';
    try {
        const response = await fetch(`/api/leaves/recurring/${id}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.statusText);
            const error = new Error(`Erreur HTTP ${response.status} lors de la récupération du congé récurrent ${id}: ${errorData}`);
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
export const fetchRecurringLeaveRequestsByUser = async (userId: string): Promise<RecurringLeaveRequest[]> => {
    const operationKey = 'LeaveService.fetchRecurringLeaveRequestsByUser';
    try {
        const response = await fetch(`/api/leaves/recurring?userId=${userId}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.statusText);
            const error = new Error(`Erreur HTTP ${response.status} lors de la récupération des congés récurrents pour ${userId}: ${errorData}`);
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
export const deleteRecurringLeaveRequest = async (id: string, deleteOccurrences: boolean = true): Promise<{ success: boolean, deletedOccurrences?: number }> => {
    const operationKey = 'LeaveService.deleteRecurringLeaveRequest';
    try {
        const response = await fetch(`/api/leaves/recurring/${id}?deleteOccurrences=${deleteOccurrences}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.statusText);
            const error = new Error(`Erreur HTTP ${response.status} lors de la suppression du congé récurrent ${id}: ${errorData}`);
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
export const previewRecurringLeaveOccurrences = async (recurringRequest: Partial<RecurringLeaveRequest>): Promise<Leave[]> => {
    const operationKey = 'LeaveService.previewRecurringLeaveOccurrences';
    try {
        // Formater les dates pour l'API
        const payload = {
            ...recurringRequest,
            patternStartDate: recurringRequest.patternStartDate ? formatDate(recurringRequest.patternStartDate, ISO_DATE_FORMAT) : undefined,
            patternEndDate: recurringRequest.patternEndDate ? formatDate(recurringRequest.patternEndDate, ISO_DATE_FORMAT) : undefined,
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
            const error = new Error(`Erreur HTTP ${response.status} lors de la prévisualisation des occurrences: ${errorData}`);
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
        // Formater les dates pour l'API
        const payload = {
            ...recurringRequest,
            patternStartDate: recurringRequest.patternStartDate ? formatDate(recurringRequest.patternStartDate, ISO_DATE_FORMAT) : undefined,
            patternEndDate: recurringRequest.patternEndDate ? formatDate(recurringRequest.patternEndDate, ISO_DATE_FORMAT) : undefined,
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
            const error = new Error(`Erreur HTTP ${response.status} lors de la vérification des conflits: ${errorData}`);
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