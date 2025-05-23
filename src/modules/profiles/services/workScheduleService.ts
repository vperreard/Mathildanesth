import {
    WorkSchedule,
    WorkFrequency,
    Weekday,
    WeekType,
    MonthType,
    WeeklyWorkingDays
} from '../types/workSchedule';
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
 * @param schedule Planning de travail de l'utilisateur
 * @param date Date à vérifier
 * @returns true si l'utilisateur doit travailler ce jour-là
 */
export const isWorkingDay = (schedule: WorkSchedule, date: Date): boolean => {
    // Vérifier que la date est dans la période de validité du planning
    if (
        !isWithinInterval(date, {
            start: schedule.validFrom,
            end: schedule.validTo || new Date(2099, 11, 31) // Date lointaine si pas de date de fin
        })
    ) {
        return false;
    }

    // Si le planning n'est pas actif
    if (!schedule.isActive) {
        return false;
    }

    const weekday = getDay(date) as Weekday;
    const isEven = isEvenWeek(date);
    const isEvenMonthDate = isEvenMonth(date);

    switch (schedule.frequency) {
        case WorkFrequency.FULL_TIME:
            // En temps plein, on travaille tous les jours de la semaine (hors weekend)
            return weekday >= 1 && weekday <= 5;

        case WorkFrequency.PART_TIME:
            // Temps partiel, on vérifie les jours spécifiques
            return schedule.workingDays ? schedule.workingDays.includes(weekday) : false;

        case WorkFrequency.ALTERNATE_WEEKS:
            // Alternance semaines paires/impaires
            if (schedule.weekType === WeekType.BOTH) {
                return schedule.workingDays ? schedule.workingDays.includes(weekday) : (weekday >= 1 && weekday <= 5);
            } else if (schedule.weekType === WeekType.EVEN && isEven) {
                return schedule.workingDays ? schedule.workingDays.includes(weekday) : (weekday >= 1 && weekday <= 5);
            } else if (schedule.weekType === WeekType.ODD && !isEven) {
                return schedule.workingDays ? schedule.workingDays.includes(weekday) : (weekday >= 1 && weekday <= 5);
            }
            return false;

        case WorkFrequency.ALTERNATE_MONTHS:
            // Alternance mois pairs/impairs
            if (schedule.monthType === MonthType.BOTH) {
                return schedule.workingDays ? schedule.workingDays.includes(weekday) : (weekday >= 1 && weekday <= 5);
            } else if (schedule.monthType === MonthType.EVEN && isEvenMonthDate) {
                return schedule.workingDays ? schedule.workingDays.includes(weekday) : (weekday >= 1 && weekday <= 5);
            } else if (schedule.monthType === MonthType.ODD && !isEvenMonthDate) {
                return schedule.workingDays ? schedule.workingDays.includes(weekday) : (weekday >= 1 && weekday <= 5);
            }
            return false;

        case WorkFrequency.CUSTOM:
            // Configuration personnalisée
            if (!schedule.customSchedule) return false;

            if (isEven && schedule.customSchedule.evenWeeks) {
                return schedule.customSchedule.evenWeeks.includes(weekday);
            } else if (!isEven && schedule.customSchedule.oddWeeks) {
                return schedule.customSchedule.oddWeeks.includes(weekday);
            }
            return false;

        default:
            return false;
    }
};

/**
 * Calculer le nombre de jours travaillés dans une période
 * @param schedule Planning de travail
 * @param startDate Date de début de la période
 * @param endDate Date de fin de la période
 * @returns Nombre de jours travaillés dans la période
 */
export const countWorkingDaysInPeriod = (
    schedule: WorkSchedule,
    startDate: Date,
    endDate: Date
): number => {
    let count = 0;
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        if (isWorkingDay(schedule, currentDate)) {
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
 * @param schedule Planning de travail
 * @returns Objet contenant le nombre total de jours et la répartition par type de semaine
 */
export const calculateWeeklyWorkingDays = (schedule: WorkSchedule): WeeklyWorkingDays => {
    let evenWeekDays = 0;
    let oddWeekDays = 0;

    switch (schedule.frequency) {
        case WorkFrequency.FULL_TIME:
            // 5 jours par semaine (lundi-vendredi)
            evenWeekDays = oddWeekDays = 5;
            break;

        case WorkFrequency.PART_TIME:
            // Jours spécifiques
            const workingDays = schedule.workingDays || [];
            evenWeekDays = oddWeekDays = workingDays.length;
            break;

        case WorkFrequency.ALTERNATE_WEEKS:
            if (schedule.weekType === WeekType.BOTH) {
                evenWeekDays = oddWeekDays = schedule.workingDays?.length || 5;
            } else if (schedule.weekType === WeekType.EVEN) {
                evenWeekDays = schedule.workingDays?.length || 5;
                oddWeekDays = 0;
            } else if (schedule.weekType === WeekType.ODD) {
                evenWeekDays = 0;
                oddWeekDays = schedule.workingDays?.length || 5;
            }
            break;

        case WorkFrequency.ALTERNATE_MONTHS:
            // Simplifié pour la calculation hebdomadaire
            if (schedule.monthType === MonthType.BOTH) {
                evenWeekDays = oddWeekDays = schedule.workingDays?.length || 5;
            } else {
                evenWeekDays = oddWeekDays = (schedule.workingDays?.length || 5) / 2;
            }
            break;

        case WorkFrequency.CUSTOM:
            if (schedule.customSchedule) {
                evenWeekDays = schedule.customSchedule.evenWeeks?.length || 0;
                oddWeekDays = schedule.customSchedule.oddWeeks?.length || 0;
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
        const response = await fetch(`/api/profiles/work-schedules?userId=${userId}`);

        if (!response.ok) {
            throw new Error(`Erreur lors de la récupération des plannings de travail: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur dans fetchUserWorkSchedules:', error);
        throw error;
    }
};

/**
 * Créer ou mettre à jour un planning de travail
 * @param schedule Planning de travail à créer ou mettre à jour
 * @returns Promise avec le planning créé ou mis à jour
 */
export const saveWorkSchedule = async (schedule: Partial<WorkSchedule>): Promise<WorkSchedule> => {
    try {
        const method = schedule.id ? 'PUT' : 'POST';
        const url = schedule.id
            ? `/api/profiles/work-schedules/${schedule.id}`
            : '/api/profiles/work-schedules';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(schedule),
        });

        if (!response.ok) {
            throw new Error(`Erreur lors de l'enregistrement du planning de travail: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur dans saveWorkSchedule:', error);
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
        const response = await fetch(`/api/profiles/work-schedules/${scheduleId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Erreur lors de la suppression du planning de travail: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Erreur dans deleteWorkSchedule:', error);
        throw error;
    }
}; 