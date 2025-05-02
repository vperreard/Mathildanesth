import { useState, useCallback, useMemo } from 'react';
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
import { useErrorHandler, ErrorSeverity } from './useErrorHandler';

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
    details?: any; // informations supplémentaires sur l'erreur
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
    [key: string]: any;
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
    } catch (error) {
        console.error('Erreur lors du formatage de la date:', error);
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
 * Hook pour la validation des dates
 */
export function useDateValidation() {
    const [errors, setErrors] = useState<Array<{ type: DateValidationErrorType, message: string, field: string }>>([]);
    const { setError, clearError, clearAllErrors } = useErrorHandler();

    /**
     * Ajoute une erreur à la liste en évitant les doublons
     */
    const addError = useCallback((field: string, type: DateValidationErrorType, message: string) => {
        setErrors(prev => {
            // Vérifier si l'erreur existe déjà pour ce champ et ce type
            const existingErrorIndex = prev.findIndex(e => e.field === field && e.type === type);

            // Si l'erreur existe déjà, on ne l'ajoute pas à nouveau
            if (existingErrorIndex >= 0) {
                return prev;
            }

            // Sinon, on ajoute la nouvelle erreur
            return [...prev, { field, type, message }];
        });
    }, []);

    /**
     * Efface les erreurs pour un champ spécifique
     */
    const clearFieldErrors = useCallback((field: string) => {
        setErrors(prev => prev.filter(error => error.field !== field));
    }, []);

    /**
     * Valide une date selon les options spécifiées
     */
    const validateDate = useCallback((date: Date | string | null | undefined, field: string, options: DateValidationOptions = {}) => {
        // Par défaut, on efface toutes les erreurs précédentes pour ce champ
        clearFieldErrors(field);

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
            addError(field, DateValidationErrorType.REQUIRED, 'Ce champ est obligatoire');
            return false;
        } else if (!required && (date === null || date === undefined || date === '')) {
            // Si la date n'est pas requise et qu'elle est vide, c'est valide
            return true;
        }

        // Normaliser la date
        const normalizedDate = normalizeDate(date);
        if (!normalizedDate) {
            addError(field, DateValidationErrorType.INVALID_FORMAT, 'Format de date invalide');
            return false;
        }

        // Vérification des dates passées
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Minuit pour comparer uniquement les dates

        if (!allowPastDates && isBefore(normalizedDate, now)) {
            addError(field, DateValidationErrorType.PAST_DATE, 'Les dates passées ne sont pas autorisées');
            return false;
        }

        // Vérification des dates futures
        if (!allowFutureDates && isAfter(normalizedDate, now)) {
            addError(field, DateValidationErrorType.FUTURE_DATE, 'Les dates futures ne sont pas autorisées');
            return false;
        }

        // Vérification des week-ends
        if (disallowWeekends && isWeekend(normalizedDate)) {
            addError(field, DateValidationErrorType.WEEKEND, 'Les week-ends ne sont pas autorisés');
            return false;
        }

        // Vérification des jours fériés
        if (holidays.length > 0 && isHoliday(normalizedDate, holidays)) {
            addError(field, DateValidationErrorType.HOLIDAY, 'Les jours fériés ne sont pas autorisés');
            return false;
        }

        // Vérification des dates min/max
        if (minDate && isBefore(normalizedDate, minDate)) {
            addError(field, DateValidationErrorType.INVALID_DATE, `La date doit être après le ${formatDate(minDate)}`);
            return false;
        }

        if (maxDate && isAfter(normalizedDate, maxDate)) {
            addError(field, DateValidationErrorType.INVALID_DATE, `La date doit être avant le ${formatDate(maxDate)}`);
            return false;
        }

        return true;
    }, [addError, clearFieldErrors]);

    /**
     * Valide une plage de dates
     */
    const validateDateRange = useCallback((
        startDate: Date | string | null | undefined,
        endDate: Date | string | null | undefined,
        startFieldName: string,
        endFieldName: string,
        options: DateValidationOptions = {}
    ): boolean => {
        // Réinitialiser les erreurs pour les deux champs
        clearFieldErrors(startFieldName);
        clearFieldErrors(endFieldName);

        const {
            required = true,
            allowPastDates = false,
            disallowWeekends = false,
            minDuration,
            maxDuration,
            holidays = []
        } = options;

        // Valider les dates individuellement
        const isStartValid = validateDate(startDate, startFieldName, {
            required,
            allowPastDates,
            disallowWeekends,
            holidays
        });

        const isEndValid = validateDate(endDate, endFieldName, {
            required,
            allowPastDates,
            disallowWeekends,
            holidays
        });

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
            addError(startFieldName, DateValidationErrorType.START_AFTER_END, 'La date de début doit être antérieure à la date de fin');
            return false;
        }

        // Vérifier la durée minimale
        if (minDuration !== undefined && minDuration > 0) {
            const durationDays = differenceInDays(normalizedEndDate, normalizedStartDate) + 1;
            if (durationDays < minDuration) {
                addError(endFieldName, DateValidationErrorType.MIN_DURATION, `La durée minimum requise est de ${minDuration} jour(s)`);
                return false;
            }
        }

        // Vérifier la durée maximale
        if (maxDuration !== undefined && maxDuration > 0) {
            const durationDays = differenceInDays(normalizedEndDate, normalizedStartDate) + 1;
            if (durationDays > maxDuration) {
                addError(endFieldName, DateValidationErrorType.MAX_DURATION, `La durée maximum autorisée est de ${maxDuration} jour(s)`);
                return false;
            }
        }

        return true;
    }, [validateDate, clearFieldErrors, addError]);

    // Récupérer toutes les erreurs
    const getAllErrors = useCallback(() => {
        return errors;
    }, [errors]);

    // Effacer toutes les erreurs
    const clearAllValidationErrors = useCallback(() => {
        setErrors([]);
    }, []);

    // Vérifier s'il y a des erreurs pour un champ spécifique
    const hasFieldError = useCallback((fieldName: string): boolean => {
        return errors.some(error => error.field === fieldName);
    }, [errors]);

    // Récupérer les erreurs pour un champ spécifique
    const getFieldErrors = useCallback((fieldName: string) => {
        return errors.filter(error => error.field === fieldName);
    }, [errors]);

    // Vérifier s'il y a des erreurs d'un type spécifique
    const hasErrorType = useCallback((type: DateValidationErrorType): boolean => {
        return errors.some(error => error.type === type);
    }, [errors]);

    return {
        errors,
        validateDate,
        validateDateRange,
        getAllErrors,
        clearAllValidationErrors,
        hasFieldError,
        getFieldErrors,
        hasErrorType
    };
} 