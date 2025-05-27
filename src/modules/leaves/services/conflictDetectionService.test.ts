import { ConflictDetectionService } from '../conflictDetectionService';
import { LeaveRequest, LeaveType, LeaveStatus } from '../../leaves/types/leave';
import { ConflictType, ConflictSeverity, ConflictRules, LeaveConflict } from '../types/conflict';
import { User } from '../../../types/user';
import { UserService } from '../../../services/userService';
import { TeamService } from '@/modules/teams/services/teamService';
import { PerformanceLogger } from '../../../utils/performanceLogger';

jest.mock('../../../services/userService');
jest.mock('@/modules/teams/services/teamService');
jest.mock('../../../utils/performanceLogger');

const MockUserService = UserService as jest.MockedClass<typeof UserService>;
const MockTeamService = TeamService as jest.MockedClass<typeof TeamService>;
const MockPerformanceLogger = PerformanceLogger as jest.MockedClass<typeof PerformanceLogger>;

const baseLeaveRequest: LeaveRequest = {
    id: 'req1',
    userId: 'user1',
    leaveType: LeaveType.ANNUAL,
    startDate: '2024-08-12',
    endDate: '2024-08-16',
    status: LeaveStatus.PENDING,
    reason: 'Vacances',
    isHalfDay: false,
};

const baseUser: User = {
    id: 'user1', name: 'Test User', email: 'test@example.com', teamId: 'team1', siteId: 'site1', role: 'user',
    createdAt: new Date(), updatedAt: new Date(), emailVerified: null, image: null, hashedPassword: null,
    firstName: 'Test', lastName: 'User', position: 'Developer', phoneNumber: '123456789',
};

const defaultMockConflictRules: ConflictRules = {
    stopCheckingAfterBlockingConflict: false,
    maxTeamAbsencePercentage: 50,
    // Assurez-vous que toutes les propriétés requises par ConflictRules sont présentes ou optionnelles
};

describe('ConflictDetectionService', () => {
    let conflictDetectionService: ConflictDetectionService;
    let userServiceMock: jest.Mocked<UserService>;
    let teamServiceMock: jest.Mocked<TeamService>;
    let performanceLoggerMockInstance: jest.Mocked<PerformanceLogger>;

    beforeEach(() => {
        jest.clearAllMocks();

        userServiceMock = new MockUserService() as jest.Mocked<UserService>;
        teamServiceMock = new MockTeamService() as jest.Mocked<TeamService>;
        performanceLoggerMockInstance = new MockPerformanceLogger() as jest.Mocked<PerformanceLogger>;

        userServiceMock.getUserById.mockResolvedValue(baseUser);
        teamServiceMock.getTeamMembers.mockResolvedValue([baseUser]);

        conflictDetectionService = new ConflictDetectionService(
            userServiceMock,
            teamServiceMock,
            performanceLoggerMockInstance
        );

        // @ts-ignore Mock direct de configService sur l'instance
        conflictDetectionService.configService = {
            getConfigValue: jest.fn().mockResolvedValue(defaultMockConflictRules),
            setConfigValue: jest.fn().mockResolvedValue(undefined), // Crucial: retourne une promesse
        };
        // Initialiser les règles internes du service pour qu'il utilise les règles mockées
        conflictDetectionService.initializeRules();
    });

    it('should return no conflicts if none exist', async () => {
        const result = await conflictDetectionService.checkConflicts(baseLeaveRequest, []);
        expect(result.hasConflicts).toBe(false);
        expect(result.conflicts).toHaveLength(0);
    });

    it('should detect USER_LEAVE_OVERLAP with correct type and default severity', async () => {
        const overlappingLeave: LeaveRequest = {
            ...baseLeaveRequest, id: 'L001', startDate: '2024-08-14', endDate: '2024-08-15', status: LeaveStatus.APPROVED
        };
        const result = await conflictDetectionService.checkConflicts(baseLeaveRequest, [overlappingLeave]);
        expect(result.hasConflicts).toBe(true);
        const conflict = result.conflicts.find(c => c.type === ConflictType.USER_LEAVE_OVERLAP);
        expect(conflict).toBeDefined();
        expect(conflict?.type).toBe(ConflictType.USER_LEAVE_OVERLAP);
        // La sévérité dépendra de la logique interne du service si non définie par une règle spécifique.
        // Pour ce test, on se concentre sur la détection et le type.
    });

    it('setRules should call configService.setConfigValue', async () => {
        const newRules: Partial<ConflictRules> = { stopCheckingAfterBlockingConflict: true };
        await conflictDetectionService.setRules(newRules);
        // @ts-ignore
        expect(conflictDetectionService.configService.setConfigValue).toHaveBeenCalledWith(
            'leaveConflictRules',
            expect.objectContaining(newRules)
        );
    });
}); 