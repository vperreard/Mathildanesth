import { PrismaClient, SimulationStatus } from '@prisma/client';
import { ApplySimulationService } from '../applySimulationService';
import { simulationNotificationService } from '../notificationService';

// Mock des dépendances
jest.mock('@prisma/client', () => {
    const mockPrismaClient = {
        simulationResult: {
            findUnique: jest.fn(),
            update: jest.fn()
        },
        attribution: {
            deleteMany: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
            create: jest.fn()
        },
        leave: {
            create: jest.fn()
        },
        auditLog: {
            create: jest.fn()
        },
        user: {
            findUnique: jest.fn()
        },
        simulationScenario: {
            findUnique: jest.fn()
        },
        notification: {
            create: jest.fn()
        },
        $transaction: jest.fn((callback) => callback())
    };

    return {
        PrismaClient: jest.fn(() => mockPrismaClient)
    };
});

jest.mock('../notificationService', () => ({
    simulationNotificationService: {
        notifySimulationStarted: jest.fn(),
        notifySimulationProgress: jest.fn(),
        notifySimulationCompleted: jest.fn(),
        notifySimulationError: jest.fn()
    }
}));

jest.mock('@/lib/prisma');

describe('ApplySimulationService', () => {
    let service: ApplySimulationService;
    let prisma: PrismaClient;

    beforeEach(() => {
    jest.clearAllMocks();
    
        jest.clearAllMocks();
        service = new ApplySimulationService();
        prisma = prisma;
    });

    describe('applySimulationToPlanning', () => {
        const mockSimulationResultId = 'sim-result-123';
        const mockUserId = 'user-123';
        const mockScenarioId = 'scenario-123';
        const mockOptions = {
            userId: mockUserId,
            clearExistingAssignments: false,
            includeLeaves: false,
            includeOnCall: true
        };

        const mockResultData = {
            simulatedPeriod: {
                from: '2025-07-01',
                to: '2025-07-31'
            },
            attributions: [
                {
                    userId: 1,
                    date: '2025-07-02',
                    periode: 'MATIN',
                    type: 'BLOC_OPERATOIRE',
                    location: 'Salle 1'
                },
                {
                    userId: 2,
                    date: '2025-07-03',
                    periode: 'APRES_MIDI',
                    type: 'CONSULTATION',
                    location: 'Bureau 3'
                }
            ]
        };

        it('doit échouer si le résultat de simulation n\'existe pas', async () => {
            // Arrange
            (prisma.simulationResult.findUnique as jest.Mock).mockResolvedValue(null);

            // Act & Assert
            await expect(service.applySimulationToPlanning(mockSimulationResultId, mockOptions))
                .rejects.toThrow('Résultat de simulation non trouvé');

            expect(prisma.simulationResult.findUnique).toHaveBeenCalledWith({
                where: { id: mockSimulationResultId },
                include: { scenario: true }
            });
        });

        it('doit échouer si le statut de la simulation n\'est pas COMPLETED', async () => {
            // Arrange
            (prisma.simulationResult.findUnique as jest.Mock).mockResolvedValue({
                id: mockSimulationResultId,
                status: SimulationStatus.PENDING,
                resultData: mockResultData,
                scenario: { id: mockScenarioId }
            });

            // Act & Assert
            await expect(service.applySimulationToPlanning(mockSimulationResultId, mockOptions))
                .rejects.toThrow('Impossible d\'appliquer une simulation non terminée');
        });

        it('doit appliquer avec succès un résultat de simulation valide', async () => {
            // Arrange
            (prisma.simulationResult.findUnique as jest.Mock).mockResolvedValue({
                id: mockSimulationResultId,
                status: SimulationStatus.COMPLETED,
                resultData: mockResultData,
                scenario: { id: mockScenarioId, name: 'Test Scenario' }
            });

            (prisma.attribution.findFirst as jest.Mock).mockResolvedValue(null);
            (prisma.attribution.create as jest.Mock).mockResolvedValue({});
            (prisma.auditLog.create as jest.Mock).mockResolvedValue({});
            (prisma.simulationScenario.findUnique as jest.Mock).mockResolvedValue({
                id: mockScenarioId,
                name: 'Test Scenario'
            });
            (prisma.notification.create as jest.Mock).mockResolvedValue({});

            // Act
            const result = await service.applySimulationToPlanning(mockSimulationResultId, mockOptions);

            // Assert
            expect(result.success).toBe(true);
            expect(result.assignmentsCreated).toBe(2); // 2 gardes/vacations dans les données mockées
            expect(result.assignmentsUpdated).toBe(0); // Pas de mises à jour, seulement des créations
            expect(result.leavesCreated).toBe(0); // Pas de congés car includeLeaves = false

            // Vérifier que l'audit log a été créé
            expect(prisma.auditLog.create).toHaveBeenCalled();

            // Vérifier que les notifications ont été envoyées
            expect(prisma.notification.create).toHaveBeenCalled();
        });

        it('doit supprimer les gardes/vacations existantes si clearExistingAssignments est true', async () => {
            // Arrange
            const optionsWithClear = { ...mockOptions, clearExistingAssignments: true };

            (prisma.simulationResult.findUnique as jest.Mock).mockResolvedValue({
                id: mockSimulationResultId,
                status: SimulationStatus.COMPLETED,
                resultData: mockResultData,
                scenario: { id: mockScenarioId, name: 'Test Scenario' }
            });

            (prisma.attribution.deleteMany as jest.Mock).mockResolvedValue({ count: 5 });
            (prisma.attribution.findFirst as jest.Mock).mockResolvedValue(null);
            (prisma.attribution.create as jest.Mock).mockResolvedValue({});
            (prisma.auditLog.create as jest.Mock).mockResolvedValue({});
            (prisma.simulationScenario.findUnique as jest.Mock).mockResolvedValue({
                id: mockScenarioId,
                name: 'Test Scenario'
            });
            (prisma.notification.create as jest.Mock).mockResolvedValue({});

            // Act
            const result = await service.applySimulationToPlanning(mockSimulationResultId, optionsWithClear);

            // Assert
            expect(result.success).toBe(true);

            // Vérifier que les gardes/vacations existantes ont été supprimées
            expect(prisma.attribution.deleteMany).toHaveBeenCalledWith({
                where: {
                    date: {
                        gte: new Date(mockResultData.simulatedPeriod.from),
                        lte: new Date(mockResultData.simulatedPeriod.to)
                    }
                }
            });
        });

        it('doit mettre à jour les gardes/vacations existantes plutôt que d\'en créer de nouvelles', async () => {
            // Arrange
            (prisma.simulationResult.findUnique as jest.Mock).mockResolvedValue({
                id: mockSimulationResultId,
                status: SimulationStatus.COMPLETED,
                resultData: mockResultData,
                scenario: { id: mockScenarioId, name: 'Test Scenario' }
            });

            // Simuler une garde/vacation existante pour le premier élément
            (prisma.attribution.findFirst as jest.Mock).mockImplementation((args) => {
                const where = args.where;
                if (where.userId === 1 && where.periode === 'MATIN') {
                    return Promise.resolve({ id: 'existing-attribution-1' });
                }
                return Promise.resolve(null);
            });

            (prisma.attribution.update as jest.Mock).mockResolvedValue({});
            (prisma.attribution.create as jest.Mock).mockResolvedValue({});
            (prisma.auditLog.create as jest.Mock).mockResolvedValue({});
            (prisma.simulationScenario.findUnique as jest.Mock).mockResolvedValue({
                id: mockScenarioId,
                name: 'Test Scenario'
            });
            (prisma.notification.create as jest.Mock).mockResolvedValue({});

            // Act
            const result = await service.applySimulationToPlanning(mockSimulationResultId, mockOptions);

            // Assert
            expect(result.success).toBe(true);
            expect(result.assignmentsCreated).toBe(1); // 1 nouvelle garde/vacation
            expect(result.assignmentsUpdated).toBe(1); // 1 garde/vacation mise à jour

            // Vérifier que l'update a été appelé pour l'garde/vacation existante
            expect(prisma.attribution.update).toHaveBeenCalled();
        });

        it('doit gérer correctement les erreurs lors de la création d\'gardes/vacations', async () => {
            // Arrange
            (prisma.simulationResult.findUnique as jest.Mock).mockResolvedValue({
                id: mockSimulationResultId,
                status: SimulationStatus.COMPLETED,
                resultData: mockResultData,
                scenario: { id: mockScenarioId, name: 'Test Scenario' }
            });

            // Simuler une erreur lors de la création de la deuxième garde/vacation
            (prisma.attribution.findFirst as jest.Mock).mockResolvedValue(null);
            (prisma.attribution.create as jest.Mock).mockImplementation((args) => {
                const data = args.data;
                if (data.userId === 2) {
                    return Promise.reject(new Error('Erreur de création d\'garde/vacation'));
                }
                return Promise.resolve({});
            });

            (prisma.auditLog.create as jest.Mock).mockResolvedValue({});
            (prisma.simulationScenario.findUnique as jest.Mock).mockResolvedValue({
                id: mockScenarioId,
                name: 'Test Scenario'
            });
            (prisma.notification.create as jest.Mock).mockResolvedValue({});

            // Act
            const result = await service.applySimulationToPlanning(mockSimulationResultId, mockOptions);

            // Assert
            expect(result.success).toBe(true); // L'opération globale réussit toujours
            expect(result.assignmentsCreated).toBe(1); // Seulement 1 garde/vacation créée avec succès
            expect(result.conflicts.length).toBe(1); // 1 conflit enregistré

            // Vérifier que le conflit contient l'erreur
            expect(result.conflicts[0].type).toBe('ASSIGNMENT_CREATION_ERROR');
            expect(result.conflicts[0].error).toBe('Erreur de création d\'garde/vacation');
        });
    });
}); 