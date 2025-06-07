import { describe, it, expect } from '@jest/globals';
import {
  formatDate,
  parseDate,
  addDays,
  addWeeks,
  addMonths,
  differenceInDays,
  isWeekend,
  isValidDate,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  formatDateRange,
  ISO_DATE_FORMAT,
} from '../dateUtils';

describe('DateUtils', () => {
  describe('formatDate', () => {
    it('should format date to default format', () => {
      const date = new Date('2025-06-15T10:30:00');
      const result = formatDate(date);
      expect(result).toBe('15/06/2025');
    });

    it('should handle string input', () => {
      const result = formatDate('2025-06-15');
      expect(result).toBe('15/06/2025');
    });

    it('should return empty string for invalid date', () => {
      const result = formatDate('invalid');
      expect(result).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(formatDate(null as any)).toBe('');
      expect(formatDate(undefined as any)).toBe('');
    });
  });

  describe('parseDate', () => {
    it('should parse ISO date string', () => {
      const result = parseDate('2025-06-15');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(5); // June is month 5
      expect(result?.getDate()).toBe(15);
    });

    it('should return null for invalid date', () => {
      const result = parseDate('invalid');
      expect(result).toBeNull();
    });

    it('should handle Date object input', () => {
      const date = new Date('2025-06-15');
      const result = parseDate(date);
      expect(result).toEqual(date);
    });
  });

  describe('addDays', () => {
    it('should add positive days', () => {
      const date = new Date('2025-06-15');
      const result = addDays(date, 5);
      expect(result.getDate()).toBe(20);
    });

    it('should subtract negative days', () => {
      const date = new Date('2025-06-15');
      const result = addDays(date, -5);
      expect(result.getDate()).toBe(10);
    });

    it('should handle month boundaries', () => {
      const date = new Date('2025-06-30');
      const result = addDays(date, 2);
      expect(result.getMonth()).toBe(6); // July
      expect(result.getDate()).toBe(2);
    });
  });

  describe('addWeeks', () => {
    it('should add weeks correctly', () => {
      const date = new Date('2025-06-15');
      const result = addWeeks(date, 2);
      expect(result.getDate()).toBe(29);
    });

    it('should handle negative weeks', () => {
      const date = new Date('2025-06-15');
      const result = addWeeks(date, -1);
      expect(result.getDate()).toBe(8);
    });
  });

  describe('addMonths', () => {
    it('should add months correctly', () => {
      const date = new Date('2025-06-15');
      const result = addMonths(date, 2);
      expect(result.getMonth()).toBe(7); // August
      expect(result.getDate()).toBe(15);
    });

    it('should handle year boundaries', () => {
      const date = new Date('2025-11-15');
      const result = addMonths(date, 2);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(0); // January
    });

    it('should handle month-end dates', () => {
      const date = new Date('2025-01-31');
      const result = addMonths(date, 1);
      // February doesn't have 31 days, should adjust
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBeLessThanOrEqual(28);
    });
  });

  describe('differenceInDays', () => {
    it('should calculate positive difference', () => {
      const date1 = new Date('2025-06-15');
      const date2 = new Date('2025-06-20');
      const result = differenceInDays(date2, date1);
      expect(result).toBe(5);
    });

    it('should calculate negative difference', () => {
      const date1 = new Date('2025-06-20');
      const date2 = new Date('2025-06-15');
      const result = differenceInDays(date2, date1);
      expect(result).toBe(-5);
    });

    it('should return 0 for same dates', () => {
      const date = new Date('2025-06-15');
      const result = differenceInDays(date, date);
      expect(result).toBe(0);
    });
  });

  describe('isWeekend', () => {
    it('should return true for Saturday', () => {
      const date = new Date('2025-06-14'); // Saturday
      expect(isWeekend(date)).toBe(true);
    });

    it('should return true for Sunday', () => {
      const date = new Date('2025-06-15'); // Sunday
      expect(isWeekend(date)).toBe(true);
    });

    it('should return false for weekdays', () => {
      const monday = new Date('2025-06-16');
      const friday = new Date('2025-06-20');
      expect(isWeekend(monday)).toBe(false);
      expect(isWeekend(friday)).toBe(false);
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid dates', () => {
      expect(isValidDate(new Date('2025-06-15'))).toBe(true);
      expect(isValidDate('2025-06-15')).toBe(true);
    });

    it('should return false for invalid dates', () => {
      expect(isValidDate('invalid')).toBe(false);
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate(undefined)).toBe(false);
      expect(isValidDate(new Date('invalid'))).toBe(false);
    });
  });

  describe('getStartOfWeek', () => {
    it('should return Monday for week start', () => {
      const date = new Date('2025-06-18'); // Wednesday
      const result = getStartOfWeek(date);
      expect(result.getDay()).toBe(1); // Monday
      expect(result.getDate()).toBe(16);
    });

    it('should handle Sunday correctly', () => {
      const date = new Date('2025-06-15'); // Sunday
      const result = getStartOfWeek(date);
      expect(result.getDay()).toBe(1); // Previous Monday
      expect(result.getDate()).toBe(9);
    });
  });

  describe('getEndOfWeek', () => {
    it('should return Sunday for week end', () => {
      const date = new Date('2025-06-18'); // Wednesday
      const result = getEndOfWeek(date);
      expect(result.getDay()).toBe(0); // Sunday
      expect(result.getDate()).toBe(22);
    });
  });

  describe('getStartOfMonth', () => {
    it('should return first day of month', () => {
      const date = new Date('2025-06-15');
      const result = getStartOfMonth(date);
      expect(result.getDate()).toBe(1);
      expect(result.getMonth()).toBe(5); // June
    });
  });

  describe('getEndOfMonth', () => {
    it('should return last day of month', () => {
      const date = new Date('2025-06-15');
      const result = getEndOfMonth(date);
      expect(result.getDate()).toBe(30); // June has 30 days
      expect(result.getMonth()).toBe(5);
    });

    it('should handle February correctly', () => {
      const date = new Date('2025-02-15');
      const result = getEndOfMonth(date);
      expect(result.getDate()).toBe(28); // 2025 is not a leap year
    });
  });

  describe('formatDateRange', () => {
    it('should format date range within same month', () => {
      const start = new Date('2025-06-15');
      const end = new Date('2025-06-20');
      const result = formatDateRange(start, end);
      expect(result).toContain('15');
      expect(result).toContain('20');
      expect(result).toContain('juin');
    });

    it('should format date range across months', () => {
      const start = new Date('2025-06-28');
      const end = new Date('2025-07-05');
      const result = formatDateRange(start, end);
      expect(result).toContain('28 juin');
      expect(result).toContain('5 juillet');
    });

    it('should format single day', () => {
      const date = new Date('2025-06-15');
      const result = formatDateRange(date, date);
      expect(result).toContain('15 juin 2025');
    });
  });
});