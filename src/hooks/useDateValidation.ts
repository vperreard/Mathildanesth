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
    isValid as isValidDate
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
    INVALID_BUSINESS_DAYS = 'invalid_business_days'
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
    return countBusinessDays(startDate, endDate, holidays);
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
    isInBlackout: boolean,
    affectedPeriods: DateRange[]
} {
    const affectedPeriods = blackoutPeriods.filter(period => datesOverlap(range, period));
    return {
        isInBlackout: affectedPeriods.length > 0,
        affectedPeriods
    };
}

/**
 * Hook pour la validation des dates
 */
export function useDateValidation() {
    const [errors, setErrors] = useState<Record<string, DateValidationError>>({});
    const [validationContext, setValidationContext] = useState<ValidationContext>({});
    const { setError, clearError, clearAllErrors } = useErrorHandler();

    /**
     * Messages d'erreur par type d'erreur
     */
    const errorMessages = {
        [DateValidationErrorType.REQUIRED]: 'Ce champ est obligatoire',
        [DateValidationErrorType.PAST_DATE]: 'Les dates passées ne sont pas autorisées',
        [DateValidationErrorType.FUTURE_DATE]: 'Les dates futures ne sont pas autorisées',
        [DateValidationErrorType.INVALID_FORMAT]: 'Format de date invalide',
        [DateValidationErrorType.START_AFTER_END]: 'La date de début doit être antérieure à la date de fin',
        [DateValidationErrorType.OVERLAPPING]: 'Cette période chevauche une période existante',
        [DateValidationErrorType.WEEKEND]: 'Les week-ends ne sont pas autorisés',
        [DateValidationErrorType.HOLIDAY]: 'Les jours fériés ne sont pas autorisés',
        [DateValidationErrorType.MAX_DURATION]: 'La durée maximum autorisée est dépassée',
        [DateValidationErrorType.MIN_DURATION]: 'La durée minimum requise n\'est pas atteinte',
        [DateValidationErrorType.INVALID_RANGE]: 'Plage de dates invalide',
        [DateValidationErrorType.MIN_ADVANCE_NOTICE]: 'Le délai minimum de préavis n\'est pas respecté',
        [DateValidationErrorType.MAX_ADVANCE_BOOKING]: 'Le délai maximum de réservation à l\'avance est dépassé',
        [DateValidationErrorType.BLACKOUT_PERIOD]: 'Cette période n\'est pas disponible',
        [DateValidationErrorType.EXCEEDS_AVAILABLE_DAYS]: 'Vous avez dépassé votre quota de jours disponibles',
        [DateValidationErrorType.INVALID_BUSINESS_DAYS]: 'Seuls les jours ouvrables sont autorisés'
    };

    /**
     * Sévérité des erreurs pour le système d'erreurs global
     */
    const errorSeverity: Record<DateValidationErrorType, ErrorSeverity> = {
        [DateValidationErrorType.REQUIRED]: 'warning',
        [DateValidationErrorType.PAST_DATE]: 'warning',
        [DateValidationErrorType.FUTURE_DATE]: 'warning',
        [DateValidationErrorType.INVALID_FORMAT]: 'error',
        [DateValidationErrorType.START_AFTER_END]: 'error',
        [DateValidationErrorType.OVERLAPPING]: 'error',
        [DateValidationErrorType.WEEKEND]: 'warning',
        [DateValidationErrorType.HOLIDAY]: 'warning',
        [DateValidationErrorType.MAX_DURATION]: 'warning',
        [DateValidationErrorType.MIN_DURATION]: 'warning',
        [DateValidationErrorType.INVALID_RANGE]: 'error',
        [DateValidationErrorType.MIN_ADVANCE_NOTICE]: 'warning',
        [DateValidationErrorType.MAX_ADVANCE_BOOKING]: 'warning',
        [DateValidationErrorType.BLACKOUT_PERIOD]: 'error',
        [DateValidationErrorType.EXCEEDS_AVAILABLE_DAYS]: 'error',
        [DateValidationErrorType.INVALID_BUSINESS_DAYS]: 'warning'
    };

    /**
     * Valide une date unique
     */
    const validateDate = useCallback((
        date: Date | string | null | undefined,
        fieldName: string,
        options: DateValidationOptions = {}
    ): boolean => {
        const newErrors = { ...errors };
        const context: ValidationContext = {};

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
            setValidationContext({ ...validationContext, ...context });
            return true;
        }

        // Normaliser la date
        const dateObj = normalizeDate(date);
        if (!dateObj) {
            newErrors[fieldName] = {
                type: DateValidationErrorType.INVALID_FORMAT,
                message: 'Le format de la date est invalide'
            };
            setErrors(newErrors);
            return false;
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

        // Vérifier le délai minimum d'avertissement
        if (options.minAdvanceNotice && options.minAdvanceNotice > 0) {
            const minDate = addDays(today, options.minAdvanceNotice);
            if (isBefore(dateObj, minDate)) {
                const formattedMinDate = formatDate(minDate, options.format);
                newErrors[fieldName] = {
                    type: DateValidationErrorType.MIN_ADVANCE_NOTICE,
                    message: `La réservation doit être effectuée au moins ${options.minAdvanceNotice} jours à l'avance (à partir du ${formattedMinDate})`,
                    details: { minDate, daysNotice: options.minAdvanceNotice }
                };
                setErrors(newErrors);
                return false;
            }
        }

        // Vérifier le délai maximum de réservation à l'avance
        if (options.maxAdvanceBooking && options.maxAdvanceBooking > 0) {
            const maxDate = addDays(today, options.maxAdvanceBooking);
            if (isAfter(dateObj, maxDate)) {
                const formattedMaxDate = formatDate(maxDate, options.format);
                newErrors[fieldName] = {
                    type: DateValidationErrorType.MAX_ADVANCE_BOOKING,
                    message: `La réservation ne peut pas être effectuée plus de ${options.maxAdvanceBooking} jours à l'avance (jusqu'au ${formattedMaxDate})`,
                    details: { maxDate, daysAdvance: options.maxAdvanceBooking }
                };
                setErrors(newErrors);
                return false;
            }
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

        // Vérifier si la date est un jour ouvrable
        if (options.onlyBusinessDays && !isBusinessDay(dateObj, options.holidays)) {
            newErrors[fieldName] = {
                type: DateValidationErrorType.INVALID_BUSINESS_DAYS,
                message: 'Seuls les jours ouvrables sont autorisés'
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

        // Vérifier si la date est dans une période blackout
        if (options.blackoutPeriods && options.blackoutPeriods.length > 0) {
            if (isInBlackoutPeriod(dateObj, options.blackoutPeriods)) {
                const conflictingPeriods = options.blackoutPeriods.filter(period =>
                    isWithinInterval(dateObj, { start: period.start, end: period.end }) ||
                    isEqual(dateObj, period.start) ||
                    isEqual(dateObj, period.end)
                );

                newErrors[fieldName] = {
                    type: DateValidationErrorType.BLACKOUT_PERIOD,
                    message: 'Cette date n\'est pas disponible (période bloquée)',
                    details: { conflictingPeriods }
                };
                setErrors(newErrors);
                return false;
            }
        }

        // Si tout est valide, supprimer les erreurs pour ce champ
        delete newErrors[fieldName];
        setErrors(newErrors);
        setValidationContext({ ...validationContext, ...context });
        return true;
    }, [errors, validationContext]);

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
        const context: ValidationContext = {};

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

        // Normaliser les dates
        const startDateObj = normalizeDate(startDate);
        const endDateObj = normalizeDate(endDate);

        // Si l'une des dates est null après normalisation, c'est une erreur
        if (!startDateObj || !endDateObj) {
            if (!startDateObj) {
                newErrors[startFieldName] = {
                    type: DateValidationErrorType.INVALID_FORMAT,
                    message: 'Le format de la date de début est invalide'
                };
            }
            if (!endDateObj) {
                newErrors[endFieldName] = {
                    type: DateValidationErrorType.INVALID_FORMAT,
                    message: 'Le format de la date de fin est invalide'
                };
            }
            setErrors(newErrors);
            return false;
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

        // Calculer la durée totale et la durée en jours ouvrables
        const totalDuration = calculateDurationInDays(startDateObj, endDateObj);
        context.totalDaysCount = totalDuration;

        if (options.businessDaysOnly && options.holidays) {
            context.businessDaysCount = calculateBusinessDays(startDateObj, endDateObj, options.holidays);
        }

        // Vérifier si toute la plage est dans une période blackout
        if (options.blackoutPeriods && options.blackoutPeriods.length > 0) {
            const range: DateRange = { start: startDateObj, end: endDateObj };
            const blackoutCheck = isRangeInBlackoutPeriod(range, options.blackoutPeriods);

            if (blackoutCheck.isInBlackout) {
                context.conflicts = blackoutCheck.affectedPeriods;

                newErrors[endFieldName] = {
                    type: DateValidationErrorType.BLACKOUT_PERIOD,
                    message: 'Cette période chevauche une ou plusieurs périodes bloquées',
                    details: { conflictingPeriods: blackoutCheck.affectedPeriods }
                };
                setErrors(newErrors);
                setValidationContext({ ...validationContext, ...context });
                return false;
            }
        }

        // Vérifier la durée minimale
        if (options.minDuration) {
            const durationToCheck = options.businessDaysOnly && context.businessDaysCount !== undefined
                ? context.businessDaysCount
                : totalDuration;

            if (durationToCheck < options.minDuration) {
                const message = options.businessDaysOnly
                    ? `La durée minimale est de ${options.minDuration} jours ouvrables`
                    : `La durée minimale est de ${options.minDuration} jours`;

                newErrors[endFieldName] = {
                    type: DateValidationErrorType.MIN_DURATION,
                    message,
                    details: {
                        minDuration: options.minDuration,
                        actualDuration: durationToCheck,
                        businessDaysOnly: options.businessDaysOnly
                    }
                };
                setErrors(newErrors);
                setValidationContext({ ...validationContext, ...context });
                return false;
            }
        }

        // Vérifier la durée maximale
        if (options.maxDuration) {
            const durationToCheck = options.businessDaysOnly && context.businessDaysCount !== undefined
                ? context.businessDaysCount
                : totalDuration;

            if (durationToCheck > options.maxDuration) {
                const message = options.businessDaysOnly
                    ? `La durée maximale est de ${options.maxDuration} jours ouvrables`
                    : `La durée maximale est de ${options.maxDuration} jours`;

                newErrors[endFieldName] = {
                    type: DateValidationErrorType.MAX_DURATION,
                    message,
                    details: {
                        maxDuration: options.maxDuration,
                        actualDuration: durationToCheck,
                        businessDaysOnly: options.businessDaysOnly
                    }
                };
                setErrors(newErrors);
                setValidationContext({ ...validationContext, ...context });
                return false;
            }
        }

        // Vérifier le nombre de jours disponibles
        if (options.availableDaysPerYear !== undefined && context.totalDaysCount !== undefined) {
            // Si on a un nombre de jours disponibles par an
            if (options.availableDaysPerYear > 0) {
                const durationToCheck = options.businessDaysOnly && context.businessDaysCount !== undefined
                    ? context.businessDaysCount
                    : context.totalDaysCount;

                // On vérifie si on a des informations sur les jours déjà utilisés
                const usedDays = validationContext.usedDays || 0;
                const remainingDays = options.availableDaysPerYear - usedDays;

                context.usedDays = usedDays;
                context.remainingDays = remainingDays;

                if (durationToCheck > remainingDays) {
                    const message = options.businessDaysOnly
                        ? `Vous avez dépassé le nombre de jours ouvrables disponibles (${remainingDays} jours restants)`
                        : `Vous avez dépassé le nombre de jours disponibles (${remainingDays} jours restants)`;

                    newErrors[endFieldName] = {
                        type: DateValidationErrorType.EXCEEDS_AVAILABLE_DAYS,
                        message,
                        details: {
                            remainingDays,
                            requestedDays: durationToCheck,
                            businessDaysOnly: options.businessDaysOnly
                        }
                    };
                    setErrors(newErrors);
                    setValidationContext({ ...validationContext, ...context });
                    return false;
                }
            }
        }

        // Si tout est valide, supprimer les erreurs pour ces champs
        delete newErrors[startFieldName];
        delete newErrors[endFieldName];
        setErrors(newErrors);
        setValidationContext({ ...validationContext, ...context });
        return true;
    }, [errors, validationContext, validateDate]);

    /**
     * Vérifie si une nouvelle plage de dates chevauche des plages existantes
     */
    const validateOverlap = useCallback((
        newRange: DateRange,
        existingRanges: DateRange[],
        fieldName: string
    ): boolean => {
        const newErrors = { ...errors };
        const context: ValidationContext = {};

        // Vérifier les chevauchements avec les plages existantes
        const overlappingRanges = findOverlaps(newRange, existingRanges);
        context.conflicts = overlappingRanges;

        if (overlappingRanges.length > 0) {
            const conflictLabels = overlappingRanges
                .map(range => range.label || formatDate(range.start) + ' - ' + formatDate(range.end))
                .join(', ');

            newErrors[fieldName] = {
                type: DateValidationErrorType.OVERLAPPING,
                message: `Cette période chevauche une ou plusieurs périodes existantes: ${conflictLabels}`,
                details: { overlappingRanges }
            };
            setErrors(newErrors);
            setValidationContext({ ...validationContext, ...context });
            return false;
        }

        // Si tout est valide, supprimer les erreurs pour ce champ
        delete newErrors[fieldName];
        setErrors(newErrors);
        setValidationContext({ ...validationContext, ...context });
        return true;
    }, [errors, validationContext]);

    /**
     * Définit le contexte de validation (comme les jours déjà utilisés)
     */
    const setContext = useCallback((context: Partial<ValidationContext>) => {
        setValidationContext(prevContext => ({
            ...prevContext,
            ...context
        }));
    }, []);

    /**
     * Obtient le message d'erreur pour un champ
     */
    const getErrorMessage = useCallback((fieldName: string): string | null => {
        return errors[fieldName]?.message || null;
    }, [errors]);

    /**
     * Obtient les détails de l'erreur pour un champ
     */
    const getErrorDetails = useCallback((fieldName: string): any => {
        return errors[fieldName]?.details || null;
    }, [errors]);

    /**
     * Obtient le type d'erreur pour un champ
     */
    const getErrorType = useCallback((fieldName: string): DateValidationErrorType | null => {
        return errors[fieldName]?.type || null;
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
        clearAllErrors();
    }, [clearAllErrors]);

    /**
     * Réinitialise le contexte de validation
     */
    const resetContext = useCallback(() => {
        setValidationContext({});
    }, []);

    /**
     * Réinitialise tout (erreurs et contexte)
     */
    const resetAll = useCallback(() => {
        resetErrors();
        resetContext();
    }, [resetErrors, resetContext]);

    /**
     * Valide une demande de congés
     * @param start Date de début des congés
     * @param end Date de fin des congés
     * @param userId ID de l'utilisateur
     * @param options Options de validation
     * @returns {boolean} Indique si la demande est valide
     */
    const validateLeaveRequest = useCallback((
        start: Date | string | null | undefined,
        end: Date | string | null | undefined,
        userId: string,
        options: DateValidationOptions = {}
    ): boolean => {
        const newErrors = { ...errors };
        const context: ValidationContext = {};
        const startFieldName = `leave_start_${userId}`;
        const endFieldName = `leave_end_${userId}`;

        // Configuration par défaut pour les congés
        const leaveOptions = {
            required: true,
            allowPastDates: false,
            minAdvanceNotice: 3, // 3 jours d'avance minimum
            disallowWeekends: false, // On peut prendre des congés le weekend
            ...options
        };

        // Valider la plage de dates
        const rangeValid = validateDateRange(
            start,
            end,
            startFieldName,
            endFieldName,
            leaveOptions
        );

        if (!rangeValid) {
            return false;
        }

        // Normaliser les dates
        const startDateObj = normalizeDate(start);
        const endDateObj = normalizeDate(end);

        if (!startDateObj || !endDateObj) {
            return false;
        }

        // Vérifier les quotas de congés disponibles si spécifié
        if (leaveOptions.availableDaysPerYear && validationContext.usedDays !== undefined) {
            const duration = leaveOptions.businessDaysOnly
                ? calculateBusinessDays(startDateObj, endDateObj, leaveOptions.holidays)
                : calculateDurationInDays(startDateObj, endDateObj);

            const totalUsed = validationContext.usedDays + duration;
            const remaining = leaveOptions.availableDaysPerYear - validationContext.usedDays;

            context.totalDaysCount = duration;
            context.usedDays = validationContext.usedDays;
            context.remainingDays = remaining - duration;

            if (totalUsed > leaveOptions.availableDaysPerYear) {
                newErrors[endFieldName] = {
                    type: DateValidationErrorType.EXCEEDS_AVAILABLE_DAYS,
                    message: `Cette demande dépasse votre quota de congés disponibles (${remaining} jours restants)`,
                    details: {
                        requested: duration,
                        available: remaining,
                        total: leaveOptions.availableDaysPerYear
                    }
                };
                setErrors(newErrors);
                setValidationContext({ ...validationContext, ...context });
                return false;
            }
        }

        // Si tout est valide
        setValidationContext({ ...validationContext, ...context });
        return true;
    }, [errors, validationContext, validateDateRange]);

    /**
     * Valide une affectation de garde
     * @param date Date de la garde
     * @param shift Créneau de la garde (matin, apresmidi, nuit, etc.)
     * @param userId ID de l'utilisateur
     * @param options Options de validation
     * @returns {boolean} Indique si l'affectation est valide
     */
    const validateShiftAssignment = useCallback((
        date: Date | string | null | undefined,
        shift: string,
        userId: string,
        options: DateValidationOptions = {}
    ): boolean => {
        const fieldName = `shift_${shift}_${userId}`;
        const newErrors = { ...errors };

        // Configuration par défaut pour les gardes
        const shiftOptions = {
            required: true,
            allowPastDates: false,
            onlyBusinessDays: false, // Les gardes peuvent être le weekend
            minAdvanceNotice: 1, // 1 jour d'avance minimum
            ...options
        };

        // Valider la date de garde
        const dateValid = validateDate(date, fieldName, shiftOptions);
        if (!dateValid) {
            return false;
        }

        // Normaliser la date
        const dateObj = normalizeDate(date);
        if (!dateObj) {
            return false;
        }

        // Règle spécifique: pas de garde dans les 24h après une garde précédente
        if (options.blackoutPeriods && options.blackoutPeriods.length > 0) {
            // Vérifier si la date est dans une période de repos obligatoire (24h après une garde)
            if (isInBlackoutPeriod(dateObj, options.blackoutPeriods)) {
                const recentShifts = options.blackoutPeriods.filter(period =>
                    period.type === 'rest_period' &&
                    isInBlackoutPeriod(dateObj, [period])
                );

                if (recentShifts.length > 0) {
                    newErrors[fieldName] = {
                        type: DateValidationErrorType.BLACKOUT_PERIOD,
                        message: 'Une période de repos de 24h est obligatoire après une garde',
                        details: { recentShifts }
                    };
                    setErrors(newErrors);
                    return false;
                }
            }
        }

        // Si tout est valide
        delete newErrors[fieldName];
        setErrors(newErrors);
        return true;
    }, [errors, validateDate]);

    /**
     * Détecte les conflits pour un utilisateur à une date donnée
     * @param userId ID de l'utilisateur
     * @param date Date à vérifier
     * @param type Type d'événement (congés, garde, etc.)
     * @param existingEvents Événements existants à vérifier
     * @returns {boolean} true s'il n'y a pas de conflit, false sinon
     */
    const detectConflicts = useCallback((
        userId: string,
        date: Date | string | null | undefined,
        type: string,
        existingEvents: DateRange[]
    ): boolean => {
        const fieldName = `conflict_${type}_${userId}`;
        const newErrors = { ...errors };
        const context: ValidationContext = {};

        // Normaliser la date
        const dateObj = normalizeDate(date);
        if (!dateObj) {
            newErrors[fieldName] = {
                type: DateValidationErrorType.INVALID_FORMAT,
                message: 'Le format de la date est invalide'
            };
            setErrors(newErrors);
            return false;
        }

        // Créer une plage pour ce jour
        const range: DateRange = {
            start: dateObj,
            end: dateObj,
            type
        };

        // Filtrer les événements pour cet utilisateur
        const userEvents = existingEvents.filter(event =>
            event.label?.includes(userId) ||
            event.type?.includes(userId)
        );

        // Trouver les conflits
        const conflicts = findOverlaps(range, userEvents);

        if (conflicts.length > 0) {
            context.conflicts = conflicts;

            newErrors[fieldName] = {
                type: DateValidationErrorType.OVERLAPPING,
                message: `Il y a ${conflicts.length} conflit(s) pour cette date`,
                details: { conflicts }
            };
            setErrors(newErrors);
            setValidationContext({ ...validationContext, ...context });
            return false;
        }

        // Si tout est valide
        delete newErrors[fieldName];
        setErrors(newErrors);
        setValidationContext({ ...validationContext, ...context });
        return true;
    }, [errors, validationContext]);

    const contextValue = useMemo(() => ({
        ...validationContext
    }), [validationContext]);

    return {
        errors,
        validateDate,
        validateDateRange,
        validateOverlap,
        getErrorMessage,
        getErrorDetails,
        getErrorType,
        hasError,
        resetErrors,
        context: contextValue,
        setContext,
        resetContext,
        resetAll,
        validateLeaveRequest,
        validateShiftAssignment,
        detectConflicts
    };
} 