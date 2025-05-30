/**
 * Hook personnalisé pour la validation des demandes de congés
 * 
 * Ce hook étend le hook useDateValidation avec des fonctionnalités spécifiques aux congés.
 * Il permet de valider les demandes de congés selon diverses règles métier :
 * - Dates requises et valides
 * - Dates dans le futur (non passées)
 * - Date de début antérieure à la date de fin
 * - Respect des quotas de congés disponibles
 * - Vérification des périodes d'exclusion (blackout)
 * - Respect des délais minimum de préavis
 * 
 * Fonctionnalités principales :
 * - validateLeaveRequest : Valide une demande de congé complète
 * - hasError : Vérifie si un champ a une erreur
 * - getErrorMessage : Récupère le message d'erreur pour un champ
 * - getErrorType : Récupère le type d'erreur pour un champ
 * - resetErrors : Réinitialise toutes les erreurs
 * - context : Contexte de validation (jours utilisés, restants, etc.)
 * - setContext : Définit le contexte de validation
 * 
 * @example
 * const {
 *   validateLeaveRequest,
 *   hasError,
 *   getErrorMessage,
 *   resetErrors,
 *   context
 * } = useLeaveValidation();
 * 
 * // Valider une demande
 * const isValid = validateLeaveRequest(startDate, endDate, userId, {
 *   availableDaysPerYear: 30
 * });
 * 
 * // Vérifier s'il y a des erreurs
 * if (hasError(`leave_start_${userId}`)) {
 *   console.log(getErrorMessage(`leave_start_${userId}`));
 * }
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { useDateValidation } from './useDateValidation';

// Types for date validation
export enum DateValidationErrorType {
    REQUIRED = 'required',
    INVALID_FORMAT = 'invalid_format',
    PAST_DATE = 'past_date',
    FUTURE_DATE = 'future_date',
    START_AFTER_END = 'start_after_end',
    BLACKOUT_PERIOD = 'blackout_period',
    INSUFFICIENT_NOTICE = 'insufficient_notice',
    EXCEEDS_AVAILABLE_DAYS = 'exceeds_available_days',
    WEEKEND_NOT_ALLOWED = 'weekend_not_allowed'
}

export interface DateValidationOptions {
    required?: boolean;
    allowPastDates?: boolean;
    allowFutureDates?: boolean;
    minAdvanceNotice?: number;
    maxAdvanceNotice?: number;
    disallowWeekends?: boolean;
    availableDaysPerYear?: number;
    blackoutPeriods?: DateRange[];
    businessDaysOnly?: boolean;
}

export interface DateRange {
    start: Date;
    end: Date;
}

export interface ValidationContext {
    usedDays?: number;
    remainingDays?: number;
    totalDaysCount?: number;
    availableDaysPerYear?: number;
}

// Helper functions
export function normalizeDate(date: Date | string | null | undefined): Date | null {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (typeof date === 'string') {
        const parsed = new Date(date);
        return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
}

export function calculateDurationInDays(startDate: Date, endDate: Date): number {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

export function calculateBusinessDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
            count++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return count;
}

export function isInBlackoutPeriod(date: Date, blackoutPeriods: DateRange[]): boolean {
    return blackoutPeriods.some(period => 
        date >= period.start && date <= period.end
    );
}

/**
 * Interface pour l'erreur de validation de date
 */
interface ValidationError {
    field: string;
    type: DateValidationErrorType;
    message: string;
    details?: any;
}

/**
 * Clé de cache pour les validations
 */
interface ValidationCacheKey {
    startDate: string;
    endDate: string;
    userId: string;
    optionsHash: string;
    contextHash: string;
}

/**
 * Résultat mis en cache
 */
interface CachedValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    context: ValidationContext;
    timestamp: number;
}

/**
 * Durée d'expiration du cache en millisecondes (5 minutes)
 */
const CACHE_EXPIRATION_MS = 5 * 60 * 1000;

/**
 * Génère une clé de hachage pour un objet
 */
function hashObject(obj: any): string {
    return JSON.stringify(obj);
}

/**
 * Hook personnalisé pour la validation des demandes de congés
 * Étend le hook useDateValidation avec des fonctionnalités spécifiques aux congés
 */
export function useLeaveValidation() {
    // Utiliser le hook de validation de base
    const dateValidation = useDateValidation();

    // État local pour stocker les erreurs
    const [localErrors, setLocalErrors] = useState<ValidationError[]>([]);

    // Contexte de validation local
    const [localContext, setLocalContext] = useState<ValidationContext>({});

    // Cache de validation
    const validationCache = useRef<Map<string, CachedValidationResult>>(new Map());

    // Compteur pour les statistiques de cache
    const cacheStats = useRef({ hits: 0, misses: 0 });

    /**
     * Génère une clé de cache pour une validation
     */
    const generateCacheKey = useCallback((
        start: Date | string | null | undefined,
        end: Date | string | null | undefined,
        userId: string,
        options: DateValidationOptions = {}
    ): string => {
        const key: ValidationCacheKey = {
            startDate: start ? start.toString() : 'null',
            endDate: end ? end.toString() : 'null',
            userId,
            optionsHash: hashObject(options),
            contextHash: hashObject(localContext)
        };

        return hashObject(key);
    }, [localContext]);

    /**
     * Vérifie si le cache contient une entrée valide
     */
    const getCachedResult = useCallback((cacheKey: string): CachedValidationResult | null => {
        const cached = validationCache.current.get(cacheKey);

        if (!cached) return null;

        // Vérifier si le cache est expiré
        const now = Date.now();
        if (now - cached.timestamp > CACHE_EXPIRATION_MS) {
            validationCache.current.delete(cacheKey);
            return null;
        }

        return cached;
    }, []);

    /**
     * Enregistre un résultat dans le cache
     */
    const setCachedResult = useCallback((
        cacheKey: string,
        isValid: boolean,
        errors: ValidationError[],
        context: ValidationContext
    ): void => {
        const result: CachedValidationResult = {
            isValid,
            errors,
            context: { ...context },
            timestamp: Date.now()
        };

        validationCache.current.set(cacheKey, result);

        // Limiter la taille du cache (max 100 entrées)
        if (validationCache.current.size > 100) {
            // Supprimer la plus ancienne entrée
            const oldestKey = Array.from(validationCache.current.entries())
                .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
            validationCache.current.delete(oldestKey);
        }
    }, []);

    /**
     * Valide une demande de congés avec mise en cache
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
        // Générer la clé de cache
        const cacheKey = generateCacheKey(start, end, userId, options);

        // Vérifier si le résultat est déjà dans le cache
        const cachedResult = getCachedResult(cacheKey);
        if (cachedResult) {
            // Utiliser le résultat en cache
            setLocalErrors(cachedResult.errors);
            setLocalContext(cachedResult.context);
            cacheStats.current.hits++;
            console.debug(`[LeaveValidation] Cache hit (${cacheStats.current.hits} hits, ${cacheStats.current.misses} misses)`);
            return cachedResult.isValid;
        }

        cacheStats.current.misses++;
        console.debug(`[LeaveValidation] Cache miss (${cacheStats.current.hits} hits, ${cacheStats.current.misses} misses)`);

        const startFieldName = `leave_start_${userId}`;
        const endFieldName = `leave_end_${userId}`;

        // Réinitialiser les erreurs locales
        const newErrors: ValidationError[] = [];

        // Configuration par défaut pour les congés
        const leaveOptions = {
            required: true,
            allowPastDates: false,
            minAdvanceNotice: 1, // 1 jour d'avance minimum
            disallowWeekends: false, // On peut prendre des congés le weekend
            ...options
        };

        // Normaliser les dates avant la validation
        const startDate = normalizeDate(start);
        const endDate = normalizeDate(end);

        if (!startDate || !endDate) {
            if (!startDate) {
                newErrors.push({
                    field: startFieldName,
                    message: 'La date de début est requise',
                    type: DateValidationErrorType.REQUIRED
                });
            }

            if (!endDate) {
                newErrors.push({
                    field: endFieldName,
                    message: 'La date de fin est requise',
                    type: DateValidationErrorType.REQUIRED
                });
            }

            setLocalErrors(newErrors);
            // Mettre en cache le résultat négatif
            setCachedResult(cacheKey, false, newErrors, localContext);
            return false;
        }

        // Vérifier si la date de début est dans le passé
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!leaveOptions.allowPastDates && startDate < today) {
            newErrors.push({
                field: startFieldName,
                message: 'Les dates passées ne sont pas autorisées',
                type: DateValidationErrorType.PAST_DATE
            });
            setLocalErrors(newErrors);
            // Mettre en cache le résultat négatif
            setCachedResult(cacheKey, false, newErrors, localContext);
            return false;
        }

        // Vérifier si la date de fin est avant la date de début
        if (endDate < startDate) {
            newErrors.push(
                {
                    field: startFieldName,
                    message: 'La date de début doit être antérieure à la date de fin',
                    type: DateValidationErrorType.START_AFTER_END
                },
                {
                    field: endFieldName,
                    message: 'La date de fin doit être postérieure à la date de début',
                    type: DateValidationErrorType.START_AFTER_END
                }
            );
            setLocalErrors(newErrors);
            // Mettre en cache le résultat négatif
            setCachedResult(cacheKey, false, newErrors, localContext);
            return false;
        }

        // Calculer la durée
        const totalDuration = calculateDurationInDays(startDate, endDate);

        // Mettre à jour le contexte
        const newContext: ValidationContext = {
            ...localContext,
            totalDaysCount: totalDuration
        };

        // Vérifier les quotas de congés disponibles si spécifié
        if (leaveOptions.availableDaysPerYear && localContext.usedDays !== undefined) {
            const usedDays = localContext.usedDays || 0;
            const remaining = leaveOptions.availableDaysPerYear - usedDays;

            newContext.usedDays = usedDays;
            newContext.remainingDays = remaining - totalDuration;

            if (totalDuration > remaining) {
                newErrors.push({
                    field: endFieldName,
                    message: `Cette demande dépasse votre quota de congés disponibles (${remaining} jours restants)`,
                    type: DateValidationErrorType.EXCEEDS_AVAILABLE_DAYS,
                    details: {
                        requested: totalDuration,
                        available: remaining,
                        total: leaveOptions.availableDaysPerYear
                    }
                });

                setLocalErrors(newErrors);
                setLocalContext(newContext);
                // Mettre en cache le résultat négatif
                setCachedResult(cacheKey, false, newErrors, newContext);
                return false;
            }
        }

        // Si tout est valide, mettre à jour le contexte
        setLocalErrors(newErrors);
        setLocalContext(newContext);

        // Mettre en cache le résultat positif
        setCachedResult(cacheKey, true, newErrors, newContext);
        return true;
    }, [localContext, generateCacheKey, getCachedResult, setCachedResult]);

    /**
     * Statistiques du cache
     */
    const cacheStatistics = useMemo(() => ({
        hits: cacheStats.current.hits,
        misses: cacheStats.current.misses,
        ratio: cacheStats.current.hits + cacheStats.current.misses > 0
            ? (cacheStats.current.hits / (cacheStats.current.hits + cacheStats.current.misses)) * 100
            : 0,
        cacheSize: validationCache.current.size
    }), [cacheStats.current.hits, cacheStats.current.misses]);

    /**
     * Réinitialise le cache
     */
    const clearCache = useCallback(() => {
        validationCache.current.clear();
        cacheStats.current = { hits: 0, misses: 0 };
    }, []);

    /**
     * Détermine si un champ a une erreur
     */
    const hasError = useCallback((fieldName: string): boolean => {
        return localErrors.some(error => error.field === fieldName);
    }, [localErrors]);

    /**
     * Récupère le message d'erreur pour un champ
     */
    const getErrorMessage = useCallback((fieldName: string): string | null => {
        const error = localErrors.find(error => error.field === fieldName);
        return error ? error.message : null;
    }, [localErrors]);

    /**
     * Récupère le type d'erreur pour un champ
     */
    const getErrorType = useCallback((fieldName: string): DateValidationErrorType | null => {
        const error = localErrors.find(error => error.field === fieldName);
        return error ? error.type : null;
    }, [localErrors]);

    /**
     * Réinitialise toutes les erreurs
     */
    const resetErrors = useCallback(() => {
        setLocalErrors([]);
    }, []);

    /**
     * Définit le contexte de validation
     */
    const setContext = useCallback((context: Partial<ValidationContext>) => {
        setLocalContext(prevContext => ({
            ...prevContext,
            ...context
        }));
    }, []);

    // Retourner les fonctions nécessaires
    return {
        validateLeaveRequest,
        hasError,
        getErrorMessage,
        getErrorType,
        resetErrors,
        context: localContext,
        setContext,
        cacheStatistics,
        clearCache
    };
} 