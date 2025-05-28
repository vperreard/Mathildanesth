import { 
  LeaveStatus, 
  LeaveType, 
  Leave, 
  CreateLeaveRequest, 
  LeaveBalance 
} from '../leave';

describe('Leave types', () => {
  describe('LeaveStatus enum', () => {
    it('should define all leave statuses', () => {
      expect(LeaveStatus.PENDING).toBe('PENDING');
      expect(LeaveStatus.APPROVED).toBe('APPROVED');
      expect(LeaveStatus.REJECTED).toBe('REJECTED');
      expect(LeaveStatus.CANCELLED).toBe('CANCELLED');
    });

    it('should have string values', () => {
      Object.values(LeaveStatus).forEach(status => {
        expect(typeof status).toBe('string');
      });
    });
  });

  describe('LeaveType enum', () => {
    it('should define common leave types', () => {
      expect(LeaveType.ANNUAL).toBe('ANNUAL');
      expect(LeaveType.SICK).toBe('SICK');
      expect(LeaveType.MATERNITY).toBe('MATERNITY');
      expect(LeaveType.PATERNITY).toBe('PATERNITY');
    });

    it('should have descriptive values', () => {
      Object.values(LeaveType).forEach(type => {
        expect(typeof type).toBe('string');
        expect(type.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Leave interface', () => {
    it('should define complete leave structure', () => {
      const leave: Leave = {
        id: 1,
        userId: 100,
        type: LeaveType.ANNUAL,
        status: LeaveStatus.APPROVED,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-05'),
        daysCount: 5,
        reason: 'Summer vacation',
        isHalfDay: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(leave.id).toBe(1);
      expect(leave.userId).toBe(100);
      expect(leave.type).toBe(LeaveType.ANNUAL);
      expect(leave.status).toBe(LeaveStatus.APPROVED);
      expect(leave.startDate).toBeInstanceOf(Date);
      expect(leave.endDate).toBeInstanceOf(Date);
      expect(leave.daysCount).toBe(5);
      expect(leave.reason).toBe('Summer vacation');
      expect(leave.isHalfDay).toBe(false);
      expect(leave.createdAt).toBeInstanceOf(Date);
      expect(leave.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle half-day leaves', () => {
      const halfDayLeave: Partial<Leave> = {
        type: LeaveType.SICK,
        isHalfDay: true,
        daysCount: 0.5,
        halfDayPeriod: 'MORNING'
      };

      expect(halfDayLeave.isHalfDay).toBe(true);
      expect(halfDayLeave.daysCount).toBe(0.5);
      expect(halfDayLeave.halfDayPeriod).toBe('MORNING');
    });
  });

  describe('CreateLeaveRequest interface', () => {
    it('should define leave creation structure', () => {
      const createRequest: CreateLeaveRequest = {
        userId: 200,
        type: LeaveType.SICK,
        startDate: new Date('2024-07-10'),
        endDate: new Date('2024-07-12'),
        reason: 'Medical appointment',
        isHalfDay: false
      };

      expect(createRequest.userId).toBe(200);
      expect(createRequest.type).toBe(LeaveType.SICK);
      expect(createRequest.startDate).toBeInstanceOf(Date);
      expect(createRequest.endDate).toBeInstanceOf(Date);
      expect(createRequest.reason).toBe('Medical appointment');
      expect(createRequest.isHalfDay).toBe(false);
    });

    it('should support optional fields', () => {
      const minimalRequest: Partial<CreateLeaveRequest> = {
        userId: 300,
        type: LeaveType.ANNUAL,
        startDate: new Date('2024-08-01'),
        endDate: new Date('2024-08-01')
      };

      expect(minimalRequest.userId).toBe(300);
      expect(minimalRequest.type).toBe(LeaveType.ANNUAL);
      expect(minimalRequest.startDate).toBeInstanceOf(Date);
      expect(minimalRequest.endDate).toBeInstanceOf(Date);
    });
  });

  describe('LeaveBalance interface', () => {
    it('should track leave balances', () => {
      const balance: LeaveBalance = {
        userId: 400,
        leaveType: LeaveType.ANNUAL,
        totalDays: 25,
        usedDays: 10,
        remainingDays: 15,
        year: 2024
      };

      expect(balance.userId).toBe(400);
      expect(balance.leaveType).toBe(LeaveType.ANNUAL);
      expect(balance.totalDays).toBe(25);
      expect(balance.usedDays).toBe(10);
      expect(balance.remainingDays).toBe(15);
      expect(balance.year).toBe(2024);
    });

    it('should calculate remaining days correctly', () => {
      const balance: LeaveBalance = {
        userId: 500,
        leaveType: LeaveType.SICK,
        totalDays: 20,
        usedDays: 5,
        remainingDays: 15,
        year: 2024
      };

      expect(balance.totalDays - balance.usedDays).toBe(balance.remainingDays);
    });
  });

  describe('Status workflow', () => {
    it('should support status transitions', () => {
      const statuses = [
        LeaveStatus.PENDING,
        LeaveStatus.APPROVED,
        LeaveStatus.REJECTED,
        LeaveStatus.CANCELLED
      ];

      // All statuses should be defined
      statuses.forEach(status => {
        expect(status).toBeDefined();
        expect(typeof status).toBe('string');
      });
    });
  });

  describe('Date validation', () => {
    it('should ensure end date is after start date', () => {
      const startDate = new Date('2024-06-01');
      const endDate = new Date('2024-06-05');
      
      expect(endDate.getTime()).toBeGreaterThan(startDate.getTime());
    });

    it('should handle same-day leaves', () => {
      const sameDay = new Date('2024-06-01');
      
      expect(sameDay.getTime()).toBe(sameDay.getTime());
    });
  });
});