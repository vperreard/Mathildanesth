import { renderHook, act } from '@testing-library/react';
import { addDays, subDays } from 'date-fns';
import {
    useDateValidation,
    DateValidationErrorType,
    isValidDateString,
    isHoliday,
    isWeekend,
    datesOverlap,
    calculateDurationInDays,
    formatDate,
    DateRange
} from '../useDateValidation';

describe('useDateValidation', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = addDays(today, 1);
    const dayAfterTomorrow = addDays(today, 2);
    const yesterday = subDays(today, 1);

    describe('Fonctions utilitaires', () => {
        describe('isValidDateString', () => {
            it('retourne true pour une chaîne de date valide', () => {
                expect(isValidDateString('2023-05-15')).toBe(true);
            });

            it('retourne false pour une chaîne de date invalide', () => {
                expect(isValidDateString('not-a-date')).toBe(false);
            });

            it('retourne false pour une chaîne vide', () => {
                expect(isValidDateString('')).toBe(false);
            });
        });

        describe('isHoliday', () => {
            const holidays = [
                new Date(2023, 0, 1), // 1er janvier 2023
                new Date(2023, 4, 1)  // 1er mai 2023
            ];

            it('retourne true pour un jour férié', () => {
                expect(isHoliday(new Date(2023, 0, 1), holidays)).toBe(true);
            });

            it('retourne false pour un jour non férié', () => {
                expect(isHoliday(new Date(2023, 0, 2), holidays)).toBe(false);
            });

            it('gère correctement un tableau vide de jours fériés', () => {
                expect(isHoliday(new Date(2023, 0, 1), [])).toBe(false);
            });
        });

        describe('isWeekend', () => {
            it('retourne true pour un samedi', () => {
                const saturday = new Date(2023, 4, 6); // 6 mai 2023 (samedi)
                expect(isWeekend(saturday)).toBe(true);
            });

            it('retourne true pour un dimanche', () => {
                const sunday = new Date(2023, 4, 7); // 7 mai 2023 (dimanche)
                expect(isWeekend(sunday)).toBe(true);
            });

            it('retourne false pour un jour de semaine', () => {
                const monday = new Date(2023, 4, 8); // 8 mai 2023 (lundi)
                expect(isWeekend(monday)).toBe(false);
            });
        });

        describe('datesOverlap', () => {
            it('détecte le chevauchement quand la date de début est dans la plage', () => {
                const range1: DateRange = {
                    start: new Date(2023, 4, 5),
                    end: new Date(2023, 4, 10)
                };

                const range2: DateRange = {
                    start: new Date(2023, 4, 3),
                    end: new Date(2023, 4, 7)
                };

                expect(datesOverlap(range1, range2)).toBe(true);
            });

            it('détecte le chevauchement quand la date de fin est dans la plage', () => {
                const range1: DateRange = {
                    start: new Date(2023, 4, 5),
                    end: new Date(2023, 4, 10)
                };

                const range2: DateRange = {
                    start: new Date(2023, 4, 8),
                    end: new Date(2023, 4, 12)
                };

                expect(datesOverlap(range1, range2)).toBe(true);
            });

            it('détecte le chevauchement quand une plage est entièrement incluse dans l\'autre', () => {
                const range1: DateRange = {
                    start: new Date(2023, 4, 5),
                    end: new Date(2023, 4, 15)
                };

                const range2: DateRange = {
                    start: new Date(2023, 4, 8),
                    end: new Date(2023, 4, 12)
                };

                expect(datesOverlap(range1, range2)).toBe(true);
            });

            it('retourne false quand les plages ne se chevauchent pas', () => {
                const range1: DateRange = {
                    start: new Date(2023, 4, 5),
                    end: new Date(2023, 4, 10)
                };

                const range2: DateRange = {
                    start: new Date(2023, 4, 12),
                    end: new Date(2023, 4, 15)
                };

                expect(datesOverlap(range1, range2)).toBe(false);
            });

            it('détecte le chevauchement quand les dates sont identiques', () => {
                const date = new Date(2023, 4, 5);
                const range1: DateRange = {
                    start: date,
                    end: date
                };

                const range2: DateRange = {
                    start: date,
                    end: date
                };

                expect(datesOverlap(range1, range2)).toBe(true);
            });
        });

        describe('calculateDurationInDays', () => {
            it('calcule correctement la durée entre deux dates', () => {
                const start = new Date(2023, 4, 5);
                const end = new Date(2023, 4, 10);

                expect(calculateDurationInDays(start, end)).toBe(6); // 5, 6, 7, 8, 9, 10 => 6 jours
            });

            it('retourne 1 pour le même jour', () => {
                const date = new Date(2023, 4, 5);

                expect(calculateDurationInDays(date, date)).toBe(1);
            });

            it('gère correctement les dates inversées', () => {
                const start = new Date(2023, 4, 10);
                const end = new Date(2023, 4, 5);

                expect(calculateDurationInDays(start, end)).toBe(6);
            });
        });

        describe('formatDate', () => {
            it('formate correctement une date avec le format par défaut', () => {
                const date = new Date(2023, 4, 5); // 5 mai 2023

                expect(formatDate(date)).toBe('05/05/2023');
            });

            it('formate correctement une date avec un format personnalisé', () => {
                const date = new Date(2023, 4, 5); // 5 mai 2023

                expect(formatDate(date, 'dd MMMM yyyy')).toContain('05 mai 2023');
            });
        });
    });

    describe('Hook useDateValidation', () => {
        describe('validateDate', () => {
            it('valide une date dans le futur', () => {
                const { result } = renderHook(() => useDateValidation());

                act(() => {
                    const isValid = result.current.validateDate(tomorrow, 'testDate');
                    expect(isValid).toBe(true);
                });

                expect(result.current.errors).toEqual({});
            });

            it('rejette une date dans le passé par défaut', () => {
                const { result } = renderHook(() => useDateValidation());

                act(() => {
                    const isValid = result.current.validateDate(yesterday, 'testDate');
                    expect(isValid).toBe(false);
                });

                expect(result.current.errors.testDate?.type).toBe(DateValidationErrorType.PAST_DATE);
            });

            it('accepte une date dans le passé avec allowPastDates', () => {
                const { result } = renderHook(() => useDateValidation());

                act(() => {
                    const isValid = result.current.validateDate(yesterday, 'testDate', { allowPastDates: true });
                    expect(isValid).toBe(true);
                });

                expect(result.current.errors).toEqual({});
            });

            it('rejette une date de weekend avec disallowWeekends', () => {
                const { result } = renderHook(() => useDateValidation());
                const saturday = new Date(2023, 4, 6); // 6 mai 2023 (samedi)

                act(() => {
                    const isValid = result.current.validateDate(saturday, 'testDate', {
                        allowPastDates: true,
                        disallowWeekends: true
                    });
                    expect(isValid).toBe(false);
                });

                expect(result.current.errors.testDate?.type).toBe(DateValidationErrorType.WEEKEND);
            });

            it('gère correctement les valeurs undefined et null', () => {
                const { result } = renderHook(() => useDateValidation());

                act(() => {
                    // Non requis, donc valide
                    const isValidUndefined = result.current.validateDate(undefined, 'testDate');
                    expect(isValidUndefined).toBe(true);

                    const isValidNull = result.current.validateDate(null, 'testDate');
                    expect(isValidNull).toBe(true);

                    // Requis, donc invalide
                    const isInvalidUndefined = result.current.validateDate(undefined, 'requiredDate', { required: true });
                    expect(isInvalidUndefined).toBe(false);
                });

                expect(result.current.errors.requiredDate?.type).toBe(DateValidationErrorType.REQUIRED);
            });
        });

        describe('validateDateRange', () => {
            it('valide une plage de dates valide', () => {
                const { result } = renderHook(() => useDateValidation());

                act(() => {
                    const isValid = result.current.validateDateRange(
                        tomorrow,
                        dayAfterTomorrow,
                        'startDate',
                        'endDate'
                    );
                    expect(isValid).toBe(true);
                });

                expect(result.current.errors).toEqual({});
            });

            it('rejette une plage où la date de début est après la date de fin', () => {
                const { result } = renderHook(() => useDateValidation());

                act(() => {
                    const isValid = result.current.validateDateRange(
                        dayAfterTomorrow,
                        tomorrow,
                        'startDate',
                        'endDate'
                    );
                    expect(isValid).toBe(false);
                });

                expect(result.current.errors.startDate?.type).toBe(DateValidationErrorType.START_AFTER_END);
                expect(result.current.errors.endDate?.type).toBe(DateValidationErrorType.START_AFTER_END);
            });

            it('vérifie la durée minimale', () => {
                const { result } = renderHook(() => useDateValidation());

                act(() => {
                    const isValid = result.current.validateDateRange(
                        tomorrow,
                        tomorrow,
                        'startDate',
                        'endDate',
                        { minDuration: 2 }
                    );
                    expect(isValid).toBe(false);
                });

                expect(result.current.errors.endDate?.type).toBe(DateValidationErrorType.MIN_DURATION);
            });

            it('vérifie la durée maximale', () => {
                const { result } = renderHook(() => useDateValidation());

                const start = tomorrow;
                const end = addDays(tomorrow, 10); // 11 jours au total

                act(() => {
                    const isValid = result.current.validateDateRange(
                        start,
                        end,
                        'startDate',
                        'endDate',
                        { maxDuration: 10 }
                    );
                    expect(isValid).toBe(false);
                });

                expect(result.current.errors.endDate?.type).toBe(DateValidationErrorType.MAX_DURATION);
            });

            it('permet aux deux dates d\'être vides si non requises', () => {
                const { result } = renderHook(() => useDateValidation());

                act(() => {
                    const isValid = result.current.validateDateRange(
                        null,
                        null,
                        'startDate',
                        'endDate'
                    );
                    expect(isValid).toBe(true);
                });

                expect(result.current.errors).toEqual({});
            });
        });

        describe('validateOverlap', () => {
            it('détecte les chevauchements', () => {
                const { result } = renderHook(() => useDateValidation());

                const newRange: DateRange = {
                    start: new Date(2023, 4, 5),
                    end: new Date(2023, 4, 10)
                };

                const existingRanges: DateRange[] = [
                    {
                        start: new Date(2023, 4, 3),
                        end: new Date(2023, 4, 7)
                    }
                ];

                act(() => {
                    const isValid = result.current.validateOverlap(newRange, existingRanges, 'dateRange');
                    expect(isValid).toBe(false);
                });

                expect(result.current.errors.dateRange?.type).toBe(DateValidationErrorType.OVERLAPPING);
            });

            it('accepte des plages sans chevauchement', () => {
                const { result } = renderHook(() => useDateValidation());

                const newRange: DateRange = {
                    start: new Date(2023, 4, 5),
                    end: new Date(2023, 4, 10)
                };

                const existingRanges: DateRange[] = [
                    {
                        start: new Date(2023, 4, 12),
                        end: new Date(2023, 4, 15)
                    }
                ];

                act(() => {
                    const isValid = result.current.validateOverlap(newRange, existingRanges, 'dateRange');
                    expect(isValid).toBe(true);
                });

                expect(result.current.errors).toEqual({});
            });
        });

        describe('getErrorMessage et hasError', () => {
            it('retourne le message d\'erreur pour un champ', () => {
                const { result } = renderHook(() => useDateValidation());

                act(() => {
                    result.current.validateDate(yesterday, 'testDate');
                });

                expect(result.current.getErrorMessage('testDate')).toBe('La date ne peut pas être dans le passé');
                expect(result.current.hasError('testDate')).toBe(true);
            });

            it('retourne null pour un champ sans erreur', () => {
                const { result } = renderHook(() => useDateValidation());

                expect(result.current.getErrorMessage('nonExistentField')).toBeNull();
                expect(result.current.hasError('nonExistentField')).toBe(false);
            });
        });

        describe('resetErrors', () => {
            it('réinitialise toutes les erreurs', () => {
                const { result } = renderHook(() => useDateValidation());

                act(() => {
                    result.current.validateDate(yesterday, 'testDate');
                    expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);

                    result.current.resetErrors();
                });

                expect(result.current.errors).toEqual({});
            });
        });
    });
}); 