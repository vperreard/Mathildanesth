import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  calculateLeaveDays,
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
      
      expect(result).toContain('15');
      expect(result).toContain('20');
      expect(result).toContain('juin');
    });

    it('should format single day leave', () => {
      const date = new Date('2025-06-15');
      
      const result = formatLeavePeriod(date, date);
      
      expect(result).toContain('15 juin');
    });
  });

  describe('getLeaveTypeLabel', () => {
    it('should return correct label for ANNUAL leave', () => {
      const result = getLeaveTypeLabel(LeaveType.ANNUAL);
      expect(result).toBe('Congé annuel');
    });

    it('should return correct label for SICK leave', () => {
      const result = getLeaveTypeLabel(LeaveType.SICK);
      expect(result).toBe('Congé maladie');
    });

    it('should return correct label for RTT', () => {
      const result = getLeaveTypeLabel(LeaveType.RTT);
      expect(result).toBe('RTT');
    });

    it('should return correct label for UNPAID', () => {
      const result = getLeaveTypeLabel(LeaveType.UNPAID);
      expect(result).toBe('Congé sans solde');
    });

    it('should return correct label for FORMATION', () => {
      const result = getLeaveTypeLabel(LeaveType.FORMATION);
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
      expect(result).toBe('Rejeté');
    });

    it('should return correct label for CANCELLED status', () => {
      const result = getLeaveStatusLabel(LeaveStatus.CANCELLED);
      expect(result).toBe('Annulé');
    });
  });

  describe('API Functions', () => {
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
          expect.stringContaining('/conges/balance/1')
        );
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
        const result = await checkLeaveConflicts({
          userId: 1,
          startDate: new Date('2025-06-15'),
          endDate: new Date('2025-06-20'),
          type: LeaveType.ANNUAL,
        });

        expect(result).toEqual(mockConflicts);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/conges/check-conflicts'),
          expect.objectContaining({
            method: 'POST',
          })
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
            method: 'PUT',
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
            method: 'PUT',
          })
        );
      });
    });
  });
});