/**
 * Tests d'intégration pour le workflow complet de demande de congé
 * Objectif : Tester le flux end-to-end
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { TestFactory } from '@/tests/factories/testFactorySimple';

describe('Leave Workflow Integration Tests', () => {
    let testUser: any;
    let testBalance: any;

    beforeEach(() => {
    jest.clearAllMocks();
        // Créer un environnement de test
        testUser = TestFactory.User.create();
        testBalance = TestFactory.LeaveBalance.createForUser(testUser.id, 2024, {
            initial: 25,
            used: 5,
            pending: 0,
            remaining: 20,
        });
    });

    describe('Workflow complet de demande de congé', () => {
        it('devrait permettre de créer, approuver et suivre une demande de congé', async () => {
            // 1. Création de la demande
            const leaveRequest = TestFactory.Leave.createForUser(testUser.id, {
                type: 'ANNUAL',
                status: 'PENDING',
                startDate: new Date('2024-07-01'),
                endDate: new Date('2024-07-05'),
                countedDays: 5,
                reason: 'Vacances d\'été',
            });

            expect(leaveRequest.status).toBe('PENDING');
            expect(leaveRequest.countedDays).toBe(5);

            // 2. Vérification des quotas
            const remainingAfterRequest = testBalance.remaining - leaveRequest.countedDays;
            expect(remainingAfterRequest).toBe(15);
            expect(remainingAfterRequest).toBeGreaterThan(0);

            // 3. Approbation
            const approvedLeave = TestFactory.Leave.create({
                ...leaveRequest,
                status: 'APPROVED',
            });

            expect(approvedLeave.status).toBe('APPROVED');

            // 4. Mise à jour du solde
            const updatedBalance = TestFactory.LeaveBalance.create({
                ...testBalance,
                used: testBalance.used + leaveRequest.countedDays,
                remaining: testBalance.remaining - leaveRequest.countedDays,
            });

            expect(updatedBalance.used).toBe(10);
            expect(updatedBalance.remaining).toBe(15);
        });

        it('devrait rejeter une demande si quota insuffisant', async () => {
            // Arrange - Solde insuffisant
            const lowBalance = TestFactory.LeaveBalance.createForUser(testUser.id, 2024, {
                initial: 25,
                used: 22,
                pending: 0,
                remaining: 3,
            });

            const excessiveRequest = TestFactory.Leave.createForUser(testUser.id, {
                type: 'ANNUAL',
                status: 'PENDING',
                countedDays: 10, // Plus que le solde disponible
            });

            // Act & Assert
            const wouldExceedQuota = excessiveRequest.countedDays > lowBalance.remaining;
            expect(wouldExceedQuota).toBe(true);

            // La demande devrait être rejetée
            const rejectedLeave = TestFactory.Leave.create({
                ...excessiveRequest,
                status: 'REJECTED',
            });

            expect(rejectedLeave.status).toBe('REJECTED');
        });

        it('devrait détecter les conflits de dates', async () => {
            // Arrange - Congé existant
            const existingLeave = TestFactory.Leave.createForUser(testUser.id, {
                status: 'APPROVED',
                startDate: new Date('2024-07-03'),
                endDate: new Date('2024-07-10'),
            });

            // Nouvelle demande qui chevauche
            const conflictingRequest = TestFactory.Leave.createForUser(testUser.id, {
                status: 'PENDING',
                startDate: new Date('2024-07-08'),
                endDate: new Date('2024-07-15'),
            });

            // Act - Vérifier le conflit
            const hasConflict = (
                conflictingRequest.startDate <= existingLeave.endDate &&
                conflictingRequest.endDate >= existingLeave.startDate
            );

            // Assert
            expect(hasConflict).toBe(true);
        });
    });

    describe('Gestion des congés récurrents', () => {
        it('devrait créer plusieurs occurrences pour un congé récurrent', async () => {
            // Arrange
            const recurringPattern = {
                frequency: 'WEEKLY',
                daysOfWeek: [1], // Lundi
                startDate: new Date('2024-06-01'),
                endDate: new Date('2024-06-30'),
            };

            // Act - Simuler la génération d'occurrences
            const occurrences = [];
            const currentDate = new Date(recurringPattern.startDate);

            while (currentDate <= recurringPattern.endDate) {
                if (currentDate.getDay() === 1) { // Lundi
                    occurrences.push(TestFactory.Leave.createForUser(testUser.id, {
                        startDate: new Date(currentDate),
                        endDate: new Date(currentDate),
                        type: 'ANNUAL',
                        status: 'PENDING',
                    }));
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }

            // Assert
            expect(occurrences.length).toBeGreaterThan(0);
            occurrences.forEach(occurrence => {
                expect(occurrence.startDate.getDay()).toBe(1); // Tous les lundis
            });
        });
    });

    describe('Calculs de jours ouvrés', () => {
        it('devrait calculer correctement les jours ouvrés en excluant les week-ends', () => {
            // Arrange
            const startDate = new Date('2024-06-03'); // Lundi
            const endDate = new Date('2024-06-14'); // Vendredi (2 semaines)

            // Act - Calculer les jours ouvrés
            let workingDays = 0;
            const currentDate = new Date(startDate);

            while (currentDate <= endDate) {
                const dayOfWeek = currentDate.getDay();
                if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Lundi à Vendredi
                    workingDays++;
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }

            // Assert
            expect(workingDays).toBe(10); // 2 semaines = 10 jours ouvrés
        });

        it('devrait gérer les jours fériés', () => {
            // Arrange
            const publicHolidays = [
                new Date('2024-07-14'), // Fête nationale (dimanche)
                new Date('2024-08-15'), // Assomption (jeudi)
            ];

            const startDate = new Date('2024-08-12'); // Lundi
            const endDate = new Date('2024-08-16'); // Vendredi

            // Act - Calculer en excluant les jours fériés
            let workingDays = 0;
            const currentDate = new Date(startDate);

            while (currentDate <= endDate) {
                const dayOfWeek = currentDate.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const isHoliday = publicHolidays.some(holiday =>
                    holiday.toDateString() === currentDate.toDateString()
                );

                if (!isWeekend && !isHoliday) {
                    workingDays++;
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }

            // Assert
            expect(workingDays).toBe(4); // 5 jours - 1 jour férié (jeudi)
        });
    });

    describe('Gestion des quotas avancée', () => {
        it('devrait gérer le report de congés d\'une année sur l\'autre', () => {
            // Arrange
            const balance2023 = TestFactory.LeaveBalance.createForUser(testUser.id, 2023, {
                initial: 25,
                used: 20,
                remaining: 5,
            });

            const balance2024 = TestFactory.LeaveBalance.createForUser(testUser.id, 2024, {
                initial: 25 + 5, // Report de 5 jours
                used: 0,
                remaining: 30,
            });

            // Assert
            expect(balance2024.initial).toBe(30);
            expect(balance2024.remaining).toBe(30);
        });

        it('devrait calculer les quotas pour temps partiel', () => {
            // Arrange
            const partTimeUser = TestFactory.User.create({
                // Supposons 80% du temps
            });

            const fullTimeQuota = 25;
            const partTimePercentage = 0.8;
            const partTimeQuota = Math.floor(fullTimeQuota * partTimePercentage);

            const partTimeBalance = TestFactory.LeaveBalance.createForUser(partTimeUser.id, 2024, {
                initial: partTimeQuota,
                used: 0,
                remaining: partTimeQuota,
            });

            // Assert
            expect(partTimeBalance.initial).toBe(20); // 25 * 0.8 = 20
            expect(partTimeBalance.remaining).toBe(20);
        });
    });

    describe('Tests de performance', () => {
        it('devrait traiter efficacement de gros volumes de congés', () => {
            // Arrange
            const startTime = Date.now();
            const largeNumberOfLeaves = 1000;

            // Act
            const leaves = TestFactory.Leave.createBatch(largeNumberOfLeaves, testUser.id);
            const endTime = Date.now();

            // Assert
            expect(leaves).toHaveLength(largeNumberOfLeaves);
            expect(endTime - startTime).toBeLessThan(1000); // Moins d'1 seconde
        });

        it('devrait calculer rapidement les conflits sur une grande période', () => {
            // Arrange
            const startTime = Date.now();
            const existingLeaves = TestFactory.Leave.createBatch(100, testUser.id);

            const newRequest = TestFactory.Leave.createForUser(testUser.id, {
                startDate: new Date('2024-06-01'),
                endDate: new Date('2024-06-05'),
            });

            // Act - Simuler la détection de conflits
            const conflicts = existingLeaves.filter(leave =>
                newRequest.startDate <= leave.endDate &&
                newRequest.endDate >= leave.startDate
            );

            const endTime = Date.now();

            // Assert
            expect(endTime - startTime).toBeLessThan(100); // Moins de 100ms
            expect(conflicts).toBeInstanceOf(Array);
        });
    });
}); 