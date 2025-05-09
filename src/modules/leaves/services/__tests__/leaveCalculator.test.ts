/// <reference types="@testing-library/jest-dom" />
import '@testing-library/jest-dom';
import {
    calculateLeaveCountedDays,
    calculateWorkingDays,
    isBusinessDay,
    clearLeaveCalculationCache
} from '../leaveCalculator';
import { publicHolidayService } from '../publicHolidayService';
import { WorkFrequency, WeekType } from '../../../profiles/types/workSchedule';
import { parseISO, addDays, format } from 'date-fns';

// Mock du service de jours fériés
jest.mock('../publicHolidayService', () => ({
    publicHolidayService: {
        getPublicHolidaysInRange: jest.fn(),
        isPublicHoliday: jest.fn()
    }
}));

// Exemple d'emploi du temps à temps plein
const fullTimeSchedule = {
    id: 'full-time-test',
    userId: 1,
    frequency: WorkFrequency.FULL_TIME,
    weekType: WeekType.BOTH,
    workingDays: [1, 2, 3, 4, 5], // Lundi à vendredi
    workingTimePercentage: 100,
    annualLeaveAllowance: 25,
    isActive: true,
    validFrom: new Date(2000, 0, 1) // Date fixe dans le passé
};

// Exemple d'emploi du temps à temps partiel
const partTimeSchedule = {
    id: 'part-time-test',
    userId: 2,
    frequency: WorkFrequency.ALTERNATE_WEEKS,
    weekType: WeekType.EVEN,
    workingDays: [1, 3, 5], // Lundi, mercredi, vendredi
    workingTimePercentage: 50,
    annualLeaveAllowance: 12.5,
    isActive: true,
    validFrom: new Date(2000, 0, 1) // Date fixe dans le passé
};

describe('Leave Calculator Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        clearLeaveCalculationCache();

        // Mock par défaut pour les jours fériés (aucun jour férié par défaut)
        (publicHolidayService.getPublicHolidaysInRange as jest.Mock).mockResolvedValue([]);
        (publicHolidayService.isPublicHoliday as jest.Mock).mockResolvedValue(false);
    });

    describe('calculateLeaveCountedDays', () => {
        it('devrait calculer correctement les jours ouvrables pour une semaine classique', async () => {
            // Du lundi au vendredi (5 jours ouvrables, 0 weekend)
            const startDate = parseISO('2023-09-04'); // Lundi
            const endDate = parseISO('2023-09-08');   // Vendredi

            const result = await calculateLeaveCountedDays(startDate, endDate, fullTimeSchedule);

            expect(result).not.toBeNull();
            expect(result?.naturalDays).toBe(5);
            expect(result?.workDays).toBe(5);
            expect(result?.countedDays).toBe(5);
            expect(result?.halfDays).toBe(0);
        });

        it('devrait calculer correctement les jours ouvrables pour une période incluant un weekend', async () => {
            // Du lundi au lundi suivant (6 jours ouvrables, 2 jours de weekend)
            const startDate = parseISO('2023-09-04'); // Lundi
            const endDate = parseISO('2023-09-11');   // Lundi suivant

            const result = await calculateLeaveCountedDays(startDate, endDate, fullTimeSchedule);

            expect(result).not.toBeNull();
            expect(result?.naturalDays).toBe(8);
            expect(result?.workDays).toBe(6);
            expect(result?.countedDays).toBe(6);
        });

        it('devrait prendre en compte les jours fériés', async () => {
            // Mock d'un jour férié
            (publicHolidayService.getPublicHolidaysInRange as jest.Mock).mockResolvedValue([
                { date: '2023-09-06', name: 'Jour férié test', isNational: true }
            ]);

            const startDate = parseISO('2023-09-04'); // Lundi
            const endDate = parseISO('2023-09-08');   // Vendredi

            // Avec l'option skipHolidays à true (par défaut)
            const resultWithSkip = await calculateLeaveCountedDays(startDate, endDate, fullTimeSchedule);

            expect(resultWithSkip).not.toBeNull();
            expect(resultWithSkip?.naturalDays).toBe(5);
            expect(resultWithSkip?.workDays).toBe(4); // 5 jours - 1 jour férié
            expect(resultWithSkip?.countedDays).toBe(4);

            // Avec l'option skipHolidays à false
            const resultWithoutSkip = await calculateLeaveCountedDays(startDate, endDate, fullTimeSchedule, {
                skipHolidays: false
            });

            expect(resultWithoutSkip).not.toBeNull();
            expect(resultWithoutSkip?.naturalDays).toBe(5);
            expect(resultWithoutSkip?.workDays).toBe(5); // Tous les jours sont comptés
            expect(resultWithoutSkip?.countedDays).toBe(5);
        });

        it('devrait gérer les demi-journées', async () => {
            const startDate = parseISO('2023-09-04'); // Lundi
            const endDate = parseISO('2023-09-08');   // Vendredi

            const result = await calculateLeaveCountedDays(startDate, endDate, fullTimeSchedule, {
                countHalfDays: true
            });

            expect(result).not.toBeNull();
            expect(result?.naturalDays).toBe(5);
            expect(result?.countedDays).toBe(4.5); // Vendredi après-midi est une demi-journée
            expect(result?.halfDays).toBe(1);
        });

        it('devrait respecter l\'emploi du temps à temps partiel', async () => {
            const startDate = parseISO('2023-09-04'); // Lundi
            const endDate = parseISO('2023-09-08');   // Vendredi

            const result = await calculateLeaveCountedDays(startDate, endDate, partTimeSchedule);

            expect(result).not.toBeNull();
            expect(result?.naturalDays).toBe(5);
            expect(result?.workDays).toBe(5);  // Tous les jours sont ouvrés
            expect(result?.countedDays).toBe(3); // Mais seulement 3 sont travaillés selon le planning
        });

        it('devrait gérer les jours fériés tombant un weekend', async () => {
            // Mock d'un jour férié tombant un samedi
            (publicHolidayService.getPublicHolidaysInRange as jest.Mock).mockResolvedValue([
                { date: '2023-09-09', name: 'Jour férié weekend', isNational: true }
            ]);

            const startDate = parseISO('2023-09-08'); // Vendredi
            const endDate = parseISO('2023-09-10');   // Dimanche

            // Sans compter les jours fériés weekend
            const resultWithoutCount = await calculateLeaveCountedDays(startDate, endDate, fullTimeSchedule);

            expect(resultWithoutCount).not.toBeNull();
            expect(resultWithoutCount?.naturalDays).toBe(3);
            expect(resultWithoutCount?.workDays).toBe(1); // Seulement le vendredi

            expect(resultWithoutCount?.countedDays).toBe(1);

            // En comptant les jours fériés weekend
            const resultWithCount = await calculateLeaveCountedDays(startDate, endDate, fullTimeSchedule, {
                countHolidaysOnWeekends: true,
                skipHolidays: false
            });

            expect(resultWithCount).not.toBeNull();
            expect(resultWithCount?.naturalDays).toBe(3);
            expect(resultWithCount?.workDays).toBe(2); // Vendredi + le samedi férié
            expect(resultWithCount?.countedDays).toBe(2);
        });

        it('devrait utiliser le cache pour des appels répétés avec les mêmes paramètres', async () => {
            const startDate = parseISO('2023-09-04'); // Lundi
            const endDate = parseISO('2023-09-08');   // Vendredi

            // Premier appel
            await calculateLeaveCountedDays(startDate, endDate, fullTimeSchedule);

            // Deuxième appel (devrait utiliser le cache)
            await calculateLeaveCountedDays(startDate, endDate, fullTimeSchedule);

            // On ne devrait avoir appelé le service de jours fériés qu'une seule fois
            expect(publicHolidayService.getPublicHolidaysInRange).toHaveBeenCalledTimes(1);
        });

        it('devrait gérer les erreurs correctement', async () => {
            // Inverser les dates pour provoquer une erreur
            const startDate = parseISO('2023-09-08');
            const endDate = parseISO('2023-09-04');

            const result = await calculateLeaveCountedDays(startDate, endDate, fullTimeSchedule);

            // Le résultat devrait être null en cas d'erreur
            expect(result).toBeNull();
        });
    });

    describe('calculateWorkingDays', () => {
        it('devrait calculer correctement les jours ouvrables', async () => {
            const startDate = parseISO('2023-09-04'); // Lundi
            const endDate = parseISO('2023-09-08');   // Vendredi

            const workingDays = await calculateWorkingDays(startDate, endDate);

            expect(workingDays).toBe(5);
        });

        it('devrait exclure les weekends', async () => {
            const startDate = parseISO('2023-09-04'); // Lundi
            const endDate = parseISO('2023-09-10');   // Dimanche

            const workingDays = await calculateWorkingDays(startDate, endDate);

            expect(workingDays).toBe(5); // Lundi à vendredi
        });

        it('devrait exclure les jours fériés', async () => {
            // Mock d'un jour férié
            (publicHolidayService.getPublicHolidaysInRange as jest.Mock).mockResolvedValue([
                { date: '2023-09-06', name: 'Jour férié test', isNational: true }
            ]);

            const startDate = parseISO('2023-09-04'); // Lundi
            const endDate = parseISO('2023-09-08');   // Vendredi

            const workingDays = await calculateWorkingDays(startDate, endDate);

            expect(workingDays).toBe(4); // 5 jours - 1 jour férié
        });
    });

    describe('isBusinessDay', () => {
        it('devrait identifier correctement les jours ouvrables', async () => {
            // Lundi
            const monday = parseISO('2023-09-04');
            const isMonday = await isBusinessDay(monday);
            expect(isMonday).toBe(true);

            // Samedi (weekend)
            const saturday = parseISO('2023-09-09');
            const isSaturday = await isBusinessDay(saturday);
            expect(isSaturday).toBe(false);

            // Jour férié
            (publicHolidayService.isPublicHoliday as jest.Mock).mockResolvedValue(true);
            const holiday = parseISO('2023-09-05');
            const isHoliday = await isBusinessDay(holiday);
            expect(isHoliday).toBe(false);
        });

        it('devrait gérer les dates invalides', async () => {
            const result = await isBusinessDay(null);
            expect(result).toBe(false);
        });
    });
}); 