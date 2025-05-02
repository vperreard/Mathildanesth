import {
    LeaveType,
    LeaveStatus,
    RecurrenceFrequency,
    RecurrenceEndType,
    RecurrencePattern
} from '../../src/modules/leaves/types/leave';
import { createRecurringLeaveRequest, updateRecurringLeaveRequest } from '../../src/modules/leaves/services/leaveService';
import { generateRecurringDates } from '../../src/modules/leaves/utils/recurringLeavesUtils';
import { addDays, format, addWeeks } from 'date-fns';

// Mock des fonctions fetch
global.fetch = jest.fn();

describe('Workflow des congés récurrents - Test d\'intégration', () => {
    const userId = 'user-123';
    const today = new Date();
    const tomorrow = addDays(today, 1);

    const validRecurringPattern: RecurrencePattern = {
        frequency: RecurrenceFrequency.WEEKLY,
        interval: 1,
        weekdays: [1], // Lundi
        endType: RecurrenceEndType.COUNT,
        endCount: 5,
        skipWeekends: false,
        skipHolidays: false
    };

    // Configuration des mocks avant chaque test
    beforeEach(() => {
        jest.clearAllMocks();

        // Mock pour la création d'une demande récurrente
        (global.fetch as jest.Mock).mockImplementation((url: string, options: RequestInit) => {
            if (url.includes('/api/leaves/recurring')) {
                const requestBody = JSON.parse(options.body as string);
                const response = {
                    id: 'recurring-leave-123',
                    ...requestBody,
                    status: LeaveStatus.DRAFT,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(response)
                });
            }

            return Promise.resolve({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            });
        });
    });

    test('devrait créer une demande de congé récurrente et générer les occurrences', async () => {
        // Créer une demande de congé récurrente
        const recurringRequest = {
            userId,
            type: LeaveType.ANNUAL,
            startDate: today,
            endDate: tomorrow,
            patternStartDate: today,
            patternEndDate: addWeeks(today, 4),
            reason: 'Congé récurrent test',
            recurrencePattern: validRecurringPattern
        };

        // Appeler le service pour créer la demande
        const createdRequest = await createRecurringLeaveRequest(recurringRequest);

        // Vérifier que la demande est créée
        expect(createdRequest).toBeDefined();
        expect(createdRequest.id).toBe('recurring-leave-123');
        expect(createdRequest.type).toBe(LeaveType.ANNUAL);
        expect(createdRequest.recurrencePattern).toEqual(validRecurringPattern);

        // Vérifier que fetch a été appelé correctement
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith(
            '/api/leaves/recurring',
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'Content-Type': 'application/json'
                })
            })
        );

        // Générer les occurrences à partir de la demande
        const occurrencesResult = generateRecurringDates(createdRequest);

        // Vérifier que les occurrences sont générées correctement
        expect(occurrencesResult.occurrences.length).toBe(5); // Basé sur endCount: 5

        // Vérifier que chaque occurrence a les propriétés attendues
        occurrencesResult.occurrences.forEach((occurrence, index) => {
            expect(occurrence.userId).toBe(userId);
            expect(occurrence.type).toBe(LeaveType.ANNUAL);
            expect((occurrence as any).parentRequestId).toBe('recurring-leave-123');
            expect(occurrence.reason).toBe('Congé récurrent test');

            // Si les jours de la semaine sont spécifiés, vérifier que l'occurrence tombe le bon jour
            if (validRecurringPattern.weekdays && validRecurringPattern.weekdays.length > 0) {
                expect(occurrence.startDate.getDay()).toBe(validRecurringPattern.weekdays[0]);
            }

            // Vérifier l'intervalle entre les occurrences
            if (index > 0) {
                const previousOccurrence = occurrencesResult.occurrences[index - 1];
                const expectedDate = addWeeks(previousOccurrence.startDate, validRecurringPattern.interval);
                expect(format(occurrence.startDate, 'yyyy-MM-dd')).toBe(format(expectedDate, 'yyyy-MM-dd'));
            }
        });
    });

    test('devrait mettre à jour une demande récurrente existante', async () => {
        // Mock pour la mise à jour
        (global.fetch as jest.Mock).mockImplementationOnce((url: string, options: RequestInit) => {
            if (url.includes('/api/leaves/recurring/recurring-leave-123')) {
                const requestBody = JSON.parse(options.body as string);
                const response = {
                    id: 'recurring-leave-123',
                    ...requestBody,
                    status: LeaveStatus.DRAFT,
                    updatedAt: new Date()
                };

                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(response)
                });
            }

            return Promise.resolve({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            });
        });

        // Modifier la récurrence (passer de 5 à 3 occurrences)
        const updatedPattern = {
            ...validRecurringPattern,
            endCount: 3
        };

        const updateRequest = {
            id: 'recurring-leave-123',
            userId,
            recurrencePattern: updatedPattern
        };

        // Appeler le service pour mettre à jour la demande
        const updatedRequest = await updateRecurringLeaveRequest(updateRequest);

        // Vérifier que la demande est mise à jour
        expect(updatedRequest).toBeDefined();
        expect(updatedRequest.id).toBe('recurring-leave-123');
        expect(updatedRequest.recurrencePattern?.endCount).toBe(3);

        // Générer les occurrences avec le modèle mis à jour
        const occurrencesResult = generateRecurringDates({
            ...updateRequest,
            patternStartDate: today,
            patternEndDate: tomorrow,
            startDate: today,
            endDate: tomorrow,
            type: LeaveType.ANNUAL
        } as any);

        // Vérifier que le nombre d'occurrences a été mis à jour
        expect(occurrencesResult.occurrences.length).toBe(3);
    });

    test('devrait gérer les jours fériés pendant la génération des occurrences', async () => {
        // Définir quelques jours fériés simulés
        const holidays = [
            addWeeks(today, 1), // La première occurrence
            addWeeks(today, 3)  // La troisième occurrence
        ];

        // Modifier le modèle pour tenir compte des jours fériés
        const patternWithHolidaySkip = {
            ...validRecurringPattern,
            skipHolidays: true
        };

        // Créer une demande de congé récurrente
        const recurringRequest = {
            userId,
            type: LeaveType.ANNUAL,
            startDate: today,
            endDate: tomorrow,
            patternStartDate: today,
            patternEndDate: addWeeks(today, 10),
            reason: 'Congé récurrent avec jours fériés',
            recurrencePattern: patternWithHolidaySkip
        };

        // Mock pour cette demande spécifique
        (global.fetch as jest.Mock).mockImplementationOnce((url: string, options: RequestInit) => {
            if (url.includes('/api/leaves/recurring')) {
                const requestBody = JSON.parse(options.body as string);
                const response = {
                    id: 'recurring-leave-holidays',
                    ...requestBody,
                    status: LeaveStatus.DRAFT,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(response)
                });
            }

            return Promise.resolve({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            });
        });

        // Créer la demande
        const createdRequest = await createRecurringLeaveRequest(recurringRequest);

        // Générer les occurrences en tenant compte des jours fériés
        const occurrencesResult = generateRecurringDates(createdRequest, { holidays });

        // Vérifier que les occurrences sont générées correctement
        expect(occurrencesResult.occurrences.length).toBe(5); // Toujours 5 occurrences

        // Vérifier qu'aucune occurrence ne tombe un jour férié
        const holidayStrings = holidays.map(date => format(date, 'yyyy-MM-dd'));
        occurrencesResult.occurrences.forEach(occurrence => {
            const occurrenceDate = format(occurrence.startDate, 'yyyy-MM-dd');
            expect(holidayStrings.includes(occurrenceDate)).toBe(false);
        });
    });

    test('devrait tester les limites de quota lors de la création de congés récurrents', async () => {
        // Configurer un modèle avec beaucoup d'occurrences pour simuler un dépassement de quota
        const patternWithManyOccurrences = {
            ...validRecurringPattern,
            endCount: 50 // Un grand nombre d'occurrences
        };

        // Créer une demande de congé récurrente
        const recurringRequest = {
            userId,
            type: LeaveType.ANNUAL,
            startDate: today,
            endDate: addDays(today, 5), // 5 jours par occurrence
            patternStartDate: today,
            patternEndDate: addWeeks(today, 52), // Un an
            reason: 'Congé récurrent long',
            recurrencePattern: patternWithManyOccurrences
        };

        // Mock pour simuler une erreur de quota
        (global.fetch as jest.Mock).mockImplementationOnce((url: string, options: RequestInit) => {
            return Promise.resolve({
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                json: () => Promise.resolve({
                    error: 'QUOTA_EXCEEDED',
                    message: 'La demande dépasse le quota disponible',
                    details: {
                        requested: 250, // 50 occurrences * 5 jours
                        available: 25    // Quota disponible simulé
                    }
                })
            });
        });

        // Tenter de créer la demande (devrait échouer)
        try {
            await createRecurringLeaveRequest(recurringRequest);
            fail('La création aurait dû échouer avec une erreur de quota');
        } catch (error: any) {
            expect(error).toBeDefined();
            expect(error.message).toContain('Erreur HTTP 400');
        }

        // Vérifier que fetch a été appelé
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });
}); 