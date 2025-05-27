import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { calculateLeaveCountedDays, clearLeaveCalculationCache, isBusinessDay } from './leaveCalculator';
import { publicHolidayService } from './publicHolidayService';
import { WorkFrequency, WeekType, WorkSchedule } from '../../profiles/types/workSchedule';
import { addDays } from 'date-fns';

// Mock des services externes
jest.mock('./publicHolidayService');
jest.mock('@/utils/logger', () => ({
    getLogger: jest.fn().mockResolvedValue({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn()
    })
}));

describe('leaveCalculator', () => {
    // Réinitialiser les mocks avant chaque test
    beforeEach(() => {
        jest.clearAllMocks();
        clearLeaveCalculationCache();

        // Configuration par défaut pour le service de jours fériés
        (publicHolidayService.getPublicHolidaysInRange as jest.Mock).mockResolvedValue([]);
        (publicHolidayService.isPublicHoliday as jest.Mock).mockResolvedValue(false);
    });

    // Exemple d'emploi du temps pour les tests
    const createMockSchedule = (): WorkSchedule => ({
        id: 'test-planning médical-1',
        userId: 'user-1',
        name: 'Emploi du temps standard',
        frequency: WorkFrequency.FULL_TIME,
        weekType: WeekType.BOTH,
        workingDays: [1, 2, 3, 4, 5], // Lundi à vendredi
        workingTimePercentage: 100,
        // Autres champs omis pour la simplicité
    });

    describe('calculateLeaveCountedDays', () => {
        test('devrait calculer correctement les jours pour une période standard', async () => {
            // Du lundi au vendredi de la semaine suivante (5 jours ouvrés)
            const startDate = new Date('2023-11-20'); // Un lundi
            const endDate = new Date('2023-11-24');   // Un vendredi
            const mockSchedule = createMockSchedule();

            const result = await calculateLeaveCountedDays(startDate, endDate, mockSchedule);

            expect(result).not.toBeNull();
            expect(result?.countedDays).toBe(5);
            expect(result?.naturalDays).toBe(5);
            expect(result?.halfDays).toBe(0);
        });

        test('devrait calculer correctement une demi-journée du matin', async () => {
            const date = new Date('2023-11-20'); // Un lundi
            const mockSchedule = createMockSchedule();

            const result = await calculateLeaveCountedDays(date, date, mockSchedule, {
                isHalfDay: true,
                halfDayPeriod: 'AM'
            });

            expect(result).not.toBeNull();
            expect(result?.countedDays).toBe(0.5);
            expect(result?.naturalDays).toBe(1);
            expect(result?.halfDays).toBe(1);
        });

        test('devrait calculer correctement une demi-journée de l\'après-midi', async () => {
            const date = new Date('2023-11-20'); // Un lundi
            const mockSchedule = createMockSchedule();

            const result = await calculateLeaveCountedDays(date, date, mockSchedule, {
                isHalfDay: true,
                halfDayPeriod: 'PM'
            });

            expect(result).not.toBeNull();
            expect(result?.countedDays).toBe(0.5);
            expect(result?.naturalDays).toBe(1);
            expect(result?.halfDays).toBe(1);
        });

        test('devrait ignorer isHalfDay si startDate et endDate sont différents', async () => {
            const startDate = new Date('2023-11-20'); // Un lundi
            const endDate = new Date('2023-11-21');   // Un mardi
            const mockSchedule = createMockSchedule();

            const result = await calculateLeaveCountedDays(startDate, endDate, mockSchedule, {
                isHalfDay: true, // Devrait être ignoré car période > 1 jour
                halfDayPeriod: 'AM'
            });

            expect(result).not.toBeNull();
            expect(result?.countedDays).toBe(2); // Devrait compter 2 jours complets
            expect(result?.naturalDays).toBe(2);
            expect(result?.halfDays).toBe(0);
        });

        test('devrait prendre en compte les jours fériés', async () => {
            // Supposons que le 22 novembre est un jour férié
            const startDate = new Date('2023-11-20'); // Un lundi
            const endDate = new Date('2023-11-24');   // Un vendredi
            const mockSchedule = createMockSchedule();

            // Configurer un jour férié
            (publicHolidayService.getPublicHolidaysInRange as jest.Mock).mockResolvedValue([
                { date: '2023-11-22', name: 'Jour férié de test', isNational: true }
            ]);

            const result = await calculateLeaveCountedDays(startDate, endDate, mockSchedule, {
                skipHolidays: true // Par défaut, ignorer les jours fériés
            });

            expect(result).not.toBeNull();
            expect(result?.countedDays).toBe(4); // 5 jours - 1 jour férié
            expect(result?.naturalDays).toBe(5);
        });

        test('devrait mettre en cache les résultats et les réutiliser', async () => {
            const startDate = new Date('2023-11-20');
            const endDate = new Date('2023-11-24');
            const mockSchedule = createMockSchedule();

            // Premier appel
            await calculateLeaveCountedDays(startDate, endDate, mockSchedule);

            // Deuxième appel - devrait utiliser le cache
            await calculateLeaveCountedDays(startDate, endDate, mockSchedule);

            // Vérifier que le service n'a été appelé qu'une seule fois
            expect(publicHolidayService.getPublicHolidaysInRange).toHaveBeenCalledTimes(1);
        });

        test('devrait forcer le rafraîchissement du cache si demandé', async () => {
            const startDate = new Date('2023-11-20');
            const endDate = new Date('2023-11-24');
            const mockSchedule = createMockSchedule();

            // Premier appel
            await calculateLeaveCountedDays(startDate, endDate, mockSchedule);

            // Deuxième appel avec forceCacheRefresh
            await calculateLeaveCountedDays(startDate, endDate, mockSchedule, {
                forceCacheRefresh: true
            });

            // Vérifier que le service a été appelé deux fois
            expect(publicHolidayService.getPublicHolidaysInRange).toHaveBeenCalledTimes(2);
        });
    });

    describe('isBusinessDay', () => {
        test('devrait retourner false pour les weekends', async () => {
            // Un samedi
            const saturday = new Date('2023-11-25');
            const result = await isBusinessDay(saturday);
            expect(result).toBe(false);
        });

        test('devrait retourner false pour les jours fériés', async () => {
            // Un jour de semaine qui est férié
            const holiday = new Date('2023-11-22');
            (publicHolidayService.isPublicHoliday as jest.Mock).mockResolvedValue(true);

            const result = await isBusinessDay(holiday);
            expect(result).toBe(false);
        });

        test('devrait retourner true pour les jours ouvrables normaux', async () => {
            // Un jour de semaine normal
            const workday = new Date('2023-11-20');

            const result = await isBusinessDay(workday);
            expect(result).toBe(true);
        });
    });
}); 