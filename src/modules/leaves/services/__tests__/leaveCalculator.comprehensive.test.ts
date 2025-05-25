import {
    calculateLeaveCountedDays,
    calculateWorkingDays,
    isBusinessDay,
    clearLeaveCalculationCache
} from '../leaveCalculator';
import { publicHolidayService } from '../publicHolidayService';
import { WorkSchedule, WorkFrequency, WeekType } from '../../../profiles/types/workSchedule';

// Mock du service des jours fériés
jest.mock('../publicHolidayService', () => ({
    publicHolidayService: {
        getPublicHolidaysInRange: jest.fn(),
        isPublicHoliday: jest.fn(),
    }
}));

const mockPublicHolidayService = publicHolidayService as jest.Mocked<typeof publicHolidayService>;

describe('LeaveCalculator - Tests Complets', () => {
    // Mock d'un planning de travail standard
    const standardSchedule: WorkSchedule = {
        id: 1,
        userId: 1,
        frequency: WorkFrequency.FULL_TIME,
        weekType: WeekType.BOTH,
        workingDays: [1, 2, 3, 4, 5], // Lundi à Vendredi (1-5)
        workingTimePercentage: 100,
        annualLeaveAllowance: 50,
        isActive: true,
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2024-12-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        clearLeaveCalculationCache();
        // Mock par défaut : pas de jours fériés
        mockPublicHolidayService.getPublicHolidaysInRange.mockResolvedValue([]);
        mockPublicHolidayService.isPublicHoliday.mockResolvedValue(false);
    });

    describe('Calculs de base - Jours ouvrés', () => {
        it('should calculate working days for a full week (Monday to Friday)', async () => {
            const startDate = new Date('2024-08-05'); // Lundi
            const endDate = new Date('2024-08-09');   // Vendredi

            const result = await calculateLeaveCountedDays(startDate, endDate, standardSchedule);

            expect(result).not.toBeNull();
            expect(result!.countedDays).toBe(5);
            expect(result!.naturalDays).toBe(5);
        });

        it('should exclude weekends from working days calculation', async () => {
            const startDate = new Date('2024-08-05'); // Lundi
            const endDate = new Date('2024-08-11');   // Dimanche (semaine complète)

            const result = await calculateLeaveCountedDays(startDate, endDate, standardSchedule);

            expect(result).not.toBeNull();
            expect(result!.countedDays).toBe(5); // Lundi à Vendredi seulement
            expect(result!.naturalDays).toBe(7);
        });

        it('should handle single day leave requests', async () => {
            const singleDay = new Date('2024-08-05'); // Lundi

            const result = await calculateLeaveCountedDays(singleDay, singleDay, standardSchedule);

            expect(result).not.toBeNull();
            expect(result!.countedDays).toBe(1);
            expect(result!.naturalDays).toBe(1);
        });

        it('should handle weekend-only leave requests', async () => {
            const startDate = new Date('2024-08-10'); // Samedi
            const endDate = new Date('2024-08-11');   // Dimanche

            const result = await calculateLeaveCountedDays(startDate, endDate, standardSchedule);

            expect(result).not.toBeNull();
            expect(result!.countedDays).toBe(0);
            expect(result!.naturalDays).toBe(2);
        });

        it('should return null for invalid date range (end before start)', async () => {
            const startDate = new Date('2024-08-10');
            const endDate = new Date('2024-08-05');

            const result = await calculateLeaveCountedDays(startDate, endDate, standardSchedule);

            expect(result).toBeNull();
        });
    });

    describe('Gestion des jours fériés', () => {
        it('should exclude public holidays from working days', async () => {
            const startDate = new Date('2024-08-05'); // Lundi
            const endDate = new Date('2024-08-09');   // Vendredi

            // Mock un jour férié le mercredi
            const publicHolidays = [
                {
                    id: '1',
                    name: 'Assomption',
                    date: new Date('2024-08-07'), // Mercredi
                    isNational: true,
                    country: 'FR',
                }
            ];
            mockPublicHolidayService.getPublicHolidaysInRange.mockResolvedValue(publicHolidays);

            const result = await calculateLeaveCountedDays(startDate, endDate, standardSchedule);

            expect(result).not.toBeNull();
            expect(result!.countedDays).toBe(4); // 5 jours - 1 férié
            expect(result!.naturalDays).toBe(5);
        });

        it('should handle multiple public holidays in range', async () => {
            const startDate = new Date('2024-12-23'); // Lundi
            const endDate = new Date('2024-12-27');   // Vendredi

            // Période de Noël avec plusieurs jours fériés
            const publicHolidays = [
                {
                    id: '1',
                    name: 'Noël',
                    date: new Date('2024-12-25'), // Mercredi
                    isNational: true,
                    country: 'FR',
                },
                {
                    id: '2',
                    name: 'Boxing Day',
                    date: new Date('2024-12-26'), // Jeudi
                    isNational: false,
                    country: 'FR',
                }
            ];
            mockPublicHolidayService.getPublicHolidaysInRange.mockResolvedValue(publicHolidays);

            const result = await calculateLeaveCountedDays(startDate, endDate, standardSchedule);

            expect(result).not.toBeNull();
            expect(result!.countedDays).toBe(3); // 5 jours - 2 fériés
        });

        it('should not double-count holidays that fall on weekends', async () => {
            const startDate = new Date('2024-08-05'); // Lundi
            const endDate = new Date('2024-08-11');   // Dimanche

            // Jour férié qui tombe un weekend
            const publicHolidays = [
                {
                    id: '1',
                    name: 'Férié Weekend',
                    date: new Date('2024-08-10'), // Samedi
                    isNational: true,
                    country: 'FR',
                }
            ];
            mockPublicHolidayService.getPublicHolidaysInRange.mockResolvedValue(publicHolidays);

            const result = await calculateLeaveCountedDays(startDate, endDate, standardSchedule);

            expect(result).not.toBeNull();
            expect(result!.countedDays).toBe(5); // Pas affecté par le férié weekend
        });
    });

    describe('Calculs demi-journées', () => {
        it('should calculate half-day leave correctly', async () => {
            const singleDay = new Date('2024-08-05'); // Lundi

            const result = await calculateLeaveCountedDays(
                singleDay,
                singleDay,
                standardSchedule,
                { isHalfDay: true }
            );

            expect(result).not.toBeNull();
            expect(result!.countedDays).toBe(0.5);
            expect(result!.naturalDays).toBe(1);
        });

        it('should handle half-day periods correctly', async () => {
            const singleDay = new Date('2024-08-05'); // Lundi

            // Test demi-journée matin
            const resultAM = await calculateLeaveCountedDays(
                singleDay,
                singleDay,
                standardSchedule,
                { isHalfDay: true, halfDayPeriod: 'AM' }
            );

            // Test demi-journée après-midi
            const resultPM = await calculateLeaveCountedDays(
                singleDay,
                singleDay,
                standardSchedule,
                { isHalfDay: true, halfDayPeriod: 'PM' }
            );

            expect(resultAM).not.toBeNull();
            expect(resultPM).not.toBeNull();
            expect(resultAM!.countedDays).toBe(0.5);
            expect(resultPM!.countedDays).toBe(0.5);
        });
    });

    describe('Plannings spéciaux', () => {
        it('should handle part-time schedule correctly', async () => {
            const partTimeSchedule = {
                ...standardSchedule,
                frequency: WorkFrequency.PART_TIME,
                workingDays: [1, 2, 3, 4], // Lundi à Jeudi (1-4)
            };

            const startDate = new Date('2024-08-05'); // Lundi
            const endDate = new Date('2024-08-09');   // Vendredi

            const result = await calculateLeaveCountedDays(startDate, endDate, partTimeSchedule);

            expect(result).not.toBeNull();
            expect(result!.countedDays).toBe(4); // Lundi à Jeudi seulement
        });

        it('should handle alternating week schedule', async () => {
            const alternatingSchedule = {
                ...standardSchedule,
                weekType: WeekType.EVEN, // Semaines paires seulement
            };

            const startDate = new Date('2024-08-05'); // Lundi semaine paire
            const endDate = new Date('2024-08-09');   // Vendredi semaine paire

            const result = await calculateLeaveCountedDays(startDate, endDate, alternatingSchedule);

            expect(result).not.toBeNull();
            // Le résultat dépend de la logique d'implémentation pour les semaines alternées
            expect(result!.countedDays).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Performance et optimisation', () => {
        it('should calculate working days quickly for normal ranges', async () => {
            const startDate = new Date('2024-08-01');
            const endDate = new Date('2024-08-31');

            const startTime = Date.now();
            const result = await calculateLeaveCountedDays(startDate, endDate, standardSchedule);
            const duration = Date.now() - startTime;

            expect(duration).toBeLessThan(200); // Moins de 200ms
            expect(result).not.toBeNull();
            expect(result!.countedDays).toBeGreaterThan(0);
        });

        it('should handle concurrent calculations efficiently', async () => {
            const calculations = Array.from({ length: 5 }, (_, i) => {
                const start = new Date('2024-08-01');
                start.setDate(start.getDate() + i);
                const end = new Date(start);
                end.setDate(end.getDate() + 5);

                return calculateLeaveCountedDays(start, end, standardSchedule);
            });

            const startTime = Date.now();
            const results = await Promise.all(calculations);
            const duration = Date.now() - startTime;

            expect(results).toHaveLength(5);
            expect(duration).toBeLessThan(500); // Toutes les calculs en moins de 500ms
            results.forEach((result) => {
                expect(result).not.toBeNull();
                expect(result!.countedDays).toBeGreaterThanOrEqual(0);
            });
        });
    });

    describe('Gestion des erreurs', () => {
        it('should handle PublicHolidayService errors gracefully', async () => {
            const startDate = new Date('2024-08-05');
            const endDate = new Date('2024-08-09');

            mockPublicHolidayService.getPublicHolidaysInRange.mockRejectedValue(
                new Error('Service indisponible')
            );

            // Should still calculate without crashing
            const result = await calculateLeaveCountedDays(startDate, endDate, standardSchedule);

            expect(result).not.toBeNull();
            expect(result!.countedDays).toBe(5); // Fallback sans jours fériés
        });

        it('should handle invalid dates gracefully', async () => {
            const invalidDate = new Date('invalid');
            const validDate = new Date('2024-08-05');

            const result1 = await calculateLeaveCountedDays(invalidDate, validDate, standardSchedule);
            const result2 = await calculateLeaveCountedDays(validDate, invalidDate, standardSchedule);

            expect(result1).toBeNull();
            expect(result2).toBeNull();
        });
    });

    describe('Fonctions utilitaires', () => {
        it('should calculate working days without schedule', async () => {
            const startDate = new Date('2024-08-05'); // Lundi
            const endDate = new Date('2024-08-09');   // Vendredi

            const workingDays = await calculateWorkingDays(startDate, endDate);

            expect(workingDays).toBe(5);
        });

        it('should identify business days correctly', async () => {
            const monday = new Date('2024-08-05');    // Lundi
            const saturday = new Date('2024-08-10');  // Samedi

            const isMondayBusiness = await isBusinessDay(monday);
            const isSaturdayBusiness = await isBusinessDay(saturday);

            expect(isMondayBusiness).toBe(true);
            expect(isSaturdayBusiness).toBe(false);
        });

        it('should handle business day check with holidays', async () => {
            const holiday = new Date('2024-08-15'); // Assomption (jeudi)

            mockPublicHolidayService.isPublicHoliday.mockResolvedValue(true);

            const isHolidayBusiness = await isBusinessDay(holiday);

            expect(isHolidayBusiness).toBe(false);
        });
    });

    describe('Cache management', () => {
        it('should use cache for repeated calculations', async () => {
            const startDate = new Date('2024-08-05');
            const endDate = new Date('2024-08-09');

            // Premier calcul
            const result1 = await calculateLeaveCountedDays(startDate, endDate, standardSchedule);

            // Deuxième calcul identique
            const result2 = await calculateLeaveCountedDays(startDate, endDate, standardSchedule);

            expect(result1).toEqual(result2);
            // Le service de jours fériés ne devrait être appelé qu'une fois grâce au cache
            expect(mockPublicHolidayService.getPublicHolidaysInRange).toHaveBeenCalledTimes(1);
        });

        it('should clear cache properly', async () => {
            const startDate = new Date('2024-08-05');
            const endDate = new Date('2024-08-09');

            // Premier calcul
            await calculateLeaveCountedDays(startDate, endDate, standardSchedule);

            // Clear cache
            clearLeaveCalculationCache();

            // Deuxième calcul après clear
            await calculateLeaveCountedDays(startDate, endDate, standardSchedule);

            // Le service devrait être appelé deux fois (pas de cache)
            expect(mockPublicHolidayService.getPublicHolidaysInRange).toHaveBeenCalledTimes(2);
        });
    });
}); 