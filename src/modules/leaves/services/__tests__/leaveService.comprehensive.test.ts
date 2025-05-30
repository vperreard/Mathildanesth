/**
 * @jest-environment jsdom
 */

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
  getLeaveStatusLabel
} from '../leaveService';
import {
  LeaveType,
  LeaveStatus,
  LeaveFilters,
  LeaveRequest as Leave
} from '@/types/leave';

// Mock the API client
jest.mock('../../../../utils/apiClient', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    leave: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

// Mock error logging service
jest.mock('@/services/errorLoggingService', () => ({
  logError: jest.fn(),
}));

import mockApiClient from '../../../../utils/apiClient';

describe('LeaveService - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchLeaves', () => {
    it('should fetch leaves successfully', async () => {
      const mockLeaves = [
        {
          id: 'leave-1',
          userId: 'user-1',
          userName: 'John Doe',
          userEmail: 'john@example.com',
          departmentId: 'dept-1',
          departmentName: 'IT',
          startDate: '2024-05-01',
          endDate: '2024-05-03',
          workingDaysCount: 3,
          type: LeaveType.ANNUAL,
          status: LeaveStatus.PENDING,
          requestDate: '2024-04-25',
          createdAt: '2024-04-25T10:00:00Z',
          updatedAt: '2024-04-25T10:00:00Z'
        }
      ];

      mockApiClient.get.mockResolvedValue({
        data: { items: mockLeaves, total: 1, page: 1, limit: 10, totalPages: 1 },
        status: 200,
        statusText: 'OK'
      });

      const filters: LeaveFilters = { page: 1, limit: 10 };
      const result = await fetchLeaves(filters);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('leave-1');
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/conges', { params: filters });
    });

    it('should handle fetch leaves errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      const filters: LeaveFilters = { page: 1, limit: 10 };
      
      await expect(fetchLeaves(filters)).rejects.toThrow('Network error');
    });
  });

  describe('fetchLeaveById', () => {
    it('should fetch leave by id successfully', async () => {
      const mockLeave = {
        id: 'leave-1',
        userId: 'user-1',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        departmentId: 'dept-1',
        departmentName: 'IT',
        startDate: '2024-05-01',
        endDate: '2024-05-03',
        workingDaysCount: 3,
        type: LeaveType.ANNUAL,
        status: LeaveStatus.PENDING,
        requestDate: '2024-04-25',
        createdAt: '2024-04-25T10:00:00Z',
        updatedAt: '2024-04-25T10:00:00Z'
      };

      mockApiClient.get.mockResolvedValue({
        data: mockLeave,
        status: 200,
        statusText: 'OK'
      });

      const result = await fetchLeaveById('leave-1');

      expect(result.id).toBe('leave-1');
      expect(result.userName).toBe('John Doe');
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/conges/leave-1');
    });

    it('should handle fetch leave by id errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Not found'));

      await expect(fetchLeaveById('leave-1')).rejects.toThrow('Not found');
    });
  });

  describe('fetchLeaveBalance', () => {
    it('should fetch leave balance successfully', async () => {
      const mockBalance = {
        userId: 'user-1',
        year: 2024,
        balances: {
          [LeaveType.ANNUAL]: {
            initial: 25,
            used: 5,
            pending: 2,
            remaining: 18,
            acquired: 25
          },
          [LeaveType.RECOVERY]: {
            initial: 10,
            used: 0,
            pending: 0,
            remaining: 10,
            acquired: 10
          }
        }
      };

      mockApiClient.get.mockResolvedValue({
        data: mockBalance,
        status: 200,
        statusText: 'OK'
      });

      const result = await fetchLeaveBalance('user-1');

      expect(result.userId).toBe('user-1');
      expect(result.balances[LeaveType.ANNUAL].initial).toBe(25);
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/conges/balance/user-1');
    });
  });

  describe('saveLeave', () => {
    it('should save new leave successfully', async () => {
      const leaveData = {
        userId: 'user-1',
        startDate: '2024-05-01',
        endDate: '2024-05-03',
        type: LeaveType.ANNUAL,
        reason: 'Vacation'
      };

      const mockSavedLeave = {
        id: 'leave-new',
        ...leaveData,
        userName: 'John Doe',
        userEmail: 'john@example.com',
        departmentId: 'dept-1',
        departmentName: 'IT',
        workingDaysCount: 3,
        status: LeaveStatus.PENDING,
        requestDate: '2024-04-25',
        createdAt: '2024-04-25T10:00:00Z',
        updatedAt: '2024-04-25T10:00:00Z'
      };

      mockApiClient.post.mockResolvedValue({
        data: mockSavedLeave,
        status: 201,
        statusText: 'Created'
      });

      const result = await saveLeave(leaveData);

      expect(result.id).toBe('leave-new');
      expect(result.type).toBe(LeaveType.ANNUAL);
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/conges', leaveData);
    });

    it('should update existing leave successfully', async () => {
      const leaveData = {
        id: 'leave-1',
        userId: 'user-1',
        startDate: '2024-05-01',
        endDate: '2024-05-04',
        type: LeaveType.ANNUAL,
        reason: 'Extended vacation'
      };

      mockApiClient.put.mockResolvedValue({
        data: leaveData,
        status: 200,
        statusText: 'OK'
      });

      const result = await saveLeave(leaveData);

      expect(result.id).toBe('leave-1');
      expect(mockApiClient.put).toHaveBeenCalledWith('/api/conges/leave-1', leaveData);
    });
  });

  describe('submitLeaveRequest', () => {
    it('should submit leave request successfully', async () => {
      const requestData = {
        userId: 'user-1',
        startDate: '2024-05-01',
        endDate: '2024-05-03',
        type: LeaveType.ANNUAL,
        reason: 'Vacation'
      };

      mockApiClient.post.mockResolvedValue({
        data: { id: 'leave-new', status: LeaveStatus.PENDING },
        status: 201,
        statusText: 'Created'
      });

      const result = await submitLeaveRequest(requestData);

      expect(result.id).toBe('leave-new');
      expect(result.status).toBe(LeaveStatus.PENDING);
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/conges/submit', requestData);
    });
  });

  describe('Leave Management Actions', () => {
    it('should approve leave successfully', async () => {
      mockApiClient.patch.mockResolvedValue({
        data: { id: 'leave-1', status: LeaveStatus.APPROVED },
        status: 200,
        statusText: 'OK'
      });

      const result = await approveLeave('leave-1', 'Approved by manager');

      expect(result.status).toBe(LeaveStatus.APPROVED);
      expect(mockApiClient.patch).toHaveBeenCalledWith('/api/conges/leave-1/approve', {
        comment: 'Approved by manager'
      });
    });

    it('should reject leave successfully', async () => {
      mockApiClient.patch.mockResolvedValue({
        data: { id: 'leave-1', status: LeaveStatus.REJECTED },
        status: 200,
        statusText: 'OK'
      });

      const result = await rejectLeave('leave-1', 'Insufficient quota');

      expect(result.status).toBe(LeaveStatus.REJECTED);
      expect(mockApiClient.patch).toHaveBeenCalledWith('/api/conges/leave-1/reject', {
        comment: 'Insufficient quota'
      });
    });

    it('should cancel leave successfully', async () => {
      mockApiClient.patch.mockResolvedValue({
        data: { id: 'leave-1', status: LeaveStatus.CANCELLED },
        status: 200,
        statusText: 'OK'
      });

      const result = await cancelLeave('leave-1', 'Change of plans');

      expect(result.status).toBe(LeaveStatus.CANCELLED);
      expect(mockApiClient.patch).toHaveBeenCalledWith('/api/conges/leave-1/cancel', {
        comment: 'Change of plans'
      });
    });
  });

  describe('Validation Functions', () => {
    it('should check leave conflicts', async () => {
      const conflictResult = {
        hasConflicts: false,
        conflicts: [],
        suggestions: []
      };

      mockApiClient.post.mockResolvedValue({
        data: conflictResult,
        status: 200,
        statusText: 'OK'
      });

      const result = await checkLeaveConflicts({
        userId: 'user-1',
        startDate: '2024-05-01',
        endDate: '2024-05-03',
        type: LeaveType.ANNUAL
      });

      expect(result.hasConflicts).toBe(false);
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/conges/check-conflicts', {
        userId: 'user-1',
        startDate: '2024-05-01',
        endDate: '2024-05-03',
        type: LeaveType.ANNUAL
      });
    });

    it('should check leave allowance', async () => {
      const allowanceResult = {
        allowed: true,
        remaining: 20,
        requested: 3
      };

      mockApiClient.post.mockResolvedValue({
        data: allowanceResult,
        status: 200,
        statusText: 'OK'
      });

      const result = await checkLeaveAllowance('user-1', LeaveType.ANNUAL, 3);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(20);
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/conges/check-allowance', {
        userId: 'user-1',
        leaveType: LeaveType.ANNUAL,
        requestedDays: 3
      });
    });
  });

  describe('Utility Functions', () => {
    it('should calculate leave days correctly', () => {
      const mockWorkSchedule = {
        id: 'ws-1',
        name: 'Standard',
        userId: 'user-1',
        workDays: {
          MONDAY: { isWorking: true, startTime: '08:00', endTime: '17:00' },
          TUESDAY: { isWorking: true, startTime: '08:00', endTime: '17:00' },
          WEDNESDAY: { isWorking: true, startTime: '08:00', endTime: '17:00' },
          THURSDAY: { isWorking: true, startTime: '08:00', endTime: '17:00' },
          FRIDAY: { isWorking: true, startTime: '08:00', endTime: '17:00' },
          SATURDAY: { isWorking: false, startTime: '', endTime: '' },
          SUNDAY: { isWorking: false, startTime: '', endTime: '' }
        },
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = calculateLeaveDays(new Date('2024-05-01'), new Date('2024-05-03'), mockWorkSchedule);
      expect(result).toBe(3); // Wednesday to Friday = 3 working days
    });

    it('should format leave period correctly', () => {
      const result = formatLeavePeriod(new Date('2024-05-01'), new Date('2024-05-03'));
      expect(result).toBe('01/05/2024 - 03/05/2024');
    });

    it('should return correct leave type labels', () => {
      expect(getLeaveTypeLabel(LeaveType.ANNUAL)).toBe('Congé annuel');
      expect(getLeaveTypeLabel(LeaveType.SICK)).toBe('Maladie');
      expect(getLeaveTypeLabel(LeaveType.RECOVERY)).toBe('Récupération');
    });

    it('should return correct leave status labels', () => {
      expect(getLeaveStatusLabel(LeaveStatus.PENDING)).toBe('En attente');
      expect(getLeaveStatusLabel(LeaveStatus.APPROVED)).toBe('Approuvé');
      expect(getLeaveStatusLabel(LeaveStatus.REJECTED)).toBe('Refusé');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockApiClient.get.mockRejectedValue(new Error('API Error'));

      await expect(fetchLeaveById('leave-1')).rejects.toThrow('API Error');
    });

    it('should handle network errors', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Network timeout'));

      await expect(submitLeaveRequest({
        userId: 'user-1',
        startDate: '2024-05-01',
        endDate: '2024-05-03',
        type: LeaveType.ANNUAL
      })).rejects.toThrow('Network timeout');
    });
  });
});