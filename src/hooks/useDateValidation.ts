import { useState, useCallback } from 'react';
import { format, isAfter, isBefore, isEqual, isWithinInterval, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

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
    INVALID_RANGE = 'invalid_range'
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
    holidays?: Date[];
    maxDuration?: number; // en jours
    minDuration?: number; // en jours
    format?: string;
}

/**
 * Interface pour les erreurs de validation de dates
 */
export interface DateValidationError {
    type: DateValidationErrorType;
    message: string;
}

/**
 * Interface pour un intervalle de dates
 */
export interface DateRange {
    start: Date;
    end: Date;
}

/**
 * Formate une date selon le format spécifié
 */
export function formatDate(date: Date, dateFormat: string = 'dd/MM/yyyy'): string {
    try {
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
    return !isNaN(parsedDate.getTime());
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
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = dimanche, 6 = samedi
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
 * Calcule la durée entre deux dates en jours
 */
export function calculateDurationInDays(startDate: Date, endDate: Date): number {
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((endDate.getTime() - startDate.getTime()) / millisecondsPerDay)) + 1;
}

/**
 * Hook pour la validation des dates
 */
export function useDateValidation() {
    const [errors, setErrors] = useState<Record<string, DateValidationError>>({});

    /**
     * Valide une date unique
     */
    const validateDate = useCallback((
        date: Date | string | null | undefined,
        fieldName: string,
        options: DateValidationOptions = {}
    ): boolean => {
        const newErrors = { ...errors };

        // Vérifier si le champ est requis
        if (options.required && (!date || (typeof date === 'string' && !date.trim()))) {
            newErrors[fieldName] = {
                type: DateValidationErrorType.REQUIRED,
                message: 'La date est requise'
            };
            setErrors(newErrors);
            return false;
        }

        // Si la date est vide et n'est pas requise, on considère que c'est valide
        if (!date) {
            delete newErrors[fieldName];
            setErrors(newErrors);
            return true;
        }

        // Convertir la chaîne en Date si nécessaire
        let dateObj: Date;
        if (typeof date === 'string') {
            try {
                dateObj = parseISO(date);
                if (isNaN(dateObj.getTime())) {
                    newErrors[fieldName] = {
                        type: DateValidationErrorType.INVALID_FORMAT,
                        message: 'Le format de la date est invalide'
                    };
                    setErrors(newErrors);
                    return false;
                }
            } catch (error) {
                newErrors[fieldName] = {
                    type: DateValidationErrorType.INVALID_FORMAT,
                    message: 'Le format de la date est invalide'
                };
                setErrors(newErrors);
                return false;
            }
        } else {
            dateObj = date;
        }

        // Vérifier si la date est dans le passé
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!options.allowPastDates && isBefore(dateObj, today)) {
            newErrors[fieldName] = {
                type: DateValidationErrorType.PAST_DATE,
                message: 'La date ne peut pas être dans le passé'
            };
            setErrors(newErrors);
            return false;
        }

        // Vérifier si la date est dans le futur
        if (!options.allowFutureDates && isAfter(dateObj, today)) {
            newErrors[fieldName] = {
                type: DateValidationErrorType.FUTURE_DATE,
                message: 'La date ne peut pas être dans le futur'
            };
            setErrors(newErrors);
            return false;
        }

        // Vérifier les dates min et max
        if (options.minDate && isBefore(dateObj, options.minDate)) {
            const formattedMinDate = formatDate(options.minDate, options.format);
            newErrors[fieldName] = {
                type: DateValidationErrorType.INVALID_RANGE,
                message: `La date doit être après le ${formattedMinDate}`
            };
            setErrors(newErrors);
            return false;
        }

        if (options.maxDate && isAfter(dateObj, options.maxDate)) {
            const formattedMaxDate = formatDate(options.maxDate, options.format);
            newErrors[fieldName] = {
                type: DateValidationErrorType.INVALID_RANGE,
                message: `La date doit être avant le ${formattedMaxDate}`
            };
            setErrors(newErrors);
            return false;
        }

        // Vérifier si la date est un week-end
        if (options.disallowWeekends && isWeekend(dateObj)) {
            newErrors[fieldName] = {
                type: DateValidationErrorType.WEEKEND,
                message: 'Les dates de week-end ne sont pas autorisées'
            };
            setErrors(newErrors);
            return false;
        }

        // Vérifier si la date est un jour férié
        if (options.holidays && options.holidays.length > 0 && isHoliday(dateObj, options.holidays)) {
            newErrors[fieldName] = {
                type: DateValidationErrorType.HOLIDAY,
                message: 'Les jours fériés ne sont pas autorisés'
            };
            setErrors(newErrors);
            return false;
        }

        // Si tout est valide, supprimer les erreurs pour ce champ
        delete newErrors[fieldName];
        setErrors(newErrors);
        return true;
    }, [errors]);

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
        const newErrors = { ...errors };

        // Vérifier d'abord individuellement les dates
        const startValid = validateDate(startDate, startFieldName, options);
        const endValid = validateDate(endDate, endFieldName, options);

        // Si l'une des dates n'est pas valide, arrêter là
        if (!startValid || !endValid) {
            return false;
        }

        // Si les deux dates sont vides et ne sont pas requises, c'est valide
        if (!startDate && !endDate && !options.required) {
            return true;
        }

        // Convertir les dates en objets Date si nécessaire
        let startDateObj: Date;
        let endDateObj: Date;

        if (typeof startDate === 'string') {
            startDateObj = parseISO(startDate);
        } else {
            startDateObj = startDate as Date;
        }

        if (typeof endDate === 'string') {
            endDateObj = parseISO(endDate);
        } else {
            endDateObj = endDate as Date;
        }

        // Vérifier que la date de début est avant la date de fin
        if (isAfter(startDateObj, endDateObj)) {
            newErrors[startFieldName] = {
                type: DateValidationErrorType.START_AFTER_END,
                message: 'La date de début doit être avant la date de fin'
            };
            newErrors[endFieldName] = {
                type: DateValidationErrorType.START_AFTER_END,
                message: 'La date de fin doit être après la date de début'
            };
            setErrors(newErrors);
            return false;
        }

        // Vérifier la durée minimale
        if (options.minDuration) {
            const duration = calculateDurationInDays(startDateObj, endDateObj);
            if (duration < options.minDuration) {
                newErrors[endFieldName] = {
                    type: DateValidationErrorType.MIN_DURATION,
                    message: `La durée minimale est de ${options.minDuration} jours`
                };
                setErrors(newErrors);
                return false;
            }
        }

        // Vérifier la durée maximale
        if (options.maxDuration) {
            const duration = calculateDurationInDays(startDateObj, endDateObj);
            if (duration > options.maxDuration) {
                newErrors[endFieldName] = {
                    type: DateValidationErrorType.MAX_DURATION,
                    message: `La durée maximale est de ${options.maxDuration} jours`
                };
                setErrors(newErrors);
                return false;
            }
        }

        // Si tout est valide, supprimer les erreurs pour ces champs
        delete newErrors[startFieldName];
        delete newErrors[endFieldName];
        setErrors(newErrors);
        return true;
    }, [errors, validateDate]);

    /**
     * Vérifie si une nouvelle plage de dates chevauche des plages existantes
     */
    const validateOverlap = useCallback((
        newRange: DateRange,
        existingRanges: DateRange[],
        fieldName: string
    ): boolean => {
        const newErrors = { ...errors };

        // Vérifier les chevauchements avec les plages existantes
        const overlap = existingRanges.some(range => datesOverlap(newRange, range));

        if (overlap) {
            newErrors[fieldName] = {
                type: DateValidationErrorType.OVERLAPPING,
                message: 'Cette période chevauche une période existante'
            };
            setErrors(newErrors);
            return false;
        }

        // Si tout est valide, supprimer les erreurs pour ce champ
        delete newErrors[fieldName];
        setErrors(newErrors);
        return true;
    }, [errors]);

    /**
     * Obtient le message d'erreur pour un champ
     */
    const getErrorMessage = useCallback((fieldName: string): string | null => {
        return errors[fieldName]?.message || null;
    }, [errors]);

    /**
     * Vérifie si un champ a une erreur
     */
    const hasError = useCallback((fieldName: string): boolean => {
        return !!errors[fieldName];
    }, [errors]);

    /**
     * Réinitialise toutes les erreurs
     */
    const resetErrors = useCallback(() => {
        setErrors({});
    }, []);

    return {
        errors,
        validateDate,
        validateDateRange,
        validateOverlap,
        getErrorMessage,
        hasError,
        resetErrors
    };
} 