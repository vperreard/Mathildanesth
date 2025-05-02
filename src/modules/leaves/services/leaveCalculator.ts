import {
    getDifferenceInDays,
    getWeekNumber,
    getStartOfWeek,
    getEndOfWeek,
    getDaysInInterval,
    isDateWeekend,
    parseDate,
    isSameDay,
    formatDate
} from '@/utils/dateUtils';
import { fr } from 'date-fns/locale';
import { isAfter, parseISO, format, getYear, isEqual, isBefore, isWithinInterval } from 'date-fns';

import {
    LeaveCalculationDetails,
    WeeklyLeaveBreakdown,
    LeaveDayType,
    PublicHolidayDetail
} from '../types/leave';
import {
    WorkSchedule,
    WorkFrequency,
    WeekType
} from '../../profiles/types/workSchedule';
import { isWorkingDay as isScheduledWorkingDay } from '../../profiles/services/workScheduleService';
import { isEvenWeek } from '../../profiles/services/workScheduleService';
import { publicHolidayService } from '../services/publicHolidayService';
import { logger } from '@/utils/logger';

// Type pour les semaines paires/impaires
type WeekEvenOdd = 'EVEN' | 'ODD';

// Cache pour la mémorisation des calculs fréquents
interface LeaveCalculationCacheKey {
    startDate: string;
    endDate: string;
    scheduleId: string | number;
    skipHolidays: boolean;
    countHalfDays: boolean;
    countHolidaysOnWeekends: boolean;
}

interface LeaveCalculationCacheEntry {
    result: LeaveCalculationDetails;
    timestamp: number; // Pour expiration du cache
}

// Durée de validité du cache: 1 heure (en ms)
const CACHE_TTL = 60 * 60 * 1000;

// Initialisation du cache de mémorisation
const calculationCache = new Map<string, LeaveCalculationCacheEntry>();

/**
 * Génère une clé de cache unique pour les paramètres de calcul
 */
const generateCacheKey = (params: LeaveCalculationCacheKey): string => {
    return JSON.stringify({
        startDate: params.startDate,
        endDate: params.endDate,
        scheduleId: params.scheduleId,
        skipHolidays: params.skipHolidays,
        countHalfDays: params.countHalfDays,
        countHolidaysOnWeekends: params.countHolidaysOnWeekends
    });
};

/**
 * Vide le cache de calcul (utile pour les tests ou après mises à jour importantes)
 */
export const clearLeaveCalculationCache = (): void => {
    calculationCache.clear();
};

/**
 * Calculer le nombre de jours décomptés pour une demande de congés
 * en fonction du planning de travail de l'utilisateur
 * 
 * @param startDateInput Date de début des congés
 * @param endDateInput Date de fin des congés
 * @param schedule Planning de travail de l'utilisateur
 * @param options Options de calcul avancées
 * @returns Détails du calcul des jours de congés ou null en cas d'erreur
 */
export const calculateLeaveCountedDays = async (
    startDateInput: Date | string | number | null | undefined,
    endDateInput: Date | string | number | null | undefined,
    schedule: WorkSchedule,
    options?: {
        skipHolidays?: boolean;               // Ne pas compter les jours fériés (défaut: true)
        countHalfDays?: boolean;              // Compter les demi-journées (défaut: false)
        countHolidaysOnWeekends?: boolean;    // Compter les jours fériés tombant le weekend (défaut: false)
        forceCacheRefresh?: boolean;          // Forcer le rafraîchissement du cache (défaut: false)
    }
): Promise<LeaveCalculationDetails | null> => {
    try {
        // Valider et parser les dates en entrée
        const startDate = parseDate(startDateInput);
        const endDate = parseDate(endDateInput);

        if (!startDate || !endDate || isAfter(startDate, endDate)) {
            throw new Error("Dates de début ou de fin invalides pour le calcul des congés");
        }

        // Options par défaut
        const skipHolidays = options?.skipHolidays !== undefined ? options.skipHolidays : true;
        const countHalfDays = options?.countHalfDays || false;
        const countHolidaysOnWeekends = options?.countHolidaysOnWeekends || false;
        const forceCacheRefresh = options?.forceCacheRefresh || false;

        // Vérifier le cache si le rafraîchissement n'est pas forcé
        if (!forceCacheRefresh && schedule.id) {
            const cacheKey = generateCacheKey({
                startDate: format(startDate, 'yyyy-MM-dd'),
                endDate: format(endDate, 'yyyy-MM-dd'),
                scheduleId: schedule.id,
                skipHolidays,
                countHalfDays,
                countHolidaysOnWeekends
            });

            const cachedEntry = calculationCache.get(cacheKey);
            if (cachedEntry && (Date.now() - cachedEntry.timestamp) < CACHE_TTL) {
                return cachedEntry.result;
            }
        }

        // Nombre total de jours naturels
        const naturalDaysDiff = getDifferenceInDays(endDate, startDate);
        const naturalDays = naturalDaysDiff !== null ? naturalDaysDiff + 1 : 0;

        // Jours ouvrés (hors weekends et jours fériés)
        let workDays = 0;

        // Jours réellement décomptés (en fonction du planning)
        let countedDays = 0;

        // Jours comptés comme demi-journées
        let halfDays = 0;

        // Calculer le décompte par semaine
        const weeklyBreakdown: WeeklyLeaveBreakdown[] = [];

        // Pour le suivi détaillé des jours
        const dayDetails: Array<{
            date: Date;
            type: LeaveDayType;
            isCounted: boolean;
            isHalfDay: boolean;
        }> = [];

        // Récupérer les jours fériés pour la période demandée
        const publicHolidays = await publicHolidayService.getPublicHolidaysInRange(
            format(startDate, 'yyyy-MM-dd'),
            format(endDate, 'yyyy-MM-dd')
        );

        // Parcourir la période jour par jour
        const days = getDaysInInterval({ start: startDate, end: endDate });

        if (days.length === 0) {
            throw new Error("Aucun jour dans l'intervalle spécifié");
        }

        let currentWeekStart = getStartOfWeek(days[0]);
        let currentWeekEnd = getEndOfWeek(days[0]);
        let currentWeekNumber = getWeekNumber(days[0]);
        if (!currentWeekStart || !currentWeekEnd || currentWeekNumber === null) {
            throw new Error("Erreur lors de la récupération des informations de la semaine initiale");
        }

        let currentWeekType: WeekEvenOdd = isEvenWeek(days[0]) ? 'EVEN' : 'ODD';
        let currentWeekDays = 0;
        let currentWeekCountedDays = 0;
        let currentWeekHalfDays = 0;

        for (const day of days) {
            const dayWeekEnd = getEndOfWeek(day);
            if (!dayWeekEnd) {
                console.warn("Impossible de déterminer la fin de semaine pour", day);
                continue;
            }

            // Passage à une nouvelle semaine
            if (isAfter(day, currentWeekEnd)) {
                if (currentWeekNumber !== null && currentWeekStart && currentWeekEnd) {
                    weeklyBreakdown.push({
                        weekNumber: currentWeekNumber,
                        weekType: currentWeekType,
                        startDate: currentWeekStart,
                        endDate: currentWeekEnd,
                        naturalDays: currentWeekDays,
                        countedDays: currentWeekCountedDays,
                        halfDays: currentWeekHalfDays,
                        isWorkingWeek: isWorkingWeekForUser(schedule, currentWeekType)
                    });
                } else {
                    throw new Error("Données de semaine invalides avant de pousser dans weeklyBreakdown");
                }

                currentWeekStart = getStartOfWeek(day);
                currentWeekEnd = dayWeekEnd;
                currentWeekNumber = getWeekNumber(day);
                if (!currentWeekStart || !currentWeekEnd || currentWeekNumber === null) {
                    throw new Error("Erreur lors de la réinitialisation des informations de la semaine");
                }
                currentWeekType = isEvenWeek(day) ? 'EVEN' : 'ODD';
                currentWeekDays = 0;
                currentWeekCountedDays = 0;
                currentWeekHalfDays = 0;
            }

            currentWeekDays++;

            // Format de la date pour comparaison
            const dayFormatted = format(day, 'yyyy-MM-dd');

            // Déterminer si c'est un jour férié
            const isPublicHoliday = publicHolidays.some(holiday => {
                const holidayDate = typeof holiday.date === 'string'
                    ? holiday.date
                    : format(new Date(holiday.date), 'yyyy-MM-dd');
                return holidayDate === dayFormatted;
            });

            // Déterminer si c'est un weekend
            const isWeekend = isDateWeekend(day);

            // Déterminer si c'est une demi-journée (par exemple, vendredi après-midi)
            // Ceci est un exemple, la logique réelle dépendra des besoins spécifiques
            const isHalfDay = countHalfDays &&
                day.getDay() === 5 && // Vendredi
                !isPublicHoliday &&
                !isWeekend &&
                isScheduledWorkingDay(schedule, day);

            // Déterminer le type de jour
            let dayType: LeaveDayType = 'REGULAR';
            if (isWeekend) dayType = 'WEEKEND';
            else if (isPublicHoliday) dayType = 'HOLIDAY';
            else if (!isScheduledWorkingDay(schedule, day)) dayType = 'NON_WORKING';

            // Déterminer si le jour est compté dans les jours de congé
            let isCounted = false;

            // Gestion du cas où un jour férié tombe un weekend
            if (isWeekend && isPublicHoliday && countHolidaysOnWeekends) {
                // Si on compte les jours fériés tombant le weekend
                if (!skipHolidays) {
                    workDays++;
                    countedDays++;
                    currentWeekCountedDays++;
                    isCounted = true;
                }
            }
            // Gestion des jours normaux (non weekend)
            else if (!isWeekend) {
                // Si ce n'est pas un jour férié ou si on ne les ignore pas
                if (!isPublicHoliday || !skipHolidays) {
                    workDays++;

                    if (isScheduledWorkingDay(schedule, day)) {
                        if (isHalfDay) {
                            countedDays += 0.5;
                            halfDays++;
                            currentWeekHalfDays++;
                            currentWeekCountedDays += 0.5;
                        } else {
                            countedDays++;
                            currentWeekCountedDays++;
                        }
                        isCounted = true;
                    }
                }
            }

            // Ajouter les détails du jour pour le suivi
            dayDetails.push({
                date: new Date(day),
                type: dayType,
                isCounted,
                isHalfDay: isHalfDay && isCounted
            });
        }

        // Ajouter la dernière semaine
        if (currentWeekNumber !== null && currentWeekStart && currentWeekEnd) {
            weeklyBreakdown.push({
                weekNumber: currentWeekNumber,
                weekType: currentWeekType,
                startDate: currentWeekStart,
                endDate: currentWeekEnd,
                naturalDays: currentWeekDays,
                countedDays: currentWeekCountedDays,
                halfDays: currentWeekHalfDays,
                isWorkingWeek: isWorkingWeekForUser(schedule, currentWeekType)
            });
        } else {
            throw new Error("Données de la dernière semaine invalides");
        }

        // Mapper les jours fériés au format PublicHolidayDetail
        const mappedHolidays: PublicHolidayDetail[] = publicHolidays.map(h => ({
            date: parseISO(typeof h.date === 'string' ? h.date : format(new Date(h.date), 'yyyy-MM-dd')),
            name: h.name,
            isNational: h.isNational,
            description: h.description
        }));

        const result: LeaveCalculationDetails = {
            naturalDays,
            workDays,
            countedDays,
            halfDays,
            weeklyBreakdown,
            publicHolidays: mappedHolidays,
            workingTimePercentage: schedule.workingTimePercentage || 100,
            dayDetails
        };

        // Stocker dans le cache si un ID de planning est disponible
        if (schedule.id) {
            const cacheKey = generateCacheKey({
                startDate: format(startDate, 'yyyy-MM-dd'),
                endDate: format(endDate, 'yyyy-MM-dd'),
                scheduleId: schedule.id,
                skipHolidays,
                countHalfDays,
                countHolidaysOnWeekends
            });

            calculationCache.set(cacheKey, {
                result,
                timestamp: Date.now()
            });
        }

        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Erreur lors du calcul des jours de congés: ${errorMessage}`, {
            startDate: startDateInput,
            endDate: endDateInput,
            scheduleId: schedule.id,
            options
        });
        return null;
    }
};

/**
 * Calculer le nombre de jours ouvrables entre deux dates
 * Cette fonction ne prend pas en compte le planning spécifique de l'utilisateur
 * et compte simplement les jours non weekend et non fériés
 * 
 * @param startDate Date de début 
 * @param endDate Date de fin
 * @param options Options supplémentaires
 * @returns Nombre de jours ouvrables ou null en cas d'erreur
 */
export const calculateWorkingDays = async (
    startDate: Date | string | number | null | undefined,
    endDate: Date | string | number | null | undefined,
    options?: {
        countHolidaysOnWeekends?: boolean;
        region?: string;
        country?: string;
    }
): Promise<number | null> => {
    try {
        const start = parseDate(startDate);
        const end = parseDate(endDate);

        if (!start || !end || isAfter(start, end)) {
            return null;
        }

        // Récupérer les jours fériés pour la période
        const publicHolidays = await publicHolidayService.getPublicHolidaysInRange(
            format(start, 'yyyy-MM-dd'),
            format(end, 'yyyy-MM-dd'),
            options?.region
        );

        const days = getDaysInInterval({ start, end });
        let workingDays = 0;

        for (const day of days) {
            const isWeekend = isDateWeekend(day);

            if (!isWeekend) {
                // Vérifier si c'est un jour férié
                const isHoliday = publicHolidays.some(holiday => {
                    const holidayDate = typeof holiday.date === 'string'
                        ? holiday.date
                        : format(new Date(holiday.date), 'yyyy-MM-dd');
                    return holidayDate === format(day, 'yyyy-MM-dd');
                });

                if (!isHoliday) {
                    workingDays++;
                }
            } else if (options?.countHolidaysOnWeekends) {
                // Si on compte les jours fériés tombant le weekend
                const isHoliday = publicHolidays.some(holiday => {
                    const holidayDate = typeof holiday.date === 'string'
                        ? holiday.date
                        : format(new Date(holiday.date), 'yyyy-MM-dd');
                    return holidayDate === format(day, 'yyyy-MM-dd');
                });

                if (isHoliday) {
                    workingDays++;
                }
            }
        }

        return workingDays;
    } catch (error) {
        logger.error(`Erreur lors du calcul des jours ouvrables: ${error instanceof Error ? error.message : String(error)}`, {
            startDate,
            endDate,
            options
        });
        return null;
    }
};

/**
 * Vérifie si un jour spécifique est un jour ouvrable
 * (n'est ni un weekend ni un jour férié)
 * 
 * @param date Date à vérifier
 * @param options Options supplémentaires
 * @returns true si c'est un jour ouvrable, false sinon
 */
export const isBusinessDay = async (
    date: Date | string | number | null | undefined,
    options?: {
        region?: string;
        country?: string;
    }
): Promise<boolean> => {
    try {
        const dateObj = parseDate(date);
        if (!dateObj) return false;

        // Vérifier si c'est un weekend
        if (isDateWeekend(dateObj)) return false;

        // Vérifier si c'est un jour férié
        const isHoliday = await publicHolidayService.isPublicHoliday(dateObj);
        return !isHoliday;
    } catch (error) {
        logger.error(`Erreur lors de la vérification de jour ouvrable: ${error instanceof Error ? error.message : String(error)}`, {
            date,
            options
        });
        return false;
    }
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