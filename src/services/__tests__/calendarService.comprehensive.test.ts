/**
 * Tests complets pour CalendarService
 * Tests toutes les fonctionnalités de gestion de calendrier et jours fériés
 */

import { getPublicHolidays, isPublicHoliday } from '../calendarService';
import axios from 'axios';
import { CONFIG } from '@/config';
import { 
  setupTestEnvironment, 
  cleanupTestEnvironment 
} from '../../test-utils/standardMocks';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock de la configuration
jest.mock('@/config', () => ({
  CONFIG: {
    API_BASE_URL: 'http://localhost:3000'
  }
}));

describe('CalendarService', () => {
  let testEnv: any;

  beforeAll(() => {
    testEnv = setupTestEnvironment();
  });

  afterAll(() => {
    cleanupTestEnvironment();
    testEnv.restoreConsole?.();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPublicHolidays', () => {
    it('should fetch public holidays for given year range', async () => {
      const mockHolidays = [
        { date: '2025-01-01', name: 'Jour de l\'An' },
        { date: '2025-05-01', name: 'Fête du Travail' },
        { date: '2025-07-14', name: 'Fête Nationale' },
        { date: '2025-12-25', name: 'Noël' }
      ];

      mockedAxios.get.mockResolvedValue({
        data: mockHolidays
      });

      const result = await getPublicHolidays(2025, 2025);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${CONFIG.API_BASE_URL}/api/jours-feries?startYear=2025&endYear=2025`
      );

      expect(result).toHaveLength(4);
      expect(result[0]).toBeInstanceOf(Date);
      expect(result[0].toISOString().split('T')[0]).toBe('2025-01-01');
    });

    it('should handle multiple years range', async () => {
      const mockHolidays = [
        { date: '2024-12-25', name: 'Noël 2024' },
        { date: '2025-01-01', name: 'Jour de l\'An 2025' },
        { date: '2025-12-25', name: 'Noël 2025' }
      ];

      mockedAxios.get.mockResolvedValue({
        data: mockHolidays
      });

      const result = await getPublicHolidays(2024, 2025);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${CONFIG.API_BASE_URL}/api/jours-feries?startYear=2024&endYear=2025`
      );

      expect(result).toHaveLength(3);
    });

    it('should return empty array on API error', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      const result = await getPublicHolidays(2025, 2025);

      expect(result).toEqual([]);
      expect(consoleError).toHaveBeenCalledWith(
        'Erreur lors de la récupération des jours fériés:',
        expect.any(Error)
      );

      consoleError.mockRestore();
    });

    it('should handle network timeout', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      mockedAxios.get.mockRejectedValue(new Error('timeout of 5000ms exceeded'));

      const result = await getPublicHolidays(2025, 2025);

      expect(result).toEqual([]);
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });

    it('should handle malformed API response', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      mockedAxios.get.mockResolvedValue({
        data: 'invalid response'
      });

      const result = await getPublicHolidays(2025, 2025);

      // Should handle gracefully and return empty array
      expect(result).toEqual([]);

      consoleError.mockRestore();
    });
  });

  describe('isPublicHoliday', () => {
    const createDateArray = (dateStrings: string[]): Date[] => {
      return dateStrings.map(dateStr => new Date(dateStr));
    };

    it('should return true for exact holiday match', () => {
      const holidays = createDateArray(['2025-01-01', '2025-12-25']);
      const testDate = new Date('2025-01-01');

      const result = isPublicHoliday(testDate, holidays);

      expect(result).toBe(true);
    });

    it('should return false for non-holiday date', () => {
      const holidays = createDateArray(['2025-01-01', '2025-12-25']);
      const testDate = new Date('2025-06-15');

      const result = isPublicHoliday(testDate, holidays);

      expect(result).toBe(false);
    });

    it('should handle time components correctly', () => {
      const holidays = createDateArray(['2025-01-01']);
      
      // Different times on the same day
      const testDate1 = new Date('2025-01-01T08:30:00.000Z');
      const testDate2 = new Date('2025-01-01T23:59:59.999Z');
      const testDate3 = new Date('2025-01-01T00:00:00.000Z');

      expect(isPublicHoliday(testDate1, holidays)).toBe(true);
      expect(isPublicHoliday(testDate2, holidays)).toBe(true);
      expect(isPublicHoliday(testDate3, holidays)).toBe(true);
    });

    it('should handle empty holiday list', () => {
      const holidays: Date[] = [];
      const testDate = new Date('2025-01-01');

      const result = isPublicHoliday(testDate, holidays);

      expect(result).toBe(false);
    });

    it('should handle multiple holidays correctly', () => {
      const holidays = createDateArray([
        '2025-01-01', // Jour de l'An
        '2025-05-01', // Fête du Travail
        '2025-05-08', // Victoire 1945
        '2025-07-14', // Fête Nationale
        '2025-08-15', // Assomption
        '2025-11-01', // Toussaint
        '2025-11-11', // Armistice
        '2025-12-25'  // Noël
      ]);

      // Test plusieurs dates
      expect(isPublicHoliday(new Date('2025-01-01'), holidays)).toBe(true);
      expect(isPublicHoliday(new Date('2025-07-14'), holidays)).toBe(true);
      expect(isPublicHoliday(new Date('2025-12-25'), holidays)).toBe(true);
      
      // Test dates non fériées
      expect(isPublicHoliday(new Date('2025-01-02'), holidays)).toBe(false);
      expect(isPublicHoliday(new Date('2025-06-15'), holidays)).toBe(false);
      expect(isPublicHoliday(new Date('2025-12-24'), holidays)).toBe(false);
    });
  });
});