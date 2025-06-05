import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import axios from 'axios';
import { getPublicHolidays, isPublicHoliday } from '../calendarService';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CalendarService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPublicHolidays', () => {
    it('should fetch public holidays from API', async () => {
      const mockHolidays = [
        { date: '2025-01-01', name: 'Nouvel An' },
        { date: '2025-05-01', name: 'Fête du Travail' },
        { date: '2025-07-14', name: 'Fête Nationale' },
      ];

      mockedAxios.get.mockResolvedValueOnce({ data: mockHolidays });

      const result = await getPublicHolidays(2025, 2025);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(new Date('2025-01-01'));
      expect(result[1]).toEqual(new Date('2025-05-01'));
      expect(result[2]).toEqual(new Date('2025-07-14'));
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/jours-feries?startYear=2025&endYear=2025')
      );
    });

    it('should return empty array on API error', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await getPublicHolidays(2025, 2025);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Erreur lors de la récupération des jours fériés:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle multiple years', async () => {
      const mockHolidays = [
        { date: '2025-01-01', name: 'Nouvel An 2025' },
        { date: '2026-01-01', name: 'Nouvel An 2026' },
      ];

      mockedAxios.get.mockResolvedValueOnce({ data: mockHolidays });

      const result = await getPublicHolidays(2025, 2026);

      expect(result).toHaveLength(2);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('startYear=2025&endYear=2026')
      );
    });
  });

  describe('isPublicHoliday', () => {
    const holidays = [
      new Date('2025-01-01'),
      new Date('2025-05-01'),
      new Date('2025-07-14'),
    ];

    it('should return true for a public holiday', () => {
      const date = new Date('2025-01-01');
      const result = isPublicHoliday(date, holidays);
      expect(result).toBe(true);
    });

    it('should return false for a regular day', () => {
      const date = new Date('2025-01-02');
      const result = isPublicHoliday(date, holidays);
      expect(result).toBe(false);
    });

    it('should handle different time components correctly', () => {
      // Date with different time but same day
      const date = new Date('2025-01-01T15:30:00');
      const result = isPublicHoliday(date, holidays);
      expect(result).toBe(true);
    });

    it('should return false for empty holidays array', () => {
      const date = new Date('2025-01-01');
      const result = isPublicHoliday(date, []);
      expect(result).toBe(false);
    });
  });

});