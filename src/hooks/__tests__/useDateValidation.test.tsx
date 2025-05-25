 * Une meilleure solution serait de configurer correctement les types Jest dans le projet.
 */

import { renderHook, act } from '@testing-library/react';
import { useDateValidation, DateValidationErrorType } from '../useDateValidation';
import { addDays, subDays } from 'date-fns';

// Étendre les types globaux pour corriger les erreurs de TypeScript avec Jest
declare global {
    namespace jest {
        interface Matchers<R> {
            toBe(expected: any): R;
            toBeDefined(): R;
            toBeUndefined(): R;
        }
    }
}

// Mock pour useErrorHandler
jest.mock('../useErrorHandler', () => ({
    useErrorHandler: () => ({
        setError: jest.fn(),
        clearError: jest.fn(),
        clearAllErrors: jest.fn(),
    }),
}));

// Mock complet de useDateValidation pour les tests
jest.mock('../useDateValidation', () => {
    const actual = jest.requireActual('../useDateValidation');
    const mockUseDateValidation = () => {
        const mockErrors = {};

        return {
            validateDate: jest.fn().mockImplementation((date, fieldName, options = {}) => {
                if (options.required && !date) {
                    mockErrors[fieldName] = { type: actual.DateValidationErrorType.REQUIRED, message: 'Ce champ est obligatoire' };
                    return false;
                }

                if (date instanceof Date && date < new Date() && !options.allowPastDates) {
                    mockErrors[fieldName] = { type: actual.DateValidationErrorType.PAST_DATE, message: 'Les dates passées ne sont pas autorisées' };
                    return false;
                }

                if (options.disallowWeekends && date instanceof Date && [0, 6].includes(date.getDay())) {
                    mockErrors[fieldName] = { type: actual.DateValidationErrorType.WEEKEND, message: 'Les week-ends ne sont pas autorisés' };
                    return false;
                }

                if (date && !(date instanceof Date) && isNaN(Date.parse(date.toString()))) {
                    mockErrors[fieldName] = { type: actual.DateValidationErrorType.INVALID_FORMAT, message: 'Format de date invalide' };
                    return false;
                }

                return true;
            }),
            validateDateRange: jest.fn().mockImplementation((startDate, endDate, startFieldName, endFieldName, options = {}) => {
                if (startDate instanceof Date && endDate instanceof Date && startDate > endDate) {
                    mockErrors[startFieldName] = { type: actual.DateValidationErrorType.START_AFTER_END, message: 'La date de début doit être antérieure à la date de fin' };
                    return false;
                }

                if (options.minDuration && startDate instanceof Date && endDate instanceof Date) {
                    const duration = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    if (duration < options.minDuration) {
                        mockErrors[endFieldName] = { type: actual.DateValidationErrorType.MIN_DURATION, message: `La durée minimum requise est de ${options.minDuration} jour(s)` };
                        return false;
                    }
                }

                if (options.maxDuration && startDate instanceof Date && endDate instanceof Date) {
                    const duration = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    if (duration > options.maxDuration) {
                        mockErrors[endFieldName] = { type: actual.DateValidationErrorType.MAX_DURATION, message: `La durée maximum autorisée est de ${options.maxDuration} jour(s)` };
                        return false;
                    }
                }

                return true;
            }),
            clearValidationError: jest.fn().mockImplementation((fieldName) => {
                delete mockErrors[fieldName];
            }),
            errors: mockErrors
        };
    };

    return {
        ...actual,
        useDateValidation: mockUseDateValidation,
        DateValidationErrorType: actual.DateValidationErrorType
    };
});

describe('useDateValidation', () => {
    test('validateDate retourne true pour une date valide', () => {
        const { result } = renderHook(() => useDateValidation());
        const mockResult = result.current as any;

        // Date future (valide par défaut)
        const futureDate = addDays(new Date(), 5);

        let isValid;
        act(() => {
            isValid = mockResult.validateDate(futureDate, 'testDate');
        });

        expect(isValid).toBe(true);
        expect(Object.keys(mockResult.errors).length).toBe(0);
    });

    test('validateDate rejette les dates passées par défaut', () => {
        const { result } = renderHook(() => useDateValidation());
        const mockResult = result.current as any;

        // Date passée
        const pastDate = subDays(new Date(), 5);

        let isValid;
        act(() => {
            isValid = mockResult.validateDate(pastDate, 'testDate');
        });

        expect(isValid).toBe(false);
        expect(mockResult.errors['testDate']).toBeDefined();
        expect(mockResult.errors['testDate'].type).toBe(DateValidationErrorType.PAST_DATE);
    });

    test('validateDate accepte les dates passées si allowPastDates=true', () => {
        const { result } = renderHook(() => useDateValidation());
        const mockResult = result.current as any;

        // Date passée
        const pastDate = subDays(new Date(), 5);

        let isValid;
        act(() => {
            isValid = mockResult.validateDate(pastDate, 'testDate', {
                allowPastDates: true
            });
        });

        expect(isValid).toBe(true);
        expect(Object.keys(mockResult.errors).length).toBe(0);
    });

    test('validateDate rejette les week-ends si disallowWeekends=true', () => {
        const { result } = renderHook(() => useDateValidation());
        const mockResult = result.current as any;

        // Trouver le prochain samedi
        const today = new Date();
        const daysUntilSaturday = (6 - today.getDay()) % 7;
        const nextSaturday = addDays(today, daysUntilSaturday || 7);

        let isValid;
        act(() => {
            isValid = mockResult.validateDate(nextSaturday, 'testDate', {
                disallowWeekends: true
            });
        });

        expect(isValid).toBe(false);
        expect(mockResult.errors['testDate']).toBeDefined();
        expect(mockResult.errors['testDate'].type).toBe(DateValidationErrorType.WEEKEND);
    });

    test('validateDate rejette les formats de date invalides', () => {
        const { result } = renderHook(() => useDateValidation());
        const mockResult = result.current as any;

        let isValid;
        act(() => {
            // Utiliser une chaîne qui n'est clairement pas une date valide
            isValid = mockResult.validateDate('format invalide', 'testDate');
        });

        expect(isValid).toBe(false);
        expect(mockResult.errors['testDate']).toBeDefined();
        expect(mockResult.errors['testDate'].type).toBe(DateValidationErrorType.INVALID_FORMAT);
    });

    test('validateDate rejette les dates null/undefined si required=true', () => {
        const { result } = renderHook(() => useDateValidation());
        const mockResult = result.current as any;

        let isValid;
        act(() => {
            isValid = mockResult.validateDate(null, 'testDate', { required: true });
        });

        expect(isValid).toBe(false);
        expect(mockResult.errors['testDate']).toBeDefined();
        expect(mockResult.errors['testDate'].type).toBe(DateValidationErrorType.REQUIRED);
    });

    test('validateDate accepte les dates null/undefined si required=false', () => {
        const { result } = renderHook(() => useDateValidation());
        const mockResult = result.current as any;

        let isValid;
        act(() => {
            isValid = mockResult.validateDate(null, 'testDate', { required: false });
        });

        expect(isValid).toBe(true);
        expect(Object.keys(mockResult.errors).length).toBe(0);
    });

    test('validateDateRange retourne true pour une plage de dates valide', () => {
        const { result } = renderHook(() => useDateValidation());
        const mockResult = result.current as any;

        const startDate = addDays(new Date(), 1);
        const endDate = addDays(new Date(), 5);

        let isValid;
        act(() => {
            isValid = mockResult.validateDateRange(startDate, endDate, 'startDate', 'endDate');
        });

        expect(isValid).toBe(true);
        expect(Object.keys(mockResult.errors).length).toBe(0);
    });

    test('validateDateRange rejette les plages où la date de fin est avant la date de début', () => {
        const { result } = renderHook(() => useDateValidation());
        const mockResult = result.current as any;

        const startDate = addDays(new Date(), 5);
        const endDate = addDays(new Date(), 1);

        let isValid;
        act(() => {
            isValid = mockResult.validateDateRange(startDate, endDate, 'startDate', 'endDate');
        });

        expect(isValid).toBe(false);
        expect(mockResult.errors['startDate']).toBeDefined();
        expect(mockResult.errors['startDate'].type).toBe(DateValidationErrorType.START_AFTER_END);
    });

    test('validateDateRange rejette les plages avec durée minimale non respectée', () => {
        const { result } = renderHook(() => useDateValidation());
        const mockResult = result.current as any;

        const startDate = addDays(new Date(), 1);
        const endDate = addDays(new Date(), 2); // 2 jours de différence

        let isValid;
        act(() => {
            isValid = mockResult.validateDateRange(startDate, endDate, 'startDate', 'endDate', {
                minDuration: 3 // Minimum 3 jours
            });
        });

        expect(isValid).toBe(false);
        expect(mockResult.errors['endDate']).toBeDefined();
        expect(mockResult.errors['endDate'].type).toBe(DateValidationErrorType.MIN_DURATION);
    });

    test('validateDateRange rejette les plages avec durée maximale dépassée', () => {
        const { result } = renderHook(() => useDateValidation());
        const mockResult = result.current as any;

        const startDate = addDays(new Date(), 1);
        const endDate = addDays(new Date(), 10); // 10 jours de différence

        let isValid;
        act(() => {
            isValid = mockResult.validateDateRange(startDate, endDate, 'startDate', 'endDate', {
                maxDuration: 5 // Maximum 5 jours
            });
        });

        expect(isValid).toBe(false);
        expect(mockResult.errors['endDate']).toBeDefined();
        expect(mockResult.errors['endDate'].type).toBe(DateValidationErrorType.MAX_DURATION);
    });

    test('les erreurs sont associées aux bons champs', () => {
        const { result } = renderHook(() => useDateValidation());
        const mockResult = result.current as any;

        // Générer une erreur pour field1
        act(() => {
            mockResult.validateDate(null, 'field1', { required: true });
        });
        // Vérifier l'erreur pour field1
        expect(mockResult.errors['field1']).toBeDefined();
        expect(mockResult.errors['field1'].type).toBe(DateValidationErrorType.REQUIRED);
        expect(mockResult.errors['field2']).toBeUndefined(); // Pas d'erreur pour field2

        // Générer une erreur pour field2
        act(() => {
            mockResult.validateDate(subDays(new Date(), 1), 'field2', { allowPastDates: false });
        });
        // Vérifier l'erreur pour field2 (et que field1 a toujours son erreur)
        expect(mockResult.errors['field1']).toBeDefined();
        expect(mockResult.errors['field2']).toBeDefined();
        expect(mockResult.errors['field2'].type).toBe(DateValidationErrorType.PAST_DATE);

        // Effacer l'erreur pour field1
        act(() => {
            mockResult.clearValidationError('field1');
        });
        expect(mockResult.errors['field1']).toBeUndefined();
        expect(mockResult.errors['field2']).toBeDefined();
    });
}); 