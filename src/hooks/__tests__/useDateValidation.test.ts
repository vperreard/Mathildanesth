import { renderHook, act } from '@testing-library/react';
import { addDays, subDays, parseISO } from 'date-fns';
import {
    useDateValidation,
    DateValidationErrorType,
    isValidDateString,
    isHoliday,
    isWeekend,
    isBusinessDay,
    datesOverlap,
    calculateDurationInDays,
    calculateBusinessDays,
    formatDate,
    DateRange,
    isInBlackoutPeriod,
    isRangeInBlackoutPeriod,
    findOverlaps,
    normalizeDate
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

        describe('normalizeDate', () => {
            it('convertit correctement une chaîne de date valide', () => {
                const result = normalizeDate('2023-05-15');
                expect(result).toBeInstanceOf(Date);
                expect(result?.getFullYear()).toBe(2023);
                expect(result?.getMonth()).toBe(4); // Mai = 4 (0-indexed)
                expect(result?.getDate()).toBe(15);
            });

            it('retourne null pour une chaîne de date invalide', () => {
                expect(normalizeDate('not-a-date')).toBe(null);
            });

            it('retourne null pour null ou undefined', () => {
                expect(normalizeDate(null)).toBe(null);
                expect(normalizeDate(undefined)).toBe(null);
            });

            it('retourne la date inchangée si c\'est déjà un objet Date', () => {
                const date = new Date(2023, 4, 15);
                expect(normalizeDate(date)).toBe(date);
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

        describe('isBusinessDay', () => {
            const holidays = [
                new Date(2023, 4, 1) // 1er mai 2023
            ];

            it('retourne true pour un jour ouvrable', () => {
                const monday = new Date(2023, 4, 8); // 8 mai 2023 (lundi)
                expect(isBusinessDay(monday, holidays)).toBe(true);
            });

            it('retourne false pour un weekend', () => {
                const saturday = new Date(2023, 4, 6); // 6 mai 2023 (samedi)
                expect(isBusinessDay(saturday, holidays)).toBe(false);
            });

            it('retourne false pour un jour férié', () => {
                const holiday = new Date(2023, 4, 1); // 1er mai 2023
                expect(isBusinessDay(holiday, holidays)).toBe(false);
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

        describe('findOverlaps', () => {
            it('trouve tous les chevauchements dans une liste de plages', () => {
                const testRange: DateRange = {
                    start: new Date(2023, 4, 5),
                    end: new Date(2023, 4, 10)
                };

                const ranges: DateRange[] = [
                    { start: new Date(2023, 4, 1), end: new Date(2023, 4, 4) }, // Pas de chevauchement
                    { start: new Date(2023, 4, 3), end: new Date(2023, 4, 7) }, // Chevauchement
                    { start: new Date(2023, 4, 8), end: new Date(2023, 4, 12) }, // Chevauchement
                    { start: new Date(2023, 4, 11), end: new Date(2023, 4, 15) } // Pas de chevauchement
                ];

                const overlaps = findOverlaps(testRange, ranges);
                expect(overlaps.length).toBe(2);
                expect(overlaps).toContainEqual(ranges[1]);
                expect(overlaps).toContainEqual(ranges[2]);
            });

            it('retourne un tableau vide s\'il n\'y a pas de chevauchement', () => {
                const testRange: DateRange = {
                    start: new Date(2023, 4, 5),
                    end: new Date(2023, 4, 10)
                };

                const ranges: DateRange[] = [
                    { start: new Date(2023, 4, 1), end: new Date(2023, 4, 4) },
                    { start: new Date(2023, 4, 11), end: new Date(2023, 4, 15) }
                ];

                const overlaps = findOverlaps(testRange, ranges);
                expect(overlaps.length).toBe(0);
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

        describe('calculateBusinessDays', () => {
            const holidays = [
                new Date(2023, 4, 8) // 8 mai 2023 (lundi)
            ];

            it('calcule correctement les jours ouvrables', () => {
                // Du lundi 1er mai au vendredi 12 mai 2023
                const start = new Date(2023, 4, 1);
                const end = new Date(2023, 4, 12);
                // 1, 2, 3, 4, 5 (weekend), 8 (férié), 9, 10, 11, 12 => 8 jours ouvrables

                expect(calculateBusinessDays(start, end, holidays)).toBe(8);
            });

            it('retourne 0 si tous les jours sont des weekends ou fériés', () => {
                // Du samedi 6 mai au dimanche 7 mai 2023
                const start = new Date(2023, 4, 6);
                const end = new Date(2023, 4, 7);

                expect(calculateBusinessDays(start, end, holidays)).toBe(0);
            });
        });

        describe('isInBlackoutPeriod', () => {
            const blackoutPeriods: DateRange[] = [
                { start: new Date(2023, 4, 1), end: new Date(2023, 4, 5) },
                { start: new Date(2023, 4, 15), end: new Date(2023, 4, 20) }
            ];

            it('détecte une date dans une période blackout', () => {
                expect(isInBlackoutPeriod(new Date(2023, 4, 3), blackoutPeriods)).toBe(true);
            });

            it('détecte une date au début d\'une période blackout', () => {
                expect(isInBlackoutPeriod(new Date(2023, 4, 1), blackoutPeriods)).toBe(true);
            });

            it('détecte une date à la fin d\'une période blackout', () => {
                expect(isInBlackoutPeriod(new Date(2023, 4, 20), blackoutPeriods)).toBe(true);
            });

            it('retourne false pour une date hors période blackout', () => {
                expect(isInBlackoutPeriod(new Date(2023, 4, 10), blackoutPeriods)).toBe(false);
            });
        });

        describe('isRangeInBlackoutPeriod', () => {
            const blackoutPeriods: DateRange[] = [
                { start: new Date(2023, 4, 1), end: new Date(2023, 4, 5) },
                { start: new Date(2023, 4, 15), end: new Date(2023, 4, 20) }
            ];

            it('détecte un chevauchement avec une période blackout', () => {
                const range: DateRange = {
                    start: new Date(2023, 4, 3),
                    end: new Date(2023, 4, 10)
                };

                const result = isRangeInBlackoutPeriod(range, blackoutPeriods);
                expect(result.isInBlackout).toBe(true);
                expect(result.affectedPeriods.length).toBe(1);
                expect(result.affectedPeriods[0]).toBe(blackoutPeriods[0]);
            });

            it('détecte un chevauchement avec plusieurs périodes blackout', () => {
                const range: DateRange = {
                    start: new Date(2023, 4, 3),
                    end: new Date(2023, 4, 18)
                };

                const result = isRangeInBlackoutPeriod(range, blackoutPeriods);
                expect(result.isInBlackout).toBe(true);
                expect(result.affectedPeriods.length).toBe(2);
            });

            it('retourne false pour une plage hors périodes blackout', () => {
                const range: DateRange = {
                    start: new Date(2023, 4, 6),
                    end: new Date(2023, 4, 14)
                };

                const result = isRangeInBlackoutPeriod(range, blackoutPeriods);
                expect(result.isInBlackout).toBe(false);
                expect(result.affectedPeriods.length).toBe(0);
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

            it('gère les erreurs pour les dates invalides', () => {
                const invalidDate = new Date('invalid-date');
                expect(formatDate(invalidDate)).toBe('');
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

            it('rejette une date non-ouvrable avec onlyBusinessDays', () => {
                const { result } = renderHook(() => useDateValidation());
                const saturday = new Date(2023, 4, 6); // 6 mai 2023 (samedi)
                const holiday = new Date(2023, 4, 1); // 1er mai 2023
                const holidays = [holiday];

                act(() => {
                    const isValidWeekend = result.current.validateDate(saturday, 'testDate', {
                        allowPastDates: true,
                        onlyBusinessDays: true
                    });
                    expect(isValidWeekend).toBe(false);

                    const isValidHoliday = result.current.validateDate(holiday, 'holidayDate', {
                        allowPastDates: true,
                        onlyBusinessDays: true,
                        holidays
                    });
                    expect(isValidHoliday).toBe(false);
                });

                expect(result.current.errors.testDate?.type).toBe(DateValidationErrorType.INVALID_BUSINESS_DAYS);
                expect(result.current.errors.holidayDate?.type).toBe(DateValidationErrorType.INVALID_BUSINESS_DAYS);
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

            it('vérifie le délai minimum d\'avertissement', () => {
                const { result } = renderHook(() => useDateValidation());
                const minAdvanceDate = addDays(today, 5); // Date dans 5 jours
                const tooSoonDate = addDays(today, 2); // Date dans 2 jours

                act(() => {
                    const isValidAdvancedEnough = result.current.validateDate(minAdvanceDate, 'validDate', {
                        minAdvanceNotice: 5
                    });
                    expect(isValidAdvancedEnough).toBe(true);

                    const isValidTooSoon = result.current.validateDate(tooSoonDate, 'invalidDate', {
                        minAdvanceNotice: 5
                    });
                    expect(isValidTooSoon).toBe(false);
                });

                expect(result.current.errors.invalidDate?.type).toBe(DateValidationErrorType.MIN_ADVANCE_NOTICE);
                expect(result.current.getErrorDetails('invalidDate')).toHaveProperty('daysNotice', 5);
            });

            it('vérifie le délai maximum de réservation à l\'avance', () => {
                const { result } = renderHook(() => useDateValidation());
                const maxAdvanceDate = addDays(today, 30); // Date dans 30 jours
                const tooFarDate = addDays(today, 60); // Date dans 60 jours

                act(() => {
                    const isValidInRange = result.current.validateDate(maxAdvanceDate, 'validDate', {
                        maxAdvanceBooking: 30
                    });
                    expect(isValidInRange).toBe(true);

                    const isValidTooFar = result.current.validateDate(tooFarDate, 'invalidDate', {
                        maxAdvanceBooking: 30
                    });
                    expect(isValidTooFar).toBe(false);
                });

                expect(result.current.errors.invalidDate?.type).toBe(DateValidationErrorType.MAX_ADVANCE_BOOKING);
                expect(result.current.getErrorDetails('invalidDate')).toHaveProperty('daysAdvance', 30);
            });

            it('vérifie les périodes blackout', () => {
                const { result } = renderHook(() => useDateValidation());
                const blackoutPeriods: DateRange[] = [
                    { start: addDays(today, 5), end: addDays(today, 10) }
                ];

                const beforeBlackout = addDays(today, 3);
                const duringBlackout = addDays(today, 7);
                const afterBlackout = addDays(today, 12);

                act(() => {
                    const isValidBefore = result.current.validateDate(beforeBlackout, 'beforeDate', {
                        blackoutPeriods
                    });
                    expect(isValidBefore).toBe(true);

                    const isValidDuring = result.current.validateDate(duringBlackout, 'duringDate', {
                        blackoutPeriods
                    });
                    expect(isValidDuring).toBe(false);

                    const isValidAfter = result.current.validateDate(afterBlackout, 'afterDate', {
                        blackoutPeriods
                    });
                    expect(isValidAfter).toBe(true);
                });

                expect(result.current.errors.duringDate?.type).toBe(DateValidationErrorType.BLACKOUT_PERIOD);
                expect(result.current.getErrorDetails('duringDate')).toHaveProperty('conflictingPeriods');
            });
        });

        describe('validateDateRange', () => {
            it('valide une plage de dates cohérente', () => {
                const { result } = renderHook(() => useDateValidation());

                act(() => {
                    const isValid = result.current.validateDateRange(tomorrow, dayAfterTomorrow, 'startDate', 'endDate');
                    expect(isValid).toBe(true);
                });

                expect(result.current.errors).toEqual({});
            });

            it('rejette une plage où la date de début est après la date de fin', () => {
                const { result } = renderHook(() => useDateValidation());

                act(() => {
                    const isValid = result.current.validateDateRange(dayAfterTomorrow, tomorrow, 'startDate', 'endDate');
                    expect(isValid).toBe(false);
                });

                expect(result.current.errors.startDate?.type).toBe(DateValidationErrorType.START_AFTER_END);
                expect(result.current.errors.endDate?.type).toBe(DateValidationErrorType.START_AFTER_END);
            });

            it('rejette une plage qui ne respecte pas la durée minimale', () => {
                const { result } = renderHook(() => useDateValidation());
                const endDate = addDays(tomorrow, 2); // 3 jours au total

                act(() => {
                    const isValid = result.current.validateDateRange(tomorrow, endDate, 'startDate', 'endDate', {
                        minDuration: 5
                    });
                    expect(isValid).toBe(false);
                });

                expect(result.current.errors.endDate?.type).toBe(DateValidationErrorType.MIN_DURATION);
            });

            it('rejette une plage qui dépasse la durée maximale', () => {
                const { result } = renderHook(() => useDateValidation());
                const endDate = addDays(tomorrow, 9); // 10 jours au total

                act(() => {
                    const isValid = result.current.validateDateRange(tomorrow, endDate, 'startDate', 'endDate', {
                        maxDuration: 5
                    });
                    expect(isValid).toBe(false);
                });

                expect(result.current.errors.endDate?.type).toBe(DateValidationErrorType.MAX_DURATION);
            });

            it('valide une plage qui respecte les durées min et max', () => {
                const { result } = renderHook(() => useDateValidation());
                const endDate = addDays(tomorrow, 3); // 4 jours au total

                act(() => {
                    const isValid = result.current.validateDateRange(tomorrow, endDate, 'startDate', 'endDate', {
                        minDuration: 3,
                        maxDuration: 5
                    });
                    expect(isValid).toBe(true);
                });

                expect(result.current.errors).toEqual({});
            });

            it('gère correctement les valeurs undefined et null', () => {
                const { result } = renderHook(() => useDateValidation());

                act(() => {
                    // Non requis, donc valide
                    const isValidEmpty = result.current.validateDateRange(undefined, undefined, 'startDate', 'endDate');
                    expect(isValidEmpty).toBe(true);

                    // Requis, donc invalide
                    const isInvalidEmpty = result.current.validateDateRange(undefined, undefined, 'startReq', 'endReq', {
                        required: true
                    });
                    expect(isInvalidEmpty).toBe(false);
                });

                expect(result.current.errors.startReq?.type).toBe(DateValidationErrorType.REQUIRED);
            });

            it('rejette une plage qui chevauche une période blackout', () => {
                const { result } = renderHook(() => useDateValidation());
                const blackoutPeriods: DateRange[] = [
                    { start: addDays(today, 5), end: addDays(today, 10) }
                ];

                const startBeforeBlackout = addDays(today, 3);
                const endDuringBlackout = addDays(today, 7);

                act(() => {
                    const isValid = result.current.validateDateRange(
                        startBeforeBlackout,
                        endDuringBlackout,
                        'startDate',
                        'endDate',
                        { blackoutPeriods }
                    );
                    expect(isValid).toBe(false);
                });

                expect(result.current.errors.endDate?.type).toBe(DateValidationErrorType.BLACKOUT_PERIOD);
                expect(result.current.getErrorDetails('endDate')).toHaveProperty('conflictingPeriods');
            });

            it('calcule correctement les jours ouvrables', () => {
                const { result } = renderHook(() => useDateValidation());

                // Du lundi au vendredi (5 jours calendaires, 5 jours ouvrables)
                const monday = new Date(2023, 4, 1);
                const friday = new Date(2023, 4, 5);

                // Du lundi au lundi suivant (8 jours calendaires, 6 jours ouvrables)
                const nextMonday = new Date(2023, 4, 8);

                act(() => {
                    result.current.validateDateRange(
                        monday,
                        friday,
                        'startWeek',
                        'endWeek',
                        {
                            allowPastDates: true,
                            businessDaysOnly: true
                        }
                    );

                    result.current.validateDateRange(
                        monday,
                        nextMonday,
                        'startLong',
                        'endLong',
                        {
                            allowPastDates: true,
                            businessDaysOnly: true
                        }
                    );
                });

                expect(result.current.context.businessDaysCount).toBe(6);
                expect(result.current.context.totalDaysCount).toBe(8);
            });

            it('vérifie le nombre de jours disponibles', () => {
                const { result } = renderHook(() => useDateValidation());

                // Plage de 5 jours
                const start = addDays(today, 1);
                const end = addDays(today, 5);

                act(() => {
                    // Définir le contexte avec 10 jours utilisés sur 20 disponibles
                    result.current.setContext({ usedDays: 10 });

                    // Tester une plage valide (5 jours, il reste 10 jours disponibles)
                    const isValidWithinLimit = result.current.validateDateRange(
                        start,
                        end,
                        'startDate',
                        'endDate',
                        { availableDaysPerYear: 20 }
                    );
                    expect(isValidWithinLimit).toBe(true);

                    // Tester une plage qui dépasse les jours disponibles (15 jours, il reste 10 jours)
                    const longEnd = addDays(today, 15);
                    const isValidExceedsLimit = result.current.validateDateRange(
                        start,
                        longEnd,
                        'startLong',
                        'endLong',
                        { availableDaysPerYear: 20 }
                    );
                    expect(isValidExceedsLimit).toBe(false);
                });

                expect(result.current.errors.endLong?.type).toBe(DateValidationErrorType.EXCEEDS_AVAILABLE_DAYS);
                expect(result.current.getErrorDetails('endLong')).toHaveProperty('remainingDays', 10);
                expect(result.current.getErrorDetails('endLong')).toHaveProperty('requestedDays', 15);
            });
        });

        describe('validateOverlap', () => {
            it('détecte correctement les chevauchements', () => {
                const { result } = renderHook(() => useDateValidation());

                const newRange: DateRange = {
                    start: addDays(today, 5),
                    end: addDays(today, 10)
                };

                const existingRanges: DateRange[] = [
                    { start: addDays(today, 1), end: addDays(today, 3) }, // Pas de chevauchement
                    {
                        start: addDays(today, 8),
                        end: addDays(today, 15),
                        label: 'Vacances d\'été'
                    } // Chevauchement
                ];

                act(() => {
                    const isValid = result.current.validateOverlap(newRange, existingRanges, 'rangeField');
                    expect(isValid).toBe(false);
                });

                expect(result.current.errors.rangeField?.type).toBe(DateValidationErrorType.OVERLAPPING);
                expect(result.current.errors.rangeField?.message).toContain('Vacances d\'été');
                expect(result.current.getErrorDetails('rangeField')).toHaveProperty('overlappingRanges');
                expect(result.current.getErrorDetails('rangeField').overlappingRanges).toHaveLength(1);
            });

            it('accepte les plages sans chevauchement', () => {
                const { result } = renderHook(() => useDateValidation());

                const newRange: DateRange = {
                    start: addDays(today, 5),
                    end: addDays(today, 10)
                };

                const existingRanges: DateRange[] = [
                    { start: addDays(today, 1), end: addDays(today, 3) },
                    { start: addDays(today, 12), end: addDays(today, 15) }
                ];

                act(() => {
                    const isValid = result.current.validateOverlap(newRange, existingRanges, 'rangeField');
                    expect(isValid).toBe(true);
                });

                expect(result.current.errors.rangeField).toBeUndefined();
            });

            it('stocke les informations de conflit dans le contexte', () => {
                const { result } = renderHook(() => useDateValidation());

                const newRange: DateRange = {
                    start: addDays(today, 5),
                    end: addDays(today, 10)
                };

                const existingRanges: DateRange[] = [
                    { start: addDays(today, 1), end: addDays(today, 6) },
                    { start: addDays(today, 9), end: addDays(today, 15) }
                ];

                act(() => {
                    const isValid = result.current.validateOverlap(newRange, existingRanges, 'rangeField');
                    expect(isValid).toBe(false);
                });

                expect(result.current.context.conflicts).toHaveLength(2);
                expect(result.current.context.conflicts?.[0]).toBe(existingRanges[0]);
                expect(result.current.context.conflicts?.[1]).toBe(existingRanges[1]);
            });
        });

        describe('Gestion du contexte et des erreurs', () => {
            it('permet de définir et réinitialiser le contexte', () => {
                const { result } = renderHook(() => useDateValidation());

                act(() => {
                    result.current.setContext({ usedDays: 15, remainingDays: 5 });
                });

                expect(result.current.context.usedDays).toBe(15);
                expect(result.current.context.remainingDays).toBe(5);

                act(() => {
                    result.current.resetContext();
                });

                expect(result.current.context.usedDays).toBeUndefined();
                expect(result.current.context.remainingDays).toBeUndefined();
            });

            it('fournit des méthodes d\'aide pour accéder aux erreurs', () => {
                const { result } = renderHook(() => useDateValidation());

                act(() => {
                    // Créer une erreur
                    result.current.validateDate(yesterday, 'testDate');
                });

                expect(result.current.hasError('testDate')).toBe(true);
                expect(result.current.getErrorMessage('testDate')).toContain('passé');
                expect(result.current.getErrorType('testDate')).toBe(DateValidationErrorType.PAST_DATE);

                act(() => {
                    // Réinitialiser les erreurs
                    result.current.resetErrors();
                });

                expect(result.current.hasError('testDate')).toBe(false);
                expect(result.current.getErrorMessage('testDate')).toBeNull();
                expect(result.current.getErrorType('testDate')).toBeNull();
            });

            it('permet de réinitialiser tout (erreurs et contexte)', () => {
                const { result } = renderHook(() => useDateValidation());

                act(() => {
                    // Créer une erreur et définir le contexte
                    result.current.validateDate(yesterday, 'testDate');
                    result.current.setContext({ usedDays: 15 });
                });

                expect(result.current.hasError('testDate')).toBe(true);
                expect(result.current.context.usedDays).toBe(15);

                act(() => {
                    // Réinitialiser tout
                    result.current.resetAll();
                });

                expect(result.current.hasError('testDate')).toBe(false);
                expect(result.current.context.usedDays).toBeUndefined();
            });
        });
    });

    describe('Fonctions spécifiques', () => {
        describe('validateLeaveRequest', () => {
            it('valide une demande de congés correcte', () => {
                const { result } = renderHook(() => useDateValidation());

                // Initialiser le contexte avec des jours utilisés
                act(() => {
                    result.current.setContext({ usedDays: 10 });
                });

                const startDate = addDays(today, 5); // 5 jours dans le futur
                const endDate = addDays(today, 10); // 10 jours dans le futur

                act(() => {
                    const isValid = result.current.validateLeaveRequest(
                        startDate,
                        endDate,
                        'user123',
                        { availableDaysPerYear: 25 }
                    );

                    expect(isValid).toBe(true);
                    expect(result.current.hasError('leave_start_user123')).toBe(false);
                    expect(result.current.hasError('leave_end_user123')).toBe(false);
                });
            });

            it('rejette une demande dépassant le quota disponible', () => {
                const { result } = renderHook(() => useDateValidation());

                // Initialiser le contexte avec des jours utilisés
                act(() => {
                    result.current.setContext({ usedDays: 20 });
                });

                const startDate = addDays(today, 5);
                const endDate = addDays(today, 10); // 6 jours au total

                act(() => {
                    const isValid = result.current.validateLeaveRequest(
                        startDate,
                        endDate,
                        'user123',
                        { availableDaysPerYear: 25 }
                    );

                    expect(isValid).toBe(false);
                    expect(result.current.hasError('leave_end_user123')).toBe(true);
                    expect(result.current.getErrorType('leave_end_user123')).toBe(DateValidationErrorType.EXCEEDS_AVAILABLE_DAYS);
                });
            });

            it('respecte la période minimale d\'avance pour la demande', () => {
                const { result } = renderHook(() => useDateValidation());

                const startDate = addDays(today, 1); // Seulement 1 jour d'avance
                const endDate = addDays(today, 5);

                act(() => {
                    const isValid = result.current.validateLeaveRequest(
                        startDate,
                        endDate,
                        'user123',
                        { minAdvanceNotice: 3 } // Minimum 3 jours d'avance
                    );

                    expect(isValid).toBe(false);
                    expect(result.current.hasError('leave_start_user123')).toBe(true);
                    expect(result.current.getErrorType('leave_start_user123')).toBe(DateValidationErrorType.MIN_ADVANCE_NOTICE);
                });
            });
        });

        describe('validateShiftAssignment', () => {
            it('valide une affectation de garde correcte', () => {
                const { result } = renderHook(() => useDateValidation());

                const shiftDate = addDays(today, 2); // 2 jours dans le futur

                act(() => {
                    const isValid = result.current.validateShiftAssignment(
                        shiftDate,
                        'nuit',
                        'user123'
                    );

                    expect(isValid).toBe(true);
                    expect(result.current.hasError('shift_nuit_user123')).toBe(false);
                });
            });

            it('rejette une garde pendant une période de repos obligatoire', () => {
                const { result } = renderHook(() => useDateValidation());

                const previousShiftDate = addDays(today, 1);
                const newShiftDate = addDays(today, 2);

                // Créer une période de repos (24h après la garde précédente)
                const blackoutPeriods: DateRange[] = [
                    {
                        start: previousShiftDate,
                        end: addDays(previousShiftDate, 1),
                        type: 'rest_period',
                        label: 'Repos après garde user123'
                    }
                ];

                act(() => {
                    const isValid = result.current.validateShiftAssignment(
                        newShiftDate,
                        'jour',
                        'user123',
                        { blackoutPeriods }
                    );

                    expect(isValid).toBe(false);
                    expect(result.current.hasError('shift_jour_user123')).toBe(true);
                    expect(result.current.getErrorType('shift_jour_user123')).toBe(DateValidationErrorType.BLACKOUT_PERIOD);
                });
            });

            it('rejette une garde dans le passé', () => {
                const { result } = renderHook(() => useDateValidation());

                const shiftDate = subDays(today, 1); // 1 jour dans le passé

                act(() => {
                    const isValid = result.current.validateShiftAssignment(
                        shiftDate,
                        'matin',
                        'user123'
                    );

                    expect(isValid).toBe(false);
                    expect(result.current.hasError('shift_matin_user123')).toBe(true);
                    expect(result.current.getErrorType('shift_matin_user123')).toBe(DateValidationErrorType.PAST_DATE);
                });
            });
        });

        describe('detectConflicts', () => {
            it('détecte un conflit avec un événement existant', () => {
                const { result } = renderHook(() => useDateValidation());

                const eventDate = addDays(today, 5);

                // Événements existants
                const existingEvents: DateRange[] = [
                    {
                        start: addDays(today, 4),
                        end: addDays(today, 6),
                        type: 'leave_user123',
                        label: 'Congés user123'
                    },
                    {
                        start: addDays(today, 10),
                        end: addDays(today, 15),
                        type: 'leave_user456',
                        label: 'Congés user456'
                    }
                ];

                act(() => {
                    const isValid = result.current.detectConflicts(
                        'user123',
                        eventDate,
                        'shift',
                        existingEvents
                    );

                    expect(isValid).toBe(false);
                    expect(result.current.hasError('conflict_shift_user123')).toBe(true);
                    expect(result.current.getErrorType('conflict_shift_user123')).toBe(DateValidationErrorType.OVERLAPPING);
                });
            });

            it('ne détecte pas de conflit quand il n\'y en a pas', () => {
                const { result } = renderHook(() => useDateValidation());

                const eventDate = addDays(today, 8);

                // Événements existants
                const existingEvents: DateRange[] = [
                    {
                        start: addDays(today, 4),
                        end: addDays(today, 6),
                        type: 'leave_user123',
                        label: 'Congés user123'
                    },
                    {
                        start: addDays(today, 10),
                        end: addDays(today, 15),
                        type: 'leave_user456',
                        label: 'Congés user456'
                    }
                ];

                act(() => {
                    const isValid = result.current.detectConflicts(
                        'user123',
                        eventDate,
                        'shift',
                        existingEvents
                    );

                    expect(isValid).toBe(true);
                    expect(result.current.hasError('conflict_shift_user123')).toBe(false);
                });
            });

            it('ignore les événements d\'autres utilisateurs', () => {
                const { result } = renderHook(() => useDateValidation());

                const eventDate = addDays(today, 12);

                // Événements existants
                const existingEvents: DateRange[] = [
                    {
                        start: addDays(today, 4),
                        end: addDays(today, 6),
                        type: 'leave_user123',
                        label: 'Congés user123'
                    },
                    {
                        start: addDays(today, 10),
                        end: addDays(today, 15),
                        type: 'leave_user456',
                        label: 'Congés user456'
                    }
                ];

                act(() => {
                    const isValid = result.current.detectConflicts(
                        'user123',
                        eventDate,
                        'shift',
                        existingEvents
                    );

                    expect(isValid).toBe(true);
                    expect(result.current.hasError('conflict_shift_user123')).toBe(false);
                });
            });
        });
    });
}); 