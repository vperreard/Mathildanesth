import {
    differenceInDays,
    addDays,
    getWeek,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isWeekend
} from 'date-fns';
import { fr } from 'date-fns/locale';

import { Leave, LeaveCalculationDetails, WeeklyLeaveBreakdown } from '../types/leave';
import {
    WorkSchedule,
    WorkFrequency,
    WeekType
} from '../../profiles/types/workSchedule';
import { isWorkingDay, isEvenWeek } from '../../profiles/services/workScheduleService';

// Type pour les semaines paires/impaires
type WeekEvenOdd = 'EVEN' | 'ODD';

/**
 * Calculer le nombre de jours décomptés pour une demande de congés
 * en fonction du planning de travail de l'utilisateur
 */
export const calculateLeaveCountedDays = (
    startDate: Date,
    endDate: Date,
    schedule: WorkSchedule
): LeaveCalculationDetails => {
    // Nombre total de jours naturels
    const naturalDays = differenceInDays(endDate, startDate) + 1;

    // Jours ouvrés (hors weekends)
    let workDays = 0;

    // Jours réellement décomptés (en fonction du planning)
    let countedDays = 0;

    // Calculer le décompte par semaine
    const weeklyBreakdown: WeeklyLeaveBreakdown[] = [];

    // Liste des jours fériés (à configurer)
    const publicHolidays: Date[] = [];

    // Parcourir la période jour par jour
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    let currentWeekStart = startOfWeek(days[0], { locale: fr });
    let currentWeekEnd = endOfWeek(days[0], { locale: fr });
    let currentWeekNumber = getWeek(days[0], { locale: fr });
    let currentWeekType: WeekEvenOdd = isEvenWeek(days[0]) ? 'EVEN' : 'ODD';

    let currentWeekDays = 0;
    let currentWeekCountedDays = 0;

    for (const day of days) {
        // Vérifier si le jour fait partie d'une nouvelle semaine
        if (day > currentWeekEnd) {
            // Ajouter la semaine précédente au décompte
            weeklyBreakdown.push({
                weekNumber: currentWeekNumber,
                weekType: currentWeekType,
                startDate: currentWeekStart,
                endDate: currentWeekEnd,
                naturalDays: currentWeekDays,
                countedDays: currentWeekCountedDays,
                isWorkingWeek: isWorkingWeekForUser(schedule, currentWeekType)
            });

            // Réinitialiser pour la nouvelle semaine
            currentWeekStart = startOfWeek(day, { locale: fr });
            currentWeekEnd = endOfWeek(day, { locale: fr });
            currentWeekNumber = getWeek(day, { locale: fr });
            currentWeekType = isEvenWeek(day) ? 'EVEN' : 'ODD';
            currentWeekDays = 0;
            currentWeekCountedDays = 0;
        }

        // Incrémenter les compteurs de la semaine
        currentWeekDays++;

        // Si ce n'est pas un weekend
        if (!isWeekend(day)) {
            workDays++;

            // Si c'est un jour travaillé selon le planning
            if (isWorkingDay(schedule, day)) {
                countedDays++;
                currentWeekCountedDays++;
            }
        }
    }

    // Ajouter la dernière semaine au décompte
    weeklyBreakdown.push({
        weekNumber: currentWeekNumber,
        weekType: currentWeekType,
        startDate: currentWeekStart,
        endDate: currentWeekEnd,
        naturalDays: currentWeekDays,
        countedDays: currentWeekCountedDays,
        isWorkingWeek: isWorkingWeekForUser(schedule, currentWeekType)
    });

    // Retourner les détails du calcul
    return {
        naturalDays,
        workDays,
        weeklyBreakdown,
        publicHolidays,
        workingTimePercentage: schedule.workingTimePercentage || 100
    };
};

/**
 * Vérifier si une semaine (paire ou impaire) est travaillée par l'utilisateur
 */
const isWorkingWeekForUser = (
    schedule: WorkSchedule,
    weekType: WeekEvenOdd
): boolean => {
    // Pour les temps pleins, toutes les semaines sont travaillées
    if (schedule.frequency === WorkFrequency.FULL_TIME) {
        return true;
    }

    // Pour l'alternance de semaines
    if (schedule.frequency === WorkFrequency.ALTERNATE_WEEKS) {
        if (schedule.weekType === WeekType.BOTH) {
            return true;
        } else if (schedule.weekType === WeekType.EVEN && weekType === 'EVEN') {
            return true;
        } else if (schedule.weekType === WeekType.ODD && weekType === 'ODD') {
            return true;
        }
        return false;
    }

    // Pour les configurations personnalisées
    if (schedule.frequency === WorkFrequency.CUSTOM && schedule.customSchedule) {
        if (weekType === 'EVEN' && schedule.customSchedule.evenWeeks?.length) {
            return true;
        } else if (weekType === 'ODD' && schedule.customSchedule.oddWeeks?.length) {
            return true;
        }
    }

    // Pour les autres types de planning, vérifier s'il y a des jours travaillés
    return (schedule.workingDays?.length || 0) > 0;
}; 