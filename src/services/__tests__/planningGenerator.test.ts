import { PlanningGenerator } from '../planningGenerator';
import { prisma } from '@/lib/prisma';
import { TestFactory } from '@/tests/factories/testFactorySimple';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    blocPlanning: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    blocDayPlanning: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    blocRoomAssignment: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    blocStaffAssignment: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    operatingRoom: {
      findMany: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe('PlanningGenerator', () => {
  let generator: PlanningGenerator;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    generator = new PlanningGenerator();
    mockPrisma = prisma as any;

    // Setup default transaction behavior
    mockPrisma.$transaction.mockImplementation(async (fn: any) => {
      if (typeof fn === 'function') {
        return await fn(mockPrisma);
      }
      return Promise.all(fn);
    });
  });

  describe('generateWeeklyPlanning', () => {
    it('should generate a new weekly planning', async () => {
      const siteId = 'site-1';
      const weekStart = new Date('2024-06-03'); // Monday
      const mockRooms = [
        TestFactory.createOperatingRoom({ id: 1, sectorId: 1 }),
        TestFactory.createOperatingRoom({ id: 2, sectorId: 1 }),
      ];
      const mockUsers = [
        TestFactory.createUser({ id: 1, role: 'SUPERVISOR' }),
        TestFactory.createUser({ id: 2, role: 'SUPERVISOR' }),
      ];

      mockPrisma.blocPlanning.findFirst.mockResolvedValue(null);
      mockPrisma.operatingRoom.findMany.mockResolvedValue(mockRooms);
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockPrisma.blocPlanning.create.mockResolvedValue({
        id: 'planning-1',
        siteId,
        date: weekStart,
        status: 'DRAFT',
      });

      const result = await generator.generateWeeklyPlanning(siteId, weekStart);

      expect(mockPrisma.blocPlanning.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          siteId,
          date: weekStart,
          status: 'DRAFT',
          weekType: 'REGULAR',
        }),
      });
      expect(result).toHaveProperty('id', 'planning-1');
    });

    it('should not create duplicate planning for same week', async () => {
      const siteId = 'site-1';
      const weekStart = new Date('2024-06-03');
      const existingPlanning = {
        id: 'existing-planning',
        siteId,
        date: weekStart,
      };

      mockPrisma.blocPlanning.findFirst.mockResolvedValue(existingPlanning);

      await expect(generator.generateWeeklyPlanning(siteId, weekStart)).rejects.toThrow(
        'Un planning existe déjà pour cette semaine'
      );
    });
  });

  describe('applyTemplate', () => {
    it('should apply a template to planning', async () => {
      const planningId = 'planning-1';
      const templateId = 'template-1';
      const mockTemplate = {
        id: templateId,
        dayConfigurations: [
          {
            dayOfWeek: 'MONDAY',
            period: 'MORNING',
            roomsOpen: 5,
            staffRequired: 3,
          },
        ],
      };

      mockPrisma.blocPlanning.findFirst.mockResolvedValue({ id: planningId });

      await generator.applyTemplate(planningId, mockTemplate);

      expect(mockPrisma.blocDayPlanning.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            blocPlanningId: planningId,
            dayOfWeek: 'MONDAY',
            period: 'MORNING',
            roomsOpen: 5,
            staffRequired: 3,
          }),
        ]),
      });
    });
  });

  describe('validatePlanning', () => {
    it('should validate planning with no conflicts', async () => {
      const planningId = 'planning-1';
      const mockPlanning = {
        id: planningId,
        dayPlannings: [
          {
            id: 'day-1',
            roomAssignments: [{ operatingRoomId: 1, surgeonId: 1 }],
            staffAssignments: [{ userId: 1, role: 'SUPERVISION', roomIds: [1] }],
          },
        ],
      };

      mockPrisma.blocPlanning.findFirst.mockResolvedValue(mockPlanning);

      const conflicts = await generator.validatePlanning(planningId);

      expect(conflicts).toHaveLength(0);
    });

    it('should detect supervision limit conflicts', async () => {
      const planningId = 'planning-1';
      const mockPlanning = {
        id: planningId,
        dayPlannings: [
          {
            id: 'day-1',
            period: 'MORNING',
            dayOfWeek: 'MONDAY',
            staffAssignments: [
              {
                userId: 1,
                role: 'SUPERVISION',
                roomIds: [1, 2, 3, 4], // Too many rooms
              },
            ],
          },
        ],
      };

      mockPrisma.blocPlanning.findFirst.mockResolvedValue(mockPlanning);

      const conflicts = await generator.validatePlanning(planningId);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]).toMatchObject({
        type: 'SUPERVISION_LIMIT',
        severity: 'ERROR',
      });
    });
  });

  describe('optimizeStaffAssignments', () => {
    it('should optimize staff assignments for balanced workload', async () => {
      const planningId = 'planning-1';
      const mockStaff = [
        { id: 1, workload: 10 },
        { id: 2, workload: 5 },
        { id: 3, workload: 15 },
      ];

      const optimized = await generator.optimizeStaffAssignments(planningId, mockStaff);

      // Should prioritize staff with lower workload
      expect(optimized[0].id).toBe(2);
      expect(optimized[1].id).toBe(1);
      expect(optimized[2].id).toBe(3);
    });
  });

  describe('generateFromPreviousWeek', () => {
    it('should copy planning from previous week', async () => {
      const siteId = 'site-1';
      const weekStart = new Date('2024-06-10');
      const previousWeekStart = new Date('2024-06-03');

      const previousPlanning = {
        id: 'prev-planning',
        siteId,
        date: previousWeekStart,
        dayPlannings: [
          {
            dayOfWeek: 'MONDAY',
            period: 'MORNING',
            roomsOpen: 5,
            roomAssignments: [],
            staffAssignments: [],
          },
        ],
      };

      mockPrisma.blocPlanning.findFirst
        .mockResolvedValueOnce(previousPlanning) // Previous week
        .mockResolvedValueOnce(null); // No existing planning for new week

      mockPrisma.blocPlanning.create.mockResolvedValue({
        id: 'new-planning',
        siteId,
        date: weekStart,
      });

      const result = await generator.generateFromPreviousWeek(siteId, weekStart);

      expect(result).toHaveProperty('id', 'new-planning');
      expect(mockPrisma.blocDayPlanning.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            dayOfWeek: 'MONDAY',
            period: 'MORNING',
            roomsOpen: 5,
          }),
        ]),
      });
    });
  });

  describe('publishPlanning', () => {
    it('should publish planning and notify users', async () => {
      const planningId = 'planning-1';
      const userId = 'user-1';
      const mockPlanning = {
        id: planningId,
        status: 'VALIDATED',
        staffAssignments: [
          { userId: 1, user: { email: 'user1@example.com' } },
          { userId: 2, user: { email: 'user2@example.com' } },
        ],
      };

      mockPrisma.blocPlanning.findFirst.mockResolvedValue(mockPlanning);
      mockPrisma.blocPlanning.update.mockResolvedValue({
        ...mockPlanning,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        publishedById: userId,
      });

      const result = await generator.publishPlanning(planningId, userId);

      expect(mockPrisma.blocPlanning.update).toHaveBeenCalledWith({
        where: { id: planningId },
        data: {
          status: 'PUBLISHED',
          publishedAt: expect.any(Date),
          publishedById: userId,
        },
      });
      expect(result.status).toBe('PUBLISHED');
    });

    it('should throw error if planning not validated', async () => {
      const planningId = 'planning-1';
      const mockPlanning = {
        id: planningId,
        status: 'DRAFT',
      };

      mockPrisma.blocPlanning.findFirst.mockResolvedValue(mockPlanning);

      await expect(generator.publishPlanning(planningId, 'user-1')).rejects.toThrow(
        'Le planning doit être validé avant publication'
      );
    });
  });
});
