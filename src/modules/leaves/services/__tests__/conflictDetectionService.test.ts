import { ConflictDetectionService } from '../conflictDetectionService';
import { UserService } from '../../../users/services/userService';
import { TeamService } from '../../../teams/services/teamService';
import { ConfigService } from '../../../config/services/configService';
import {
    ConflictType,
    ConflictSeverity,
    ConflictRules
} from '../../types/conflict';
import { LeaveRequest, LeaveStatus } from '../../types/leave';

// Mocks des services
jest.mock('../../../users/services/userService');
jest.mock('../../../teams/services/teamService');
jest.mock('../../../config/services/configService');

describe('ConflictDetectionService', () => {
    let conflictService: ConflictDetectionService;
    let mockUserService: jest.Mocked<UserService>;
    let mockTeamService: jest.Mocked<TeamService>;
    let mockConfigService: jest.Mocked<ConfigService>;

    // Données de test
    const mockUser = {
        id: 'user1',
        departmentId: 'dept1',
        roles: ['developer'],
        name: 'Test User',
        critical: true
    };

    const mockTeamMembers = [
        { id: 'user1', departmentId: 'dept1', roles: ['developer'], name: 'Test User', critical: true },
        { id: 'user2', departmentId: 'dept1', roles: ['designer'], name: 'Another User', critical: false }
    ];

    const createLeaveRequest = (overrides = {}): LeaveRequest => ({
        id: 'leave1',
        userId: 'user1',
        startDate: '2023-06-01',
        endDate: '2023-06-10',
        status: LeaveStatus.EN_ATTENTE,
        type: 'CONGES_PAYES',
        duration: 8,
        ...overrides
    });

    const defaultRules: ConflictRules = {
        maxTeamAbsencePercentage: 50,
        criticalRolesRequireBackup: true,
        minDaysBeforeDeadline: 5,
        blockHolidayBridging: true,
        blockHighWorkloadPeriods: true,
        highWorkloadPeriods: [
            {
                startDate: '2023-12-15',
                endDate: '2023-12-31',
                description: 'Fin d\'année'
            }
        ]
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Configuration des mocks
        mockUserService = {
            getUserById: jest.fn().mockResolvedValue(mockUser)
        } as unknown as jest.Mocked<UserService>;

        mockTeamService = {
            getTeamMembers: jest.fn().mockResolvedValue(mockTeamMembers)
        } as unknown as jest.Mocked<TeamService>;

        mockConfigService = {
            getConfigValue: jest.fn().mockResolvedValue(null),
            setConfigValue: jest.fn().mockResolvedValue(undefined)
        } as unknown as jest.Mocked<ConfigService>;

        // Création du service avec les mocks
        conflictService = new ConflictDetectionService(
            mockUserService,
            mockTeamService,
            mockConfigService,
            defaultRules
        );
    });

    describe('Initialisation et configuration', () => {
        it('devrait initialiser le service avec les règles par défaut', () => {
            expect(conflictService.getRules()).toEqual(defaultRules);
            expect(mockConfigService.getConfigValue).toHaveBeenCalledWith('leaveConflictRules');
        });

        it('devrait mettre à jour les règles correctement', async () => {
            const newRules: Partial<ConflictRules> = {
                maxTeamAbsencePercentage: 60,
                blockHolidayBridging: false
            };

            conflictService.setRules(newRules);

            expect(conflictService.getRules()).toEqual({
                ...defaultRules,
                ...newRules
            });

            expect(mockConfigService.setConfigValue).toHaveBeenCalledWith(
                'leaveConflictRules',
                expect.objectContaining(newRules)
            );
        });
    });

    describe('checkConflicts', () => {
        it('devrait rejeter une demande sans userId', async () => {
            const invalidRequest = createLeaveRequest({ userId: undefined });

            await expect(conflictService.checkConflicts(invalidRequest)).rejects.toThrow(
                'ID utilisateur non défini dans la demande de congés'
            );
        });

        it('devrait rejeter si l\'utilisateur n\'existe pas', async () => {
            mockUserService.getUserById.mockResolvedValueOnce(null);
            const request = createLeaveRequest();

            await expect(conflictService.checkConflicts(request)).rejects.toThrow(
                /Utilisateur .* non trouvé/
            );
        });

        it('devrait retourner aucun conflit pour une demande valide sans conflits', async () => {
            const request = createLeaveRequest();

            // Mock des méthodes privées qui vérifient les conflits
            // @ts-ignore accès aux méthodes privées pour le test
            conflictService.checkTeamAbsenceConflicts = jest.fn().mockResolvedValue(undefined);
            // @ts-ignore accès aux méthodes privées pour le test
            conflictService.checkCriticalRoleConflicts = jest.fn().mockResolvedValue(undefined);
            // @ts-ignore accès aux méthodes privées pour le test
            conflictService.checkDeadlineProximityConflicts = jest.fn().mockResolvedValue(undefined);
            // @ts-ignore accès aux méthodes privées pour le test
            conflictService.checkHolidayProximityConflicts = jest.fn().mockResolvedValue(undefined);
            // @ts-ignore accès aux méthodes privées pour le test
            conflictService.checkRecurringMeetingConflicts = jest.fn().mockResolvedValue(undefined);
            // @ts-ignore accès aux méthodes privées pour le test
            conflictService.checkHighWorkloadPeriodConflicts = jest.fn().mockResolvedValue(undefined);
            // @ts-ignore accès aux méthodes privées pour le test
            conflictService.checkUserLeaveOverlapConflicts = jest.fn().mockResolvedValue(undefined);

            const result = await conflictService.checkConflicts(request);

            expect(result).toEqual({
                hasConflicts: false,
                conflicts: [],
                hasBlockers: false,
                canAutoApprove: true,
                requiresManagerReview: false
            });
        });
    });

    describe('Tests des vérifications spécifiques', () => {
        // Un tableau de conflits pour collecter les résultats
        let conflicts: any[] = [];
        let request: LeaveRequest;

        beforeEach(() => {
            conflicts = [];
            request = createLeaveRequest();
        });

        describe('checkUserLeaveOverlapConflicts', () => {
            it('devrait détecter un chevauchement avec un congé existant', async () => {
                const existingLeaves = [
                    createLeaveRequest({
                        id: 'leave2',
                        startDate: '2023-06-05',
                        endDate: '2023-06-15',
                        status: LeaveStatus.APPROUVE
                    })
                ];

                // @ts-ignore accès à la méthode privée pour le test
                await conflictService.checkUserLeaveOverlapConflicts(
                    request,
                    mockUser,
                    existingLeaves,
                    conflicts
                );

                expect(conflicts.length).toBe(1);
                expect(conflicts[0]).toEqual(expect.objectContaining({
                    type: ConflictType.USER_LEAVE_OVERLAP,
                    severity: ConflictSeverity.BLOQUANT,
                    canOverride: false
                }));
            });

            it('ne devrait pas détecter de conflit avec un congé annulé', async () => {
                const existingLeaves = [
                    createLeaveRequest({
                        id: 'leave2',
                        startDate: '2023-06-05',
                        endDate: '2023-06-15',
                        status: LeaveStatus.ANNULE
                    })
                ];

                // @ts-ignore accès à la méthode privée pour le test
                await conflictService.checkUserLeaveOverlapConflicts(
                    request,
                    mockUser,
                    existingLeaves,
                    conflicts
                );

                expect(conflicts.length).toBe(0);
            });

            it('ne devrait pas détecter de conflit sans chevauchement', async () => {
                const existingLeaves = [
                    createLeaveRequest({
                        id: 'leave2',
                        startDate: '2023-06-20',
                        endDate: '2023-06-25',
                        status: LeaveStatus.APPROUVE
                    })
                ];

                // @ts-ignore accès à la méthode privée pour le test
                await conflictService.checkUserLeaveOverlapConflicts(
                    request,
                    mockUser,
                    existingLeaves,
                    conflicts
                );

                expect(conflicts.length).toBe(0);
            });
        });

        describe('checkTeamAbsenceConflicts', () => {
            it('devrait ignorer la vérification si la règle est désactivée', async () => {
                conflictService.setRules({ maxTeamAbsencePercentage: undefined });

                // @ts-ignore accès à la méthode privée pour le test
                await conflictService.checkTeamAbsenceConflicts(
                    request,
                    [],
                    mockTeamMembers,
                    conflicts
                );

                expect(conflicts.length).toBe(0);
            });

            it('devrait détecter un conflit si trop de membres sont absents', async () => {
                // Simuler 50% de l'équipe déjà absente
                const existingLeaves = [
                    createLeaveRequest({
                        id: 'leave2',
                        userId: 'user2',
                        startDate: '2023-06-01',
                        endDate: '2023-06-10',
                        status: LeaveStatus.APPROUVE
                    })
                ];

                // @ts-ignore accès à la méthode privée pour le test
                await conflictService.checkTeamAbsenceConflicts(
                    request,
                    existingLeaves,
                    mockTeamMembers,
                    conflicts
                );

                expect(conflicts.length).toBe(1);
                expect(conflicts[0]).toEqual(expect.objectContaining({
                    type: ConflictType.TEAM_ABSENCE,
                    severity: ConflictSeverity.AVERTISSEMENT
                }));
            });
        });

        describe('checkCriticalRoleConflicts', () => {
            it('devrait détecter un conflit si un utilisateur avec rôle critique est absent sans remplaçant', async () => {
                // Simuler que l'utilisateur a un rôle critique
                mockUserService.getUserById.mockResolvedValueOnce({
                    ...mockUser,
                    critical: true,
                    roles: ['critical-role']
                });

                // @ts-ignore accès à la méthode privée pour le test
                await conflictService.checkCriticalRoleConflicts(
                    request,
                    mockUser,
                    [],
                    conflicts
                );

                expect(conflicts.length).toBe(1);
                expect(conflicts[0]).toEqual(expect.objectContaining({
                    type: ConflictType.CRITICAL_ROLE,
                    severity: ConflictSeverity.AVERTISSEMENT
                }));
            });

            it('ne devrait pas détecter de conflit si la règle est désactivée', async () => {
                conflictService.setRules({ criticalRolesRequireBackup: false });

                // @ts-ignore accès à la méthode privée pour le test
                await conflictService.checkCriticalRoleConflicts(
                    request,
                    mockUser,
                    [],
                    conflicts
                );

                expect(conflicts.length).toBe(0);
            });
        });

        describe('checkDeadlineProximityConflicts', () => {
            beforeEach(() => {
                // @ts-ignore accès aux props privées pour le test
                conflictService.configService.getConfigValue.mockImplementation((key) => {
                    if (key === 'projectDeadlines') {
                        return Promise.resolve([
                            {
                                id: 'deadline1',
                                projectId: 'project1',
                                date: '2023-06-15',
                                description: 'Deadline importante'
                            }
                        ]);
                    }
                    return Promise.resolve(null);
                });
            });

            it('devrait détecter un conflit si le congé est proche d\'une deadline', async () => {
                // @ts-ignore accès à la méthode privée pour le test
                await conflictService.checkDeadlineProximityConflicts(
                    request,
                    conflicts
                );

                expect(conflicts.length).toBe(1);
                expect(conflicts[0]).toEqual(expect.objectContaining({
                    type: ConflictType.DEADLINE_PROXIMITY,
                    severity: ConflictSeverity.AVERTISSEMENT
                }));
            });

            it('ne devrait pas détecter de conflit si la règle est désactivée', async () => {
                conflictService.setRules({ minDaysBeforeDeadline: undefined });

                // @ts-ignore accès à la méthode privée pour le test
                await conflictService.checkDeadlineProximityConflicts(
                    request,
                    conflicts
                );

                expect(conflicts.length).toBe(0);
            });
        });

        describe('checkHighWorkloadPeriodConflicts', () => {
            it('devrait détecter un conflit si le congé est pendant une période de haute charge', async () => {
                const decemberRequest = createLeaveRequest({
                    startDate: '2023-12-20',
                    endDate: '2023-12-25'
                });

                // @ts-ignore accès à la méthode privée pour le test
                await conflictService.checkHighWorkloadPeriodConflicts(
                    decemberRequest,
                    conflicts
                );

                expect(conflicts.length).toBe(1);
                expect(conflicts[0]).toEqual(expect.objectContaining({
                    type: ConflictType.HIGH_WORKLOAD,
                    severity: ConflictSeverity.AVERTISSEMENT
                }));
            });

            it('ne devrait pas détecter de conflit si la règle est désactivée', async () => {
                conflictService.setRules({ blockHighWorkloadPeriods: false });

                const decemberRequest = createLeaveRequest({
                    startDate: '2023-12-20',
                    endDate: '2023-12-25'
                });

                // @ts-ignore accès à la méthode privée pour le test
                await conflictService.checkHighWorkloadPeriodConflicts(
                    decemberRequest,
                    conflicts
                );

                expect(conflicts.length).toBe(0);
            });
        });
    });

    describe('Méthode canAutoApprove', () => {
        it('devrait permettre l\'auto-approbation quand il n\'y a pas de conflits', async () => {
            // Mock de checkConflicts pour qu'elle retourne aucun conflit
            // @ts-ignore accès aux méthodes pour le mock
            conflictService.checkConflicts = jest.fn().mockResolvedValue({
                hasConflicts: false,
                conflicts: [],
                hasBlockers: false,
                canAutoApprove: true,
                requiresManagerReview: false
            });

            const request = createLeaveRequest();
            const result = await conflictService.canAutoApprove(request);

            expect(result).toBe(true);
        });

        it('ne devrait pas permettre l\'auto-approbation quand il y a des conflits bloquants', async () => {
            // Mock de checkConflicts pour qu'elle retourne des conflits bloquants
            // @ts-ignore accès aux méthodes pour le mock
            conflictService.checkConflicts = jest.fn().mockResolvedValue({
                hasConflicts: true,
                conflicts: [
                    {
                        id: 'conflict1',
                        type: ConflictType.USER_LEAVE_OVERLAP,
                        severity: ConflictSeverity.BLOQUANT
                    }
                ],
                hasBlockers: true,
                canAutoApprove: false,
                requiresManagerReview: true
            });

            const request = createLeaveRequest();
            const result = await conflictService.canAutoApprove(request);

            expect(result).toBe(false);
        });
    });

    describe('Tests de performance', () => {
        it('devrait traiter efficacement un grand nombre de congés existants', async () => {
            // Créer un grand nombre de congés existants qui ne se chevauchent pas
            const manyLeaves = Array.from({ length: 100 }, (_, i) =>
                createLeaveRequest({
                    id: `leave${i}`,
                    userId: i % 2 === 0 ? 'user1' : 'user2',
                    startDate: `2023-01-${String(i + 1).padStart(2, '0')}`,
                    endDate: `2023-01-${String(i + 1).padStart(2, '0')}`,
                    status: LeaveStatus.APPROUVE
                })
            );

            const request = createLeaveRequest({
                startDate: '2023-06-01',
                endDate: '2023-06-10'
            });

            const startTime = Date.now();
            const result = await conflictService.checkConflicts(request, manyLeaves);
            const endTime = Date.now();

            // La vérification devrait prendre moins de 500ms, même avec 100 congés
            expect(endTime - startTime).toBeLessThan(500);

            // Vérifier que le résultat est correct
            expect(result).toHaveProperty('hasConflicts');
            expect(result).toHaveProperty('conflicts');
        });
    });
}); 