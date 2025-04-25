import { differenceInDays, getWeek, startOfWeek, endOfWeek, eachDayOfInterval, isWeekend } from 'date-fns';
import { fr } from 'date-fns/locale';
import { WorkFrequency, WeekType } from '../../profiles/types/workSchedule';
import { isWorkingDay, isEvenWeek } from '../../profiles/services/workScheduleService';
/**
 * Calculer le nombre de jours décomptés pour une demande de congés
 * en fonction du planning de travail de l'utilisateur
 */
export var calculateLeaveCountedDays = function (startDate, endDate, schedule) {
    // Nombre total de jours naturels
    var naturalDays = differenceInDays(endDate, startDate) + 1;
    // Jours ouvrés (hors weekends)
    var workDays = 0;
    // Jours réellement décomptés (en fonction du planning)
    var countedDays = 0;
    // Calculer le décompte par semaine
    var weeklyBreakdown = [];
    // Liste des jours fériés (à configurer)
    var publicHolidays = [];
    // Parcourir la période jour par jour
    var days = eachDayOfInterval({ start: startDate, end: endDate });
    var currentWeekStart = startOfWeek(days[0], { locale: fr });
    var currentWeekEnd = endOfWeek(days[0], { locale: fr });
    var currentWeekNumber = getWeek(days[0], { locale: fr });
    var currentWeekType = isEvenWeek(days[0]) ? 'EVEN' : 'ODD';
    var currentWeekDays = 0;
    var currentWeekCountedDays = 0;
    for (var _i = 0, days_1 = days; _i < days_1.length; _i++) {
        var day = days_1[_i];
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
        naturalDays: naturalDays,
        workDays: workDays,
        weeklyBreakdown: weeklyBreakdown,
        publicHolidays: publicHolidays,
        workingTimePercentage: schedule.workingTimePercentage || 100
    };
};
/**
 * Vérifier si une semaine (paire ou impaire) est travaillée par l'utilisateur
 */
var isWorkingWeekForUser = function (schedule, weekType) {
    var _a, _b, _c;
    // Pour les temps pleins, toutes les semaines sont travaillées
    if (schedule.frequency === WorkFrequency.FULL_TIME) {
        return true;
    }
    // Pour l'alternance de semaines
    if (schedule.frequency === WorkFrequency.ALTERNATE_WEEKS) {
        if (schedule.weekType === WeekType.BOTH) {
            return true;
        }
        else if (schedule.weekType === WeekType.EVEN && weekType === 'EVEN') {
            return true;
        }
        else if (schedule.weekType === WeekType.ODD && weekType === 'ODD') {
            return true;
        }
        return false;
    }
    // Pour les configurations personnalisées
    if (schedule.frequency === WorkFrequency.CUSTOM && schedule.customSchedule) {
        if (weekType === 'EVEN' && ((_a = schedule.customSchedule.evenWeeks) === null || _a === void 0 ? void 0 : _a.length)) {
            return true;
        }
        else if (weekType === 'ODD' && ((_b = schedule.customSchedule.oddWeeks) === null || _b === void 0 ? void 0 : _b.length)) {
            return true;
        }
    }
    // Pour les autres types de planning, vérifier s'il y a des jours travaillés
    return (((_c = schedule.workingDays) === null || _c === void 0 ? void 0 : _c.length) || 0) > 0;
};
