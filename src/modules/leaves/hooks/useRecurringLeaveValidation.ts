import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { addDays, format, isAfter, isBefore } from 'date-fns';

import {
    useDateValidation,
    DateValidationOptions,
    DateValidationErrorType,
    ValidationContext
} from '../../../hooks/useDateValidation';
import { useLeaveValidation } from './useLeaveValidation';
import { useConflictDetection } from './useConflictDetection';
import {
    RecurrenceFrequency,
    RecurrencePattern,
    RecurrenceEndType
} from '../types/leave';
import {
    generateRecurringDates,
    GenerateRecurringResult
} from '../utils/recurringLeavesUtils';

/**
 * Type d'erreur spécifique à la validation récurrente
 */
export enum RecurringValidationErrorType {
    INVALID_PATTERN = 'invalid_pattern',
    QUOTA_EXCEEDED = 'quota_exceeded',
    TOO_MANY_OCCURRENCES = 'too_many_occurrences',
    RECURRING_CONFLICT = 'recurring_conflict',
    INVALID_END_DATE = 'invalid_end_date',
    NO_OCCURRENCES = 'no_occurrences',
    PATTERN_TOO_SHORT = 'pattern_too_short',
    PATTERN_TOO_LONG = 'pattern_too_long'
}

/**
 * Interface pour l'erreur de validation récurrente
 */
interface RecurringValidationError {
    field: string;
    type: RecurringValidationErrorType | DateValidationErrorType;
    message: string;
    details?: any;
}

/**
 * Options de validation récurrente
 */
export interface RecurringValidationOptions extends DateValidationOptions {
    maxOccurrences?: number;            // Nombre maximum d'occurrences permises
    maxGenerationYears?: number;        // Limite maximale d'années pour la génération
    minDuration?: number;               // Durée minimale du modèle en jours
    maxDuration?: number;               // Durée maximale du modèle en jours
    validateAllOccurrences?: boolean;   // Valider toutes les occurrences individuellement
    holidays?: Date[];                  // Jours fériés à prendre en compte
}

/**
 * Résultat de validation récurrente
 */
export interface RecurringValidationResult {
    isValid: boolean;                   // La demande est-elle valide ?
    errors: RecurringValidationError[]; // Erreurs éventuelles
    occurrencesResult?: GenerateRecurringResult; // Résultat de la génération
    validationDuration?: number;        // Durée de la validation en millisecondes
}

/**
 * Clé de cache pour les validations de récurrence
 */
interface RecurringValidationCacheKey {
    startDate: string;
    endDate: string;
    userId: string;
    patternHash: string;
    optionsHash: string;
}

/**
 * Résultat de validation mis en cache
 */
interface CachedRecurringValidationResult {
    isValid: boolean;
    errors: RecurringValidationError[];
    occurrencesResult?: GenerateRecurringResult;
    timestamp: number;
}

/**
 * Durée d'expiration du cache en millisecondes (5 minutes)
 */
const CACHE_EXPIRATION_MS = 5 * 60 * 1000;

/**
 * Génère un hash pour un objet
 */
function hashObject(obj: any): string {
    return JSON.stringify(obj);
}

/**
 * Hook personnalisé pour la validation des demandes de congés récurrentes
 */
export function useRecurringLeaveValidation() {
    // Utiliser les hooks existants
    const leaveValidation = useLeaveValidation();
    const dateValidation = useDateValidation();
    const conflictDetection = useConflictDetection({ userId: '' }); // userId sera défini lors de l'appel

    // État local pour stocker les erreurs de récurrence
    const [recurringErrors, setRecurringErrors] = useState<RecurringValidationError[]>([]);

    // État pour le résultat de la génération d'occurrences
    const [generationResult, setGenerationResult] = useState<GenerateRecurringResult | null>(null);

    // Cache de validation
    const validationCache = useRef<Map<string, CachedRecurringValidationResult>>(new Map());

    // Compteur pour les statistiques de cache
    const cacheStats = useRef({ hits: 0, misses: 0 });

    // Métriques de performance
    const performanceMetrics = useRef({
        lastValidationDuration: 0,
        averageValidationDuration: 0,
        validationCount: 0
    });

    /**
     * Génère une clé de cache pour une validation
     */
    const generateCacheKey = useCallback((
        patternStartDate: Date | string | null | undefined,
        patternEndDate: Date | string | null | undefined,
        userId: string,
        recurrencePattern: RecurrencePattern,
        options: RecurringValidationOptions = {}
    ): string => {
        const key: RecurringValidationCacheKey = {
            startDate: patternStartDate ? patternStartDate.toString() : 'null',
            endDate: patternEndDate ? patternEndDate.toString() : 'null',
            userId,
            patternHash: hashObject(recurrencePattern),
            optionsHash: hashObject(options)
        };

        return hashObject(key);
    }, []);

    /**
     * Vérifie si le cache contient une entrée valide
     */
    const getCachedResult = useCallback((cacheKey: string): CachedRecurringValidationResult | null => {
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
        errors: RecurringValidationError[],
        occurrencesResult?: GenerateRecurringResult
    ): void => {
        const result: CachedRecurringValidationResult = {
            isValid,
            errors,
            occurrencesResult,
            timestamp: Date.now()
        };

        validationCache.current.set(cacheKey, result);

        // Limiter la taille du cache (max 50 entrées)
        if (validationCache.current.size > 50) {
            // Supprimer la plus ancienne entrée
            const oldestKey = Array.from(validationCache.current.entries())
                .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
            validationCache.current.delete(oldestKey);
        }
    }, []);

    /**
     * Valide un modèle de récurrence
     */
    const validateRecurrencePattern = useCallback((
        pattern: RecurrencePattern,
        fieldPrefix: string,
        options: RecurringValidationOptions = {}
    ): boolean => {
        const newErrors: RecurringValidationError[] = [];

        // Vérifier la fréquence
        if (!Object.values(RecurrenceFrequency).includes(pattern.frequency)) {
            newErrors.push({
                field: `${fieldPrefix}_frequency`,
                type: RecurringValidationErrorType.INVALID_PATTERN,
                message: 'Fréquence de récurrence invalide'
            });
        }

        // Vérifier l'intervalle
        if (!pattern.interval || pattern.interval < 1) {
            newErrors.push({
                field: `${fieldPrefix}_interval`,
                type: RecurringValidationErrorType.INVALID_PATTERN,
                message: 'L\'intervalle doit être un nombre entier positif'
            });
        }

        // Vérifier le type de fin
        if (!Object.values(RecurrenceEndType).includes(pattern.endType)) {
            newErrors.push({
                field: `${fieldPrefix}_endType`,
                type: RecurringValidationErrorType.INVALID_PATTERN,
                message: 'Type de fin de récurrence invalide'
            });
        }

        // Vérifier la cohérence du type de fin
        switch (pattern.endType) {
            case RecurrenceEndType.UNTIL_DATE:
                if (!pattern.endDate) {
                    newErrors.push({
                        field: `${fieldPrefix}_endDate`,
                        type: RecurringValidationErrorType.INVALID_END_DATE,
                        message: 'Une date de fin est requise'
                    });
                } else if (
                    options.maxGenerationYears &&
                    isAfter(pattern.endDate, addDays(new Date(), options.maxGenerationYears * 365))
                ) {
                    newErrors.push({
                        field: `${fieldPrefix}_endDate`,
                        type: RecurringValidationErrorType.INVALID_END_DATE,
                        message: `La date de fin ne peut pas être ultérieure à ${options.maxGenerationYears} ans`
                    });
                }
                break;
            case RecurrenceEndType.COUNT:
                if (!pattern.endCount || pattern.endCount < 1) {
                    newErrors.push({
                        field: `${fieldPrefix}_endCount`,
                        type: RecurringValidationErrorType.INVALID_PATTERN,
                        message: 'Le nombre d\'occurrences doit être un entier positif'
                    });
                } else if (options.maxOccurrences && pattern.endCount > options.maxOccurrences) {
                    newErrors.push({
                        field: `${fieldPrefix}_endCount`,
                        type: RecurringValidationErrorType.TOO_MANY_OCCURRENCES,
                        message: `Le nombre d'occurrences ne peut pas dépasser ${options.maxOccurrences}`
                    });
                }
                break;
        }

        // Vérifier les weekdays pour la récurrence hebdomadaire
        if (
            pattern.frequency === RecurrenceFrequency.WEEKLY &&
            (!pattern.weekdays || pattern.weekdays.length === 0)
        ) {
            newErrors.push({
                field: `${fieldPrefix}_weekdays`,
                type: RecurringValidationErrorType.INVALID_PATTERN,
                message: 'Au moins un jour de la semaine doit être sélectionné'
            });
        }

        // Vérifier le jour du mois pour la récurrence mensuelle
        if (
            pattern.frequency === RecurrenceFrequency.MONTHLY &&
            pattern.dayOfMonth !== undefined &&
            (pattern.dayOfMonth < 1 || pattern.dayOfMonth > 31)
        ) {
            newErrors.push({
                field: `${fieldPrefix}_dayOfMonth`,
                type: RecurringValidationErrorType.INVALID_PATTERN,
                message: 'Le jour du mois doit être entre 1 et 31'
            });
        }

        // Mettre à jour les erreurs
        setRecurringErrors(prev => [
            ...prev.filter(e => !e.field.startsWith(fieldPrefix)),
            ...newErrors
        ]);

        return newErrors.length === 0;
    }, []);

    /**
     * Optimisation de la validation des conflits pour de multiples occurrences
     * Cette fonction traite les occurrences par lots pour éviter de bloquer le thread principal
     */
    const validateOccurrencesConflicts = useCallback(async (
        occurrences: any[],
        batchSize: number = 5
    ): Promise<{ hasConflicts: boolean, conflictingOccurrences: any[] }> => {
        const conflictingOccurrences: any[] = [];

        // Traiter les occurrences par lots
        for (let i = 0; i < occurrences.length; i += batchSize) {
            const batch = occurrences.slice(i, i + batchSize);

            // Utiliser Promise.all pour paralléliser les vérifications de conflits
            const batchResults = await Promise.all(
                batch.map(async (occurrence) => {
                    try {
                        const conflictResult = await conflictDetection.checkConflicts(
                            occurrence.startDate,
                            occurrence.endDate
                        );

                        if (conflictResult.hasBlockingConflicts) {
                            return {
                                startDate: occurrence.startDate,
                                endDate: occurrence.endDate,
                                conflicts: conflictResult.conflicts
                            };
                        }
                        return null;
                    } catch (err) {
                        console.error('Erreur lors de la vérification des conflits', err);
                        return null;
                    }
                })
            );

            // Filtrer les résultats null et ajouter les conflits trouvés
            batchResults
                .filter(result => result !== null)
                .forEach(conflict => conflictingOccurrences.push(conflict));

            // Pause courte pour permettre au thread principal de respirer
            if (i + batchSize < occurrences.length) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        return {
            hasConflicts: conflictingOccurrences.length > 0,
            conflictingOccurrences
        };
    }, [conflictDetection]);

    /**
     * Valide une demande de congés récurrente complète avec mise en cache
     */
    const validateRecurringLeaveRequest = useCallback(async (
        patternStartDate: Date | string | null | undefined,
        patternEndDate: Date | string | null | undefined,
        userId: string,
        recurrencePattern: RecurrencePattern,
        options: RecurringValidationOptions = {}
    ): Promise<RecurringValidationResult> => {
        // Mesurer le temps d'exécution
        const startTime = performance.now();

        // Générer la clé de cache
        const cacheKey = generateCacheKey(
            patternStartDate,
            patternEndDate,
            userId,
            recurrencePattern,
            options
        );

        // Vérifier si le résultat est déjà dans le cache
        const cachedResult = getCachedResult(cacheKey);
        if (cachedResult) {
            // Utiliser le résultat en cache
            setRecurringErrors(cachedResult.errors);
            if (cachedResult.occurrencesResult) {
                setGenerationResult(cachedResult.occurrencesResult);
            }

            cacheStats.current.hits++;
            console.debug(`[RecurringLeaveValidation] Cache hit (${cacheStats.current.hits} hits, ${cacheStats.current.misses} misses)`);

            return {
                isValid: cachedResult.isValid,
                errors: cachedResult.errors,
                occurrencesResult: cachedResult.occurrencesResult,
                validationDuration: 0 // Validation instantanée avec le cache
            };
        }

        cacheStats.current.misses++;
        console.debug(`[RecurringLeaveValidation] Cache miss (${cacheStats.current.hits} hits, ${cacheStats.current.misses} misses)`);

        // Réinitialiser les erreurs
        setRecurringErrors([]);
        leaveValidation.resetErrors();

        const errors: RecurringValidationError[] = [];
        let isValid = true;

        // Options par défaut
        const defaultOptions: RecurringValidationOptions = {
            required: true,
            allowPastDates: false,
            minAdvanceNotice: 1,
            maxOccurrences: 50,
            maxGenerationYears: 2,
            validateAllOccurrences: true,
            ...options
        };

        // Valider les dates du modèle (patternStartDate, patternEndDate)
        const startFieldName = `recurring_leave_start_${userId}`;
        const endFieldName = `recurring_leave_end_${userId}`;

        const datesValid = leaveValidation.validateLeaveRequest(
            patternStartDate,
            patternEndDate,
            userId,
            defaultOptions
        );

        if (!datesValid) {
            // Récupérer les erreurs de date depuis le hook useLeaveValidation
            if (leaveValidation.hasError(`leave_start_${userId}`)) {
                errors.push({
                    field: startFieldName,
                    type: leaveValidation.getErrorType(`leave_start_${userId}`) || DateValidationErrorType.INVALID_FORMAT,
                    message: leaveValidation.getErrorMessage(`leave_start_${userId}`) || 'Date de début invalide'
                });
            }

            if (leaveValidation.hasError(`leave_end_${userId}`)) {
                errors.push({
                    field: endFieldName,
                    type: leaveValidation.getErrorType(`leave_end_${userId}`) || DateValidationErrorType.INVALID_FORMAT,
                    message: leaveValidation.getErrorMessage(`leave_end_${userId}`) || 'Date de fin invalide'
                });
            }

            isValid = false;
        }

        // Valider le modèle de récurrence
        const patternFieldPrefix = `recurring_pattern_${userId}`;
        const patternValid = validateRecurrencePattern(recurrencePattern, patternFieldPrefix, defaultOptions);

        if (!patternValid) {
            // Les erreurs sont déjà ajoutées par validateRecurrencePattern
            isValid = false;
        }

        // Si les validations de base ont échoué, ne pas continuer
        if (!isValid) {
            const finalResult = {
                isValid: false,
                errors: [...recurringErrors, ...errors],
                validationDuration: performance.now() - startTime
            };

            setRecurringErrors(prev => [...prev, ...errors]);

            // Mettre en cache le résultat
            setCachedResult(cacheKey, false, [...recurringErrors, ...errors]);

            return finalResult;
        }

        // Utiliser useMemo pour mettre en cache les occurrences générées
        let occurrencesResult: GenerateRecurringResult | undefined = undefined;

        // Préparer la demande pour générer les occurrences
        try {
            const startDate = patternStartDate instanceof Date ? patternStartDate : new Date(patternStartDate as string);
            const endDate = patternEndDate instanceof Date ? patternEndDate : new Date(patternEndDate as string);

            const recurringRequest = {
                id: 'temp-id',
                userId,
                isRecurring: true,
                patternStartDate: startDate,
                patternEndDate: endDate,
                recurrencePattern,
                type: 'PAID' as any, // Type obligatoire mais sera remplacé
                status: 'DRAFT' as any, // Status obligatoire mais sera remplacé
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Générer les occurrences avec mesure de performance
            console.time('generateRecurringDates');
            occurrencesResult = generateRecurringDates(recurringRequest, {
                holidays: defaultOptions.holidays,
                maxOccurrences: defaultOptions.maxOccurrences,
                maxGenerationYears: defaultOptions.maxGenerationYears
            });
            console.timeEnd('generateRecurringDates');

            setGenerationResult(occurrencesResult);

            // Vérifier s'il y a au moins une occurrence
            if (occurrencesResult.occurrences.length === 0) {
                errors.push({
                    field: patternFieldPrefix,
                    type: RecurringValidationErrorType.NO_OCCURRENCES,
                    message: 'Aucune occurrence générée avec ce modèle de récurrence'
                });
                isValid = false;
            }

            // Vérifier les quotas si spécifié
            if (
                defaultOptions.availableDaysPerYear !== undefined &&
                occurrencesResult.totalDays > defaultOptions.availableDaysPerYear
            ) {
                errors.push({
                    field: endFieldName,
                    type: RecurringValidationErrorType.QUOTA_EXCEEDED,
                    message: `La demande dépasse le quota disponible (${occurrencesResult.totalDays} jours demandés, ${defaultOptions.availableDaysPerYear} disponibles)`,
                    details: {
                        requested: occurrencesResult.totalDays,
                        available: defaultOptions.availableDaysPerYear
                    }
                });
                isValid = false;
            }

            // Valider chaque occurrence individuellement si demandé, avec une approche optimisée
            if (defaultOptions.validateAllOccurrences && isValid && occurrencesResult.occurrences.length > 0) {
                console.time('validateOccurrencesConflicts');
                const conflictResults = await validateOccurrencesConflicts(occurrencesResult.occurrences);
                console.timeEnd('validateOccurrencesConflicts');

                if (conflictResults.hasConflicts) {
                    errors.push({
                        field: patternFieldPrefix,
                        type: RecurringValidationErrorType.RECURRING_CONFLICT,
                        message: `${conflictResults.conflictingOccurrences.length} occurrence(s) ont des conflits bloquants`,
                        details: { conflictingOccurrences: conflictResults.conflictingOccurrences }
                    });
                    isValid = false;
                }
            }

        } catch (err) {
            console.error('Erreur lors de la validation récurrente', err);
            errors.push({
                field: patternFieldPrefix,
                type: RecurringValidationErrorType.INVALID_PATTERN,
                message: 'Erreur lors de la génération des occurrences'
            });
            isValid = false;
        }

        // Mettre à jour les erreurs
        setRecurringErrors(prev => [...prev, ...errors]);

        // Calculer la durée de validation
        const validationDuration = performance.now() - startTime;

        // Mettre à jour les métriques de performance
        performanceMetrics.current.lastValidationDuration = validationDuration;
        performanceMetrics.current.validationCount++;
        performanceMetrics.current.averageValidationDuration =
            (performanceMetrics.current.averageValidationDuration * (performanceMetrics.current.validationCount - 1) + validationDuration) /
            performanceMetrics.current.validationCount;

        console.debug(`[RecurringLeaveValidation] Validation completed in ${validationDuration.toFixed(2)}ms`);

        const finalResult: RecurringValidationResult = {
            isValid,
            errors: [...recurringErrors, ...errors],
            occurrencesResult,
            validationDuration
        };

        // Mettre en cache le résultat
        setCachedResult(cacheKey, isValid, [...recurringErrors, ...errors], occurrencesResult);

        return finalResult;
    }, [
        leaveValidation,
        validateRecurrencePattern,
        recurringErrors,
        generationResult,
        validateOccurrencesConflicts,
        generateCacheKey,
        getCachedResult,
        setCachedResult
    ]);

    /**
     * Vérifie si un champ a une erreur
     */
    const hasError = useCallback((fieldName: string): boolean => {
        return recurringErrors.some(error => error.field === fieldName);
    }, [recurringErrors]);

    /**
     * Récupère le message d'erreur pour un champ
     */
    const getErrorMessage = useCallback((fieldName: string): string | null => {
        const error = recurringErrors.find(error => error.field === fieldName);
        return error ? error.message : null;
    }, [recurringErrors]);

    /**
     * Récupère le type d'erreur pour un champ
     */
    const getErrorType = useCallback((fieldName: string): RecurringValidationErrorType | DateValidationErrorType | null => {
        const error = recurringErrors.find(error => error.field === fieldName);
        return error ? error.type : null;
    }, [recurringErrors]);

    /**
     * Réinitialise toutes les erreurs
     */
    const resetErrors = useCallback(() => {
        setRecurringErrors([]);
        leaveValidation.resetErrors();
    }, [leaveValidation]);

    /**
     * Réinitialise le cache
     */
    const clearCache = useCallback(() => {
        validationCache.current.clear();
        cacheStats.current = { hits: 0, misses: 0 };
    }, []);

    /**
     * Statistiques du cache et métriques de performance
     */
    const statistics = useMemo(() => ({
        cache: {
            hits: cacheStats.current.hits,
            misses: cacheStats.current.misses,
            ratio: cacheStats.current.hits + cacheStats.current.misses > 0
                ? (cacheStats.current.hits / (cacheStats.current.hits + cacheStats.current.misses)) * 100
                : 0,
            size: validationCache.current.size
        },
        performance: {
            lastValidationDuration: performanceMetrics.current.lastValidationDuration,
            averageValidationDuration: performanceMetrics.current.averageValidationDuration,
            validationCount: performanceMetrics.current.validationCount
        }
    }), [
        cacheStats.current.hits,
        cacheStats.current.misses,
        performanceMetrics.current.lastValidationDuration,
        performanceMetrics.current.averageValidationDuration,
        performanceMetrics.current.validationCount
    ]);

    /**
     * Met à jour l'ID utilisateur pour la détection de conflits
     */
    const setUserId = useCallback((userId: string) => {
        // Mise à jour du userId dans conflictDetection
        // Note: Cette fonction n'existe pas nativement dans useConflictDetection
        // Il faudrait adapter le hook useConflictDetection pour permettre cette fonctionnalité
    }, []);

    return {
        validateRecurringLeaveRequest,
        validateRecurrencePattern,
        hasError,
        getErrorMessage,
        getErrorType,
        resetErrors,
        clearCache,
        setUserId,
        generationResult,
        statistics,
        // Exposer les fonctions du hook de validation standard
        validateLeaveRequest: leaveValidation.validateLeaveRequest,
        context: leaveValidation.context,
        setContext: leaveValidation.setContext
    };
} 