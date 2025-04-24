import {
    Leave,
    LeaveType,
    LeaveStatus,
    LeaveFilters,
    LeaveBalance,
    LeaveAllowanceCheckResult
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
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Récupérer les demandes de congés avec filtres
 */
export const fetchLeaves = async (filters: LeaveFilters = {}): Promise<Leave[]> => {
    try {
        // Construire l'URL avec les filtres
        const url = new URL('/api/leaves', window.location.origin);

        // Ajouter les filtres à l'URL
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined) {
                if (Array.isArray(value)) {
                    value.forEach(v => {
                        if (v instanceof Date) {
                            url.searchParams.append(key, v.toISOString());
                        } else {
                            url.searchParams.append(key, v);
                        }
                    });
                } else if (value instanceof Date) {
                    url.searchParams.append(key, value.toISOString());
                } else {
                    url.searchParams.append(key, value);
                }
            }
        });

        // Récupérer les données
        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error(`Erreur lors de la récupération des congés: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur dans fetchLeaves:', error);
        throw error;
    }
};

/**
 * Récupérer une demande de congés par son ID
 */
export const fetchLeaveById = async (leaveId: string): Promise<Leave> => {
    try {
        const response = await fetch(`/api/leaves/${leaveId}`);

        if (!response.ok) {
            throw new Error(`Erreur lors de la récupération du congé: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Erreur dans fetchLeaveById pour l'ID ${leaveId}:`, error);
        throw error;
    }
};

/**
 * Récupérer le solde de congés d'un utilisateur
 */
export const fetchLeaveBalance = async (userId: string): Promise<LeaveBalance> => {
    try {
        const response = await fetch(`/api/leaves/balance?userId=${userId}`);

        if (!response.ok) {
            throw new Error(`Erreur lors de la récupération du solde de congés: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Erreur dans fetchLeaveBalance pour l'utilisateur ${userId}:`, error);
        throw error;
    }
};

/**
 * Créer ou mettre à jour une demande de congés
 */
export const saveLeave = async (leave: Partial<Leave>): Promise<Leave> => {
    try {
        const method = leave.id ? 'PUT' : 'POST';
        const url = leave.id ? `/api/leaves/${leave.id}` : '/api/leaves';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(leave),
        });

        if (!response.ok) {
            throw new Error(`Erreur lors de l'enregistrement du congé: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur dans saveLeave:', error);
        throw error;
    }
};

/**
 * Soumettre une demande de congés pour approbation
 */
export const submitLeaveRequest = async (leave: Partial<Leave>): Promise<Leave> => {
    try {
        // Définir le statut comme "en attente"
        const leaveToSubmit = {
            ...leave,
            status: LeaveStatus.PENDING,
            requestDate: new Date()
        };

        // Enregistrer la demande
        return await saveLeave(leaveToSubmit);
    } catch (error) {
        console.error('Erreur dans submitLeaveRequest:', error);
        throw error;
    }
};

/**
 * Approuver une demande de congés
 */
export const approveLeave = async (leaveId: string, comment?: string): Promise<Leave> => {
    try {
        const response = await fetch(`/api/leaves/${leaveId}/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ comment }),
        });

        if (!response.ok) {
            throw new Error(`Erreur lors de l'approbation du congé: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Erreur dans approveLeave pour l'ID ${leaveId}:`, error);
        throw error;
    }
};

/**
 * Rejeter une demande de congés
 */
export const rejectLeave = async (leaveId: string, comment?: string): Promise<Leave> => {
    try {
        const response = await fetch(`/api/leaves/${leaveId}/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ comment }),
        });

        if (!response.ok) {
            throw new Error(`Erreur lors du rejet du congé: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Erreur dans rejectLeave pour l'ID ${leaveId}:`, error);
        throw error;
    }
};

/**
 * Annuler une demande de congés
 */
export const cancelLeave = async (leaveId: string, comment?: string): Promise<Leave> => {
    try {
        const response = await fetch(`/api/leaves/${leaveId}/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ comment }),
        });

        if (!response.ok) {
            throw new Error(`Erreur lors de l'annulation du congé: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Erreur dans cancelLeave pour l'ID ${leaveId}:`, error);
        throw error;
    }
};

/**
 * Vérifier les conflits pour une demande de congés
 */
export const checkLeaveConflicts = async (
    startDate: Date,
    endDate: Date,
    userId: string,
    leaveId?: string
): Promise<ConflictCheckResult> => {
    try {
        const params = new URLSearchParams({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            userId
        });

        if (leaveId) {
            params.append('leaveId', leaveId);
        }

        const response = await fetch(`/api/leaves/check-conflicts?${params.toString()}`);

        if (!response.ok) {
            throw new Error(`Erreur lors de la vérification des conflits: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur dans checkLeaveConflicts:', error);
        throw error;
    }
};

/**
 * Vérifier si l'utilisateur a suffisamment de jours de congés disponibles
 */
export const checkLeaveAllowance = async (
    userId: string,
    leaveType: LeaveType,
    countedDays: number
): Promise<LeaveAllowanceCheckResult> => {
    try {
        const response = await fetch('/api/leaves/check-allowance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                leaveType,
                countedDays
            }),
        });

        if (!response.ok) {
            throw new Error(`Erreur lors de la vérification des droits à congés: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur dans checkLeaveAllowance:', error);
        throw error;
    }
};

/**
 * Calculer le nombre de jours décomptés pour une demande de congés
 */
export const calculateLeaveDays = (
    startDate: Date,
    endDate: Date,
    schedule: WorkSchedule
): number => {
    const calculationDetails = calculateLeaveCountedDays(startDate, endDate, schedule);
    let countedDays = 0;

    // Additionner les jours décomptés de chaque semaine
    calculationDetails.weeklyBreakdown.forEach(week => {
        countedDays += week.countedDays;
    });

    return countedDays;
};

/**
 * Formatter une période de congés pour l'affichage
 */
export const formatLeavePeriod = (startDate: Date, endDate: Date): string => {
    const start = format(new Date(startDate), 'dd MMMM yyyy', { locale: fr });
    const end = format(new Date(endDate), 'dd MMMM yyyy', { locale: fr });

    if (start === end) {
        return start;
    }

    return `Du ${start} au ${end}`;
};

/**
 * Obtenir le libellé d'un type de congé
 */
export const getLeaveTypeLabel = (type: LeaveType): string => {
    switch (type) {
        case LeaveType.ANNUAL:
            return 'Congé annuel';
        case LeaveType.RECOVERY:
            return 'Récupération (IADE)';
        case LeaveType.TRAINING:
            return 'Formation';
        case LeaveType.SICK:
            return 'Maladie';
        case LeaveType.MATERNITY:
            return 'Maternité';
        case LeaveType.SPECIAL:
            return 'Congé spécial';
        case LeaveType.UNPAID:
            return 'Sans solde';
        case LeaveType.OTHER:
            return 'Autre';
        default:
            const exhaustiveCheck: never = type;
            console.warn(`Libellé manquant pour le type de congé: ${exhaustiveCheck}`);
            return 'Inconnu';
    }
};

/**
 * Obtenir le libellé d'un statut de congé
 */
export const getLeaveStatusLabel = (status: LeaveStatus): string => {
    switch (status) {
        case LeaveStatus.DRAFT:
            return 'Brouillon';
        case LeaveStatus.PENDING:
            return 'En attente';
        case LeaveStatus.APPROVED:
            return 'Approuvé';
        case LeaveStatus.REJECTED:
            return 'Refusé';
        case LeaveStatus.CANCELLED:
            return 'Annulé';
        default:
            return 'Inconnu';
    }
}; 