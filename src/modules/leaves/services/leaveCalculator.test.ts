import {
    calculateLeaveCountedDays
} from './leaveCalculator';
import {
    LeaveCalculationDetails,
    WeeklyLeaveBreakdown
} from '../types/leave';
import {
    WorkSchedule,
    WorkFrequency,
    Weekday,
    WeekType
} from '../../profiles/types/workSchedule';
import { isWorkingDay, isEvenWeek } from '../../profiles/services/workScheduleService';

// Mocker les dépendances externes
jest.mock('../../profiles/services/workScheduleService', () => ({
    isWorkingDay: jest.fn(),
    isEvenWeek: jest.fn(),
}));

// Helper pour créer des dates facilement
const d = (year: number, month: number, day: number) => new Date(year, month - 1, day);

// --- Mocks de Données --- 

// Planning Temps Plein (Lundi-Vendredi)
const fullTimeSchedule: WorkSchedule = {
    id: 'ft1',
    userId: 'user1',
    frequency: WorkFrequency.FULL_TIME,
    workingDays: [Weekday.MONDAY, Weekday.TUESDAY, Weekday.WEDNESDAY, Weekday.THURSDAY, Weekday.FRIDAY],
    annualLeaveAllowance: 25,
    validFrom: d(2024, 1, 1),
    isActive: true,
    createdAt: d(2024, 1, 1),
    updatedAt: d(2024, 1, 1),
};

// Planning Temps Partiel (80% - Lundi, Mardi, Jeudi, Vendredi)
const partTimeSchedule80: WorkSchedule = {
    id: 'pt80',
    userId: 'user2',
    frequency: WorkFrequency.PART_TIME,
    workingTimePercentage: 80,
    workingDays: [Weekday.MONDAY, Weekday.TUESDAY, Weekday.THURSDAY, Weekday.FRIDAY],
    annualLeaveAllowance: 20,
    validFrom: d(2024, 1, 1),
    isActive: true,
    createdAt: d(2024, 1, 1),
    updatedAt: d(2024, 1, 1),
};

// Planning Semaines Paires (Lundi-Vendredi)
const evenWeeksSchedule: WorkSchedule = {
    id: 'ew1',
    userId: 'user3',
    frequency: WorkFrequency.ALTERNATE_WEEKS,
    weekType: WeekType.EVEN,
    workingDays: [Weekday.MONDAY, Weekday.TUESDAY, Weekday.WEDNESDAY, Weekday.THURSDAY, Weekday.FRIDAY],
    annualLeaveAllowance: 12.5,
    validFrom: d(2024, 1, 1),
    isActive: true,
    createdAt: d(2024, 1, 1),
    updatedAt: d(2024, 1, 1),
};

// Planning Semaines Impaires (Lundi, Mardi, Mercredi)
const oddWeeksSchedule: WorkSchedule = {
    id: 'ow1',
    userId: 'user4',
    frequency: WorkFrequency.ALTERNATE_WEEKS,
    weekType: WeekType.ODD,
    workingDays: [Weekday.MONDAY, Weekday.TUESDAY, Weekday.WEDNESDAY],
    annualLeaveAllowance: 12.5, // Supposons une base temps plein alternée
    validFrom: d(2024, 1, 1),
    isActive: true,
    createdAt: d(2024, 1, 1),
    updatedAt: d(2024, 1, 1),
};


describe('leaveCalculator', () => {
    // Réinitialiser et configurer les mocks avant chaque test
    beforeEach(() => {
        (isWorkingDay as jest.Mock).mockClear();
        (isEvenWeek as jest.Mock).mockClear();

        // Configuration par défaut des mocks (peut être surchargée dans les tests)
        // Simule la fonction réelle isEvenWeek (simple modulo)
        (isEvenWeek as jest.Mock).mockImplementation((date: Date) => {
            const weekNumber = Math.ceil((((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / 86400000) + new Date(date.getFullYear(), 0, 1).getDay() + 1) / 7);
            return weekNumber % 2 === 0;
        });

        // Simule isWorkingDay basé sur les workingDays du schedule fourni
        (isWorkingDay as jest.Mock).mockImplementation((schedule: WorkSchedule, date: Date) => {
            const dayOfWeek = date.getDay(); // 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi
            const scheduleDay = dayOfWeek === 0 ? Weekday.SUNDAY : dayOfWeek; // Mapper vers l'enum Weekday

            // Gestion basique temps plein / partiel fixe
            if (schedule.frequency === WorkFrequency.FULL_TIME || schedule.frequency === WorkFrequency.PART_TIME) {
                return schedule.workingDays?.includes(scheduleDay) ?? false;
            }

            // Gestion semaines alternées (simplifiée ici, la vraie logique est dans workScheduleService)
            if (schedule.frequency === WorkFrequency.ALTERNATE_WEEKS) {
                const isEven = isEvenWeek(date);
                if (schedule.weekType === WeekType.EVEN && isEven) {
                    return schedule.workingDays?.includes(scheduleDay) ?? false;
                }
                if (schedule.weekType === WeekType.ODD && !isEven) {
                    return schedule.workingDays?.includes(scheduleDay) ?? false;
                }
                return false;
            }
            // Ajouter d'autres cas (CUSTOM, etc.) si nécessaire pour les tests
            return false;
        });
    });

    // --- Tests pour calculateLeaveCountedDays --- 

    describe('calculateLeaveCountedDays - Full Time', () => {
        const schedule = fullTimeSchedule;

        it('should count 5 days for a full work week (Mon-Fri)', () => {
            const startDate = d(2024, 8, 19); // Lundi
            const endDate = d(2024, 8, 23);   // Vendredi
            const result = calculateLeaveCountedDays(startDate, endDate, schedule);

            expect(result.naturalDays).toBe(5);
            expect(result.workDays).toBe(5);
            const totalCountedDays = result.weeklyBreakdown.reduce((sum, week) => sum + week.countedDays, 0);
            expect(totalCountedDays).toBe(5);
            expect(result.weeklyBreakdown.length).toBe(1);
            expect(result.weeklyBreakdown[0].countedDays).toBe(5);
        });

        it('should count 5 days when crossing a weekend (Fri-Mon)', () => {
            const startDate = d(2024, 8, 23); // Vendredi
            const endDate = d(2024, 8, 26);   // Lundi suivant
            const result = calculateLeaveCountedDays(startDate, endDate, schedule);

            expect(result.naturalDays).toBe(4);
            expect(result.workDays).toBe(2); // Vendredi + Lundi
            const totalCountedDays = result.weeklyBreakdown.reduce((sum, week) => sum + week.countedDays, 0);
            expect(totalCountedDays).toBe(2);
            expect(result.weeklyBreakdown.length).toBe(2);
            expect(result.weeklyBreakdown[0].countedDays).toBe(1); // Vendredi
            expect(result.weeklyBreakdown[1].countedDays).toBe(1); // Lundi
        });

        it('should count 10 days for two full work weeks', () => {
            const startDate = d(2024, 8, 19); // Lundi semaine 1
            const endDate = d(2024, 8, 30);   // Vendredi semaine 2
            const result = calculateLeaveCountedDays(startDate, endDate, schedule);

            expect(result.naturalDays).toBe(12);
            expect(result.workDays).toBe(10);
            const totalCountedDays = result.weeklyBreakdown.reduce((sum, week) => sum + week.countedDays, 0);
            expect(totalCountedDays).toBe(10);
            expect(result.weeklyBreakdown.length).toBe(2);
            expect(result.weeklyBreakdown[0].countedDays).toBe(5);
            expect(result.weeklyBreakdown[1].countedDays).toBe(5);
        });

        it('should count 0 days for a weekend', () => {
            const startDate = d(2024, 8, 24); // Samedi
            const endDate = d(2024, 8, 25);   // Dimanche
            const result = calculateLeaveCountedDays(startDate, endDate, schedule);

            expect(result.naturalDays).toBe(2);
            expect(result.workDays).toBe(0);
            const totalCountedDays = result.weeklyBreakdown.reduce((sum, week) => sum + week.countedDays, 0);
            expect(totalCountedDays).toBe(0);
            expect(result.weeklyBreakdown.length).toBe(1);
            expect(result.weeklyBreakdown[0].countedDays).toBe(0);
        });
    });

    describe('calculateLeaveCountedDays - Part Time 80% (No Wednesday)', () => {
        const schedule = partTimeSchedule80;

        it('should count 4 days for a full week (Mon, Tue, Thu, Fri)', () => {
            const startDate = d(2024, 8, 19); // Lundi
            const endDate = d(2024, 8, 23);   // Vendredi
            const result = calculateLeaveCountedDays(startDate, endDate, schedule);

            expect(result.naturalDays).toBe(5);
            expect(result.workDays).toBe(5); // 5 jours ouvrés dans la période
            const totalCountedDays = result.weeklyBreakdown.reduce((sum, week) => sum + week.countedDays, 0);
            expect(totalCountedDays).toBe(4); // Mais seulement 4 travaillés
            expect(result.weeklyBreakdown.length).toBe(1);
            expect(result.weeklyBreakdown[0].countedDays).toBe(4);
        });

        it('should not count the non-working day (Wednesday)', () => {
            const startDate = d(2024, 8, 21); // Mercredi
            const endDate = d(2024, 8, 21);   // Mercredi
            const result = calculateLeaveCountedDays(startDate, endDate, schedule);

            expect(result.naturalDays).toBe(1);
            expect(result.workDays).toBe(1);
            const totalCountedDays = result.weeklyBreakdown.reduce((sum, week) => sum + week.countedDays, 0);
            expect(totalCountedDays).toBe(0);
        });
    });

    // Tests pour les plannings EVEN et ODD WEEKS décommentés

    describe('calculateLeaveCountedDays - Even Weeks Only', () => {
        const schedule = evenWeeksSchedule;
        // Semaine 34 (19-25 Août 2024) est PAIRE
        // Semaine 35 (26 Août - 1 Sept 2024) est IMPAIRE

        it('should count days only on even weeks', () => {
            const startDate = d(2024, 8, 19); // Lundi Semaine 34 (Paire)
            const endDate = d(2024, 9, 1);    // Dimanche Semaine 35 (Impaire)
            const result = calculateLeaveCountedDays(startDate, endDate, schedule);

            expect(result.naturalDays).toBe(14);
            // Correction: Somme des countedDays
            const totalCountedDays = result.weeklyBreakdown.reduce((sum, week) => sum + week.countedDays, 0);
            expect(totalCountedDays).toBe(5); // Uniquement les 5 jours de la semaine 34
            expect(result.weeklyBreakdown.length).toBe(2);
            expect(result.weeklyBreakdown[0].weekType).toBe('EVEN');
            expect(result.weeklyBreakdown[0].countedDays).toBe(5);
            expect(result.weeklyBreakdown[1].weekType).toBe('ODD');
            expect(result.weeklyBreakdown[1].countedDays).toBe(0);
        });
    });

    describe('calculateLeaveCountedDays - Odd Weeks Only (Mon-Wed)', () => {
        const schedule = oddWeeksSchedule;
        // Semaine 34 (19-25 Août 2024) est PAIRE
        // Semaine 35 (26 Août - 1 Sept 2024) est IMPAIRE

        it('should count days only on odd weeks (Mon-Wed)', () => {
            const startDate = d(2024, 8, 19); // Lundi Semaine 34 (Paire)
            const endDate = d(2024, 9, 1);    // Dimanche Semaine 35 (Impaire)
            const result = calculateLeaveCountedDays(startDate, endDate, schedule);

            expect(result.naturalDays).toBe(14);
            // Correction: Somme des countedDays
            const totalCountedDays = result.weeklyBreakdown.reduce((sum, week) => sum + week.countedDays, 0);
            expect(totalCountedDays).toBe(3); // Uniquement Lun,Mar,Mer de la semaine 35
            expect(result.weeklyBreakdown.length).toBe(2);
            expect(result.weeklyBreakdown[0].weekType).toBe('EVEN');
            expect(result.weeklyBreakdown[0].countedDays).toBe(0);
            expect(result.weeklyBreakdown[1].weekType).toBe('ODD');
            expect(result.weeklyBreakdown[1].countedDays).toBe(3);
        });
    });

}); 