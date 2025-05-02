import { renderHook, act } from '@testing-library/react';
import { useDateValidation, DateValidationErrorType } from '../useDateValidation';
import { addDays, subDays } from 'date-fns';

// Mock pour useErrorHandler
jest.mock('../useErrorHandler', () => ({
    useErrorHandler: () => ({
        setError: jest.fn(),
        clearError: jest.fn(),
        clearAllErrors: jest.fn(),
    }),
}));

describe('useDateValidation', () => {
    test('validateDate retourne true pour une date valide', () => {
        const { result } = renderHook(() => useDateValidation());

        // Date future (valide par défaut)
        const futureDate = addDays(new Date(), 5);

        let isValid;
        act(() => {
            isValid = result.current.validateDate(futureDate, 'testDate');
        });

        expect(isValid).toBe(true);
        expect(result.current.errors).toHaveLength(0);
    });

    test('validateDate rejette les dates passées par défaut', () => {
        const { result } = renderHook(() => useDateValidation());

        // Date passée
        const pastDate = subDays(new Date(), 5);

        let isValid;
        act(() => {
            isValid = result.current.validateDate(pastDate, 'testDate');
        });

        expect(isValid).toBe(false);
        expect(result.current.errors).toHaveLength(1);
        expect(result.current.errors[0].type).toBe(DateValidationErrorType.PAST_DATE);
        expect(result.current.errors[0].field).toBe('testDate');
    });

    test('validateDate accepte les dates passées si allowPastDates=true', () => {
        const { result } = renderHook(() => useDateValidation());

        // Date passée
        const pastDate = subDays(new Date(), 5);

        let isValid;
        act(() => {
            isValid = result.current.validateDate(pastDate, 'testDate', {
                allowPastDates: true
            });
        });

        expect(isValid).toBe(true);
        expect(result.current.errors).toHaveLength(0);
    });

    test('validateDate rejette les week-ends si disallowWeekends=true', () => {
        const { result } = renderHook(() => useDateValidation());

        // Trouver le prochain samedi
        const today = new Date();
        const daysUntilSaturday = (6 - today.getDay()) % 7;
        const nextSaturday = addDays(today, daysUntilSaturday || 7);

        let isValid;
        act(() => {
            isValid = result.current.validateDate(nextSaturday, 'testDate', {
                disallowWeekends: true
            });
        });

        expect(isValid).toBe(false);
        expect(result.current.errors).toHaveLength(1);
        expect(result.current.errors[0].type).toBe(DateValidationErrorType.WEEKEND);
    });

    test('validateDate rejette les formats de date invalides', () => {
        const { result } = renderHook(() => useDateValidation());

        let isValid;
        act(() => {
            isValid = result.current.validateDate('date invalide', 'testDate');
        });

        expect(isValid).toBe(false);
        expect(result.current.errors).toHaveLength(1);
        expect(result.current.errors[0].type).toBe(DateValidationErrorType.INVALID_FORMAT);
    });

    test('validateDate rejette les dates null/undefined si required=true', () => {
        const { result } = renderHook(() => useDateValidation());

        let isValid;
        act(() => {
            isValid = result.current.validateDate(null, 'testDate', { required: true });
        });

        expect(isValid).toBe(false);
        expect(result.current.errors).toHaveLength(1);
        expect(result.current.errors[0].type).toBe(DateValidationErrorType.REQUIRED);
    });

    test('validateDate accepte les dates null/undefined si required=false', () => {
        const { result } = renderHook(() => useDateValidation());

        let isValid;
        act(() => {
            isValid = result.current.validateDate(null, 'testDate', { required: false });
        });

        expect(isValid).toBe(true);
        expect(result.current.errors).toHaveLength(0);
    });

    test('validateDateRange retourne true pour une plage de dates valide', () => {
        const { result } = renderHook(() => useDateValidation());

        const startDate = addDays(new Date(), 1);
        const endDate = addDays(new Date(), 5);

        let isValid;
        act(() => {
            isValid = result.current.validateDateRange(startDate, endDate, 'startDate', 'endDate');
        });

        expect(isValid).toBe(true);
        expect(result.current.errors).toHaveLength(0);
    });

    test('validateDateRange rejette les plages où la date de fin est avant la date de début', () => {
        const { result } = renderHook(() => useDateValidation());

        const startDate = addDays(new Date(), 5);
        const endDate = addDays(new Date(), 1);

        let isValid;
        act(() => {
            isValid = result.current.validateDateRange(startDate, endDate, 'startDate', 'endDate');
        });

        expect(isValid).toBe(false);
        expect(result.current.errors.length).toBeGreaterThan(0);
        expect(result.current.errors.some(e => e.type === DateValidationErrorType.START_AFTER_END)).toBe(true);
    });

    test('validateDateRange rejette les plages avec durée minimale non respectée', () => {
        const { result } = renderHook(() => useDateValidation());

        const startDate = addDays(new Date(), 1);
        const endDate = addDays(new Date(), 2); // 2 jours de différence

        let isValid;
        act(() => {
            isValid = result.current.validateDateRange(startDate, endDate, 'startDate', 'endDate', {
                minDuration: 3 // Minimum 3 jours
            });
        });

        expect(isValid).toBe(false);
        expect(result.current.errors.length).toBeGreaterThan(0);
        expect(result.current.errors.some(e => e.type === DateValidationErrorType.MIN_DURATION)).toBe(true);
    });

    test('validateDateRange rejette les plages avec durée maximale dépassée', () => {
        const { result } = renderHook(() => useDateValidation());

        const startDate = addDays(new Date(), 1);
        const endDate = addDays(new Date(), 10); // 10 jours de différence

        let isValid;
        act(() => {
            isValid = result.current.validateDateRange(startDate, endDate, 'startDate', 'endDate', {
                maxDuration: 5 // Maximum 5 jours
            });
        });

        expect(isValid).toBe(false);
        expect(result.current.errors.length).toBeGreaterThan(0);
        expect(result.current.errors.some(e => e.type === DateValidationErrorType.MAX_DURATION)).toBe(true);
    });

    test('les erreurs sont associées aux bons champs', () => {
        const { result } = renderHook(() => useDateValidation());

        // Générer une erreur pour un champ
        act(() => {
            result.current.validateDate(null, 'field1', { required: true });
        });

        // Vérifier que l'erreur est associée au bon champ
        expect(result.current.errors.length).toBeGreaterThan(0);
        expect(result.current.errors.some(e => e.field === 'field1')).toBe(true);

        // Générer une erreur pour un autre champ
        act(() => {
            result.current.validateDate(null, 'field2', { required: true });
        });

        // Vérifier que les deux champs ont des erreurs
        expect(result.current.errors.filter(e => e.field === 'field1').length).toBeGreaterThan(0);
        expect(result.current.errors.filter(e => e.field === 'field2').length).toBeGreaterThan(0);
    });
}); 