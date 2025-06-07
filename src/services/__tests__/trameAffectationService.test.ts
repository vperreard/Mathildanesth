import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { TrameAffectationService } from '../trameAffectationService';
import { prisma } from '@/lib/prisma';
import { OptimizedAuditService } from '@/services/OptimizedAuditService';
import { 
  TrameAffectationType,
  CreateTrameAffectationRequest,
  UpdateTrameAffectationRequest,
  TrameAffectationFilters,
  TrameAffectationSortOptions
} from '@/types/trame-affectations';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    trameAffectation: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}));

jest.mock('@/services/OptimizedAuditService', () => ({
  OptimizedAuditService: jest.fn().mockImplementation(() => ({
    logAction: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('TrameAffectationService', () => {
  let service: TrameAffectationService;
  let mockPrisma: any;
  let mockAuditService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TrameAffectationService();
    mockPrisma = prisma as any;
    mockAuditService = (service as any).auditService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTrameAffectations', () => {
    const mockTrames = [
      {
        id: '1',
        name: 'Trame Test 1',
        description: 'Description 1',
        isActive: true,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        createdBy: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        periods: [
          {
            id: 'p1',
            trameAffectationId: '1',
            name: 'Matin',
            startTime: '08:00',
            endTime: '14:00',
            color: '#4B5563',
            isActive: true,
            isLocked: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            _count: { assignments: 5 }
          }
        ],
        user: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe'
        }
      }
    ];

    it('should fetch trame affectations with pagination', async () => {
      mockPrisma.trameAffectation.count.mockResolvedValue(1);
      mockPrisma.trameAffectation.findMany.mockResolvedValue(mockTrames);

      const result = await service.getTrameAffectations(
        1,
        10,
        {},
        { sortBy: 'name', sortOrder: 'asc' }
      );

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
      
      expect(mockPrisma.trameAffectation.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        include: expect.any(Object),
        orderBy: { name: 'asc' }
      });
    });

    it('should apply filters correctly', async () => {
      mockPrisma.trameAffectation.count.mockResolvedValue(0);
      mockPrisma.trameAffectation.findMany.mockResolvedValue([]);

      const filters: TrameAffectationFilters = {
        isActive: true,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        search: 'test'
      };

      await service.getTrameAffectations(1, 10, filters, { sortBy: 'name', sortOrder: 'asc' });

      expect(mockPrisma.trameAffectation.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          startDate: { gte: filters.startDate },
          endDate: { lte: filters.endDate },
          OR: [
            { name: { contains: 'test', mode: 'insensitive' } },
            { description: { contains: 'test', mode: 'insensitive' } }
          ]
        },
        skip: 0,
        take: 10,
        include: expect.any(Object),
        orderBy: { name: 'asc' }
      });
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Database error');
      mockPrisma.trameAffectation.count.mockRejectedValue(error);

      await expect(
        service.getTrameAffectations(1, 10, {}, { sortBy: 'name', sortOrder: 'asc' })
      ).rejects.toThrow('Database error');
    });
  });

  describe('getTrameAffectationById', () => {
    const mockTrame = {
      id: '1',
      name: 'Trame Test',
      description: 'Description',
      isActive: true,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      createdBy: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      periods: [
        {
          id: 'p1',
          trameAffectationId: '1',
          name: 'Matin',
          startTime: '08:00',
          endTime: '14:00',
          color: '#4B5563',
          isActive: true,
          isLocked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { assignments: 5 }
        }
      ],
      user: {
        id: 1,
        firstName: 'John',
        lastName: 'Doe'
      }
    };

    it('should fetch a trame affectation by ID', async () => {
      mockPrisma.trameAffectation.findUnique.mockResolvedValue(mockTrame);

      const result = await service.getTrameAffectationById('1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('1');
      expect(result?.name).toBe('Trame Test');
      expect(result?.periods).toHaveLength(1);
      
      expect(mockPrisma.trameAffectation.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: expect.any(Object)
      });
    });

    it('should return null if trame not found', async () => {
      mockPrisma.trameAffectation.findUnique.mockResolvedValue(null);

      const result = await service.getTrameAffectationById('999');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Database error');
      mockPrisma.trameAffectation.findUnique.mockRejectedValue(error);

      await expect(
        service.getTrameAffectationById('1')
      ).rejects.toThrow('Database error');
    });
  });

  describe('createTrameAffectation', () => {
    const createRequest: CreateTrameAffectationRequest = {
      name: 'New Trame',
      description: 'New Description',
      isActive: true,
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      periods: [
        {
          name: 'Matin',
          startTime: '08:00',
          endTime: '14:00',
          color: '#4B5563',
          isActive: true,
          isLocked: false
        }
      ]
    };

    const mockCreatedTrame = {
      id: '2',
      name: 'New Trame',
      description: 'New Description',
      isActive: true,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      createdBy: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      periods: [
        {
          id: 'p2',
          trameAffectationId: '2',
          name: 'Matin',
          startTime: '08:00',
          endTime: '14:00',
          color: '#4B5563',
          isActive: true,
          isLocked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { assignments: 0 }
        }
      ],
      user: {
        id: 1,
        firstName: 'John',
        lastName: 'Doe'
      }
    };

    it('should create a new trame affectation', async () => {
      mockPrisma.trameAffectation.create.mockResolvedValue(mockCreatedTrame);

      const result = await service.createTrameAffectation(createRequest, 1);

      expect(result.id).toBe('2');
      expect(result.name).toBe('New Trame');
      expect(result.periods).toHaveLength(1);
      
      expect(mockPrisma.trameAffectation.create).toHaveBeenCalledWith({
        data: {
          name: 'New Trame',
          description: 'New Description',
          isActive: true,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          createdBy: 1,
          periods: {
            create: [
              {
                name: 'Matin',
                startTime: '08:00',
                endTime: '14:00',
                color: '#4B5563',
                isActive: true,
                isLocked: false
              }
            ]
          }
        },
        include: expect.any(Object)
      });

      expect(mockAuditService.logAction).toHaveBeenCalledWith({
        userId: 1,
        action: 'CREATE_TRAME_AFFECTATION',
        entityType: 'TrameAffectation',
        entityId: '2',
        details: {
          name: 'New Trame',
          periodsCount: 1
        }
      });
    });

    it('should handle creation without periods', async () => {
      const requestWithoutPeriods = { ...createRequest, periods: undefined };
      mockPrisma.trameAffectation.create.mockResolvedValue({
        ...mockCreatedTrame,
        periods: []
      });

      const result = await service.createTrameAffectation(requestWithoutPeriods, 1);

      expect(result.periods).toHaveLength(0);
      expect(mockPrisma.trameAffectation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          periods: { create: [] }
        }),
        include: expect.any(Object)
      });
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Creation failed');
      mockPrisma.trameAffectation.create.mockRejectedValue(error);

      await expect(
        service.createTrameAffectation(createRequest, 1)
      ).rejects.toThrow('Creation failed');
    });
  });

  describe('updateTrameAffectation', () => {
    const updateRequest: UpdateTrameAffectationRequest = {
      name: 'Updated Trame',
      description: 'Updated Description',
      isActive: false
    };

    const mockUpdatedTrame = {
      id: '1',
      name: 'Updated Trame',
      description: 'Updated Description',
      isActive: false,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      createdBy: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      periods: [],
      user: {
        id: 1,
        firstName: 'John',
        lastName: 'Doe'
      }
    };

    it('should update a trame affectation', async () => {
      mockPrisma.trameAffectation.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.trameAffectation.update.mockResolvedValue(mockUpdatedTrame);

      const result = await service.updateTrameAffectation('1', updateRequest, 1);

      expect(result.name).toBe('Updated Trame');
      expect(result.isActive).toBe(false);
      
      expect(mockPrisma.trameAffectation.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          name: 'Updated Trame',
          description: 'Updated Description',
          isActive: false
        },
        include: expect.any(Object)
      });

      expect(mockAuditService.logAction).toHaveBeenCalledWith({
        userId: 1,
        action: 'UPDATE_TRAME_AFFECTATION',
        entityType: 'TrameAffectation',
        entityId: '1',
        details: {
          changes: updateRequest,
          previousState: {
            name: 'Updated Trame',
            isActive: false,
            startDate: expect.any(Date),
            endDate: expect.any(Date)
          }
        }
      });
    });

    it('should throw error if trame not found', async () => {
      mockPrisma.trameAffectation.findUnique.mockResolvedValue(null);

      await expect(
        service.updateTrameAffectation('999', updateRequest, 1)
      ).rejects.toThrow('Trame affectation not found');
    });
  });

  describe('deleteTrameAffectation', () => {
    it('should delete a trame affectation', async () => {
      mockPrisma.trameAffectation.findUnique.mockResolvedValue({ 
        id: '1',
        name: 'Trame to Delete' 
      });
      mockPrisma.trameAffectation.delete.mockResolvedValue({ id: '1' });

      await service.deleteTrameAffectation('1', 1);

      expect(mockPrisma.trameAffectation.delete).toHaveBeenCalledWith({
        where: { id: '1' }
      });

      expect(mockAuditService.logAction).toHaveBeenCalledWith({
        userId: 1,
        action: 'DELETE_TRAME_AFFECTATION',
        entityType: 'TrameAffectation',
        entityId: '1',
        details: { name: 'Trame to Delete' }
      });
    });

    it('should throw error if trame not found', async () => {
      mockPrisma.trameAffectation.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteTrameAffectation('999', 1)
      ).rejects.toThrow('Trame affectation not found');
    });
  });
});