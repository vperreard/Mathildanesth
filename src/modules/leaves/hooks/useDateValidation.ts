import { useState, useCallback, useEffect } from 'react';
import { formatDate, parseDate, isDateWeekend } from '@/utils/dateUtils';
import { calculateWorkingDays, isBusinessDay } from '../services/leaveCalculator';
import { publicHolidayService } from '../services/publicHolidayService';
import { format, isAfter, isBefore, isSameDay, isValid } from 'date-fns';
import { WorkSchedule } from '../../profiles/types/workSchedule';
import { LeaveDateValidationOptions } from '../types/leave';
import { getLogger } from '@/utils/logger';

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
        const logger = await getLogger();
        logger.info('Validating dates...', { startDate, endDate, options, minDays, maxDays });

        const errors: { startDate?: string[]; endDate?: string[]; period?: string[] } = {};
        const warnings: { startDate?: string[]; endDate?: string[]; period?: string[] } = {};
        let workingDaysCount = 0;
        let holidays: any[] = [];
        let weekends: Date[] = [];
        let holidayCount = 0;
        let weekendCount = 0;
        let calculationError = false;

        // Valider et parser les dates
        const start = parseDate(startDate);
        const end = parseDate(endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!start) {
            errors.startDate = [...(errors.startDate || []), "La date de début est requise"];
        }

        if (!end) {
            errors.endDate = [...(errors.endDate || []), "La date de fin est requise"];
        }

        if (start && end && isAfter(start, end)) {
            errors.period = [...(errors.period || []), "La date de début doit être antérieure ou égale à la date de fin"];
        }

        if (!start || !end || errors.period?.length) {
            logger.warn('Basic date validation failed (missing dates or end before start)', { errors });
            setResult({
                isValid: false, errors, warnings, workingDays: 0,
                hasHolidays: false, hasWeekends: false, holidayCount: 0, weekendCount: 0
            });
            return;
        }

        if (!allowPastDates && isBefore(start, today) && !isSameDay(start, today)) {
            errors.startDate = [...(errors.startDate || []), "La date de début ne peut pas être dans le passé"];
        }

        if (!allowPastDates && isBefore(end, today) && !isSameDay(end, today)) {
            errors.endDate = [...(errors.endDate || []), "La date de fin ne peut pas être dans le passé"];
        }

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

        if (errors.startDate?.length || errors.endDate?.length) {
            logger.warn('Date validation failed (past/future checks)', { errors, warnings });
            setResult({
                isValid: false, errors, warnings, workingDays: 0,
                hasHolidays: false, hasWeekends: false, holidayCount: 0, weekendCount: 0
            });
            return;
        }

        try {
            logger.info('Calculating working days...');
            workingDaysCount = await calculateWorkingDays(start, end, {
                countHolidaysOnWeekends: options.countHolidaysOnWeekends ?? false
            });

            if (workingDaysCount === null) {
                logger.error('calculateWorkingDays returned null');
                throw new Error("Impossible de calculer les jours ouvrables");
            }
            logger.info(`Working days calculated: ${workingDaysCount}`);

            logger.info('Fetching public holidays...');
            const formattedStart = format(start, 'yyyy-MM-dd');
            const formattedEnd = format(end, 'yyyy-MM-dd');
            holidays = await publicHolidayService.getPublicHolidaysInRange(formattedStart, formattedEnd);
            holidayCount = holidays.length;
            logger.info(`Public holidays fetched: ${holidayCount}`);

            logger.info('Calculating weekends...');
            const oneDay = 24 * 60 * 60 * 1000;
            const diffDays = Math.round(Math.abs((end.getTime() - start.getTime()) / oneDay)) + 1;
            const dates: Date[] = [];
            for (let i = 0; i < diffDays; i++) {
                const date = new Date(start);
                date.setDate(start.getDate() + i);
                dates.push(date);
            }
            weekends = dates.filter(date => isDateWeekend(date));
            weekendCount = weekends.length;
            logger.info(`Weekends calculated: ${weekendCount}`);

        } catch (calcErr) {
            const errorObj = calcErr instanceof Error ? calcErr : new Error(String(calcErr));
            logger.error('Error during working days/holiday/weekend calculation', { error: errorObj.message, stack: errorObj.stack });
            errors.period = [...(errors.period || []), "Erreur interne lors du calcul des jours."];
            calculationError = true;
        }

        if (!calculationError) {
            if (workingDaysCount < minDays && options.minWorkingDays !== false) {
                if (options.allowPeriodsWithNoWorkingDays && workingDaysCount === 0) {
                    warnings.period = [...(warnings.period || []), `Aucun jour ouvrable dans cette période`];
                } else {
                    errors.period = [...(errors.period || []), `La période doit contenir au moins ${minDays} jour(s) ouvrable(s)`];
                }
            }
            if (maxDays !== undefined && workingDaysCount > maxDays) {
                errors.period = [...(errors.period || []), `La période ne peut pas dépasser ${maxDays} jours ouvrables`];
            }
        }

        const finalIsValid = Object.values(errors).every(errorList => !errorList || errorList.length === 0);

        if (!finalIsValid) {
            logger.warn('Final date validation failed', { errors, warnings, calculationError });
        } else {
            logger.info('Final date validation successful');
        }

        setResult({
            isValid: finalIsValid,
            errors,
            warnings,
            workingDays: workingDaysCount ?? 0,
            hasHolidays: holidayCount > 0,
            hasWeekends: weekendCount > 0,
            holidayCount,
            weekendCount
        });

    }, [startDate, endDate, workSchedule, options, minDays, maxDays, allowPastDates, maxFutureDays]);

    useEffect(() => {
        validateDates();
    }, [validateDates]);

    return result;
}; 