import {
    WorkSchedule,
    WorkFrequency,
    Weekday,
    WeekType,
    MonthType,
    WeeklyWorkingDays
} from '../types/workSchedule';
import { logger } from "../../../lib/logger";
import { addDays, getWeek, getMonth, getDay, isWithinInterval } from 'date-fns';

/**
 * Vérifier si une date correspond à une semaine paire ou impaire
 * @param date Date à vérifier
 * @returns true si semaine paire, false si semaine impaire
 */
export const isEvenWeek = (date: Date): boolean => {
    return getWeek(date) % 2 === 0;
};

/**
 * Vérifier si une date correspond à un mois pair ou impair
 * @param date Date à vérifier
 * @returns true si mois pair, false si mois impair
 */
export const isEvenMonth = (date: Date): boolean => {
    return (getMonth(date) + 1) % 2 === 0; // +1 car getMonth est 0-indexé
};

/**
 * Vérifier si l'utilisateur est censé travailler à une date spécifique
 * selon son planning de travail
 * @param planningMedical Planning de travail de l'utilisateur
 * @param date Date à vérifier
 * @returns true si l'utilisateur doit travailler ce jour-là
 */
export const isWorkingDay = (planningMedical: WorkSchedule, date: Date): boolean => {
    // Vérifier que la date est dans la période de validité du planning
    if (
        !isWithinInterval(date, {
            start: planningMedical.validFrom,
            end: planningMedical.validTo || new Date(2099, 11, 31) // Date lointaine si pas de date de fin
        })
    ) {
        return false;
    }

    // Si le planning n'est pas actif
    if (!planningMedical.isActive) {
        return false;
    }

    const weekday = getDay(date) as Weekday;
    const isEven = isEvenWeek(date);
    const isEvenMonthDate = isEvenMonth(date);

    switch (planningMedical.frequency) {
        case WorkFrequency.FULL_TIME:
            // En temps plein, on travaille tous les jours de la semaine (hors weekend)
            return weekday >= 1 && weekday <= 5;

        case WorkFrequency.PART_TIME:
            // Temps partiel, on vérifie les jours spécifiques
            return planningMedical.workingDays ? planningMedical.workingDays.includes(weekday) : false;

        case WorkFrequency.ALTERNATE_WEEKS:
            // Alternance semaines paires/impaires
            if (planningMedical.weekType === WeekType.BOTH) {
                return planningMedical.workingDays ? planningMedical.workingDays.includes(weekday) : (weekday >= 1 && weekday <= 5);
            } else if (planningMedical.weekType === WeekType.EVEN && isEven) {
                return planningMedical.workingDays ? planningMedical.workingDays.includes(weekday) : (weekday >= 1 && weekday <= 5);
            } else if (planningMedical.weekType === WeekType.ODD && !isEven) {
                return planningMedical.workingDays ? planningMedical.workingDays.includes(weekday) : (weekday >= 1 && weekday <= 5);
            }
            return false;

        case WorkFrequency.ALTERNATE_MONTHS:
            // Alternance mois pairs/impairs
            if (planningMedical.monthType === MonthType.BOTH) {
                return planningMedical.workingDays ? planningMedical.workingDays.includes(weekday) : (weekday >= 1 && weekday <= 5);
            } else if (planningMedical.monthType === MonthType.EVEN && isEvenMonthDate) {
                return planningMedical.workingDays ? planningMedical.workingDays.includes(weekday) : (weekday >= 1 && weekday <= 5);
            } else if (planningMedical.monthType === MonthType.ODD && !isEvenMonthDate) {
                return planningMedical.workingDays ? planningMedical.workingDays.includes(weekday) : (weekday >= 1 && weekday <= 5);
            }
            return false;

        case WorkFrequency.CUSTOM:
            // Configuration personnalisée
            if (!planningMedical.customSchedule) return false;

            if (isEven && planningMedical.customSchedule.evenWeeks) {
                return planningMedical.customSchedule.evenWeeks.includes(weekday);
            } else if (!isEven && planningMedical.customSchedule.oddWeeks) {
                return planningMedical.customSchedule.oddWeeks.includes(weekday);
            }
            return false;

        default:
            return false;
    }
};

/**
 * Calculer le nombre de jours travaillés dans une période
 * @param planningMedical Planning de travail
 * @param startDate Date de début de la période
 * @param endDate Date de fin de la période
 * @returns Nombre de jours travaillés dans la période
 */
export const countWorkingDaysInPeriod = (
    planningMedical: WorkSchedule,
    startDate: Date,
    endDate: Date
): number => {
    let count = 0;
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        if (isWorkingDay(planningMedical, currentDate)) {
            count++;
        }
        currentDate = addDays(currentDate, 1);
    }

    return count;
};

/**
 * Calculer le nombre de jours de congés annuels en fonction du temps de travail
 * @param percentage Pourcentage de temps de travail (100 pour temps plein)
 * @returns Nombre de jours de congés annuels
 */
export const calculateAnnualLeaveAllowance = (percentage: number): number => {
    // Base: 50 jours pour un temps plein
    const baseAllowance = 50;
    return Math.round((percentage / 100) * baseAllowance);
};

/**
 * Calculer le nombre de jours travaillés dans une semaine typique
 * @param planningMedical Planning de travail
 * @returns Objet contenant le nombre total de jours et la répartition par type de semaine
 */
export const calculateWeeklyWorkingDays = (planningMedical: WorkSchedule): WeeklyWorkingDays => {
    let evenWeekDays = 0;
    let oddWeekDays = 0;

    switch (planningMedical.frequency) {
        case WorkFrequency.FULL_TIME:
            // 5 jours par semaine (lundi-vendredi)
            evenWeekDays = oddWeekDays = 5;
            break;

        case WorkFrequency.PART_TIME:
            // Jours spécifiques
            const workingDays = planningMedical.workingDays || [];
            evenWeekDays = oddWeekDays = workingDays.length;
            break;

        case WorkFrequency.ALTERNATE_WEEKS:
            if (planningMedical.weekType === WeekType.BOTH) {
                evenWeekDays = oddWeekDays = planningMedical.workingDays?.length || 5;
            } else if (planningMedical.weekType === WeekType.EVEN) {
                evenWeekDays = planningMedical.workingDays?.length || 5;
                oddWeekDays = 0;
            } else if (planningMedical.weekType === WeekType.ODD) {
                evenWeekDays = 0;
                oddWeekDays = planningMedical.workingDays?.length || 5;
            }
            break;

        case WorkFrequency.ALTERNATE_MONTHS:
            // Simplifié pour la calculation hebdomadaire
            if (planningMedical.monthType === MonthType.BOTH) {
                evenWeekDays = oddWeekDays = planningMedical.workingDays?.length || 5;
            } else {
                evenWeekDays = oddWeekDays = (planningMedical.workingDays?.length || 5) / 2;
            }
            break;

        case WorkFrequency.CUSTOM:
            if (planningMedical.customSchedule) {
                evenWeekDays = planningMedical.customSchedule.evenWeeks?.length || 0;
                oddWeekDays = planningMedical.customSchedule.oddWeeks?.length || 0;
            }
            break;
    }

    return {
        totalDays: (evenWeekDays + oddWeekDays) / 2, // Moyenne sur 2 semaines
        evenWeekDays,
        oddWeekDays
    };
};

/**
 * Récupérer les plannings de travail d'un utilisateur
 * @param userId ID de l'utilisateur
 * @returns Promise avec les plannings de travail
 */
export const fetchUserWorkSchedules = async (userId: string): Promise<WorkSchedule[]> => {
    try {
        const response = await fetch(`http://localhost:3000/api/profils/work-schedules?userId=${userId}`);

        if (!response.ok) {
            throw new Error(`Erreur lors de la récupération des plannings de travail: ${response.statusText}`);
        }

        return await response.json();
    } catch (error: unknown) {
        logger.error('Erreur dans fetchUserWorkSchedules:', { error: error });
        throw error;
    }
};

/**
 * Créer ou mettre à jour un planning de travail
 * @param planningMedical Planning de travail à créer ou mettre à jour
 * @returns Promise avec le planning créé ou mis à jour
 */
export const saveWorkSchedule = async (planningMedical: Partial<WorkSchedule>): Promise<WorkSchedule> => {
    try {
        const method = planningMedical.id ? 'PUT' : 'POST';
        const url = planningMedical.id
            ? `/api/profils/work-schedules/${planningMedical.id}`
            : '/api/profils/work-schedules';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(planningMedical),
        });

        if (!response.ok) {
            throw new Error(`Erreur lors de l'enregistrement du planning de travail: ${response.statusText}`);
        }

        return await response.json();
    } catch (error: unknown) {
        logger.error('Erreur dans saveWorkSchedule:', { error: error });
        throw error;
    }
};

/**
 * Supprimer un planning de travail
 * @param scheduleId ID du planning à supprimer
 * @returns Promise avec le résultat de la suppression
 */
export const deleteWorkSchedule = async (scheduleId: string): Promise<void> => {
    try {
        const response = await fetch(`http://localhost:3000/api/profils/work-schedules/${scheduleId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Erreur lors de la suppression du planning de travail: ${response.statusText}`);
        }
    } catch (error: unknown) {
        logger.error('Erreur dans deleteWorkSchedule:', { error: error });
        throw error;
    }
}; 