import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  calculateLeaveDaysSimple as calculateLeaveDays,
  getLeaveTypeLabel,
  getLeaveStatusLabel,
  formatLeavePeriod,
  fetchLeaves,
  fetchLeaveById,
  fetchLeaveBalance,
  checkLeaveConflicts,
  submitLeaveRequest,
  approveLeave,
  cancelLeave,
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
    describe('fetchLeaves', () => {
      it('should fetch leaves with basic filters', async () => {
        const mockResponse = {
          items: [
            {
              id: '1',
              userId: '1',
              startDate: '2025-06-15',
              endDate: '2025-06-20',
              countedDays: 6,
              type: 'ANNUAL',
              reason: 'Test leave',
              status: 'PENDING',
              userName: 'John Doe',
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

        const result = await fetchLeaves({ userId: '1' });

        expect(result.items).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(result.page).toBe(1);
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/leaves?userId=1'));
      });

      it('should handle pagination in fetchLeaves', async () => {
        const mockResponse = {
          items: [],
          total: 100,
          page: 2,
          limit: 10,
          totalPages: 10,
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

        const result = await fetchLeaves({ page: 2, limit: 10 } as any);

        expect(result.page).toBe(2);
        expect(result.limit).toBe(10);
        expect(result.totalPages).toBe(10);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/leaves?page=2&limit=10')
        );
      });

      it('should handle date filters in fetchLeaves', async () => {
        const mockResponse = {
          items: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

        await fetchLeaves({
          startDate: '2025-06-01',
          endDate: '2025-06-30',
        });

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/leaves?startDate=2025-06-01&endDate=2025-06-30')
        );
      });

      it('should handle search term in fetchLeaves', async () => {
        const mockResponse = {
          items: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

        await fetchLeaves({ searchTerm: 'john' });

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/leaves?searchTerm=john')
        );
      });

      it('should handle error in fetchLeaves', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        } as Response);

        await expect(fetchLeaves()).rejects.toThrow();
      });
    });

    describe('fetchLeaveById', () => {
      it('should fetch a specific leave by ID', async () => {
        const mockLeave = {
          id: '1',
          userId: '1',
          startDate: '2025-06-15',
          endDate: '2025-06-20',
          countedDays: 6,
          type: 'ANNUAL',
          reason: 'Test leave',
          status: 'PENDING',
          userName: 'John Doe',
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockLeave,
        } as Response);

        const result = await fetchLeaveById('1');

        expect(result.id).toBe('1');
        expect(result.userName).toBe('John Doe');
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/leaves/1'));
      });

      it('should handle not found in fetchLeaveById', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found',
        } as Response);

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
          expect.stringContaining('/api/leaves/balance?userId=1')
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
          expect.stringContaining('/api/leaves/check-conflicts?')
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
          expect.stringContaining('/api/leaves'),
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
          expect.stringContaining('/api/leaves/1/approve'),
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
          expect.stringContaining('/api/leaves/1/cancel'),
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
    });
  });
});
