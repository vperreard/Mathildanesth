/**
 * @jest-environment node
 */
/**
 * @jest-environment node
 */
import { jest, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { 
  setupTestEnvironment, 
  cleanupTestEnvironment, 
  createMockPrismaClient,
  createMockBcrypt,
  createMockJWT,
  createMockLogger,
  testDataFactories 
} from '../../test-utils/standardMocks';


// Mock external dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: createMockPrismaClient()
}));

jest.mock('bcryptjs', () => createMockBcrypt());
jest.mock('jsonwebtoken', () => createMockJWT());
jest.mock('@/lib/logger', () => ({
  logger: createMockLogger()
}));

const mockPrisma = require('@/lib/prisma').prisma;
const mockBcrypt = require('bcryptjs');
const mockJwt = require('jsonwebtoken');
const mockLogger = require('@/lib/logger').logger;



describe('ValidationService - Working Tests', () => {
  describe('validateAssignments', () => {
    const mockAttribution1: Attribution = {
      id: 'attr-1',
      userId: 1,
      date: new Date('2024-01-15'),
      type: 'garde',
      location: 'salle-1',
      startTime: '08:00',
      endTime: '16:00'
    };

    const mockAttribution2: Attribution = {
      id: 'attr-2',
      userId: 2,
      date: new Date('2024-01-16'),
      type: 'vacation',
      location: 'salle-2',
      startTime: '16:00',
      endTime: '00:00'
    };

    const mockRules: RulesConfiguration = {
      minDaysBetweenAssignments: 2,
      maxAssignmentsPerMonth: 10,
      enabled: true
    };

    it('should return valid result for non-conflicting assignments', () => {
      const attributions = [mockAttribution1, mockAttribution2];
      
      const result = validateAssignments(attributions, mockRules);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.violations).toEqual([]);
    });

    it('should detect schedule conflicts for same user same day', () => {
      const conflictingAttribution = {
        ...mockAttribution1,
        id: 'attr-conflict',
        startTime: '16:00',
        endTime: '00:00'
      };

      const attributions = [mockAttribution1, conflictingAttribution];
      
      const result = validateAssignments(attributions, mockRules);
      
      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThanOrEqual(1);
      
      // Should have at least a schedule conflict violation
      const scheduleViolation = result.violations.find(v => v.type === 'CONFLICT_SCHEDULE');
      expect(scheduleViolation).toMatchObject({
        type: 'CONFLICT_SCHEDULE',
        message: expect.stringContaining('médecin a plusieurs gardes/vacations le même jour')
      });
    });

    it('should detect interval violations between assignments', () => {
      const tooCloseAttribution: Attribution = {
        id: 'attr-close',
        userId: 1,
        date: new Date('2024-01-16'), // Only 1 day after mockAttribution1
        type: 'garde',
        location: 'salle-3',
        startTime: '08:00',
        endTime: '16:00'
      };

      const attributions = [mockAttribution1, tooCloseAttribution];
      
      const result = validateAssignments(attributions, mockRules);
      
      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]).toMatchObject({
        type: 'INTERVAL_TOO_SHORT',
        message: expect.stringContaining('Intervalle entre gardes insuffisant')
      });
    });

    it('should handle string dates correctly', () => {
      const stringDateAttribution: Attribution = {
        id: 'attr-string',
        userId: 3,
        date: '2024-01-20',
        type: 'garde',
        location: 'salle-4',
        startTime: '08:00',
        endTime: '16:00'
      };

      const attributions = [stringDateAttribution];
      
      const result = validateAssignments(attributions, mockRules);
      
      expect(result.isValid).toBe(true);
      expect(result.violations).toEqual([]);
    });

    it('should handle multiple violations correctly', () => {
      const sameUserSameDay1: Attribution = {
        id: 'multi-1',
        userId: 1,
        date: new Date('2024-01-15'),
        type: 'garde',
        location: 'salle-1',
        startTime: '08:00',
        endTime: '16:00'
      };

      const sameUserSameDay2: Attribution = {
        id: 'multi-2',
        userId: 1,
        date: new Date('2024-01-15'),
        type: 'vacation',
        location: 'salle-2',
        startTime: '16:00',
        endTime: '00:00'
      };

      const tooCloseAttribution: Attribution = {
        id: 'multi-close',
        userId: 1,
        date: new Date('2024-01-16'),
        type: 'garde',
        location: 'salle-3',
        startTime: '08:00',
        endTime: '16:00'
      };

      const attributions = [sameUserSameDay1, sameUserSameDay2, tooCloseAttribution];
      
      const result = validateAssignments(attributions, mockRules);
      
      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(1);
      
      // Should have both conflict and interval violations
      const violationTypes = result.violations.map(v => v.type);
      expect(violationTypes).toContain('CONFLICT_SCHEDULE');
      expect(violationTypes).toContain('INTERVAL_TOO_SHORT');
    });

    it('should respect rules configuration', () => {
      const noRestrictionsRules: RulesConfiguration = {
        enabled: true
        // No minDaysBetweenAssignments or maxAssignmentsPerMonth
      };

      const closeAttributions = [
        {
          id: 'close-1',
          userId: 1,
          date: new Date('2024-01-15'),
          type: 'garde',
          location: 'salle-1',
          startTime: '08:00',
          endTime: '16:00'
        },
        {
          id: 'close-2',
          userId: 1,
          date: new Date('2024-01-16'), // Next day
          type: 'garde',
          location: 'salle-2',
          startTime: '08:00',
          endTime: '16:00'
        }
      ] as Attribution[];

      const result = validateAssignments(closeAttributions, noRestrictionsRules);
      
      // Should be valid since no minimum interval rule is set
      expect(result.isValid).toBe(true);
      expect(result.violations).toEqual([]);
    });

    it('should handle empty assignments array', () => {
      const result = validateAssignments([], mockRules);
      
      expect(result.isValid).toBe(true);
      expect(result.violations).toEqual([]);
    });

    it('should handle single assignment', () => {
      const result = validateAssignments([mockAttribution1], mockRules);
      
      expect(result.isValid).toBe(true);
      expect(result.violations).toEqual([]);
    });

    it('should sort assignments by date for interval checking', () => {
      const laterAttribution: Attribution = {
        id: 'later',
        userId: 1,
        date: new Date('2024-01-20'),
        type: 'garde',
        location: 'salle-1',
        startTime: '08:00',
        endTime: '16:00'
      };

      const earlierAttribution: Attribution = {
        id: 'earlier',
        userId: 1,
        date: new Date('2024-01-15'),
        type: 'garde',
        location: 'salle-2',
        startTime: '08:00',
        endTime: '16:00'
      };

      // Pass in reverse chronological order
      const attributions = [laterAttribution, earlierAttribution];
      
      const result = validateAssignments(attributions, mockRules);
      
      // Should handle the sorting correctly and validate interval
      expect(result.isValid).toBe(true); // 5 days apart, more than minimum 2
      expect(result.violations).toEqual([]);
    });

    it('should handle different user assignments correctly', () => {
      const user1Attribution: Attribution = {
        id: 'user1',
        userId: 1,
        date: new Date('2024-01-15'),
        type: 'garde',
        location: 'salle-1',
        startTime: '08:00',
        endTime: '16:00'
      };

      const user2Attribution: Attribution = {
        id: 'user2',
        userId: 2,
        date: new Date('2024-01-15'), // Same day, different user
        type: 'garde',
        location: 'salle-2',
        startTime: '08:00',
        endTime: '16:00'
      };

      const attributions = [user1Attribution, user2Attribution];
      
      const result = validateAssignments(attributions, mockRules);
      
      // Should be valid - different users can have assignments on same day
      expect(result.isValid).toBe(true);
      expect(result.violations).toEqual([]);
    });

    it('should handle edge case of exactly minimum interval', () => {
      const firstAttribution: Attribution = {
        id: 'first',
        userId: 1,
        date: new Date('2024-01-15'),
        type: 'garde',
        location: 'salle-1',
        startTime: '08:00',
        endTime: '16:00'
      };

      const exactIntervalAttribution: Attribution = {
        id: 'exact',
        userId: 1,
        date: new Date('2024-01-17'), // Exactly 2 days later
        type: 'garde',
        location: 'salle-2',
        startTime: '08:00',
        endTime: '16:00'
      };

      const attributions = [firstAttribution, exactIntervalAttribution];
      
      const result = validateAssignments(attributions, mockRules);
      
      // Should be valid with exactly minimum interval
      expect(result.isValid).toBe(true);
      expect(result.violations).toEqual([]);
    });

    it('should provide meaningful violation details', () => {
      const conflictAttribution1: Attribution = {
        id: 'conflict-1',
        userId: 1,
        date: new Date('2024-01-15'),
        type: 'garde',
        location: 'salle-1',
        startTime: '08:00',
        endTime: '16:00'
      };

      const conflictAttribution2: Attribution = {
        id: 'conflict-2',
        userId: 1,
        date: new Date('2024-01-15'),
        type: 'vacation',
        location: 'salle-2',
        startTime: '16:00',
        endTime: '00:00'
      };

      const attributions = [conflictAttribution1, conflictAttribution2];
      
      const result = validateAssignments(attributions, mockRules);
      
      expect(result.violations.length).toBeGreaterThanOrEqual(1);
      
      // Find the schedule conflict violation
      const scheduleViolation = result.violations.find(v => v.type === 'CONFLICT_SCHEDULE');
      expect(scheduleViolation).toBeDefined();
      
      expect(scheduleViolation).toHaveProperty('id');
      expect(scheduleViolation).toHaveProperty('type', 'CONFLICT_SCHEDULE');
      expect(scheduleViolation).toHaveProperty('message');
      expect(scheduleViolation).toHaveProperty('attributions');
      expect(scheduleViolation.attributions).toContain('conflict-1');
      expect(scheduleViolation.attributions).toContain('conflict-2');
    });
  });
});