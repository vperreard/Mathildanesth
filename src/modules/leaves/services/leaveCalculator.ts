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
import { logger } from "../../../lib/logger";
import { fr } from 'date-fns/locale';
import { isAfter, parseISO, format, getYear, isEqual, isBefore, isWithinInterval, addDays } from 'date-fns';

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
import { getLogger } from '@/utils/logger';

// Type pour les semaines paires/impaires
type WeekEvenOdd = 'EVEN' | 'ODD';

// Cache pour la mémorisation des calculs fréquents
interface LeaveCalculationCacheKey {
    startDate: string;
    endDate: string;
    scheduleId: string | number;
    skipHolidays: boolean;
    isHalfDay?: boolean;
    halfDayPeriod?: 'AM' | 'PM';
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
        isHalfDay: params.isHalfDay,
        halfDayPeriod: params.halfDayPeriod,
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
 * @param planningMedical Planning de travail de l'utilisateur
 * @param options Options de calcul avancées
 * @returns Détails du calcul des jours de congés ou null en cas d'erreur
 */
export const calculateLeaveCountedDays = async (
    startDateInput: Date | string | number | null | undefined,
    endDateInput: Date | string | number | null | undefined,
    planningMedical: WorkSchedule,
    options?: {
        skipHolidays?: boolean;
        isHalfDay?: boolean;
        halfDayPeriod?: 'AM' | 'PM';
        countHolidaysOnWeekends?: boolean;
        forceCacheRefresh?: boolean;
    }
): Promise<LeaveCalculationDetails | null> => {
    const logger = await getLogger();
    try {
        const skipHolidays = options?.skipHolidays !== false;
        const isHalfDayOption = options?.isHalfDay === true;
        const halfDayPeriod = options?.halfDayPeriod || 'AM'; // Valeur par défaut : matin
        const countHolidaysOnWeekends = options?.countHolidaysOnWeekends === true;
        const forceCacheRefresh = options?.forceCacheRefresh || false;

        // Parsing des dates
        const startDate = parseDate(startDateInput);
        const endDate = parseDate(endDateInput);

        if (!startDate || !endDate) {
            logger.warn('Invalid dates provided to calculateLeaveCountedDays', { startDateInput, endDateInput });
            return null;
        }

        // Vérifier que la date de fin est après la date de début
        if (isAfter(startDate, endDate)) {
            logger.warn('Invalid dates provided to calculateLeaveCountedDays', { startDateInput, endDateInput });
            return null;
        }

        // Créer une clé de cache unique qui inclut maintenant halfDayPeriod
        const cacheKey = generateCacheKey({
            startDate: format(startDate, 'yyyy-MM-dd'),
            endDate: format(endDate, 'yyyy-MM-dd'),
            scheduleId: planningMedical.id,
            skipHolidays,
            isHalfDay: isHalfDayOption,
            halfDayPeriod: isHalfDayOption ? halfDayPeriod : undefined,
            countHolidaysOnWeekends
        });

        // Vérifier si le calcul est déjà en cache et si on ne force pas le rafraîchissement
        const cachedEntry = calculationCache.get(cacheKey);
        if (!forceCacheRefresh && cachedEntry && (Date.now() - cachedEntry.timestamp) < CACHE_TTL) {
            return cachedEntry.result;
        }

        logger.info('Starting leave counted days calculation...', {
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
            scheduleId: planningMedical.id,
            isHalfDay: isHalfDayOption,
            halfDayPeriod: isHalfDayOption ? halfDayPeriod : undefined,
            options
        });

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

        logger.info(`Fetched ${publicHolidays.length} public holidays for the period.`);

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

        // Set d'IDs pour les jours fériés pour recherche rapide
        const holidayDateSet = new Set(publicHolidays.map(h =>
            typeof h.date === 'string' ? h.date : format(new Date(h.date), 'yyyy-MM-dd')
        ));

        for (const day of days) {
            const dayWeekEnd = getEndOfWeek(day);
            if (!dayWeekEnd) {
                logger.warn("Impossible de déterminer la fin de semaine pour", day);
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
                        isWorkingWeek: isWorkingWeekForUser(planningMedical, currentWeekType)
                    });
                }

                // Réinitialiser pour la nouvelle semaine
                currentWeekStart = getStartOfWeek(day);
                currentWeekEnd = dayWeekEnd;
                currentWeekNumber = getWeekNumber(day);
                currentWeekType = isEvenWeek(day) ? 'EVEN' : 'ODD';
                currentWeekDays = 0;
                currentWeekCountedDays = 0;
                currentWeekHalfDays = 0;
            }

            currentWeekDays++;

            const formattedDay = format(day, 'yyyy-MM-dd');
            const isWeekend = isDateWeekend(day);
            const isHoliday = holidayDateSet.has(formattedDay);
            const isWorkDay = !isWeekend && (!isHoliday || !skipHolidays);

            // Vérifier si ce jour est travaillé pour l'utilisateur selon son planning
            const isScheduledDay = isScheduledWorkingDay(planningMedical, day);
            const isActualWorkDay = isWorkDay && isScheduledDay;

            if (isWorkDay) {
                workDays++;
            }

            // Déterminer si on doit compter ce jour dans les jours décomptés
            const shouldCountWeekendHoliday = isWeekend && isHoliday && countHolidaysOnWeekends && !skipHolidays;
            const shouldCountDay = isActualWorkDay || shouldCountWeekendHoliday;

            // Cas spécial: si c'est un mode demi-journée et qu'il n'y a qu'un seul jour (même date)
            // const isSingleDayHalfDayRequest = isHalfDayOption && days.length === 1; // Ancienne logique

            if (shouldCountDay) {
                // Nouvelle logique pour les demi-journées
                let currentDayIsActuallyHalf = false;
                if (isHalfDayOption) {
                    if (days.length === 1) { // Requête d'un seul jour
                        currentDayIsActuallyHalf = true;
                    } else if (isSameDay(day, endDate)) { // Dernier jour d'une requête multi-jours
                        currentDayIsActuallyHalf = true;
                    }
                    // Pour les autres jours d'une requête multi-jours avec isHalfDayOption, ils sont comptés pleins.
                }

                if (currentDayIsActuallyHalf) {
                    countedDays += 0.5;
                    currentWeekCountedDays += 0.5;
                    halfDays++;
                    currentWeekHalfDays++;
                    dayDetails.push({
                        date: day,
                        type: isHoliday ? 'HOLIDAY' : (isWeekend ? 'WEEKEND' : 'HALF_DAY'),
                        isCounted: true,
                        isHalfDay: true
                    });
                } else {
                    countedDays++;
                    currentWeekCountedDays++;
                    dayDetails.push({
                        date: day,
                        type: isHoliday ? 'HOLIDAY' : (isWeekend ? 'WEEKEND' : 'FULL_DAY_WORKED'),
                        isCounted: true,
                        isHalfDay: false
                    });
                }
            } else {
                dayDetails.push({
                    date: day,
                    type: isHoliday ? 'HOLIDAY' : (isWeekend ? 'WEEKEND' : 'NON_WORKING'),
                    isCounted: false,
                    isHalfDay: false
                });
            }
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
                isWorkingWeek: isWorkingWeekForUser(planningMedical, currentWeekType)
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
            workingTimePercentage: planningMedical.workingTimePercentage || 100,
            dayDetails
        };

        // Stocker dans le cache si un ID de planning est disponible
        if (planningMedical.id) {
            calculationCache.set(cacheKey, {
                result,
                timestamp: Date.now()
            });
        }

        logger.info('Leave counted days calculation successful', { countedDays: result.countedDays, workDays: result.workDays, scheduleId: planningMedical.id });
        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Erreur lors du calcul des jours de congés: ${errorMessage}`, {
            startDate: startDateInput,
            endDate: endDateInput,
            scheduleId: planningMedical.id,
            options,
            stack: error instanceof Error ? error.stack : undefined
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
    const logger = await getLogger();
    try {
        const start = parseDate(startDate);
        const end = parseDate(endDate);

        if (!start || !end || isAfter(start, end)) {
            logger.warn('Invalid dates provided to calculateWorkingDays', { startDate, endDate });
            return null;
        }

        logger.info('Calculating working days...', { startDate: formatDate(start), endDate: formatDate(end), options });

        // Récupérer les jours fériés pour la période
        const publicHolidays = await publicHolidayService.getPublicHolidaysInRange(
            format(start, 'yyyy-MM-dd'),
            format(end, 'yyyy-MM-dd'),
            options?.region
        );

        logger.info(`Fetched ${publicHolidays.length} public holidays for working days calculation.`);

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

        logger.info(`Working days calculated: ${workingDays}`);
        return workingDays;
    } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        logger.error('Error calculating working days', { error: errorObj.message, stack: errorObj.stack });
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
    const logger = await getLogger();
    try {
        const dateObj = parseDate(date);
        if (!dateObj) {
            logger.warn('Invalid date provided to isBusinessDay', { date });
            return false;
        }

        // Vérifier si c'est un weekend
        if (isDateWeekend(dateObj)) return false;

        // Vérifier si c'est un jour férié
        logger.info(`Checking if ${formatDate(dateObj)} is a business day...`);
        const isHoliday = await publicHolidayService.isPublicHoliday(dateObj);
        logger.info(`Result for ${formatDate(dateObj)}: isWeekend=${isDateWeekend(dateObj)}, isHoliday=${isHoliday}`);
        return !isDateWeekend(dateObj) && !isHoliday;
    } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        logger.error(`Erreur lors de la vérification de jour ouvrable: ${errorObj.message}`, {
            date,
            options,
            stack: errorObj.stack
        });
        return false;
    }
};

/**
 * Vérifier si une semaine (paire ou impaire) est travaillée par l'utilisateur
 */
const isWorkingWeekForUser = (
    planningMedical: WorkSchedule,
    weekType: WeekEvenOdd
): boolean => {
    // Pour les temps pleins, toutes les semaines sont travaillées
    if (planningMedical.frequency === WorkFrequency.FULL_TIME) {
        return true;
    }

    // Pour l'alternance de semaines
    if (planningMedical.frequency === WorkFrequency.ALTERNATE_WEEKS) {
        if (planningMedical.weekType === WeekType.BOTH) {
            return true;
        } else if (planningMedical.weekType === WeekType.EVEN && weekType === 'EVEN') {
            return true;
        } else if (planningMedical.weekType === WeekType.ODD && weekType === 'ODD') {
            return true;
        }
        return false;
    }

    // Pour les configurations personnalisées
    if (planningMedical.frequency === WorkFrequency.CUSTOM && planningMedical.customSchedule) {
        if (weekType === 'EVEN' && planningMedical.customSchedule.evenWeeks?.length) {
            return true;
        } else if (weekType === 'ODD' && planningMedical.customSchedule.oddWeeks?.length) {
            return true;
        }
    }

    // Pour les autres types de planning, vérifier s'il y a des jours travaillés
    return (planningMedical.workingDays?.length || 0) > 0;
};