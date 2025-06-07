import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  calculateLeaveDaysSimple as calculateLeaveDays,
  getLeaveTypeLabel,
  getLeaveStatusLabel,
  formatLeavePeriod,
} from '../leaveService';
import { LeaveStatus, LeaveType } from '../../types/leave';

// Mock fetch pour les tests API
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('LeaveService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateLeaveDays', () => {
    it('should calculate days correctly for regular leave', () => {
      const startDate = new Date('2025-06-15');
      const endDate = new Date('2025-06-20');
      
      const result = calculateLeaveDays(startDate, endDate, false);
      
      expect(result).toBe(6); // 15, 16, 17, 18, 19, 20
    });

    it('should calculate 0.5 days for half-day leave', () => {
      const startDate = new Date('2025-06-15');
      const endDate = new Date('2025-06-15');
      
      const result = calculateLeaveDays(startDate, endDate, true);
      
      expect(result).toBe(0.5);
    });

    it('should handle same day leave', () => {
      const date = new Date('2025-06-15');
      
      const result = calculateLeaveDays(date, date, false);
      
      expect(result).toBe(1);
    });
  });

  describe('formatLeavePeriod', () => {
    it('should format leave period correctly', () => {
      const startDate = new Date('2025-06-15');
      const endDate = new Date('2025-06-20');
      
      const result = formatLeavePeriod(startDate, endDate);
      
      expect(result).toBe('15/06/2025 au 20/06/2025');
    });

    it('should format single day leave', () => {
      const date = new Date('2025-06-15');
      
      const result = formatLeavePeriod(date, date);
      
      expect(result).toBe('15/06/2025');
    });
  });

  describe('getLeaveTypeLabel', () => {
    it('should return correct label for ANNUAL leave', () => {
      const result = getLeaveTypeLabel(LeaveType.ANNUAL);
      expect(result).toBe('Congé annuel');
    });

    it('should return correct label for SICK leave', () => {
      const result = getLeaveTypeLabel(LeaveType.SICK);
      expect(result).toBe('Maladie');
    });

    it('should return correct label for RECOVERY', () => {
      const result = getLeaveTypeLabel(LeaveType.RECOVERY);
      expect(result).toBe('Récupération');
    });

    it('should return correct label for UNPAID', () => {
      const result = getLeaveTypeLabel(LeaveType.UNPAID);
      expect(result).toBe('Congé sans solde');
    });

    it('should return correct label for TRAINING', () => {
      const result = getLeaveTypeLabel(LeaveType.TRAINING);
      expect(result).toBe('Formation');
    });
  });

  describe('getLeaveStatusLabel', () => {
    it('should return correct label for PENDING status', () => {
      const result = getLeaveStatusLabel(LeaveStatus.PENDING);
      expect(result).toBe('En attente');
    });

    it('should return correct label for APPROVED status', () => {
      const result = getLeaveStatusLabel(LeaveStatus.APPROVED);
      expect(result).toBe('Approuvé');
    });

    it('should return correct label for REJECTED status', () => {
      const result = getLeaveStatusLabel(LeaveStatus.REJECTED);
      expect(result).toBe('Refusé');
    });

    it('should return correct label for CANCELLED status', () => {
      const result = getLeaveStatusLabel(LeaveStatus.CANCELLED);
      expect(result).toBe('Annulé');
    });
  });

  describe('API Functions', () => {
    const mockPrisma = {
      leave: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      leaveBalance: {
        findFirst: jest.fn(),
        upsert: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      department: {
        findMany: jest.fn(),
      },
    };

    // Mock prisma
    jest.mock('@/lib/prisma', () => ({
      prisma: mockPrisma,
    }));

    describe('fetchLeaves', () => {
      it('should fetch leaves with basic filters', async () => {
        const mockLeaves = [
          {
            id: '1',
            userId: 1,
            startDate: new Date('2025-06-15'),
            endDate: new Date('2025-06-20'),
            countedDays: 6,
            type: 'ANNUAL',
            reason: 'Test leave',
            status: 'PENDING',
            requestDate: new Date('2025-06-01'),
            approvedById: null,
            approvalDate: null,
            isRecurring: false,
            recurrencePattern: null,
            parentId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            user: {
              id: 1,
              prenom: 'John',
              nom: 'Doe',
              email: 'john.doe@example.com',
              department: {
                id: 1,
                name: 'IT Department',
              },
            },
          },
        ];

        mockPrisma.leave.count.mockResolvedValue(1);
        mockPrisma.leave.findMany.mockResolvedValue(mockLeaves);

        const { fetchLeaves } = await import('../leaveService');
        const result = await fetchLeaves({ userId: '1' });

        expect(result.items).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(result.page).toBe(1);
        expect(mockPrisma.leave.count).toHaveBeenCalled();
        expect(mockPrisma.leave.findMany).toHaveBeenCalled();
      });

      it('should handle pagination in fetchLeaves', async () => {
        mockPrisma.leave.count.mockResolvedValue(100);
        mockPrisma.leave.findMany.mockResolvedValue([]);

        const { fetchLeaves } = await import('../leaveService');
        const result = await fetchLeaves({ page: 2, limit: 10 } as any);

        expect(result.page).toBe(2);
        expect(result.limit).toBe(10);
        expect(result.totalPages).toBe(10);
        expect(mockPrisma.leave.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            skip: 10,
            take: 10,
          })
        );
      });

      it('should handle date filters in fetchLeaves', async () => {
        mockPrisma.leave.count.mockResolvedValue(0);
        mockPrisma.leave.findMany.mockResolvedValue([]);

        const { fetchLeaves } = await import('../leaveService');
        await fetchLeaves({
          startDate: '2025-06-01',
          endDate: '2025-06-30',
        });

        expect(mockPrisma.leave.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              AND: expect.arrayContaining([
                { startDate: { gte: new Date('2025-06-01') } },
                { endDate: { lte: new Date('2025-06-30') } },
              ]),
            }),
          })
        );
      });

      it('should handle search term in fetchLeaves', async () => {
        mockPrisma.leave.count.mockResolvedValue(0);
        mockPrisma.leave.findMany.mockResolvedValue([]);

        const { fetchLeaves } = await import('../leaveService');
        await fetchLeaves({ searchTerm: 'john' });

        expect(mockPrisma.leave.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              OR: expect.arrayContaining([
                { user: { prenom: { contains: 'john', mode: 'insensitive' } } },
                { user: { nom: { contains: 'john', mode: 'insensitive' } } },
                { reason: { contains: 'john', mode: 'insensitive' } },
              ]),
            }),
          })
        );
      });

      it('should handle error in fetchLeaves', async () => {
        mockPrisma.leave.count.mockRejectedValue(new Error('Database error'));

        const { fetchLeaves } = await import('../leaveService');
        
        await expect(fetchLeaves()).rejects.toThrow('Database error');
      });
    });

    describe('fetchLeaveById', () => {
      it('should fetch a specific leave by ID', async () => {
        const mockLeave = {
          id: '1',
          userId: 1,
          startDate: new Date('2025-06-15'),
          endDate: new Date('2025-06-20'),
          countedDays: 6,
          type: 'ANNUAL',
          reason: 'Test leave',
          status: 'PENDING',
          requestDate: new Date('2025-06-01'),
          approvedById: null,
          approvalDate: null,
          isRecurring: false,
          recurrencePattern: null,
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 1,
            prenom: 'John',
            nom: 'Doe',
            email: 'john.doe@example.com',
            department: {
              id: 1,
              name: 'IT Department',
            },
          },
        };

        mockPrisma.leave.findUnique.mockResolvedValue(mockLeave);

        const { fetchLeaveById } = await import('../leaveService');
        const result = await fetchLeaveById('1');

        expect(result.id).toBe('1');
        expect(result.userName).toBe('John Doe');
        expect(mockPrisma.leave.findUnique).toHaveBeenCalledWith({
          where: { id: '1' },
          include: expect.any(Object),
        });
      });

      it('should handle not found in fetchLeaveById', async () => {
        mockPrisma.leave.findUnique.mockResolvedValue(null);

        const { fetchLeaveById } = await import('../leaveService');
        
        await expect(fetchLeaveById('999')).rejects.toThrow();
      });
    });

    describe('fetchLeaveBalance', () => {
      it('should fetch leave balance from API', async () => {
        const mockBalance = {
          userId: '1',
          type: LeaveType.ANNUAL,
          year: 2025,
          totalDays: 25,
          usedDays: 10,
          remainingDays: 15,
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockBalance,
        } as Response);

        const { fetchLeaveBalance } = await import('../leaveService');
        const result = await fetchLeaveBalance('1');

        expect(result).toEqual(mockBalance);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/conges/balance?userId=1')
        );
      });

      it('should handle API error in fetchLeaveBalance', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 500,
        } as Response);

        const { fetchLeaveBalance } = await import('../leaveService');
        
        await expect(fetchLeaveBalance('1')).rejects.toThrow();
      });
    });

    describe('checkLeaveConflicts', () => {
      it('should check for leave conflicts via API', async () => {
        const mockConflicts = {
          hasConflicts: false,
          conflicts: [],
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockConflicts,
        } as Response);

        const { checkLeaveConflicts } = await import('../leaveService');
        const result = await checkLeaveConflicts(
          new Date('2025-06-15'),
          new Date('2025-06-20'),
          '1'
        );

        expect(result).toEqual(mockConflicts);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/conges/check-conflicts?')
        );
      });
    });

    describe('submitLeaveRequest', () => {
      it('should submit leave request via API', async () => {
        const mockLeave = {
          id: '1',
          userId: 1,
          type: LeaveType.ANNUAL,
          startDate: '2025-06-15',
          endDate: '2025-06-20',
          status: LeaveStatus.PENDING,
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockLeave,
        } as Response);

        const { submitLeaveRequest } = await import('../leaveService');
        const result = await submitLeaveRequest({
          userId: 1,
          type: LeaveType.ANNUAL,
          startDate: new Date('2025-06-15'),
          endDate: new Date('2025-06-20'),
          reason: 'Vacances',
        });

        expect(result).toEqual(mockLeave);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/conges'),
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
    });

    describe('approveLeave', () => {
      it('should approve leave via API', async () => {
        const mockApprovedLeave = {
          id: '1',
          status: LeaveStatus.APPROVED,
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockApprovedLeave,
        } as Response);

        const { approveLeave } = await import('../leaveService');
        const result = await approveLeave('1', 'Approved by manager');

        expect(result).toEqual(mockApprovedLeave);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/conges/1/approve'),
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
    });

    describe('cancelLeave', () => {
      it('should cancel leave via API', async () => {
        const mockCancelledLeave = {
          id: '1',
          status: LeaveStatus.CANCELLED,
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockCancelledLeave,
        } as Response);

        const { cancelLeave } = await import('../leaveService');
        const result = await cancelLeave('1', 'Cancelled by user');

        expect(result).toEqual(mockCancelledLeave);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/conges/1/cancel'),
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
    });
  });
});