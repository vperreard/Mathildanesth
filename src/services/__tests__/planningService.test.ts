import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PlanningService } from '../planningService';

// Mock fetch globally
global.fetch = jest.fn();

describe('PlanningService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveAssignments', () => {
    it('devrait sauvegarder les affectations avec succès', async () => {
      const mockAttributions = [
        {
          date: '2025-01-15',
          gardes: {
            jour: [{ userId: 1, username: 'Dr. Martin' }],
            nuit: [{ userId: 2, username: 'Dr. Dupont' }],
          },
          vacations: {
            matin: [{ userId: 3, username: 'Dr. Leroy' }],
            apresmidi: [{ userId: 4, username: 'Dr. Bernard' }],
          },
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await PlanningService.saveAssignments(mockAttributions);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/gardes/vacations',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attributions: mockAttributions }),
        }
      );
    });

    it('devrait gérer les erreurs API', async () => {
      const mockAttributions = [
        {
          date: '2025-01-15',
          gardes: {},
          vacations: {},
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Erreur serveur' }),
      });

      const result = await PlanningService.saveAssignments(mockAttributions);

      expect(result).toBe(false);
    });

    it('devrait gérer les erreurs réseau', async () => {
      const mockAttributions = [];

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await PlanningService.saveAssignments(mockAttributions);

      expect(result).toBe(false);
    });
  });

  describe('validateAssignments', () => {
    it('devrait valider les affectations sans violations', async () => {
      const mockAttributions = [
        {
          date: '2025-01-15',
          gardes: {
            jour: [{ userId: 1, username: 'Dr. Martin' }],
          },
          vacations: {},
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ violations: [] }),
      });

      const result = await PlanningService.validateAssignments(mockAttributions);

      expect(result).toEqual([]);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/gardes/vacations/validate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attributions: mockAttributions }),
        }
      );
    });

    it('devrait retourner les violations de règles', async () => {
      const mockAttributions = [
        {
          date: '2025-01-15',
          gardes: {
            jour: [{ userId: 1, username: 'Dr. Martin' }],
            nuit: [{ userId: 1, username: 'Dr. Martin' }], // Same user twice
          },
          vacations: {},
        },
      ];

      const mockViolations = [
        {
          rule: 'NO_DOUBLE_BOOKING',
          severity: 'ERROR',
          message: 'Dr. Martin est affecté deux fois le même jour',
          date: '2025-01-15',
          userId: 1,
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ violations: mockViolations }),
      });

      const result = await PlanningService.validateAssignments(mockAttributions);

      expect(result).toEqual(mockViolations);
    });

    it('devrait gérer les erreurs de validation', async () => {
      const mockAttributions = [];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Erreur de validation' }),
      });

      const result = await PlanningService.validateAssignments(mockAttributions);

      expect(result).toEqual([]);
    });
  });

  describe('Performance', () => {
    it('devrait gérer de grandes quantités d\'affectations', async () => {
      // Create 100 days of attributions
      const largeAttributions = Array.from({ length: 100 }, (_, i) => ({
        date: new Date(2025, 0, i + 1).toISOString().split('T')[0],
        gardes: {
          jour: [{ userId: i % 10 + 1, username: `Dr. ${i % 10 + 1}` }],
          nuit: [{ userId: (i + 1) % 10 + 1, username: `Dr. ${(i + 1) % 10 + 1}` }],
        },
        vacations: {
          matin: [{ userId: (i + 2) % 10 + 1, username: `Dr. ${(i + 2) % 10 + 1}` }],
          apresmidi: [{ userId: (i + 3) % 10 + 1, username: `Dr. ${(i + 3) % 10 + 1}` }],
        },
      }));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const start = Date.now();
      const result = await PlanningService.saveAssignments(largeAttributions);
      const duration = Date.now() - start;

      expect(result).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Integration', () => {
    it('devrait valider puis sauvegarder les affectations', async () => {
      const mockAttributions = [
        {
          date: '2025-01-15',
          gardes: {
            jour: [{ userId: 1, username: 'Dr. Martin' }],
          },
          vacations: {
            matin: [{ userId: 2, username: 'Dr. Dupont' }],
          },
        },
      ];

      // First validate
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ violations: [] }),
      });

      const violations = await PlanningService.validateAssignments(mockAttributions);
      expect(violations).toEqual([]);

      // Then save
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const saved = await PlanningService.saveAssignments(mockAttributions);
      expect(saved).toBe(true);

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('devrait logger les erreurs de sauvegarde', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Connection failed'));

      const result = await PlanningService.saveAssignments([]);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Erreur lors de la sauvegarde des gardes/vacations via API:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('devrait logger les erreurs de validation', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Validation service down'));

      const result = await PlanningService.validateAssignments([]);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Erreur lors de la validation des gardes/vacations via API:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});