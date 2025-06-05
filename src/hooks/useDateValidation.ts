import { useState, useCallback, useMemo } from 'react';
import { logger } from "../lib/logger";
import {
    format,
    isAfter,
    isBefore,
    isEqual,
    isWithinInterval,
    parseISO,
    differenceInDays,
    differenceInBusinessDays,
    isWeekend as dateFnsIsWeekend,
    addDays,
    isValid as isValidDate,
    subDays,
    compareAsc,
    isSameDay
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { useErrorHandler } from './useErrorHandler';
import { logError } from '@/services/errorLoggingService';
import { ErrorDetails } from './useErrorHandler';

/**
 * Types d'erreurs de validation de dates
 */
export enum DateValidationErrorType {
    REQUIRED = 'required',
    PAST_DATE = 'past_date',
    FUTURE_DATE = 'future_date',
    INVALID_FORMAT = 'invalid_format',
    START_AFTER_END = 'start_after_end',
    OVERLAPPING = 'overlapping',
    WEEKEND = 'weekend',
    HOLIDAY = 'holiday',
    MAX_DURATION = 'max_duration',
    MIN_DURATION = 'min_duration',
    INVALID_RANGE = 'invalid_range',
    MIN_ADVANCE_NOTICE = 'min_advance_notice',
    MAX_ADVANCE_BOOKING = 'max_advance_booking',
    BLACKOUT_PERIOD = 'blackout_period',
    EXCEEDS_AVAILABLE_DAYS = 'exceeds_available_days',
    INVALID_BUSINESS_DAYS = 'invalid_business_days',
    RANGE_TOO_SHORT = 'range_too_short',
    RANGE_TOO_LONG = 'range_too_long',
    CONFLICT = 'conflict',
    NON_BUSINESS_DAY = 'non_business_day',
    OVERLAP = 'overlap',
    INVALID_DATE = 'invalid_date',
    EVENT_CONFLICT = 'eventConflict',
    INSUFFICIENT_DAYS = 'insufficientDays',
    INVALID_DATE_RANGE = 'invalidDateRange',
    OTHER = 'other'
}

/**
 * Interface pour les options de validation de dates
 */
export interface DateValidationOptions {
    required?: boolean;
    allowPastDates?: boolean;
    allowFutureDates?: boolean;
    minDate?: Date;
    maxDate?: Date;
    disallowWeekends?: boolean;
    onlyBusinessDays?: boolean;
    holidays?: Date[];
    maxDuration?: number; // en jours
    minDuration?: number; // en jours
    format?: string;
    minAdvanceNotice?: number; // jours minimum avant la date de début
    maxAdvanceBooking?: number; // jours maximum avant la date de début
    blackoutPeriods?: DateRange[]; // périodes bloquées
    availableDaysPerYear?: number; // nombre de jours disponibles par an
    businessDaysOnly?: boolean; // compter uniquement les jours ouvrables
    existingEvents?: ExistingEvent[];
    customValidation?: (date: Date, context: DateValidationContext) => { isValid: boolean; errorType?: DateValidationErrorType; errorMessage?: string } | null;
}

/**
 * Interface pour les erreurs de validation de dates
 */
export interface DateValidationError {
    type: DateValidationErrorType;
    message: string;
    details?: unknown; // informations supplémentaires sur l'erreur
}

/**
 * Interface pour un intervalle de dates
 */
export interface DateRange {
    start: Date;
    end: Date;
    label?: string; // libellé optionnel pour identifier la plage
    type?: string; // type optionnel pour catégoriser la plage
}

/**
 * Interface pour le contexte de validation
 */
export interface ValidationContext {
    usedDays?: number; // jours déjà utilisés
    remainingDays?: number; // jours restants
    conflicts?: DateRange[]; // conflits détectés
    businessDaysCount?: number; // nombre de jours ouvrables
    totalDaysCount?: number; // nombre total de jours
}

/**
 * Interface pour les périodes d'interdiction (blackout)
 */
export interface BlackoutPeriod {
    start: Date;
    end: Date;
    label?: string;
}

/**
 * Interface pour les événements existants
 */
export interface ExistingEvent {
    id: string;
    start: Date;
    end: Date;
    title?: string;
}

/**
 * Interface pour le contexte de validation
 */
export interface DateValidationContext {
    userId?: string;
    departmentId?: string;
    usedDays?: number;
    remainingDays?: number;
    [key: string]: unknown;
}

/**
 * Formate une date selon le format spécifié
 */
export function formatDate(date: Date, dateFormat: string = 'dd/MM/yyyy'): string {
    try {
        if (!isValidDate(date)) {
            throw new Error('Date invalide');
        }
        return format(date, dateFormat, { locale: fr });
    } catch (error: unknown) {
        logger.error('Erreur lors du formatage de la date:', error instanceof Error ? error : new Error(String(error)));
        return '';
    }
}

/**
 * Vérifie si une chaîne est une date valide
 */
export function isValidDateString(dateString: string): boolean {
    if (!dateString) return false;

    const parsedDate = parseISO(dateString);
    return isValidDate(parsedDate);
}

/**
 * Normalise une date ou une chaîne de date en objet Date
 */
export function normalizeDate(date: Date | string | null | undefined): Date | null {
    if (!date) return null;

    if (typeof date === 'string') {
        const parsedDate = parseISO(date);
        return isValidDate(parsedDate) ? parsedDate : null;
    }

    return isValidDate(date) ? date : null;
}

/**
 * Vérifie si une date est un jour férié
 */
export function isHoliday(date: Date, holidays: Date[] = []): boolean {
    return holidays.some(holiday =>
        holiday.getDate() === date.getDate() &&
        holiday.getMonth() === date.getMonth() &&
        holiday.getFullYear() === date.getFullYear()
    );
}

/**
 * Vérifie si une date est un week-end
 */
export function isWeekend(date: Date): boolean {
    return dateFnsIsWeekend(date);
}

/**
 * Vérifie si une date est un jour ouvrable
 */
export function isBusinessDay(date: Date, holidays: Date[] = []): boolean {
    return !isWeekend(date) && !isHoliday(date, holidays);
}

/**
 * Compte le nombre de jours ouvrables entre deux dates
 */
export function countBusinessDays(startDate: Date, endDate: Date, holidays: Date[] = []): number {
    let count = differenceInBusinessDays(endDate, startDate) + 1;

    // Soustrait les jours fériés qui ne tombent pas un weekend
    let currentDate = new Date(startDate);
    while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
        if (isHoliday(currentDate, holidays) && !isWeekend(currentDate)) {
            count--;
        }
        currentDate = addDays(currentDate, 1);
    }

    return count;
}

/**
 * Vérifie si deux intervalles de dates se chevauchent
 */
export function datesOverlap(range1: DateRange, range2: DateRange): boolean {
    // Vérifie si l'une des dates de range1 est dans range2
    const startInRange2 = isWithinInterval(range1.start, {
        start: range2.start,
        end: range2.end
    }) || isEqual(range1.start, range2.start) || isEqual(range1.start, range2.end);

    const endInRange2 = isWithinInterval(range1.end, {
        start: range2.start,
        end: range2.end
    }) || isEqual(range1.end, range2.start) || isEqual(range1.end, range2.end);

    // Vérifie si range2 est entièrement contenu dans range1
    const range2InRange1 = isBefore(range1.start, range2.start) && isAfter(range1.end, range2.end);

    return startInRange2 || endInRange2 || range2InRange1;
}

/**
 * Trouve les chevauchements entre une plage et une liste de plages
 */
export function findOverlaps(range: DateRange, existingRanges: DateRange[]): DateRange[] {
    return existingRanges.filter(existingRange => datesOverlap(range, existingRange));
}

/**
 * Calcule la durée entre deux dates en jours
 */
export function calculateDurationInDays(startDate: Date, endDate: Date): number {
    return Math.abs(differenceInDays(endDate, startDate)) + 1;
}

/**
 * Calcule la durée en jours ouvrables entre deux dates
 */
export function calculateBusinessDays(startDate: Date, endDate: Date, holidays: Date[] = []): number {
    let count = 0;
    let currentDate = new Date(startDate);

    while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
        if (isBusinessDay(currentDate, holidays)) {
            count++;
        }
        currentDate = addDays(currentDate, 1);
    }

    return count;
}

/**
 * Vérifie si une date tombe pendant une période blackout
 */
export function isInBlackoutPeriod(date: Date, blackoutPeriods: DateRange[] = []): boolean {
    return blackoutPeriods.some(period =>
        isWithinInterval(date, { start: period.start, end: period.end }) ||
        isEqual(date, period.start) ||
        isEqual(date, period.end)
    );
}

/**
 * Vérifie si une plage est entièrement dans une période blackout
 */
export function isRangeInBlackoutPeriod(range: DateRange, blackoutPeriods: DateRange[] = []): {
    isInBlackout: boolean;
    affectedPeriods: DateRange[];
} {
    // Vérification des paramètres
    if (!range?.start || !range?.end || !Array.isArray(blackoutPeriods) || blackoutPeriods.length === 0) {
        return {
            isInBlackout: false,
            affectedPeriods: []
        };
    }

    // Filtrer les périodes qui se chevauchent
    const affectedPeriods = blackoutPeriods.filter((period) => {
        if (!period?.start || !period?.end) {
            return false;
        }
        return datesOverlap(range, period);
    });

    return {
        isInBlackout: affectedPeriods.length > 0,
        affectedPeriods
    };
}

/**
 * Hook personnalisé pour la validation des dates
 */
export function useDateValidation(options: DateValidationOptions = {}) {
    const [errors, setErrors] = useState<Record<string, DateValidationError>>({});
    const { setError: logValidationError } = useErrorHandler();

    /**
     * Définit une erreur de validation pour un champ spécifique.
     */
    const setError = useCallback((fieldName: string, type: DateValidationErrorType, message: string, details?: unknown) => {
        setErrors((prevErrors) => ({
            ...prevErrors,
            [fieldName]: { type, message, details },
        }));
        // Log the error using the error handler hook
        logValidationError(`DateValidation Error [${fieldName}]`, {
            severity: 'warning',
            code: `DATE_VALIDATION_${type}`,
            message: message,
            context: { fieldName, validationType: type, ...details, componentStack: 'useDateValidation' },
        });
    }, [logValidationError]);

    /**
     * Efface l'erreur de validation pour un champ spécifique.
     */
    const clearValidationError = useCallback((fieldName: string) => {
        setErrors((prevErrors) => {
            const newErrors = { ...prevErrors };
            delete newErrors[fieldName];
            return newErrors;
        });
    }, []);

    /**
     * Valide une date selon les options spécifiées
     */
    const validateDate = useCallback((date: Date | string | null | undefined, fieldName: string, context: DateValidationContext = {}): boolean => {
        // Par défaut, on efface toutes les erreurs précédentes pour ce champ
        clearValidationError(fieldName);

        const {
            required = true,
            allowPastDates = false,
            allowFutureDates = true,
            minDate,
            maxDate,
            disallowWeekends = false,
            holidays = []
        } = options;

        // Vérification si la date est requise
        if (required && (date === null || date === undefined || date === '')) {
            setError(fieldName, DateValidationErrorType.REQUIRED, 'Ce champ est obligatoire');
            return false;
        } else if (!required && (date === null || date === undefined || date === '')) {
            // Si la date n'est pas requise et qu'elle est vide, c'est valide
            return true;
        }

        // Normaliser la date
        const normalizedDate = normalizeDate(date);
        if (!normalizedDate) {
            setError(fieldName, DateValidationErrorType.INVALID_FORMAT, 'Format de date invalide');
            return false;
        }

        // Vérification des dates passées
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Minuit pour comparer uniquement les dates

        if (!allowPastDates && isBefore(normalizedDate, now)) {
            setError(fieldName, DateValidationErrorType.PAST_DATE, 'Les dates passées ne sont pas autorisées');
            return false;
        }

        // Vérification des dates futures
        if (!allowFutureDates && isAfter(normalizedDate, now)) {
            setError(fieldName, DateValidationErrorType.FUTURE_DATE, 'Les dates futures ne sont pas autorisées');
            return false;
        }

        // Vérification des week-ends
        if (disallowWeekends && isWeekend(normalizedDate)) {
            setError(fieldName, DateValidationErrorType.WEEKEND, 'Les week-ends ne sont pas autorisés');
            return false;
        }

        // Vérification des jours fériés
        if (holidays.length > 0 && isHoliday(normalizedDate, holidays)) {
            setError(fieldName, DateValidationErrorType.HOLIDAY, 'Les jours fériés ne sont pas autorisés');
            return false;
        }

        // Vérification des dates min/max
        if (minDate && isBefore(normalizedDate, minDate)) {
            setError(fieldName, DateValidationErrorType.INVALID_DATE, `La date doit être après le ${formatDate(minDate)}`);
            return false;
        }

        if (maxDate && isAfter(normalizedDate, maxDate)) {
            setError(fieldName, DateValidationErrorType.INVALID_DATE, `La date doit être avant le ${formatDate(maxDate)}`);
            return false;
        }

        // Vérification des périodes de blackout
        const { blackoutPeriods } = options;
        if (blackoutPeriods && blackoutPeriods.length > 0 && isInBlackoutPeriod(normalizedDate, blackoutPeriods)) {
            setError(fieldName, DateValidationErrorType.BLACKOUT_PERIOD, 'La date est dans une période non autorisée');
            return false;
        }

        // 🔐 CORRECTION TODO CRITIQUE : Ajouter la vérification minAdvanceNotice/maxAdvanceBooking
        const { minAdvanceNotice, maxAdvanceBooking } = options;

        if (minAdvanceNotice !== undefined && minAdvanceNotice > 0) {
            const advanceNoticeDays = differenceInDays(normalizedDate, now);
            if (advanceNoticeDays < minAdvanceNotice) {
                setError(fieldName, DateValidationErrorType.MIN_ADVANCE_NOTICE,
                    `Un préavis minimum de ${minAdvanceNotice} jour(s) est requis`);
                return false;
            }
        }

        if (maxAdvanceBooking !== undefined && maxAdvanceBooking > 0) {
            const advanceBookingDays = differenceInDays(normalizedDate, now);
            if (advanceBookingDays > maxAdvanceBooking) {
                setError(fieldName, DateValidationErrorType.MAX_ADVANCE_BOOKING,
                    `La réservation ne peut pas être faite plus de ${maxAdvanceBooking} jour(s) à l'avance`);
                return false;
            }
        }

        // 🔐 CORRECTION TODO CRITIQUE : Ajouter la vérification customValidation
        const { customValidation } = options;
        if (customValidation && typeof customValidation === 'function') {
            try {
                const customResult = customValidation(normalizedDate, context);
                if (customResult && !customResult.isValid) {
                    const errorType = customResult.errorType || DateValidationErrorType.OTHER;
                    const errorMessage = customResult.errorMessage || 'Validation personnalisée échouée';
                    setError(fieldName, errorType, errorMessage);
                    return false;
                }
            } catch (customError: unknown) {
                logger.error('Erreur dans la validation personnalisée:', customError);
                setError(fieldName, DateValidationErrorType.OTHER, 'Erreur lors de la validation personnalisée');
                return false;
            }
        }

        return true;
    }, [options, setError, clearValidationError]);

    /**
     * Valide une plage de dates
     */
    const validateDateRange = useCallback((
        startDate: Date | string | null | undefined,
        endDate: Date | string | null | undefined,
        startFieldName: string,
        endFieldName: string,
        context: DateValidationContext = {}
    ): boolean => {
        // Réinitialiser les erreurs pour les deux champs
        clearValidationError(startFieldName);
        clearValidationError(endFieldName);

        const {
            required = true,
            allowPastDates = false,
            disallowWeekends = false,
            minDuration,
            maxDuration,
            holidays = []
        } = options;

        // Valider les dates individuellement
        const isStartValid = validateDate(startDate, startFieldName, context);
        const isEndValid = validateDate(endDate, endFieldName, context);

        if (!isStartValid || !isEndValid) {
            return false;
        }

        // Normaliser les dates
        const normalizedStartDate = normalizeDate(startDate);
        const normalizedEndDate = normalizeDate(endDate);

        if (!normalizedStartDate || !normalizedEndDate) {
            return false;
        }

        // Vérifier que la date de début est avant la date de fin
        if (isAfter(normalizedStartDate, normalizedEndDate)) {
            setError(startFieldName, DateValidationErrorType.START_AFTER_END, 'La date de début doit être antérieure à la date de fin');
            return false;
        }

        // Vérifier la durée minimale
        if (minDuration !== undefined && minDuration > 0) {
            const durationDays = differenceInDays(normalizedEndDate, normalizedStartDate) + 1;
            if (durationDays < minDuration) {
                setError(endFieldName, DateValidationErrorType.MIN_DURATION, `La durée minimum requise est de ${minDuration} jour(s)`);
                return false;
            }
        }

        // Vérifier la durée maximale
        if (maxDuration !== undefined && maxDuration > 0) {
            const durationDays = differenceInDays(normalizedEndDate, normalizedStartDate) + 1;
            if (durationDays > maxDuration) {
                setError(endFieldName, DateValidationErrorType.MAX_DURATION, `La durée maximum autorisée est de ${maxDuration} jour(s)`);
                return false;
            }
        }

        return true;
    }, [options, validateDate, clearValidationError, setError]);

    /**
     * Vérifie si une nouvelle plage de dates chevauche des plages existantes.
     */
    const validateOverlap = useCallback((newRangeInput: DateRange | null | undefined, existingRanges: DateRange[] = [], fieldName: string): boolean => {
        clearValidationError(fieldName);
        const newRange = newRangeInput ? { start: normalizeDate(newRangeInput.start), end: normalizeDate(newRangeInput.end) } : null;

        if (!newRange || !newRange.start || !newRange.end) {
            // Cannot validate overlap if the new range is invalid
            return true; // Or false depending on desired behavior for invalid input
        }

        const overlaps = findOverlaps(newRange as DateRange, existingRanges);

        if (overlaps.length > 0) {
            const overlapDetails = overlaps.map(o => ({ start: formatDate(o.start), end: formatDate(o.end), label: o.label }));
            setError(fieldName, DateValidationErrorType.OVERLAP, `La période chevauche une ou plusieurs périodes existantes.`, overlapDetails);
            return false;
        }

        return true;
    }, [setError, clearValidationError, formatDate, normalizeDate, findOverlaps]);

    // Récupérer toutes les erreurs
    const getAllErrors = useCallback(() => {
        return errors;
    }, [errors]);

    // Effacer toutes les erreurs
    const clearAllValidationErrors = useCallback(() => {
        setErrors({});
    }, []);

    // Vérifier s'il y a des erreurs pour un champ spécifique
    const hasFieldError = useCallback((fieldName: string): boolean => {
        return !!errors[fieldName];
    }, [errors]);

    // Récupérer les erreurs pour un champ spécifique
    const getFieldErrors = useCallback((fieldName: string) => {
        return errors[fieldName];
    }, [errors]);

    // Vérifier s'il y a des erreurs d'un type spécifique
    const hasErrorType = useCallback((type: DateValidationErrorType): boolean => {
        return Object.values(errors).some(error => error.type === type);
    }, [errors]);

    return {
        validateDate,
        validateDateRange,
        validateOverlap,
        setError,
        clearError: clearValidationError,
        getAllErrors,
        clearAllValidationErrors,
        hasFieldError,
        getFieldErrors,
        hasErrorType,
        resetErrors: clearAllValidationErrors
    };
}