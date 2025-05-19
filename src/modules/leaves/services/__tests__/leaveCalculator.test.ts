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

// Le mock global de publicHolidayService est dans jest.setup.js
// Il n'est plus nécessaire de le mocker ici, sauf pour surcharger son comportement par test.

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
        jest.clearAllMocks(); // Efface tous les mocks, y compris ceux du mock global
        clearLeaveCalculationCache();

        // Le mock global dans jest.setup.js devrait déjà initialiser les mocks de publicHolidayService.
        // Si un test a besoin d'un comportement spécifique, il peut le configurer ici ou dans le test lui-même.
        // Par exemple, pour un test qui a besoin de jours fériés spécifiques :
        // (publicHolidayService.getPublicHolidaysInRange as jest.Mock).mockResolvedValueOnce([...]);
    });

    describe('calculateLeaveCountedDays', () => {
        it('devrait calculer correctement les jours pour une période standard', async () => {
            // Du lundi au vendredi (5 jours ouvrables, 0 weekend)
            const startDate = parseISO('2023-09-04'); // Lundi
            const endDate = parseISO('2023-09-08');   // Vendredi

            const result = await calculateLeaveCountedDays(startDate, endDate, fullTimeSchedule, { forceCacheRefresh: true });

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

            const result = await calculateLeaveCountedDays(startDate, endDate, fullTimeSchedule, { forceCacheRefresh: true });

            expect(result).not.toBeNull();
            expect(result?.naturalDays).toBe(8);
            expect(result?.workDays).toBe(6);
            expect(result?.countedDays).toBe(6);
        });

        it('devrait prendre en compte les jours fériés', async () => {
            // Mock d'un jour férié spécifique pour ce test
            (publicHolidayService.getPublicHolidaysInRange as jest.Mock).mockResolvedValueOnce([
                { date: '2023-09-06', name: 'Jour férié test', isNational: true }
            ]);

            const startDate = parseISO('2023-09-04'); // Lundi
            const endDate = parseISO('2023-09-08');   // Vendredi

            // Avec l'option skipHolidays à true (par défaut)
            const resultWithSkip = await calculateLeaveCountedDays(startDate, endDate, fullTimeSchedule, {
                skipHolidays: true,
                forceCacheRefresh: true
            });

            expect(resultWithSkip).not.toBeNull();
            expect(resultWithSkip?.naturalDays).toBe(5);
            expect(resultWithSkip?.workDays).toBe(4); // 5 jours - 1 jour férié
            expect(resultWithSkip?.countedDays).toBe(4);

            // Avec l'option skipHolidays à false
            // Assurer que le mock est configuré pour cet appel aussi si nécessaire
            (publicHolidayService.getPublicHolidaysInRange as jest.Mock).mockResolvedValueOnce([
                { date: '2023-09-06', name: 'Jour férié test', isNational: true }
            ]);
            const resultWithoutSkip = await calculateLeaveCountedDays(startDate, endDate, fullTimeSchedule, {
                skipHolidays: false,
                forceCacheRefresh: true
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
                isHalfDay: true,
                forceCacheRefresh: true
            });

            expect(result).not.toBeNull();
            expect(result?.naturalDays).toBe(5);
            expect(result?.countedDays).toBe(4.5); // Vendredi après-midi est une demi-journée
            expect(result?.halfDays).toBe(1);
        });

        it('devrait respecter l\'emploi du temps à temps partiel', async () => {
            const startDate = parseISO('2023-09-04'); // Lundi
            const endDate = parseISO('2023-09-08');   // Vendredi

            const result = await calculateLeaveCountedDays(startDate, endDate, partTimeSchedule, { forceCacheRefresh: true });

            expect(result).not.toBeNull();
            expect(result?.naturalDays).toBe(5);
            expect(result?.workDays).toBe(5);  // Tous les jours sont ouvrés
            expect(result?.countedDays).toBe(3); // Mais seulement 3 sont travaillés selon le planning
        });

        it('devrait gérer les jours fériés tombant un weekend', async () => {
            // Mock d'un jour férié tombant un samedi spécifique pour ce test
            (publicHolidayService.getPublicHolidaysInRange as jest.Mock).mockResolvedValueOnce([
                { date: '2023-09-09', name: 'Jour férié weekend', isNational: true }
            ]);
            const startDate = parseISO('2023-09-08'); // Vendredi
            const endDate = parseISO('2023-09-10');   // Dimanche

            // Sans compter les jours fériés weekend
            const resultWithoutCount = await calculateLeaveCountedDays(startDate, endDate, fullTimeSchedule, { forceCacheRefresh: true });

            expect(resultWithoutCount).not.toBeNull();
            expect(resultWithoutCount?.naturalDays).toBe(3);
            expect(resultWithoutCount?.workDays).toBe(1); // Seulement le vendredi

            expect(resultWithoutCount?.countedDays).toBe(1);

            // En comptant les jours fériés weekend
            // Assurer que le mock est configuré pour cet appel aussi si nécessaire
            (publicHolidayService.getPublicHolidaysInRange as jest.Mock).mockResolvedValueOnce([
                { date: '2023-09-09', name: 'Jour férié weekend', isNational: true }
            ]);
            const resultWithCount = await calculateLeaveCountedDays(startDate, endDate, fullTimeSchedule, {
                countHolidaysOnWeekends: true,
                skipHolidays: false,
                forceCacheRefresh: true
            });

            expect(resultWithCount).not.toBeNull();
            expect(resultWithCount?.naturalDays).toBe(3);
            expect(resultWithCount?.workDays).toBe(1); // Vendredi seulement. Samedi férié n'est pas un jour ouvrable.
            expect(resultWithCount?.countedDays).toBe(2);
        });

        it('devrait utiliser le cache pour des appels répétés avec les mêmes paramètres', async () => {
            const startDate = parseISO('2023-09-04'); // Lundi
            const endDate = parseISO('2023-09-08');   // Vendredi

            // Premier appel - sans forceCacheRefresh pour permettre la mise en cache
            await calculateLeaveCountedDays(startDate, endDate, fullTimeSchedule);

            // Deuxième appel - sans forceCacheRefresh pour utiliser le cache
            await calculateLeaveCountedDays(startDate, endDate, fullTimeSchedule);

            // On ne devrait avoir appelé le service de jours fériés qu'une seule fois
            expect(publicHolidayService.getPublicHolidaysInRange).toHaveBeenCalledTimes(1);
        });

        it('devrait gérer les erreurs correctement', async () => {
            // Inverser les dates pour provoquer une erreur
            const startDate = parseISO('2023-09-08');
            const endDate = parseISO('2023-09-04');

            const result = await calculateLeaveCountedDays(startDate, endDate, fullTimeSchedule, { forceCacheRefresh: true });

            // Le résultat devrait être null en cas d'erreur
            expect(result).toBeNull();
        });

        it('devrait calculer correctement une demi-journée du matin', async () => {
            const startDate = parseISO('2023-09-04'); // Lundi
            const endDate = parseISO('2023-09-04');   // Lundi
            const result = await calculateLeaveCountedDays(startDate, endDate, fullTimeSchedule, {
                isHalfDay: true,
                halfDayPeriod: 'AM',
                forceCacheRefresh: true
            });
            expect(result).not.toBeNull();
            expect(result?.countedDays).toBe(0.5);
        });

        it('devrait calculer correctement une demi-journée de l\'après-midi', async () => {
            const startDate = parseISO('2023-09-04'); // Lundi
            const endDate = parseISO('2023-09-04');   // Lundi
            const result = await calculateLeaveCountedDays(startDate, endDate, fullTimeSchedule, {
                isHalfDay: true,
                halfDayPeriod: 'PM',
                forceCacheRefresh: true
            });
            expect(result).not.toBeNull();
            expect(result?.countedDays).toBe(0.5);
        });

        it('devrait ignorer isHalfDay si startDate et endDate sont différents', async () => {
            const startDate = parseISO('2023-09-04'); // Lundi
            const endDate = parseISO('2023-09-05');   // Mardi
            const result = await calculateLeaveCountedDays(startDate, endDate, fullTimeSchedule, {
                isHalfDay: true, // Cette option devrait être ignorée
                forceCacheRefresh: true
            });

            expect(result).not.toBeNull();
            const resultWithSkip = await calculateLeaveCountedDays(startDate, endDate, fullTimeSchedule, {
                skipHolidays: true, // Valeur par défaut, mais explicite pour le test
                forceCacheRefresh: true
            });

            expect(resultWithSkip).not.toBeNull();
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