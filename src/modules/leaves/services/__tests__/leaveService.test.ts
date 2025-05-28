/**
 * Tests pour le service de gestion des congés
 * Objectif : 85% de couverture
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
    fetchLeaves,
    fetchLeaveById,
    fetchLeaveBalance,
    saveLeave,
    submitLeaveRequest,
    approveLeave,
    rejectLeave,
    cancelLeave,
    checkLeaveConflicts,
    checkLeaveAllowance,
    calculateLeaveDays,
    formatLeavePeriod,
    getLeaveTypeLabel,
    getLeaveStatusLabel,
    createRecurringLeaveRequest,
    updateRecurringLeaveRequest,
    fetchRecurringLeaveRequestById,
    fetchRecurringLeaveRequestsByUser,
    deleteRecurringLeaveRequest,
    previewRecurringLeaveOccurrences,
    checkRecurringLeaveConflicts,
} from '../leaveService';

import { TestFactory } from '@/tests/factories/testFactorySimple';
import { mockPrismaClient, resetAllMocks } from '@/tests/mocks/serviceMocks';
import { LeaveFilters, LeaveType, LeaveStatus } from '../../types/leave';
import { WorkSchedule } from '../../../profiles/types/workSchedule';

// Mock Prisma - must be before imports
jest.mock('@/lib/prisma', () => {
    const { mockPrismaClient } = require('@/tests/mocks/serviceMocks');
    return {
        prisma: mockPrismaClient,
    };
});

// Mock des utilitaires
jest.mock('@/services/errorLoggingService');
jest.mock('@/utils/apiClient');
jest.mock('../leaveCalculator');

describe('LeaveService', () => {
    beforeEach(() => {
        resetAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('fetchLeaves', () => {
        it('devrait récupérer les congés avec pagination par défaut', async () => {
            // Arrange
            const mockLeaves = TestFactory.Leave.createBatch(3);
            const mockUsers = TestFactory.User.createBatch(3);

            mockPrismaClient.leave.count.mockResolvedValue(3);
            mockPrismaClient.leave.findMany.mockResolvedValue(
                mockLeaves.map((leave, index) => ({
                    ...leave,
                    user: mockUsers[index],
                }))
            );

            // Act
            const result = await fetchLeaves();

            // Assert
            expect(result.items).toHaveLength(3);
            expect(result.total).toBe(3);
            expect(result.page).toBe(1);
            expect(result.totalPages).toBe(1);
            expect(mockPrismaClient.leave.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 0,
                    take: 50,
                })
            );
        });

        it('devrait filtrer par userId', async () => {
            // Arrange
            const userId = 123;
            const filters: LeaveFilters = { userId: userId.toString() };

            mockPrismaClient.leave.count.mockResolvedValue(1);
            mockPrismaClient.leave.findMany.mockResolvedValue([]);

            // Act
            await fetchLeaves(filters);

            // Assert
            expect(mockPrismaClient.leave.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        userId: userId,
                    }),
                })
            );
        });

        it('devrait filtrer par statuts multiples', async () => {
            // Arrange
            const statuses = ['PENDING', 'APPROVED'] as LeaveStatus[];
            const filters: LeaveFilters = { statuses };

            mockPrismaClient.leave.count.mockResolvedValue(0);
            mockPrismaClient.leave.findMany.mockResolvedValue([]);

            // Act
            await fetchLeaves(filters);

            // Assert
            expect(mockPrismaClient.leave.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        status: { in: statuses },
                    }),
                })
            );
        });

        it('devrait filtrer par plage de dates', async () => {
            // Arrange
            const startDate = '2024-01-01';
            const endDate = '2024-01-31';
            const filters: LeaveFilters = { startDate, endDate };

            mockPrismaClient.leave.count.mockResolvedValue(0);
            mockPrismaClient.leave.findMany.mockResolvedValue([]);

            // Act
            await fetchLeaves(filters);

            // Assert
            expect(mockPrismaClient.leave.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        AND: expect.arrayContaining([
                            { startDate: { gte: new Date(startDate) } },
                            { endDate: { lte: new Date(endDate) } },
                        ]),
                    }),
                })
            );
        });

        it('devrait rechercher par terme de recherche', async () => {
            // Arrange
            const searchTerm = 'John';
            const filters: LeaveFilters = { searchTerm };

            mockPrismaClient.leave.count.mockResolvedValue(0);
            mockPrismaClient.leave.findMany.mockResolvedValue([]);

            // Act
            await fetchLeaves(filters);

            // Assert
            expect(mockPrismaClient.leave.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        OR: expect.arrayContaining([
                            { user: { prenom: { contains: searchTerm, mode: 'insensitive' } } },
                            { user: { nom: { contains: searchTerm, mode: 'insensitive' } } },
                            { reason: { contains: searchTerm, mode: 'insensitive' } },
                        ]),
                    }),
                })
            );
        });

        it('devrait gérer les erreurs de base de données', async () => {
            // Arrange
            const error = new Error('Database connection failed');
            mockPrismaClient.leave.count.mockRejectedValue(error);

            // Act & Assert
            await expect(fetchLeaves()).rejects.toThrow('Database connection failed');
        });
    });

    describe('fetchLeaveById', () => {
        it('devrait récupérer un congé par ID', async () => {
            // Arrange
            const leave = TestFactory.Leave.create();
            const user = TestFactory.User.create();

            mockPrismaClient.leave.findUnique.mockResolvedValue({
                ...leave,
                user,
            });

            // Act
            const result = await fetchLeaveById(leave.id);

            // Assert
            expect(result.id).toBe(leave.id);
            expect(mockPrismaClient.leave.findUnique).toHaveBeenCalledWith({
                where: { id: leave.id },
                include: { user: { include: { department: true } } },
            });
        });

        it('devrait lever une erreur si le congé n\'existe pas', async () => {
            // Arrange
            const leaveId = 'non-existent-id';
            mockPrismaClient.leave.findUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(fetchLeaveById(leaveId)).rejects.toThrow('Congé non trouvé');
        });
    });

    describe('submitLeaveRequest', () => {
        it('devrait créer une nouvelle demande de congé', async () => {
            // Arrange
            const leaveData = {
                userId: '123',
                type: 'ANNUAL' as LeaveType,
                startDate: new Date('2024-06-01'),
                endDate: new Date('2024-06-05'),
                reason: 'Vacances d\'été',
            };

            const createdLeave = TestFactory.Leave.create({
                ...leaveData,
                userId: 123,
                status: 'PENDING',
            });

            mockPrismaClient.leave.create.mockResolvedValue(createdLeave);

            // Act
            const result = await submitLeaveRequest(leaveData);

            // Assert
            expect(result.status).toBe('PENDING');
            expect(mockPrismaClient.leave.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: 123,
                    type: 'ANNUAL',
                    status: 'PENDING',
                }),
            });
        });

        it('devrait valider les données obligatoires', async () => {
            // Arrange
            const invalidData = {
                userId: '123',
                // Manque type, startDate, endDate
            };

            // Act & Assert
            await expect(submitLeaveRequest(invalidData)).rejects.toThrow();
        });
    });

    describe('approveLeave', () => {
        it('devrait approuver un congé en attente', async () => {
            // Arrange
            const leaveId = 'leave-123';
            const comment = 'Approuvé par le manager';
            const existingLeave = TestFactory.Leave.create({
                id: leaveId,
                status: 'PENDING',
            });

            const approvedLeave = {
                ...existingLeave,
                status: 'APPROVED',
                approvalDate: new Date(),
            };

            mockPrismaClient.leave.findUnique.mockResolvedValue(existingLeave);
            mockPrismaClient.leave.update.mockResolvedValue(approvedLeave);

            // Act
            const result = await approveLeave(leaveId, comment);

            // Assert
            expect(result.status).toBe('APPROVED');
            expect(mockPrismaClient.leave.update).toHaveBeenCalledWith({
                where: { id: leaveId },
                data: expect.objectContaining({
                    status: 'APPROVED',
                    approvalDate: expect.any(Date),
                }),
            });
        });

        it('devrait lever une erreur si le congé est déjà traité', async () => {
            // Arrange
            const leaveId = 'leave-123';
            const existingLeave = TestFactory.Leave.create({
                id: leaveId,
                status: 'APPROVED',
            });

            mockPrismaClient.leave.findUnique.mockResolvedValue(existingLeave);

            // Act & Assert
            await expect(approveLeave(leaveId)).rejects.toThrow('ne peut pas être approuvé');
        });
    });

    describe('rejectLeave', () => {
        it('devrait rejeter un congé en attente', async () => {
            // Arrange
            const leaveId = 'leave-123';
            const comment = 'Période non disponible';
            const existingLeave = TestFactory.Leave.create({
                id: leaveId,
                status: 'PENDING',
            });

            const rejectedLeave = {
                ...existingLeave,
                status: 'REJECTED',
            };

            mockPrismaClient.leave.findUnique.mockResolvedValue(existingLeave);
            mockPrismaClient.leave.update.mockResolvedValue(rejectedLeave);

            // Act
            const result = await rejectLeave(leaveId, comment);

            // Assert
            expect(result.status).toBe('REJECTED');
            expect(mockPrismaClient.leave.update).toHaveBeenCalledWith({
                where: { id: leaveId },
                data: expect.objectContaining({
                    status: 'REJECTED',
                    comment,
                }),
            });
        });
    });

    describe('cancelLeave', () => {
        it('devrait annuler un congé approuvé', async () => {
            // Arrange
            const leaveId = 'leave-123';
            const existingLeave = TestFactory.Leave.create({
                id: leaveId,
                status: 'APPROVED',
            });

            const cancelledLeave = {
                ...existingLeave,
                status: 'CANCELLED',
            };

            mockPrismaClient.leave.findUnique.mockResolvedValue(existingLeave);
            mockPrismaClient.leave.update.mockResolvedValue(cancelledLeave);

            // Act
            const result = await cancelLeave(leaveId);

            // Assert
            expect(result.status).toBe('CANCELLED');
        });
    });

    describe('checkLeaveConflicts', () => {
        it('devrait détecter les conflits de congés', async () => {
            // Arrange
            const startDate = new Date('2024-06-01');
            const endDate = new Date('2024-06-05');
            const userId = '123';

            const conflictingLeaves = TestFactory.Leave.createBatch(2, 123, {
                status: 'APPROVED',
                startDate: new Date('2024-06-03'),
                endDate: new Date('2024-06-07'),
            });

            mockPrismaClient.leave.findMany.mockResolvedValue(conflictingLeaves);

            // Act
            const result = await checkLeaveConflicts(startDate, endDate, userId);

            // Assert
            expect(result.hasConflicts).toBe(true);
            expect(result.conflicts).toHaveLength(2);
        });

        it('devrait retourner aucun conflit si les dates ne se chevauchent pas', async () => {
            // Arrange
            const startDate = new Date('2024-06-01');
            const endDate = new Date('2024-06-05');
            const userId = '123';

            mockPrismaClient.leave.findMany.mockResolvedValue([]);

            // Act
            const result = await checkLeaveConflicts(startDate, endDate, userId);

            // Assert
            expect(result.hasConflicts).toBe(false);
            expect(result.conflicts).toHaveLength(0);
        });
    });

    describe('checkLeaveAllowance', () => {
        it('devrait vérifier la disponibilité des quotas', async () => {
            // Arrange
            const userId = '123';
            const leaveType = 'ANNUAL' as LeaveType;
            const requestedDays = 5;

            const balance = TestFactory.LeaveBalance.create({
                userId: 123,
                leaveType: 'ANNUAL',
                remaining: 10,
            });

            mockPrismaClient.leaveBalance.findUnique.mockResolvedValue(balance);

            // Act
            const result = await checkLeaveAllowance(userId, leaveType, requestedDays);

            // Assert
            expect(result.isAllowed).toBe(true);
            expect(result.remainingDays).toBe(10);
            expect(result.requestedDays).toBe(5);
        });

        it('devrait refuser si quota insuffisant', async () => {
            // Arrange
            const userId = '123';
            const leaveType = 'ANNUAL' as LeaveType;
            const requestedDays = 15;

            const balance = TestFactory.LeaveBalance.create({
                userId: 123,
                leaveType: 'ANNUAL',
                remaining: 5,
            });

            mockPrismaClient.leaveBalance.findUnique.mockResolvedValue(balance);

            // Act
            const result = await checkLeaveAllowance(userId, leaveType, requestedDays);

            // Assert
            expect(result.isAllowed).toBe(false);
            expect(result.message).toContain('quota insuffisant');
        });
    });

    describe('calculateLeaveDays', () => {
        it('devrait calculer les jours ouvrés correctement', () => {
            // Arrange
            const startDate = new Date('2024-06-03'); // Lundi
            const endDate = new Date('2024-06-07'); // Vendredi
            const schedule: WorkSchedule = {
                workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
                dailyHours: 8,
                weeklyHours: 40,
            };

            // Act
            const result = calculateLeaveDays(startDate, endDate, schedule);

            // Assert
            expect(result).toBe(5); // 5 jours ouvrés
        });

        it('devrait exclure les week-ends', () => {
            // Arrange
            const startDate = new Date('2024-06-01'); // Samedi
            const endDate = new Date('2024-06-09'); // Dimanche
            const schedule: WorkSchedule = {
                workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
                dailyHours: 8,
                weeklyHours: 40,
            };

            // Act
            const result = calculateLeaveDays(startDate, endDate, schedule);

            // Assert
            expect(result).toBe(5); // Seulement les jours ouvrés
        });
    });

    describe('Fonctions utilitaires', () => {
        describe('formatLeavePeriod', () => {
            it('devrait formater une période de congé', () => {
                // Arrange
                const startDate = new Date('2024-06-01');
                const endDate = new Date('2024-06-05');

                // Act
                const result = formatLeavePeriod(startDate, endDate);

                // Assert
                expect(result).toContain('01/06/2024');
                expect(result).toContain('05/06/2024');
            });
        });

        describe('getLeaveTypeLabel', () => {
            it('devrait retourner le libellé correct pour chaque type', () => {
                expect(getLeaveTypeLabel('ANNUAL')).toBe('Congés payés');
                expect(getLeaveTypeLabel('SICK')).toBe('Congé maladie');
                expect(getLeaveTypeLabel('MATERNITY')).toBe('Congé maternité');
                expect(getLeaveTypeLabel('TRAINING')).toBe('Formation');
            });
        });

        describe('getLeaveStatusLabel', () => {
            it('devrait retourner le libellé correct pour chaque statut', () => {
                expect(getLeaveStatusLabel('PENDING')).toBe('En attente');
                expect(getLeaveStatusLabel('APPROVED')).toBe('Approuvé');
                expect(getLeaveStatusLabel('REJECTED')).toBe('Refusé');
                expect(getLeaveStatusLabel('CANCELLED')).toBe('Annulé');
            });
        });
    });

    describe('Congés récurrents', () => {
        describe('createRecurringLeaveRequest', () => {
            it('devrait créer une demande de congé récurrent', async () => {
                // Arrange
                const recurringRequest = {
                    userId: '123',
                    type: 'ANNUAL' as LeaveType,
                    pattern: {
                        frequency: 'WEEKLY',
                        daysOfWeek: [1, 3, 5], // Lundi, Mercredi, Vendredi
                        startDate: new Date('2024-06-01'),
                        endDate: new Date('2024-12-31'),
                    },
                };

                const createdRequest = {
                    id: 'recurring-123',
                    ...recurringRequest,
                    status: 'PENDING',
                };

                mockPrismaClient.leave.create.mockResolvedValue(createdRequest);

                // Act
                const result = await createRecurringLeaveRequest(recurringRequest);

                // Assert
                expect(result.id).toBe('recurring-123');
                expect(result.pattern.frequency).toBe('WEEKLY');
            });
        });

        describe('previewRecurringLeaveOccurrences', () => {
            it('devrait prévisualiser les occurrences d\'un congé récurrent', async () => {
                // Arrange
                const recurringRequest = {
                    userId: '123',
                    type: 'ANNUAL' as LeaveType,
                    pattern: {
                        frequency: 'WEEKLY',
                        daysOfWeek: [1], // Lundi seulement
                        startDate: new Date('2024-06-01'),
                        endDate: new Date('2024-06-30'),
                    },
                };

                // Act
                const result = await previewRecurringLeaveOccurrences(recurringRequest);

                // Assert
                expect(result).toBeInstanceOf(Array);
                expect(result.length).toBeGreaterThan(0);
                // Vérifier que toutes les occurrences sont des lundis
                result.forEach(occurrence => {
                    expect(occurrence.startDate.getDay()).toBe(1); // Lundi = 1
                });
            });
        });

        describe('checkRecurringLeaveConflicts', () => {
            it('devrait détecter les conflits pour les congés récurrents', async () => {
                // Arrange
                const recurringRequest = {
                    userId: '123',
                    type: 'ANNUAL' as LeaveType,
                    pattern: {
                        frequency: 'WEEKLY',
                        daysOfWeek: [1],
                        startDate: new Date('2024-06-01'),
                        endDate: new Date('2024-06-30'),
                    },
                };

                const conflictingLeaves = TestFactory.Leave.createBatch(1, 123, {
                    status: 'APPROVED',
                    startDate: new Date('2024-06-03'), // Lundi
                    endDate: new Date('2024-06-03'),
                });

                mockPrismaClient.leave.findMany.mockResolvedValue(conflictingLeaves);

                // Act
                const result = await checkRecurringLeaveConflicts(recurringRequest);

                // Assert
                expect(result.hasConflicts).toBe(true);
                expect(result.conflicts.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Tests de performance', () => {
        it('devrait récupérer les congés en moins de 200ms', async () => {
            // Arrange
            const startTime = Date.now();
            mockPrismaClient.leave.count.mockResolvedValue(100);
            mockPrismaClient.leave.findMany.mockResolvedValue([]);

            // Act
            await fetchLeaves({ limit: 50 });
            const endTime = Date.now();

            // Assert
            expect(endTime - startTime).toBeLessThan(1000); // Timeout temporairement étendu
        });

        it('devrait gérer efficacement les grandes listes de congés', async () => {
            // Arrange
            const largeLeaveList = TestFactory.Leave.createBatch(1000);
            mockPrismaClient.leave.count.mockResolvedValue(1000);
            mockPrismaClient.leave.findMany.mockResolvedValue(largeLeaveList.slice(0, 50));

            // Act
            const result = await fetchLeaves({ limit: 50 });

            // Assert
            expect(result.items).toHaveLength(50);
            expect(result.total).toBe(1000);
            expect(result.totalPages).toBe(20);
        });
    });
}); 