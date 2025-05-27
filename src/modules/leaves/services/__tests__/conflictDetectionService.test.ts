import { ConflictDetectionService } from '../conflictDetectionService';
import { UserService } from '../../../utilisateurs/services/userService';
import { TeamService } from '../../../teams/services/teamService';
import { ConfigService } from '../../../config/services/configService';
import { PerformanceLogger } from '../../../../utils/performanceLogger';
import { LeaveRequest, LeaveStatus, LeaveType } from '../../types/leave';
import { ConflictType, ConflictSeverity, ConflictRules } from '../../types/conflict';
import { User } from '../../../../types/user';

// Mock des dépendances
jest.mock('../../../utilisateurs/services/userService');
jest.mock('../../../teams/services/teamService');
jest.mock('../../../config/services/configService');
jest.mock('../../../../utils/performanceLogger');

describe('ConflictDetectionService', () => {
    let service: ConflictDetectionService;
    let mockUserService: jest.Mocked<UserService>;
    let mockTeamService: jest.Mocked<TeamService>;
    let mockConfigService: jest.Mocked<ConfigService>;
    let mockLogger: jest.Mocked<PerformanceLogger>;

    const mockUser: User = {
        id: 'user1',
        email: 'user1@example.com',
        firstName: 'John',
        lastName: 'Doe',
        departmentId: 'dept1',
        roles: [
            { id: 'role1', name: 'Developer', isCritical: false },
            { id: 'role2', name: 'Team Lead', isCritical: true }
        ]
    } as any;

    const mockLeaveRequest: LeaveRequest = {
        id: 'leave1',
        userId: 'user1',
        type: LeaveType.PAID,
        startDate: '2024-01-15',
        endDate: '2024-01-19',
        status: LeaveStatus.EN_ATTENTE,
        reason: 'Vacation',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const defaultRules: ConflictRules = {
        maxTeamAbsencePercentage: 30,
        criticalRolesRequireBackup: true,
        minDaysBeforeDeadline: 5,
        blockHolidayBridging: true,
        blockHighWorkloadPeriods: true,
        stopCheckingAfterBlockingConflict: false,
        highWorkloadPeriods: [
            {
                startDate: '2024-01-10',
                endDate: '2024-01-20',
                description: 'Release period'
            }
        ]
    };

    beforeEach(() => {
        jest.clearAllMocks();

        mockUserService = {
            getUserById: jest.fn(),
            getUsersByRole: jest.fn()
        } as any;

        mockTeamService = {
            getTeamMembers: jest.fn()
        } as any;

        mockConfigService = {
            getConfigValue: jest.fn(),
            setConfigValue: jest.fn()
        } as any;

        // Mock PerformanceLogger
        mockLogger = {
            log: jest.fn(),
            startTimer: jest.fn(),
            endTimer: jest.fn()
        } as any;
        (PerformanceLogger as jest.Mock).mockImplementation(() => mockLogger);

        service = new ConflictDetectionService(
            mockUserService as any,
            mockTeamService as any,
            mockConfigService as any,
            defaultRules
        );
    });

    describe('initialization', () => {
        it('should initialize with default rules', () => {
            const rules = service.getRules();
            expect(rules).toEqual(defaultRules);
        });

        it('should load rules from config service on initialization', async () => {
            const storedRules = { maxTeamAbsencePercentage: 40 };
            mockConfigService.getConfigValue.mockResolvedValueOnce(storedRules);

            const newService = new ConflictDetectionService(
                mockUserService as any,
                mockTeamService as any,
                mockConfigService as any,
                defaultRules
            );

            // Give time for async initialization
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(mockConfigService.getConfigValue).toHaveBeenCalledWith('leaveConflictRules');
        });
    });

    describe('setRules', () => {
        it('should update rules and clear cache', () => {
            const clearCacheSpy = jest.spyOn(service, 'clearCache');
            const newRules = { maxTeamAbsencePercentage: 50 };

            service.setRules(newRules);

            const rules = service.getRules();
            expect(rules.maxTeamAbsencePercentage).toBe(50);
            expect(clearCacheSpy).toHaveBeenCalled();
            expect(mockConfigService.setConfigValue).toHaveBeenCalledWith('leaveConflictRules', expect.objectContaining(newRules));
        });
    });

    describe('cache management', () => {
        it('should cache results', async () => {
            mockUserService.getUserById.mockResolvedValue(mockUser);
            mockTeamService.getTeamMembers.mockResolvedValue([]);

            // First call
            await service.checkConflicts(mockLeaveRequest);
            expect(mockUserService.getUserById).toHaveBeenCalledTimes(1);

            // Second call should use cache
            await service.checkConflicts(mockLeaveRequest);
            expect(mockUserService.getUserById).toHaveBeenCalledTimes(1);
        });

        it('should skip cache when requested', async () => {
            mockUserService.getUserById.mockResolvedValue(mockUser);
            mockTeamService.getTeamMembers.mockResolvedValue([]);

            // First call
            await service.checkConflicts(mockLeaveRequest);
            expect(mockUserService.getUserById).toHaveBeenCalledTimes(1);

            // Second call with skipCache
            await service.checkConflicts(mockLeaveRequest, [], true);
            expect(mockUserService.getUserById).toHaveBeenCalledTimes(2);
        });

        it('should clear cache', () => {
            service.clearCache();
            expect(mockLogger.log).toHaveBeenCalledWith('Cache vidé');
        });

        it('should set cache TTL', () => {
            service.setCacheTTL(10000);
            expect(mockLogger.log).toHaveBeenCalledWith('TTL du cache défini à 10000ms');
        });
    });

    describe('checkConflicts', () => {
        it('should throw error if leave request is not defined', async () => {
            await expect(service.checkConflicts(null as any)).rejects.toThrow('Demande de congés non définie');
        });

        it('should throw error if userId is not defined', async () => {
            const invalidRequest = { ...mockLeaveRequest, userId: undefined } as any;
            await expect(service.checkConflicts(invalidRequest)).rejects.toThrow('ID utilisateur non défini');
        });

        it('should throw error if user not found', async () => {
            mockUserService.getUserById.mockResolvedValue(null);
            await expect(service.checkConflicts(mockLeaveRequest)).rejects.toThrow('Utilisateur user1 non trouvé');
        });

        it('should detect user leave overlap conflicts', async () => {
            const existingLeave: LeaveRequest = {
                id: 'leave2',
                userId: 'user1',
                type: LeaveType.PAID,
                startDate: '2024-01-17',
                endDate: '2024-01-22',
                status: LeaveStatus.APPROUVE,
                reason: 'Another vacation',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockUserService.getUserById.mockResolvedValue(mockUser);
            mockTeamService.getTeamMembers.mockResolvedValue([]);

            const result = await service.checkConflicts(mockLeaveRequest, [existingLeave]);

            expect(result.hasConflicts).toBe(true);
            expect(result.hasBlockers).toBe(true);
            expect(result.conflicts).toHaveLength(1);
            expect(result.conflicts[0].type).toBe(ConflictType.USER_LEAVE_OVERLAP);
            expect(result.conflicts[0].severity).toBe(ConflictSeverity.BLOQUANT);
        });

        it('should stop early if blocking conflict found and rule is enabled', async () => {
            const existingLeave: LeaveRequest = {
                id: 'leave2',
                userId: 'user1',
                type: LeaveType.PAID,
                startDate: '2024-01-17',
                endDate: '2024-01-22',
                status: LeaveStatus.APPROUVE,
                reason: 'Another vacation',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            service.setRules({ stopCheckingAfterBlockingConflict: true });
            mockUserService.getUserById.mockResolvedValue(mockUser);
            mockTeamService.getTeamMembers.mockResolvedValue([]);

            const result = await service.checkConflicts(mockLeaveRequest, [existingLeave]);

            expect(result.hasBlockers).toBe(true);
            expect(mockLogger.log).toHaveBeenCalledWith('Arrêt précoce: conflit bloquant détecté');
        });

        it('should detect team absence conflicts', async () => {
            const teamMembers = [
                mockUser,
                { id: 'user2', firstName: 'Jane', lastName: 'Smith' } as User,
                { id: 'user3', firstName: 'Bob', lastName: 'Johnson' } as User
            ];

            const existingLeave: LeaveRequest = {
                id: 'leave2',
                userId: 'user2',
                type: LeaveType.PAID,
                startDate: '2024-01-15',
                endDate: '2024-01-19',
                status: LeaveStatus.APPROUVE,
                reason: 'Vacation',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockUserService.getUserById.mockResolvedValue(mockUser);
            mockTeamService.getTeamMembers.mockResolvedValue(teamMembers);

            const result = await service.checkConflicts(mockLeaveRequest, [existingLeave]);

            const teamConflict = result.conflicts.find(c => c.type === ConflictType.TEAM_ABSENCE);
            expect(teamConflict).toBeDefined();
            expect(teamConflict?.severity).toBe(ConflictSeverity.AVERTISSEMENT);
        });

        it('should detect critical role conflicts with no backup', async () => {
            mockUserService.getUserById.mockResolvedValue(mockUser);
            mockUserService.getUsersByRole.mockResolvedValue([mockUser]); // Only the requester has this role
            mockTeamService.getTeamMembers.mockResolvedValue([]);

            const result = await service.checkConflicts(mockLeaveRequest);

            const roleConflict = result.conflicts.find(c => c.type === ConflictType.CRITICAL_ROLE);
            expect(roleConflict).toBeDefined();
            expect(roleConflict?.severity).toBe(ConflictSeverity.BLOQUANT);
            expect(roleConflict?.description).toContain('Aucun remplaçant disponible');
        });

        it('should detect critical role conflicts when all backups are absent', async () => {
            const backup: User = {
                id: 'user2',
                email: 'user2@example.com',
                firstName: 'Jane',
                lastName: 'Smith'
            } as any;

            const backupLeave: LeaveRequest = {
                id: 'leave2',
                userId: 'user2',
                type: LeaveType.PAID,
                startDate: '2024-01-14',
                endDate: '2024-01-20',
                status: LeaveStatus.APPROUVE,
                reason: 'Vacation',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockUserService.getUserById.mockResolvedValue(mockUser);
            mockUserService.getUsersByRole.mockResolvedValue([mockUser, backup]);
            mockTeamService.getTeamMembers.mockResolvedValue([]);

            const result = await service.checkConflicts(mockLeaveRequest, [backupLeave]);

            const roleConflict = result.conflicts.find(c => c.type === ConflictType.CRITICAL_ROLE);
            expect(roleConflict).toBeDefined();
            expect(roleConflict?.description).toContain('Tous les remplaçants');
        });

        it('should detect high workload period conflicts', async () => {
            mockUserService.getUserById.mockResolvedValue(mockUser);
            mockTeamService.getTeamMembers.mockResolvedValue([]);

            const result = await service.checkConflicts(mockLeaveRequest);

            const workloadConflict = result.conflicts.find(c => c.type === ConflictType.HIGH_WORKLOAD);
            expect(workloadConflict).toBeDefined();
            expect(workloadConflict?.severity).toBe(ConflictSeverity.BLOQUANT);
            expect(workloadConflict?.description).toContain('période de charge de travail élevée');
        });
    });

    describe('canAutoApprove', () => {
        it('should return true when no conflicts', async () => {
            mockUserService.getUserById.mockResolvedValue(mockUser);
            mockTeamService.getTeamMembers.mockResolvedValue([]);
            service.setRules({
                blockHighWorkloadPeriods: false,
                criticalRolesRequireBackup: false
            });

            const result = await service.canAutoApprove(mockLeaveRequest);
            expect(result).toBe(true);
        });

        it('should return false when blocking conflicts exist', async () => {
            const existingLeave: LeaveRequest = {
                id: 'leave2',
                userId: 'user1',
                type: LeaveType.PAID,
                startDate: '2024-01-17',
                endDate: '2024-01-22',
                status: LeaveStatus.APPROUVE,
                reason: 'Another vacation',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockUserService.getUserById.mockResolvedValue(mockUser);
            mockTeamService.getTeamMembers.mockResolvedValue([]);

            const result = await service.canAutoApprove(mockLeaveRequest, [existingLeave]);
            expect(result).toBe(false);
        });
    });

    describe('edge cases', () => {
        it('should handle user without department', async () => {
            const userWithoutDept = { ...mockUser, departmentId: undefined };
            mockUserService.getUserById.mockResolvedValue(userWithoutDept);

            const result = await service.checkConflicts(mockLeaveRequest);

            expect(mockTeamService.getTeamMembers).not.toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should handle user without roles', async () => {
            const userWithoutRoles = { ...mockUser, roles: undefined };
            mockUserService.getUserById.mockResolvedValue(userWithoutRoles);
            mockTeamService.getTeamMembers.mockResolvedValue([]);

            const result = await service.checkConflicts(mockLeaveRequest);

            expect(mockUserService.getUsersByRole).not.toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should skip weekend days in team absence calculation', async () => {
            const weekendRequest: LeaveRequest = {
                ...mockLeaveRequest,
                startDate: '2024-01-13', // Saturday
                endDate: '2024-01-14' // Sunday
            };

            mockUserService.getUserById.mockResolvedValue(mockUser);
            mockTeamService.getTeamMembers.mockResolvedValue([mockUser]);

            const result = await service.checkConflicts(weekendRequest);

            const teamConflict = result.conflicts.find(c => c.type === ConflictType.TEAM_ABSENCE);
            expect(teamConflict).toBeUndefined();
        });
    });
});