import {
    generateRecurringDates,
    formatRecurrencePattern,
    isHoliday
} from '../../../../../src/modules/leaves/utils/recurringLeavesUtils';
import {
    RecurrenceFrequency,
    RecurrenceEndType,
    RecurrencePattern,
    Leave,
    LeaveStatus,
    LeaveType
} from '../../../../../src/modules/leaves/types/leave';
import { addDays, addMonths, addWeeks, addYears, format } from 'date-fns';

describe('recurringLeavesUtils', () => {
    describe('generateRecurringDates', () => {
        const baseRequest = {
            id: 'leave-rec-123',
            startDate: new Date('2023-09-01'),
            endDate: new Date('2023-09-02'),
            patternStartDate: new Date('2023-09-01'),
            patternEndDate: new Date('2023-09-02'),
            userId: 'user1',
            type: LeaveType.ANNUAL,
            reason: 'Congé récurrent test',
            status: LeaveStatus.DRAFT,
            requestDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            countedDays: 2,
            isRecurring: true,
            recurrencePattern: {
                frequency: RecurrenceFrequency.WEEKLY,
                interval: 1,
                weekdays: [1], // Lundi
                endType: RecurrenceEndType.UNTIL_DATE,
                endDate: new Date('2023-12-31'),
                skipWeekends: false,
                skipHolidays: false
            }
        };

        test('devrait générer des occurrences hebdomadaires', () => {
            const result = generateRecurringDates(baseRequest);

            expect(result.occurrences.length).toBeGreaterThan(0);
            expect(result.totalDays).toBeGreaterThan(0);

            // Vérifier que les dates sont toutes des lundis
            result.occurrences.forEach(occurrence => {
                expect(occurrence.startDate.getDay()).toBe(1);

                // Vérifier que la différence entre dates de début et fin est préservée
                const expectedEndDate = addDays(occurrence.startDate, 1);
                expect(format(occurrence.endDate, 'yyyy-MM-dd')).toBe(format(expectedEndDate, 'yyyy-MM-dd'));
            });
        });

        test('devrait respecter la date de fin pour les récurrences', () => {
            const result = generateRecurringDates(baseRequest);

            // Vérifier que toutes les occurrences sont avant la date de fin
            result.occurrences.forEach(occurrence => {
                expect(occurrence.startDate <= baseRequest.recurrencePattern.endDate!).toBe(true);
            });
        });

        test('devrait gérer la limite du nombre d\'occurrences', () => {
            const request = {
                ...baseRequest,
                recurrencePattern: {
                    ...baseRequest.recurrencePattern,
                    endType: RecurrenceEndType.COUNT,
                    endCount: 5
                }
            };

            const result = generateRecurringDates(request);

            expect(result.occurrences.length).toBe(5);
            expect(result.totalDays).toBe(10); // 5 occurrences de 2 jours chacune
        });

        test('devrait correctement gérer les jours fériés dans les occurrences', () => {
            // Liste des jours fériés
            const holidays = [
                new Date('2023-09-04'), // Un lundi qui serait normalement inclus
                new Date('2023-09-18')  // Un autre lundi qui serait normalement inclus
            ];

            // Modifier le modèle pour activer l'exclusion des jours fériés
            const requestWithHolidaySkip = {
                ...baseRequest,
                recurrencePattern: {
                    ...baseRequest.recurrencePattern,
                    skipHolidays: true
                }
            };

            const result = generateRecurringDates(requestWithHolidaySkip, { holidays });

            // Vérifier qu'aucune occurrence ne tombe un jour férié
            const holidayStrings = holidays.map(d => format(d, 'yyyy-MM-dd'));
            result.occurrences.forEach(occurrence => {
                const startDateStr = format(occurrence.startDate, 'yyyy-MM-dd');
                expect(holidayStrings.includes(startDateStr)).toBe(false);
            });
        });

        test('devrait générer des occurrences quotidiennes', () => {
            const request = {
                ...baseRequest,
                countedDays: 2,
                recurrencePattern: {
                    frequency: RecurrenceFrequency.DAILY,
                    interval: 2, // tous les 2 jours
                    endType: RecurrenceEndType.COUNT,
                    endCount: 10,
                    skipWeekends: false,
                    skipHolidays: false
                }
            };

            const result = generateRecurringDates(request);

            expect(result.occurrences.length).toBe(10);

            // Vérifier l'intervalle entre les occurrences
            for (let i = 1; i < result.occurrences.length; i++) {
                const daysDiff = Math.round((result.occurrences[i].startDate.getTime() -
                    result.occurrences[i - 1].startDate.getTime()) / (1000 * 60 * 60 * 24));
                expect(daysDiff).toBe(2);
            }
        });

        test('devrait générer des occurrences mensuelles basées sur le jour du mois', () => {
            const request = {
                ...baseRequest,
                patternStartDate: new Date('2023-09-15'), // Le 15 du mois
                patternEndDate: new Date('2023-09-16'),
                startDate: new Date('2023-09-15'),
                endDate: new Date('2023-09-16'),
                countedDays: 2,
                recurrencePattern: {
                    frequency: RecurrenceFrequency.MONTHLY,
                    interval: 1,
                    dayOfMonth: 15,
                    endType: RecurrenceEndType.COUNT,
                    endCount: 4,
                    skipWeekends: false,
                    skipHolidays: false
                }
            };

            const result = generateRecurringDates(request);

            expect(result.occurrences.length).toBe(4);

            // Vérifier que chaque occurrence est le 15 du mois
            result.occurrences.forEach(occurrence => {
                expect(occurrence.startDate.getDate()).toBe(15);
            });
        });

        test('devrait générer des occurrences annuelles', () => {
            const request = {
                ...baseRequest,
                patternStartDate: new Date('2023-09-15'),
                patternEndDate: new Date('2023-09-16'),
                startDate: new Date('2023-09-15'),
                endDate: new Date('2023-09-16'),
                countedDays: 2,
                recurrencePattern: {
                    frequency: RecurrenceFrequency.YEARLY,
                    interval: 1,
                    endType: RecurrenceEndType.COUNT,
                    endCount: 3,
                    skipWeekends: false,
                    skipHolidays: false
                }
            };

            const result = generateRecurringDates(request);

            expect(result.occurrences.length).toBe(3);

            // Vérifier que les dates sont à un an d'intervalle
            expect(result.occurrences[1].startDate.getFullYear()).toBe(2024);
            expect(result.occurrences[2].startDate.getFullYear()).toBe(2025);
        });

        test('devrait respecter le nombre maximum d\'occurrences', () => {
            const request = {
                ...baseRequest,
                countedDays: 2,
                recurrencePattern: {
                    frequency: RecurrenceFrequency.WEEKLY,
                    interval: 1,
                    weekdays: [1, 2, 3, 4, 5], // Lundi au vendredi
                    endType: RecurrenceEndType.UNTIL_DATE,
                    endDate: new Date('2024-12-31'), // Long terme pour tester les limites
                    skipWeekends: false,
                    skipHolidays: false
                }
            };

            // Définir une limite maximale d'occurrences
            const result = generateRecurringDates(request, {
                maxOccurrences: 25
            });

            // Vérifier que la limite est respectée
            expect(result.occurrences.length).toBeLessThanOrEqual(25);
        });
    });

    describe('formatRecurrencePattern', () => {
        test('devrait formater correctement un modèle quotidien', () => {
            const pattern: RecurrencePattern = {
                frequency: RecurrenceFrequency.DAILY,
                interval: 1,
                endType: RecurrenceEndType.COUNT,
                endCount: 10,
                skipWeekends: false,
                skipHolidays: false
            };

            const formatted = formatRecurrencePattern(pattern);
            expect(formatted).toContain('Tous les jours');
            expect(formatted).toContain('10 occurrences');
        });

        test('devrait formater correctement un modèle hebdomadaire', () => {
            const pattern: RecurrencePattern = {
                frequency: RecurrenceFrequency.WEEKLY,
                interval: 1,
                weekdays: [1, 3, 5], // Lundi, Mercredi, Vendredi
                endType: RecurrenceEndType.NEVER,
                skipWeekends: false,
                skipHolidays: false
            };

            const formatted = formatRecurrencePattern(pattern);
            expect(formatted).toContain('Toutes les semaines');
            expect(formatted).toContain('lundi');
            expect(formatted).toContain('mercredi');
            expect(formatted).toContain('vendredi');
            expect(formatted).toContain('sans fin');
        });

        test('devrait formater correctement un modèle mensuel', () => {
            const pattern: RecurrencePattern = {
                frequency: RecurrenceFrequency.MONTHLY,
                interval: 1,
                dayOfMonth: 15,
                endType: RecurrenceEndType.UNTIL_DATE,
                endDate: new Date('2023-12-31'),
                skipWeekends: false,
                skipHolidays: false
            };

            const formatted = formatRecurrencePattern(pattern);
            expect(formatted).toContain('Tous les mois');
            expect(formatted).toContain('le 15');
            expect(formatted).toContain('31/12/2023');
        });

        test('devrait formater correctement un modèle annuel', () => {
            const pattern: RecurrencePattern = {
                frequency: RecurrenceFrequency.YEARLY,
                interval: 1,
                endType: RecurrenceEndType.NEVER,
                skipWeekends: false,
                skipHolidays: false
            };

            const formatted = formatRecurrencePattern(pattern);
            expect(formatted).toContain('Tous les ans');
            expect(formatted).toContain('sans fin');
        });
    });

    describe('isHoliday', () => {
        it('devrait identifier correctement un jour férié', () => {
            const holidays = [
                new Date('2024-01-01'),
                new Date('2024-05-01'),
                new Date('2024-12-25')
            ];

            expect(isHoliday(new Date('2024-01-01'), holidays)).toBe(true);
            expect(isHoliday(new Date('2024-05-01'), holidays)).toBe(true);
            expect(isHoliday(new Date('2024-12-25'), holidays)).toBe(true);
            expect(isHoliday(new Date('2024-02-14'), holidays)).toBe(false);
        });

        it('devrait retourner false si la liste des jours fériés est vide', () => {
            expect(isHoliday(new Date('2024-01-01'), [])).toBe(false);
        });

        it('devrait gérer correctement les comparaisons de dates (ignorer l\'heure)', () => {
            const holidays = [
                new Date('2024-01-01T00:00:00')
            ];

            // Même jour mais heure différente
            expect(isHoliday(new Date('2024-01-01T12:30:00'), holidays)).toBe(true);
        });
    });
}); 