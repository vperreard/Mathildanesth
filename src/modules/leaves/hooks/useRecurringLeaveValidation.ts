import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { addDays, format, isAfter, isBefore } from 'date-fns';

import {
    useDateValidation,
    DateValidationOptions,
    DateValidationErrorType,
    ValidationContext,
    DateValidationError
} from '../../../hooks/useDateValidation';
import { useLeaveValidation } from './useLeaveValidation';
import { useConflictDetection } from './useConflictDetection';
import {
    RecurrenceFrequency,
    RecurrenceEndType,
    RecurrencePattern,
    LeaveType,
    Leave,
    LeaveStatus
} from '../types/leave';
import {
    generateRecurringDates,
    GenerateRecurringResult
} from '../utils/recurringLeavesUtils';

// Helper to normalize dates
function normalizeDate(date: Date | string | null | undefined): Date | null {
    if (!date) return null;

    try {
        const normalizedDate = typeof date === 'string' ? new Date(date) : new Date(date.getTime());
        // Remove time part
        normalizedDate.setHours(0, 0, 0, 0);
        return normalizedDate;
    } catch (error) {
        console.error('Error normalizing date:', error);
        return null;
    }
}

// Helper to generate a cache key
function generateCacheKey(
    startDate: Date | string | null | undefined,
    endDate: Date | string | null | undefined,
    userId: string,
    pattern: RecurrencePattern,
    options?: RecurringValidationOptions
): string {
    const key = {
        startDate: startDate ? startDate.toString() : 'null',
        endDate: endDate ? endDate.toString() : 'null',
        userId,
        patternHash: JSON.stringify(pattern),
        optionsHash: JSON.stringify(options)
    };
    return JSON.stringify(key);
}

export enum RecurringValidationErrorType {
    INVALID_PATTERN = 'invalid_pattern',
    RECURRING_CONFLICT = 'recurring_conflict',
    TOO_MANY_OCCURRENCES = 'too_many_occurrences',
    NO_OCCURRENCES = 'no_occurrences',
    INVALID_START_DATE = 'invalid_start_date',
    INVALID_END_DATE = 'invalid_end_date',
    PATTERN_TOO_LONG = 'pattern_too_long',
    EXCEEDS_MAX_TOTAL_DAYS = 'exceeds_max_total_days'
}

export type RecurringValidationOptions = DateValidationOptions & {
    maxOccurrences?: number;
    maxTotalDays?: number;
    maxGenerationYears?: number;
    validateAllOccurrences?: boolean;
    skipDateValidation?: boolean;
};

export type RecurringValidationError = {
    field: string;
    type: RecurringValidationErrorType | DateValidationErrorType;
    message: string;
};

export type RecurringValidationResult = {
    isValid: boolean;
    errors: RecurringValidationError[];
    occurrencesResult?: {
        occurrences: Array<{ startDate: Date; endDate: Date; conflicts?: any[] }>;
        totalDays: number;
    } | null;
};

// Define LocalLeaveValidationError because it's not exported from useLeaveValidation
interface LocalLeaveValidationError {
    field: string;
    type: DateValidationErrorType;
    message: string;
    details?: any;
}

export function useRecurringLeaveValidation() {
    const [errors, setErrors] = useState<RecurringValidationError[]>([]);
    const [generationResult, setGenerationResult] = useState<{ occurrences: Array<{ startDate: Date; endDate: Date; conflicts?: any[] }>; totalDays: number; } | null>(null);

    // Explicitly type the return of the hooks
    const dateValidation: ReturnType<typeof useDateValidation> = useDateValidation({});
    const leaveValidation: ReturnType<typeof useLeaveValidation> = useLeaveValidation();

    const [userId, setUserId] = useState<string>('');
    // Pass userId directly. Ensure it's set before checkConflicts is called.
    const conflictDetection: ReturnType<typeof useConflictDetection> = useConflictDetection({ userId });

    // Cache
    const cache = useRef<Map<string, RecurringValidationResult>>(new Map());

    // Statistics
    const [statistics, setStatistics] = useState({
        cache: {
            hits: 0,
            misses: 0,
            size: 0
        },
        performance: {
            lastValidationDuration: 0,
            averageValidationDuration: 0,
            validationCount: 0
        }
    });

    // Ajouter un état factice pour forcer le re-render
    const [rerenderTrigger, setRerenderTrigger] = useState(false);

    const forceRerender = useCallback(() => {
        setRerenderTrigger(prev => !prev);
    }, []);

    const clearCache = useCallback(() => {
        cache.current.clear();
        const newCacheStats = {
            ...statistics.cache,
            size: 0
        };
        setStatistics({
            ...statistics,
            cache: newCacheStats
        });
        forceRerender(); // Forcer re-render
    }, [statistics, forceRerender]);

    const updateCacheStatistics = useCallback((isHit: boolean, currentCacheSize: number) => {
        const newCacheStats = { ...statistics.cache };
        if (isHit) {
            newCacheStats.hits = statistics.cache.hits + 1;
        } else {
            newCacheStats.misses = statistics.cache.misses + 1;
        }
        newCacheStats.size = currentCacheSize;

        setStatistics({
            ...statistics,
            cache: newCacheStats
        });
        forceRerender(); // Forcer re-render après la mise à jour des stats
    }, [statistics, forceRerender]);

    const resetErrors = useCallback(() => {
        setErrors([]);
    }, []);

    const validateRecurrencePattern = useCallback((
        pattern: RecurrencePattern,
        fieldPrefix: string,
        options?: RecurringValidationOptions
    ): boolean => {
        const newErrors: RecurringValidationError[] = [];

        // Check basic pattern validity
        if (!pattern) {
            newErrors.push({
                field: `${fieldPrefix}`,
                type: RecurringValidationErrorType.INVALID_PATTERN,
                message: 'Le template de récurrence est invalide'
            });
            setErrors(newErrors);
            return false;
        }

        // Check frequency
        if (!pattern.frequency || !Object.values(RecurrenceFrequency).includes(pattern.frequency as RecurrenceFrequency)) {
            newErrors.push({
                field: `${fieldPrefix}.frequency`,
                type: RecurringValidationErrorType.INVALID_PATTERN,
                message: 'La fréquence de récurrence est invalide'
            });
        }

        // Check interval
        if (!pattern.interval || pattern.interval <= 0) {
            newErrors.push({
                field: `${fieldPrefix}.interval`,
                type: RecurringValidationErrorType.INVALID_PATTERN,
                message: 'L\'intervalle de récurrence doit être supérieur à 0'
            });
        }

        // Check end type
        if (!pattern.endType || !Object.values(RecurrenceEndType).includes(pattern.endType as RecurrenceEndType)) {
            newErrors.push({
                field: `${fieldPrefix}.endType`,
                type: RecurringValidationErrorType.INVALID_PATTERN,
                message: 'Le type de fin de récurrence est invalide'
            });
        }

        // Check end criteria based on end type
        if (pattern.endType === RecurrenceEndType.COUNT) {
            if (!pattern.endCount || pattern.endCount <= 0) {
                newErrors.push({
                    field: `${fieldPrefix}.endCount`,
                    type: RecurringValidationErrorType.INVALID_PATTERN,
                    message: 'Le nombre d\'occurrences doit être supérieur à 0'
                });
            } else if (options?.maxOccurrences && pattern.endCount > options.maxOccurrences) {
                newErrors.push({
                    field: `${fieldPrefix}.endCount`,
                    type: RecurringValidationErrorType.TOO_MANY_OCCURRENCES,
                    message: `Le nombre maximum d'occurrences est de ${options.maxOccurrences}`
                });
            }
        } else if (pattern.endType === RecurrenceEndType.UNTIL_DATE) {
            if (!pattern.endDate) {
                newErrors.push({
                    field: `${fieldPrefix}.endDate`,
                    type: RecurringValidationErrorType.INVALID_END_DATE,
                    message: 'La date de fin de récurrence est requise'
                });
            }
        }

        // Frequency-specific validations
        if (pattern.frequency === RecurrenceFrequency.WEEKLY && (!pattern.weekdays || pattern.weekdays.length === 0)) {
            newErrors.push({
                field: `${fieldPrefix}.weekdays`,
                type: RecurringValidationErrorType.INVALID_PATTERN,
                message: 'Au moins un jour de la semaine doit être sélectionné'
            });
        } else if (pattern.frequency === RecurrenceFrequency.MONTHLY) {
            if (!pattern.dayOfMonth && !pattern.weekOfMonth) {
                newErrors.push({
                    field: `${fieldPrefix}.dayOfMonth`,
                    type: RecurringValidationErrorType.INVALID_PATTERN,
                    message: 'Le jour du mois ou la semaine du mois doit être spécifié'
                });
            }
            if (pattern.dayOfMonth && (pattern.dayOfMonth < 1 || pattern.dayOfMonth > 31)) {
                newErrors.push({
                    field: `${fieldPrefix}.dayOfMonth`,
                    type: RecurringValidationErrorType.INVALID_PATTERN,
                    message: 'Le jour du mois doit être compris entre 1 et 31'
                });
            }
        }

        setErrors(newErrors);
        return newErrors.length === 0;
    }, []);

    const validateOccurrencesConflicts = useCallback(async (
        occurrences: Array<{ startDate: Date; endDate: Date }>,
        currentUserId: string,
        options?: RecurringValidationOptions
    ): Promise<{ isValid: boolean; errors: RecurringValidationError[]; occurrences: Array<{ startDate: Date; endDate: Date; conflicts?: any[] }> }> => {
        const newValidationErrors: RecurringValidationError[] = [];
        const occurrencesWithConflicts: Array<{ startDate: Date; endDate: Date; conflicts?: any[] }> = [];

        console.log(`[validateOccurrencesConflicts] Checking ${occurrences.length} occurrences for conflicts`);

        if (options?.validateAllOccurrences) {
            for (const occurrence of occurrences) {
                const conflictResult = await conflictDetection.checkConflicts(
                    occurrence.startDate,
                    occurrence.endDate,
                    currentUserId
                );

                console.log(`[validateOccurrencesConflicts] Occurrence ${occurrence.startDate.toISOString()} - ${occurrence.endDate.toISOString()}: hasConflicts=${conflictResult.hasConflicts}`);

                if (conflictResult.hasConflicts) {
                    occurrencesWithConflicts.push({
                        ...occurrence,
                        conflicts: conflictResult.conflicts
                    });

                    newValidationErrors.push({
                        field: 'occurrences',
                        type: RecurringValidationErrorType.RECURRING_CONFLICT,
                        message: `Conflit détecté pour l'occurrence du ${format(occurrence.startDate, 'dd/MM/yyyy')}`
                    });
                } else {
                    occurrencesWithConflicts.push(occurrence);
                }
            }
        } else {
            occurrences.forEach(occ => occurrencesWithConflicts.push({ ...occ }));
        }

        const hasNewErrors = newValidationErrors.length > 0;
        console.log(`[validateOccurrencesConflicts] Validation complete: ${hasNewErrors ? 'INVALID' : 'VALID'}, errors: ${newValidationErrors.length}, conflictingOccurrences: ${occurrencesWithConflicts.filter(o => o.conflicts).length}`);

        return {
            isValid: !hasNewErrors,
            errors: newValidationErrors,
            occurrences: occurrencesWithConflicts
        };
    }, [conflictDetection, userId]);

    const validateRecurringLeaveRequest = useCallback(async (
        patternStartDate: Date | string | null | undefined,
        patternEndDate: Date | string | null | undefined,
        userId: string,
        recurrencePattern: RecurrencePattern,
        options?: RecurringValidationOptions
    ): Promise<RecurringValidationResult> => {
        const startTime = performance.now();
        const allErrors: RecurringValidationError[] = [];

        // Normalize dates
        const startDate = normalizeDate(patternStartDate);
        const endDate = normalizeDate(patternEndDate);

        if (!startDate || !endDate) {
            const dateError: RecurringValidationError = {
                field: 'date',
                type: DateValidationErrorType.INVALID_DATE,
                message: 'Les dates fournies sont invalides'
            };
            return {
                isValid: false,
                errors: [dateError],
                occurrencesResult: null
            };
        }

        // Generate cache key
        const cacheKey = generateCacheKey(startDate, endDate, userId, recurrencePattern, options);

        // Check cache
        if (cache.current.has(cacheKey)) {
            updateCacheStatistics(true, cache.current.size);
            return cache.current.get(cacheKey)!;
        } else {
            updateCacheStatistics(false, cache.current.size + 1);
        }

        // Validate dates if not skipped
        if (!options?.skipDateValidation) {
            const dateRangeValid = dateValidation.validateDateRange(startDate, endDate, 'patternStartDate', 'patternEndDate');

            if (!dateRangeValid) {
                console.log('[validateRecurringLeaveRequest] Date validation failed');

                // Attempt to access getErrors via string indexer as a workaround for linter issues
                const dateValidationErrors = (dateValidation as any)['getErrors'] ? (dateValidation as any)['getErrors']() : {};
                Object.entries(dateValidationErrors).forEach(([field, errorObj]) => {
                    if (errorObj && typeof errorObj === 'object' &&
                        'type' in errorObj && typeof (errorObj as any).type === 'string' &&
                        'message' in errorObj && typeof (errorObj as any).message === 'string') {
                        allErrors.push({
                            field: field,
                            type: (errorObj as any).type as DateValidationErrorType,
                            message: (errorObj as any).message
                        });
                    }
                });

                if (allErrors.length === 0) {
                    allErrors.push({
                        field: 'date',
                        type: DateValidationErrorType.INVALID_DATE,
                        message: 'Les dates fournies sont invalides ou la plage est incorrecte.'
                    });
                }

                const result: RecurringValidationResult = {
                    isValid: false,
                    errors: allErrors,
                    occurrencesResult: null
                };
                cache.current.set(cacheKey, result);
                return result;
            }
        }

        const isLeaveValid = await leaveValidation.validateLeaveRequest(startDate, endDate, userId, options);
        if (!isLeaveValid) {
            console.log('[validateRecurringLeaveRequest] Leave validation failed');

            // Attempt to access getErrors via string indexer as a workaround for linter issues
            const leaveRequestErrors = (leaveValidation as any)['getErrors'] ? (leaveValidation as any)['getErrors']() : [];
            (leaveRequestErrors as LocalLeaveValidationError[]).forEach((error: LocalLeaveValidationError) => {
                allErrors.push({
                    field: error.field,
                    type: error.type,
                    message: error.message
                });
            });

            if (allErrors.length === 0 && (!leaveRequestErrors || (leaveRequestErrors as any[]).length === 0)) {
                allErrors.push({
                    field: 'leaveRequest',
                    type: DateValidationErrorType.INVALID_RANGE,
                    message: 'La validation de la demande de congé a échoué pour des raisons inconnues.'
                });
            }

            const result: RecurringValidationResult = {
                isValid: false,
                errors: allErrors,
                occurrencesResult: null
            };
            cache.current.set(cacheKey, result);
            return result;
        }

        // Validate pattern
        if (!validateRecurrencePattern(recurrencePattern, 'recurrencePattern', options)) {
            console.log('[validateRecurringLeaveRequest] Pattern validation failed');

            const result: RecurringValidationResult = {
                isValid: false,
                errors,
                occurrencesResult: null
            };

            cache.current.set(cacheKey, result);
            return result;
        }

        // Generate occurrences
        try {
            console.log('[validateRecurringLeaveRequest] Generating occurrences');

            // Format request object for generateRecurringDates
            const recurringRequest = {
                id: 'temp-id-' + Date.now(),
                userId,
                requestDate: new Date(),
                startDate: startDate,
                endDate: endDate,
                isRecurring: true,
                patternStartDate: startDate,
                patternEndDate: endDate,
                recurrencePattern,
                type: LeaveType.ANNUAL,
                status: LeaveStatus.DRAFT,
                countedDays: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const generatedResult = generateRecurringDates(recurringRequest, {
                maxGenerationYears: options?.maxGenerationYears || 2,
                maxOccurrences: options?.maxOccurrences
            });

            if (generatedResult.occurrences.length === 0) {
                console.log('[validateRecurringLeaveRequest] No occurrences generated');
                allErrors.push({
                    field: 'recurrencePattern',
                    type: RecurringValidationErrorType.NO_OCCURRENCES,
                    message: 'Aucune occurrence n\'a pu être générée avec ce template de récurrence'
                });

                const result: RecurringValidationResult = {
                    isValid: false,
                    errors: allErrors,
                    occurrencesResult: null
                };

                cache.current.set(cacheKey, result);
                return result;
            }

            // Check max occurrences
            if (options?.maxOccurrences && generatedResult.occurrences.length > options.maxOccurrences) {
                console.log(`[validateRecurringLeaveRequest] Too many occurrences: ${generatedResult.occurrences.length} > ${options.maxOccurrences}`);
                allErrors.push({
                    field: 'recurrencePattern.endCount',
                    type: RecurringValidationErrorType.TOO_MANY_OCCURRENCES,
                    message: `Le nombre maximum d'occurrences est de ${options.maxOccurrences}`
                });
            }

            // Check max total days
            if (options?.maxTotalDays && generatedResult.totalDays > options.maxTotalDays) {
                console.log(`[validateRecurringLeaveRequest] Too many total days: ${generatedResult.totalDays} > ${options.maxTotalDays}`);
                allErrors.push({
                    field: 'recurrencePattern',
                    type: RecurringValidationErrorType.EXCEEDS_MAX_TOTAL_DAYS,
                    message: `Le nombre total de jours (${generatedResult.totalDays}) dépasse le maximum autorisé (${options.maxTotalDays})`
                });
            }

            // Validate occurrences for conflicts
            console.log('[validateRecurringLeaveRequest] Validating occurrences for conflicts');
            const occurrencesValidation = await validateOccurrencesConflicts(
                generatedResult.occurrences.map(o => ({ startDate: o.startDate, endDate: o.endDate })),
                userId,
                options
            );

            if (!occurrencesValidation.isValid) {
                console.log('[validateRecurringLeaveRequest] Conflicts detected');
                allErrors.push(...occurrencesValidation.errors);
            }

            // Calculate final validation result
            const isValid = allErrors.length === 0;
            console.log(`[validateRecurringLeaveRequest] Final validation result: ${isValid ? 'VALID' : 'INVALID'}, errors: ${allErrors.length}`);

            // Prepare occurrence result
            const occurrencesResult = {
                occurrences: occurrencesValidation.occurrences,
                totalDays: generatedResult.totalDays
            };

            // Store generation result for UI display
            setGenerationResult(occurrencesResult);

            // Calculate performance
            const validationDuration = performance.now() - startTime;
            const newStats = { ...statistics };
            newStats.performance.lastValidationDuration = validationDuration;
            newStats.performance.validationCount++;
            newStats.performance.averageValidationDuration =
                (newStats.performance.averageValidationDuration * (newStats.performance.validationCount - 1) + validationDuration) /
                newStats.performance.validationCount;

            setStatistics(newStats);

            // Prepare result
            const result: RecurringValidationResult = {
                isValid,
                errors: allErrors,
                occurrencesResult
            };

            // Cache the result
            cache.current.set(cacheKey, result);

            // Update errors state for UI display
            setErrors(allErrors);

            return result;

        } catch (error: any) {
            console.error('[validateRecurringLeaveRequest] Error generating occurrences:', error);

            allErrors.push({
                field: 'recurrencePattern',
                type: RecurringValidationErrorType.INVALID_PATTERN,
                message: 'Erreur lors de la génération des occurrences'
            });

            const result: RecurringValidationResult = {
                isValid: false,
                errors: allErrors,
                occurrencesResult: null
            };

            // Cache the result
            cache.current.set(cacheKey, result);

            // Update errors state for UI display
            setErrors(allErrors);

            return result;
        }
    }, [dateValidation, leaveValidation, userId, validateRecurrencePattern, validateOccurrencesConflicts, statistics, updateCacheStatistics, errors, conflictDetection]);

    const hasError = useCallback((fieldName: string) => {
        return errors.some(error => error.field === fieldName);
    }, [errors]);

    const getErrorMessage = useCallback((fieldName: string) => {
        const error = errors.find(error => error.field === fieldName);
        return error ? error.message : null;
    }, [errors]);

    const getErrorType = useCallback((fieldName: string) => {
        const error = errors.find(error => error.field === fieldName);
        return error ? error.type : null;
    }, [errors]);

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
        validateLeaveRequest: leaveValidation.validateLeaveRequest,
        context: leaveValidation.context,
        setContext: leaveValidation.setContext
    };
}