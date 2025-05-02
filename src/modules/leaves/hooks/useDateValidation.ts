import { useState, useCallback, useEffect } from 'react';
import { formatDate, parseDate, isDateWeekend } from '@/utils/dateUtils';
import { calculateWorkingDays, isBusinessDay } from '../services/leaveCalculator';
import { publicHolidayService } from '../services/publicHolidayService';
import { format, isAfter, isBefore, isSameDay } from 'date-fns';
import { WorkSchedule } from '../../profiles/types/workSchedule';
import { LeaveDateValidationOptions } from '../types/leave';
import { logger } from '@/utils/logger';

export interface DateValidationConfig {
    startDate: Date | string | null;
    endDate: Date | string | null;
    workSchedule?: WorkSchedule;
    options?: LeaveDateValidationOptions;
    minDays?: number;
    maxDays?: number;
    allowPastDates?: boolean;
    maxFutureDays?: number; // Nombre maximal de jours dans le futur
}

export interface DateValidationResult {
    isValid: boolean;
    errors: {
        startDate?: string[];
        endDate?: string[];
        period?: string[];
    };
    warnings: {
        startDate?: string[];
        endDate?: string[];
        period?: string[];
    };
    workingDays: number;
    hasHolidays: boolean;
    hasWeekends: boolean;
    holidayCount: number;
    weekendCount: number;
}

/**
 * Hook pour valider les dates de congés
 */
export const useDateValidation = ({
    startDate,
    endDate,
    workSchedule,
    options = {},
    minDays = 1,
    maxDays,
    allowPastDates = false,
    maxFutureDays
}: DateValidationConfig): DateValidationResult => {
    const [result, setResult] = useState<DateValidationResult>({
        isValid: false,
        errors: {},
        warnings: {},
        workingDays: 0,
        hasHolidays: false,
        hasWeekends: false,
        holidayCount: 0,
        weekendCount: 0
    });

    const validateDates = useCallback(async () => {
        const errors: { startDate?: string[]; endDate?: string[]; period?: string[] } = {};
        const warnings: { startDate?: string[]; endDate?: string[]; period?: string[] } = {};

        // Valider et parser les dates
        const start = parseDate(startDate);
        const end = parseDate(endDate);

        // Aujourd'hui à minuit
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Vérifier si les dates sont définies
        if (!start) {
            errors.startDate = [...(errors.startDate || []), "La date de début est requise"];
        }

        if (!end) {
            errors.endDate = [...(errors.endDate || []), "La date de fin est requise"];
        }

        // Si une des dates est manquante, retourner immédiatement
        if (!start || !end) {
            setResult({
                isValid: false,
                errors,
                warnings,
                workingDays: 0,
                hasHolidays: false,
                hasWeekends: false,
                holidayCount: 0,
                weekendCount: 0
            });
            return;
        }

        // Vérifier si la date de début est antérieure à la date de fin
        if (isAfter(start, end)) {
            errors.period = [...(errors.period || []), "La date de début doit être antérieure ou égale à la date de fin"];
        }

        // Vérifier si les dates sont dans le passé
        if (!allowPastDates && isBefore(start, today) && !isSameDay(start, today)) {
            errors.startDate = [...(errors.startDate || []), "La date de début ne peut pas être dans le passé"];
        }

        if (!allowPastDates && isBefore(end, today) && !isSameDay(end, today)) {
            errors.endDate = [...(errors.endDate || []), "La date de fin ne peut pas être dans le passé"];
        }

        // Vérifier si les dates sont trop loin dans le futur
        if (maxFutureDays) {
            const maxFutureDate = new Date(today);
            maxFutureDate.setDate(today.getDate() + maxFutureDays);

            if (isAfter(start, maxFutureDate)) {
                warnings.startDate = [...(warnings.startDate || []), `La date de début est plus de ${maxFutureDays} jours dans le futur`];
            }

            if (isAfter(end, maxFutureDate)) {
                warnings.endDate = [...(warnings.endDate || []), `La date de fin est plus de ${maxFutureDays} jours dans le futur`];
            }
        }

        // Si des erreurs ont été trouvées, retourner immédiatement
        if (Object.values(errors).some(errorList => errorList && errorList.length > 0)) {
            setResult({
                isValid: false,
                errors,
                warnings,
                workingDays: 0,
                hasHolidays: false,
                hasWeekends: false,
                holidayCount: 0,
                weekendCount: 0
            });
            return;
        }

        try {
            // Calculer le nombre de jours ouvrables
            const workingDaysCount = await calculateWorkingDays(start, end, {
                countHolidaysOnWeekends: options.countHolidaysOnWeekends
            });

            if (workingDaysCount === null) {
                errors.period = [...(errors.period || []), "Impossible de calculer les jours ouvrables"];
                setResult({
                    isValid: false,
                    errors,
                    warnings,
                    workingDays: 0,
                    hasHolidays: false,
                    hasWeekends: false,
                    holidayCount: 0,
                    weekendCount: 0
                });
                return;
            }

            // Vérifier nombre minimum de jours ouvrables
            if (workingDaysCount < minDays && options.minWorkingDays !== false) {
                if (options.allowPeriodsWithNoWorkingDays && workingDaysCount === 0) {
                    warnings.period = [...(warnings.period || []), `Aucun jour ouvrable dans cette période`];
                } else {
                    errors.period = [...(errors.period || []), `La période doit contenir au moins ${minDays} jour(s) ouvrable(s)`];
                }
            }

            // Vérifier nombre maximum de jours
            if (maxDays && workingDaysCount > maxDays) {
                errors.period = [...(errors.period || []), `La période ne peut pas dépasser ${maxDays} jours ouvrables`];
            }

            // Récupérer les jours fériés dans la période
            const formattedStart = format(start, 'yyyy-MM-dd');
            const formattedEnd = format(end, 'yyyy-MM-dd');
            const holidays = await publicHolidayService.getPublicHolidaysInRange(formattedStart, formattedEnd);

            // Calculer le nombre de weekends
            const oneDay = 24 * 60 * 60 * 1000; // Millisecondes dans une journée
            const diffDays = Math.round(Math.abs((end.getTime() - start.getTime()) / oneDay)) + 1;

            const dates: Date[] = [];
            for (let i = 0; i < diffDays; i++) {
                const date = new Date(start);
                date.setDate(start.getDate() + i);
                dates.push(date);
            }

            const weekends = dates.filter(date => isDateWeekend(date));

            // Mettre à jour le résultat
            setResult({
                isValid: Object.values(errors).every(errorList => !errorList || errorList.length === 0),
                errors,
                warnings,
                workingDays: workingDaysCount,
                hasHolidays: holidays.length > 0,
                hasWeekends: weekends.length > 0,
                holidayCount: holidays.length,
                weekendCount: weekends.length
            });
        } catch (err) {
            logger.error(`Erreur dans useDateValidation: ${err instanceof Error ? err.message : String(err)}`, {
                startDate,
                endDate,
                workScheduleId: workSchedule?.id
            });

            errors.period = [...(errors.period || []), "Une erreur est survenue lors de la validation des dates"];
            setResult({
                isValid: false,
                errors,
                warnings,
                workingDays: 0,
                hasHolidays: false,
                hasWeekends: false,
                holidayCount: 0,
                weekendCount: 0
            });
        }
    }, [startDate, endDate, workSchedule, options, minDays, maxDays, allowPastDates, maxFutureDays]);

    useEffect(() => {
        validateDates();
    }, [validateDates]);

    return result;
}; 