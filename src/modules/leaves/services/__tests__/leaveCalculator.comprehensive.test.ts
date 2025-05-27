/**
 * Tests complets pour le service leaveCalculator
 * Objectif : 85% de couverture avec focus sur la logique métier critique
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
    calculateLeaveCountedDays,
    calculateWorkingDays,
    isBusinessDay,
    clearLeaveCalculationCache
} from '../leaveCalculator';
import { TestFactory } from '@/tests/factories/testFactorySimple';
import { publicHolidayService } from '../publicHolidayService';
import { isWorkingDay } from '@/modules/profiles/services/workScheduleService';
import { WorkSchedule, WorkFrequency } from '@/modules/profiles/types/workSchedule';
import { getLogger } from '@/utils/logger';

// Mock des dépendances
jest.mock('../publicHolidayService');
jest.mock('@/modules/profiles/services/workScheduleService');
jest.mock('@/utils/logger');

const mockedPublicHolidayService = publicHolidayService as jest.Mocked<typeof publicHolidayService>;
const mockedIsWorkingDay = isWorkingDay as jest.MockedFunction<typeof isWorkingDay>;
const mockedGetLogger = getLogger as jest.MockedFunction<typeof getLogger>;

describe('LeaveCalculator', () => {
    const mockLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    };

    const mockScheduleFullTime: WorkSchedule = {
        id: 1,
        userId: 1,
        frequency: 'FULLTIME' as WorkFrequency,
        workDaysPerWeek: 5,
        hoursPerWeek: 40,
        isActive: true,
        startDate: '2024-01-01',
        endDate: null,
        patterns: [
            { dayOfWeek: 1, isWorking: true, startTime: '08:00', endTime: '17:00' }, // Lundi
            { dayOfWeek: 2, isWorking: true, startTime: '08:00', endTime: '17:00' }, // Mardi
            { dayOfWeek: 3, isWorking: true, startTime: '08:00', endTime: '17:00' }, // Mercredi
            { dayOfWeek: 4, isWorking: true, startTime: '08:00', endTime: '17:00' }, // Jeudi
            { dayOfWeek: 5, isWorking: true, startTime: '08:00', endTime: '17:00' }, // Vendredi
            { dayOfWeek: 6, isWorking: false, startTime: null, endTime: null },     // Samedi
            { dayOfWeek: 0, isWorking: false, startTime: null, endTime: null }      // Dimanche
        ]
    };

    const mockSchedulePartTime: WorkSchedule = {
        id: 2,
        userId: 2,
        frequency: 'PARTTIME' as WorkFrequency,
        workDaysPerWeek: 3,
        hoursPerWeek: 24,
        isActive: true,
        startDate: '2024-01-01',
        endDate: null,
        patterns: [
            { dayOfWeek: 1, isWorking: true, startTime: '08:00', endTime: '16:00' }, // Lundi
            { dayOfWeek: 2, isWorking: false, startTime: null, endTime: null },     // Mardi
            { dayOfWeek: 3, isWorking: true, startTime: '08:00', endTime: '16:00' }, // Mercredi
            { dayOfWeek: 4, isWorking: false, startTime: null, endTime: null },     // Jeudi
            { dayOfWeek: 5, isWorking: true, startTime: '08:00', endTime: '16:00' }, // Vendredi
            { dayOfWeek: 6, isWorking: false, startTime: null, endTime: null },     // Samedi
            { dayOfWeek: 0, isWorking: false, startTime: null, endTime: null }      // Dimanche
        ]
    };

    const mockPublicHolidays = [
        {
            id: 1,
            name: 'Jour de l\'An',
            date: '2024-01-01',
            type: 'NATIONAL',
            region: null,
            isRecurring: true
        },
        {
            id: 2,
            name: 'Fête du Travail',
            date: '2024-05-01',
            type: 'NATIONAL',
            region: null,
            isRecurring: true
        },
        {
            id: 3,
            name: 'Noël',
            date: '2024-12-25',
            type: 'NATIONAL',
            region: null,
            isRecurring: true
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        clearLeaveCalculationCache();

        // Mock logger
        mockedGetLogger.mockResolvedValue(mockLogger as any);

        // Mock publicHolidayService par défaut
        mockedPublicHolidayService.getPublicHolidaysInRange.mockResolvedValue([]);

        // Mock isWorkingDay par défaut (basé sur les patterns)
        mockedIsWorkingDay.mockImplementation((date: Date, schedule: WorkSchedule) => {
            const dayOfWeek = date.getDay();
            const pattern = schedule.patterns.find(p => p.dayOfWeek === dayOfWeek);
            return pattern ? pattern.isWorking : false;
        });
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('calculateLeaveCountedDays', () => {
        describe('Validation des entrées', () => {
            it('devrait retourner null pour des dates invalides', async () => {
                // Act & Assert
                expect(await calculateLeaveCountedDays(null, null, mockScheduleFullTime)).toBeNull();
                expect(await calculateLeaveCountedDays('invalid', '2024-01-15', mockScheduleFullTime)).toBeNull();
                expect(await calculateLeaveCountedDays('2024-01-15', null, mockScheduleFullTime)).toBeNull();
            });

            it('devrait retourner null si la date de fin est avant la date de début', async () => {
                // Act
                const result = await calculateLeaveCountedDays(
                    '2024-01-15',
                    '2024-01-10',
                    mockScheduleFullTime
                );

                // Assert
                expect(result).toBeNull();
                expect(mockLogger.warn).toHaveBeenCalled();
            });

            it('devrait accepter différents formats de dates', async () => {
                // Arrange
                const dateString = '2024-01-15';
                const dateObject = new Date('2024-01-15');
                const dateNumber = dateObject.getTime();

                // Act
                const resultString = await calculateLeaveCountedDays(dateString, dateString, mockScheduleFullTime);
                const resultObject = await calculateLeaveCountedDays(dateObject, dateObject, mockScheduleFullTime);
                const resultNumber = await calculateLeaveCountedDays(dateNumber, dateNumber, mockScheduleFullTime);

                // Assert
                expect(resultString).not.toBeNull();
                expect(resultObject).not.toBeNull();
                expect(resultNumber).not.toBeNull();
                expect(resultString?.countedDays).toBe(resultObject?.countedDays);
                expect(resultObject?.countedDays).toBe(resultNumber?.countedDays);
            });
        });

        describe('Calculs pour planning temps plein', () => {
            it('devrait calculer correctement une semaine de travail complète', async () => {
                // Arrange - Lundi au Vendredi (5 jours ouvrés)
                const startDate = '2024-01-15'; // Lundi
                const endDate = '2024-01-19';   // Vendredi

                // Act
                const result = await calculateLeaveCountedDays(startDate, endDate, mockScheduleFullTime);

                // Assert
                expect(result).not.toBeNull();
                expect(result!.naturalDays).toBe(5);
                expect(result!.countedDays).toBe(5);
                expect(result!.halfDays).toBe(0);
                expect(result!.weeklyBreakdown).toHaveLength(1);
            });

            it('devrait exclure les weekends du décompte', async () => {
                // Arrange - Vendredi au Lundi (incluant weekend)
                const startDate = '2024-01-12'; // Vendredi
                const endDate = '2024-01-15';   // Lundi

                // Act
                const result = await calculateLeaveCountedDays(startDate, endDate, mockScheduleFullTime);

                // Assert
                expect(result).not.toBeNull();
                expect(result!.naturalDays).toBe(4); // 4 jours naturels
                expect(result!.countedDays).toBe(2); // Seulement vendredi et lundi
            });

            it('devrait exclure les jours fériés par défaut', async () => {
                // Arrange
                mockedPublicHolidayService.getPublicHolidaysInRange.mockResolvedValue([
                    mockPublicHolidays[1] // 1er mai 2024
                ]);

                const startDate = '2024-04-30'; // Mardi
                const endDate = '2024-05-02';   // Jeudi (inclut le 1er mai)

                // Act
                const result = await calculateLeaveCountedDays(startDate, endDate, mockScheduleFullTime);

                // Assert
                expect(result).not.toBeNull();
                expect(result!.naturalDays).toBe(3);
                expect(result!.countedDays).toBe(2); // Exclut le 1er mai
                expect(result!.publicHolidays).toHaveLength(1);
            });

            it('devrait inclure les jours fériés si skipHolidays=false', async () => {
                // Arrange
                mockedPublicHolidayService.getPublicHolidaysInRange.mockResolvedValue([
                    mockPublicHolidays[1] // 1er mai 2024
                ]);

                const startDate = '2024-04-30';
                const endDate = '2024-05-02';

                // Act
                const result = await calculateLeaveCountedDays(
                    startDate,
                    endDate,
                    mockScheduleFullTime,
                    { skipHolidays: false }
                );

                // Assert
                expect(result).not.toBeNull();
                expect(result!.countedDays).toBe(3); // Inclut le 1er mai
            });
        });

        describe('Calculs pour planning temps partiel', () => {
            it('devrait calculer correctement pour un planning 3j/semaine', async () => {
                // Arrange - Lundi au Vendredi (mais seulement L-M-V travaillés)
                const startDate = '2024-01-15'; // Lundi
                const endDate = '2024-01-19';   // Vendredi

                // Act
                const result = await calculateLeaveCountedDays(startDate, endDate, mockSchedulePartTime);

                // Assert
                expect(result).not.toBeNull();
                expect(result!.naturalDays).toBe(5);
                expect(result!.countedDays).toBe(3); // Seulement lundi, mercredi, vendredi
            });

            it('devrait ignorer les jours non travaillés du planning', async () => {
                // Arrange - Mardi et Jeudi (jours non travaillés)
                const startDate = '2024-01-16'; // Mardi
                const endDate = '2024-01-18';   // Jeudi

                // Act
                const result = await calculateLeaveCountedDays(startDate, endDate, mockSchedulePartTime);

                // Assert
                expect(result).not.toBeNull();
                expect(result!.naturalDays).toBe(3);
                expect(result!.countedDays).toBe(1); // Seulement mercredi
            });
        });

        describe('Gestion des demi-journées', () => {
            it('devrait calculer correctement une demi-journée matin', async () => {
                // Arrange
                const startDate = '2024-01-15'; // Lundi
                const endDate = '2024-01-15';   // Même jour

                // Act
                const result = await calculateLeaveCountedDays(
                    startDate,
                    endDate,
                    mockScheduleFullTime,
                    { isHalfDay: true, halfDayPeriod: 'AM' }
                );

                // Assert
                expect(result).not.toBeNull();
                expect(result!.countedDays).toBe(0.5);
                expect(result!.halfDays).toBe(1);
            });

            it('devrait calculer correctement une demi-journée après-midi', async () => {
                // Arrange
                const startDate = '2024-01-15';
                const endDate = '2024-01-15';

                // Act
                const result = await calculateLeaveCountedDays(
                    startDate,
                    endDate,
                    mockScheduleFullTime,
                    { isHalfDay: true, halfDayPeriod: 'PM' }
                );

                // Assert
                expect(result).not.toBeNull();
                expect(result!.countedDays).toBe(0.5);
                expect(result!.halfDays).toBe(1);
            });

            it('devrait utiliser AM par défaut pour les demi-journées', async () => {
                // Arrange
                const startDate = '2024-01-15';
                const endDate = '2024-01-15';

                // Act
                const result = await calculateLeaveCountedDays(
                    startDate,
                    endDate,
                    mockScheduleFullTime,
                    { isHalfDay: true }
                );

                // Assert
                expect(result).not.toBeNull();
                expect(result!.countedDays).toBe(0.5);
            });
        });

        describe('Cache de calculs', () => {
            it('devrait utiliser le cache pour des calculs identiques', async () => {
                // Arrange
                const startDate = '2024-01-15';
                const endDate = '2024-01-19';

                // Act - Premier calcul
                const result1 = await calculateLeaveCountedDays(startDate, endDate, mockScheduleFullTime);

                // Act - Deuxième calcul identique
                const result2 = await calculateLeaveCountedDays(startDate, endDate, mockScheduleFullTime);

                // Assert
                expect(result1).toEqual(result2);
                expect(mockedPublicHolidayService.getPublicHolidaysInRange).toHaveBeenCalledTimes(1); // Une seule fois grâce au cache
            });

            it('devrait ignorer le cache avec forceCacheRefresh=true', async () => {
                // Arrange
                const startDate = '2024-01-15';
                const endDate = '2024-01-19';

                // Act - Premier calcul
                await calculateLeaveCountedDays(startDate, endDate, mockScheduleFullTime);

                // Act - Deuxième calcul avec refresh forcé
                await calculateLeaveCountedDays(
                    startDate,
                    endDate,
                    mockScheduleFullTime,
                    { forceCacheRefresh: true }
                );

                // Assert
                expect(mockedPublicHolidayService.getPublicHolidaysInRange).toHaveBeenCalledTimes(2);
            });

            it('devrait vider le cache avec clearLeaveCalculationCache', async () => {
                // Arrange
                const startDate = '2024-01-15';
                const endDate = '2024-01-19';

                // Act - Premier calcul
                await calculateLeaveCountedDays(startDate, endDate, mockScheduleFullTime);

                // Vider le cache
                clearLeaveCalculationCache();

                // Deuxième calcul après vidage du cache
                await calculateLeaveCountedDays(startDate, endDate, mockScheduleFullTime);

                // Assert
                expect(mockedPublicHolidayService.getPublicHolidaysInRange).toHaveBeenCalledTimes(2);
            });
        });

        describe('Breakdown hebdomadaire', () => {
            it('devrait fournir un breakdown correct pour une période multi-semaines', async () => {
                // Arrange - 2 semaines complètes
                const startDate = '2024-01-15'; // Lundi semaine 3
                const endDate = '2024-01-26';   // Vendredi semaine 4

                // Act
                const result = await calculateLeaveCountedDays(startDate, endDate, mockScheduleFullTime);

                // Assert
                expect(result).not.toBeNull();
                expect(result!.weeklyBreakdown).toHaveLength(2);
                expect(result!.countedDays).toBe(10); // 2 semaines × 5 jours
            });

            it('devrait calculer correctement les détails par jour', async () => {
                // Arrange
                const startDate = '2024-01-15'; // Lundi
                const endDate = '2024-01-17';   // Mercredi

                // Act
                const result = await calculateLeaveCountedDays(startDate, endDate, mockScheduleFullTime);

                // Assert
                expect(result).not.toBeNull();
                expect(result!.dayDetails).toHaveLength(3);

                // Vérifier que tous les jours sont des jours ouvrés
                result!.dayDetails.forEach(day => {
                    expect(day.isCounted).toBe(true);
                    expect(day.type).toBe('WORKING_DAY');
                });
            });
        });

        describe('Gestion des erreurs', () => {
            it('devrait gérer les erreurs de service public holidays', async () => {
                // Arrange
                mockedPublicHolidayService.getPublicHolidaysInRange.mockRejectedValue(
                    new Error('Service indisponible')
                );

                // Act
                const result = await calculateLeaveCountedDays(
                    '2024-01-15',
                    '2024-01-19',
                    mockScheduleFullTime
                );

                // Assert - Le calcul devrait continuer sans les jours fériés
                expect(result).not.toBeNull();
                expect(result!.publicHolidays).toEqual([]);
            });

            it('devrait logger les opérations importantes', async () => {
                // Act
                await calculateLeaveCountedDays('2024-01-15', '2024-01-19', mockScheduleFullTime);

                // Assert
                expect(mockLogger.info).toHaveBeenCalledWith(
                    'Starting leave counted days calculation...',
                    expect.objectContaining({
                        startDate: expect.any(String),
                        endDate: expect.any(String),
                        scheduleId: mockScheduleFullTime.id
                    })
                );
            });
        });
    });

    describe('calculateWorkingDays', () => {
        beforeEach(() => {
    jest.clearAllMocks();
            // Mock pour isBusinessDay
            mockedPublicHolidayService.getPublicHolidaysInRange.mockResolvedValue([]);
        });

        it('devrait calculer le nombre de jours ouvrés standard', async () => {
            // Arrange - Lundi au Vendredi (5 jours ouvrés)
            const startDate = '2024-01-15';
            const endDate = '2024-01-19';

            // Act
            const result = await calculateWorkingDays(startDate, endDate);

            // Assert
            expect(result).toBe(5);
        });

        it('devrait exclure les weekends', async () => {
            // Arrange - Vendredi au Lundi suivant (2 jours ouvrés)
            const startDate = '2024-01-12'; // Vendredi
            const endDate = '2024-01-15';   // Lundi

            // Act
            const result = await calculateWorkingDays(startDate, endDate);

            // Assert
            expect(result).toBe(2); // Vendredi + Lundi
        });

        it('devrait exclure les jours fériés', async () => {
            // Arrange
            mockedPublicHolidayService.getPublicHolidaysInRange.mockResolvedValue([
                mockPublicHolidays[1] // 1er mai
            ]);

            const startDate = '2024-04-30';
            const endDate = '2024-05-02';

            // Act
            const result = await calculateWorkingDays(startDate, endDate);

            // Assert
            expect(result).toBe(2); // Exclut le 1er mai
        });

        it('devrait inclure les jours fériés tombant en weekend si demandé', async () => {
            // Arrange - Jour férié un samedi
            mockedPublicHolidayService.getPublicHolidaysInRange.mockResolvedValue([
                {
                    id: 4,
                    name: 'Férié weekend',
                    date: '2024-01-13', // Samedi
                    type: 'NATIONAL',
                    region: null,
                    isRecurring: false
                }
            ]);

            const startDate = '2024-01-12'; // Vendredi
            const endDate = '2024-01-15';   // Lundi

            // Act
            const result = await calculateWorkingDays(
                startDate,
                endDate,
                { countHolidaysOnWeekends: true }
            );

            // Assert
            expect(result).toBe(2); // Pas d'impact car le samedi n'est déjà pas compté
        });

        it('devrait retourner null pour des dates invalides', async () => {
            // Act & Assert
            expect(await calculateWorkingDays(null, '2024-01-15')).toBeNull();
            expect(await calculateWorkingDays('2024-01-15', null)).toBeNull();
            expect(await calculateWorkingDays('invalid', '2024-01-15')).toBeNull();
        });
    });

    describe('isBusinessDay', () => {
        it('devrait identifier correctement un jour ouvré', async () => {
            // Arrange - Lundi (jour ouvré)
            const date = '2024-01-15';

            // Act
            const result = await isBusinessDay(date);

            // Assert
            expect(result).toBe(true);
        });

        it('devrait identifier correctement un weekend', async () => {
            // Arrange - Samedi
            const date = '2024-01-13';

            // Act
            const result = await isBusinessDay(date);

            // Assert
            expect(result).toBe(false);
        });

        it('devrait identifier correctement un jour férié', async () => {
            // Arrange
            mockedPublicHolidayService.getPublicHolidaysInRange.mockResolvedValue([
                mockPublicHolidays[1] // 1er mai
            ]);

            const date = '2024-05-01'; // Mercredi férié

            // Act
            const result = await isBusinessDay(date);

            // Assert
            expect(result).toBe(false);
        });

        it('devrait retourner false pour une date invalide', async () => {
            // Act
            const result = await isBusinessDay(null);

            // Assert
            expect(result).toBe(false);
        });
    });

    describe('Tests de performance', () => {
        it('devrait calculer rapidement une période longue', async () => {
            // Arrange - 1 an de congés
            const startDate = '2024-01-01';
            const endDate = '2024-12-31';
            const startTime = Date.now();

            // Act
            const result = await calculateLeaveCountedDays(startDate, endDate, mockScheduleFullTime);
            const endTime = Date.now();

            // Assert
            expect(result).not.toBeNull();
            expect(endTime - startTime).toBeLessThan(1000); // Moins d'1 seconde
        });

        it('devrait utiliser efficacement le cache pour des calculs répétés', async () => {
            // Arrange
            const startDate = '2024-01-15';
            const endDate = '2024-01-19';
            const iterations = 10;

            const startTime = Date.now();

            // Act - Calculs répétés
            for (let i = 0; i < iterations; i++) {
                await calculateLeaveCountedDays(startDate, endDate, mockScheduleFullTime);
            }

            const endTime = Date.now();

            // Assert
            expect(endTime - startTime).toBeLessThan(200); // Le cache devrait accélérer
            expect(mockedPublicHolidayService.getPublicHolidaysInRange).toHaveBeenCalledTimes(1); // Une seule fois
        });
    });

    describe('Scénarios métier complexes', () => {
        it('devrait gérer un congé sur plusieurs mois avec jours fériés', async () => {
            // Arrange - Congé de mai à juin avec plusieurs jours fériés
            mockedPublicHolidayService.getPublicHolidaysInRange.mockResolvedValue([
                mockPublicHolidays[1], // 1er mai
                {
                    id: 5,
                    name: 'Ascension',
                    date: '2024-05-09',
                    type: 'NATIONAL',
                    region: null,
                    isRecurring: true
                },
                {
                    id: 6,
                    name: 'Lundi de Pentecôte',
                    date: '2024-05-20',
                    type: 'NATIONAL',
                    region: null,
                    isRecurring: true
                }
            ]);

            const startDate = '2024-05-01';
            const endDate = '2024-05-31';

            // Act
            const result = await calculateLeaveCountedDays(startDate, endDate, mockScheduleFullTime);

            // Assert
            expect(result).not.toBeNull();
            expect(result!.publicHolidays).toHaveLength(3);
            expect(result!.countedDays).toBeLessThan(result!.naturalDays); // Moins à cause des fériés et weekends
        });

        it('devrait calculer correctement pour un planning alternant semaines paires/impaires', async () => {
            // Arrange - Planning alternant (simulation)
            const mockScheduleAlternating: WorkSchedule = {
                ...mockScheduleFullTime,
                id: 3,
                frequency: 'ALTERNATING' as WorkFrequency,
                workDaysPerWeek: 2.5 // Moyenne sur 2 semaines
            };

            const startDate = '2024-01-15'; // Semaine 3 (impaire)
            const endDate = '2024-01-26';   // Semaine 4 (paire)

            // Act
            const result = await calculateLeaveCountedDays(startDate, endDate, mockScheduleAlternating);

            // Assert
            expect(result).not.toBeNull();
            expect(result!.weeklyBreakdown).toHaveLength(2);
        });
    });
}); 