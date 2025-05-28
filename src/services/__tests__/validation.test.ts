import { 
  validateEmail,
  validatePassword,
  validateDate,
  validateRequired,
  validateRange,
  validateLeaveRequest,
  validateUserData
} from '../validation';

describe('validation service', () => {
  describe('validateEmail', () => {
    it('should validate correct emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      expect(validatePassword('StrongP@ss123')).toBe(true);
      expect(validatePassword('MySecure123!')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(validatePassword('123456')).toBe(false);
      expect(validatePassword('password')).toBe(false);
      expect(validatePassword('short')).toBe(false);
      expect(validatePassword('')).toBe(false);
    });
  });

  describe('validateDate', () => {
    it('should validate valid dates', () => {
      expect(validateDate('2024-01-01')).toBe(true);
      expect(validateDate(new Date())).toBe(true);
    });

    it('should reject invalid dates', () => {
      expect(validateDate('invalid-date')).toBe(false);
      expect(validateDate('2024-13-01')).toBe(false);
      expect(validateDate('')).toBe(false);
    });

    it('should validate date ranges', () => {
      const start = '2024-01-01';
      const end = '2024-01-31';
      
      expect(validateDate(start, { min: '2023-01-01', max: '2025-01-01' })).toBe(true);
      expect(validateDate(end, { min: start })).toBe(true);
    });
  });

  describe('validateRequired', () => {
    it('should validate required fields', () => {
      expect(validateRequired('test')).toBe(true);
      expect(validateRequired(123)).toBe(true);
      expect(validateRequired(true)).toBe(true);
    });

    it('should reject empty values', () => {
      expect(validateRequired('')).toBe(false);
      expect(validateRequired(null)).toBe(false);
      expect(validateRequired(undefined)).toBe(false);
      expect(validateRequired('   ')).toBe(false);
    });
  });

  describe('validateRange', () => {
    it('should validate numbers in range', () => {
      expect(validateRange(5, { min: 1, max: 10 })).toBe(true);
      expect(validateRange(1, { min: 1 })).toBe(true);
      expect(validateRange(10, { max: 10 })).toBe(true);
    });

    it('should reject numbers outside range', () => {
      expect(validateRange(0, { min: 1, max: 10 })).toBe(false);
      expect(validateRange(11, { min: 1, max: 10 })).toBe(false);
    });
  });

  describe('validateLeaveRequest', () => {
    it('should validate valid leave request', () => {
      const request = {
        startDate: '2024-06-01',
        endDate: '2024-06-05',
        leaveType: 'ANNUAL',
        reason: 'Vacation',
        userId: 1
      };
      
      const result = validateLeaveRequest(request);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid leave request', () => {
      const request = {
        startDate: '2024-06-05',
        endDate: '2024-06-01', // End before start
        leaveType: '',
        userId: null
      };
      
      const result = validateLeaveRequest(request);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateUserData', () => {
    it('should validate complete user data', () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        role: 'MAR',
        siteId: 1
      };
      
      const result = validateUserData(userData);
      expect(result.isValid).toBe(true);
    });

    it('should detect missing required fields', () => {
      const userData = {
        firstName: 'John',
        email: 'invalid-email'
      };
      
      const result = validateUserData(userData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('lastName is required');
      expect(result.errors).toContain('Invalid email format');
    });
  });
});