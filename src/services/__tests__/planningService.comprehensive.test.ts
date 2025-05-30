import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PlanningService } from '../planningService';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../test-utils/standardMocks';
import {
  createTestAssignment,
  createMedicalTeam,
  createOperatingBlock,
  createConflictScenario,
  createPerformanceTestData,
  TestAssignment,
} from '../../test-utils/planningFactories';

/**
 * Tests complets pour PlanningService
 * Couvre les scénarios de planning médical complexes
 */

// Mock fetch globalement avec gestion fine
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

// Mock console pour éviter le spam pendant les tests
const originalConsole = console;
beforeEach(() => {
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };
});

afterEach(() => {
  global.console = originalConsole;
});

describe('PlanningService - Comprehensive Medical Tests', () => {
  beforeEach(() => {
    setupTestEnvironment();
    mockFetch.mockClear();
    
    // Configuration par défaut du mock fetch pour réponses réussies
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        success: true,
        data: [],
        violations: [],
        attributions: [],
      }),
    });
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe('API Client Functionality', () => {
    describe('saveAssignments', () => {
      it('should save simple assignment successfully', async () => {
        const assignment = createTestAssignment({
          type: 'GARDE',
          shiftType: 'JOUR',
          userId: 1,
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ success: true }),
        });

        const result = await PlanningService.saveAssignments([assignment]);

        expect(result).toBe(true);
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/gardes/vacations',
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attributions: [assignment] }),
          }
        );
      });

      it('should save complex medical team assignments', async () => {
        const team = createMedicalTeam(5);
        const rooms = createOperatingBlock();
        
        const assignments = [
          createTestAssignment({
            userId: team[0].id, // Chef MAR
            operatingRoomId: rooms[0].id, // Bloc Cardio
            type: 'GARDE',
            shiftType: 'JOUR',
            specialite: 'Anesthésie',
          }),
          createTestAssignment({
            userId: team[1].id, // Chef IADE
            operatingRoomId: rooms[1].id, // Bloc Cardio 2
            type: 'GARDE',
            shiftType: 'JOUR',
            specialite: 'Anesthésie',
          }),
          createTestAssignment({
            userId: team[2].id, // MAR Senior
            operatingRoomId: rooms[4].id, // Urgences
            type: 'ASTREINTE',
            shiftType: 'NUIT',
            specialite: 'Anesthésie',
          }),
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ success: true }),
        });

        const result = await PlanningService.saveAssignments(assignments);

        expect(result).toBe(true);
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/gardes/vacations',
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({ attributions: assignments }),
          })
        );
      });

      it('should handle API errors gracefully', async () => {
        const assignment = createTestAssignment();

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: jest.fn().mockResolvedValue({
            error: 'Erreur serveur interne',
          }),
        });

        const result = await PlanningService.saveAssignments([assignment]);

        expect(result).toBe(false);
        expect(console.error).toHaveBeenCalledWith(
          'Erreur lors de la sauvegarde des gardes/vacations via API:',
          expect.any(Error)
        );
      });

      it('should handle network errors', async () => {
        const assignment = createTestAssignment();

        mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

        const result = await PlanningService.saveAssignments([assignment]);

        expect(result).toBe(false);
        expect(console.error).toHaveBeenCalledWith(
          'Erreur lors de la sauvegarde des gardes/vacations via API:',
          expect.any(Error)
        );
      });

      it('should handle large volumes of assignments', async () => {
        const performanceData = createPerformanceTestData('large');
        const assignments = performanceData.assignments.slice(0, 100); // 100 affectations

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ success: true }),
        });

        const startTime = Date.now();
        const result = await PlanningService.saveAssignments(assignments);
        const duration = Date.now() - startTime;

        expect(result).toBe(true);
        expect(duration).toBeLessThan(1000); // Should complete within 1 second
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });

    describe('validateAssignments', () => {
      it('should validate assignments without violations', async () => {
        const assignment = createTestAssignment({
          type: 'GARDE',
          userId: 1,
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            violations: [],
          }),
        });

        const result = await PlanningService.validateAssignments([assignment]);

        expect(result).toEqual([]);
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/gardes/vacations/validate',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attributions: [assignment] }),
          }
        );
      });

      it('should detect MAR/IADE assignment conflicts', async () => {
        const { conflictingAssignments } = createConflictScenario();

        const mockViolations = [
          {
            ruleId: 'CONFLICT_DOUBLE_ASSIGNMENT',
            message: 'Médecin affecté simultanément sur deux blocs',
            assignmentId: conflictingAssignments[0].id,
            severity: 'ERROR',
            userId: conflictingAssignments[0].userId,
            date: conflictingAssignments[0].date,
          },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            violations: mockViolations,
          }),
        });

        const result = await PlanningService.validateAssignments(conflictingAssignments);

        expect(result).toEqual(mockViolations);
        expect(result[0].ruleId).toBe('CONFLICT_DOUBLE_ASSIGNMENT');
        expect(result[0].severity).toBe('ERROR');
      });

      it('should validate medical specialty constraints', async () => {
        const cardiacAssignment = createTestAssignment({
          operatingRoomId: 'bloc-cardio-1',
          specialite: 'Cardiologie', // Specialist required
          type: 'GARDE',
        });

        const mockViolations = [
          {
            ruleId: 'SPECIALTY_MISMATCH',
            message: 'Spécialité requise non respectée pour le bloc cardio',
            assignmentId: cardiacAssignment.id,
            severity: 'WARNING',
            requiredSpecialty: 'Anesthésie Cardiaque',
            providedSpecialty: 'Cardiologie',
          },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            violations: mockViolations,
          }),
        });

        const result = await PlanningService.validateAssignments([cardiacAssignment]);

        expect(result).toEqual(mockViolations);
        expect(result[0].ruleId).toBe('SPECIALTY_MISMATCH');
      });

      it('should validate MAR/IADE supervision rules', async () => {
        const unsupervisedAssignment = createTestAssignment({
          userId: 999, // Junior IADE
          operatingRoomId: 'bloc-cardio-1', // Complex procedure
          type: 'GARDE',
          notes: 'Junior sans supervision',
        });

        const mockViolations = [
          {
            ruleId: 'SUPERVISION_REQUIRED',
            message: 'Personnel junior nécessite supervision pour ce type de bloc',
            assignmentId: unsupervisedAssignment.id,
            severity: 'ERROR',
            requiredSupervision: true,
            blocComplexity: 'HIGH',
          },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            violations: mockViolations,
          }),
        });

        const result = await PlanningService.validateAssignments([unsupervisedAssignment]);

        expect(result).toEqual(mockViolations);
        expect(result[0].ruleId).toBe('SUPERVISION_REQUIRED');
      });

      it('should handle validation API errors', async () => {
        const assignment = createTestAssignment();

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: jest.fn().mockResolvedValue({
            error: 'Données invalides',
          }),
        });

        await expect(
          PlanningService.validateAssignments([assignment])
        ).rejects.toThrow('Données invalides');
      });

      it('should handle complex medical scenarios', async () => {
        const complexScenario = [
          createTestAssignment({
            userId: 1,
            type: 'GARDE',
            shiftType: 'JOUR',
            operatingRoomId: 'bloc-cardio-1',
            startTime: '08:00',
            endTime: '17:00',
          }),
          createTestAssignment({
            userId: 1,
            type: 'ASTREINTE',
            shiftType: 'NUIT',
            startTime: '17:00',
            endTime: '08:00',
          }),
          createTestAssignment({
            userId: 2,
            type: 'GARDE',
            shiftType: 'NUIT',
            operatingRoomId: 'urgences-1',
            startTime: '20:00',
            endTime: '08:00',
          }),
        ];

        const mockViolations = [
          {
            ruleId: 'MAX_WORK_HOURS_EXCEEDED',
            message: 'Durée de travail maximale dépassée (24h continue)',
            assignmentId: complexScenario[0].id,
            severity: 'ERROR',
            totalHours: 25,
            maxAllowed: 24,
          },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            violations: mockViolations,
          }),
        });

        const result = await PlanningService.validateAssignments(complexScenario);

        expect(result).toEqual(mockViolations);
        expect(result[0].ruleId).toBe('MAX_WORK_HOURS_EXCEEDED');
      });
    });

    describe('getAssignments', () => {
      it('should retrieve assignments for date range', async () => {
        const startDate = new Date('2025-01-01');
        const endDate = new Date('2025-01-07');
        
        const mockAssignments = [
          createTestAssignment({
            date: new Date('2025-01-02'),
            type: 'GARDE',
          }),
          createTestAssignment({
            date: new Date('2025-01-03'),
            type: 'ASTREINTE',
          }),
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            attributions: mockAssignments.map(a => ({
              ...a,
              date: a.date.toISOString(),
            })),
          }),
        });

        const result = await PlanningService.getAssignments(startDate, endDate);

        expect(result).toHaveLength(2);
        expect(result[0].date).toBeInstanceOf(Date);
        expect(result[0].type).toBe('GARDE');
        expect(result[1].type).toBe('ASTREINTE');
        
        expect(mockFetch).toHaveBeenCalledWith(
          `http://localhost:3000/api/gardes/vacations?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
        );
      });

      it('should handle empty results gracefully', async () => {
        const startDate = new Date('2025-01-01');
        const endDate = new Date('2025-01-07');

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            attributions: [],
          }),
        });

        const result = await PlanningService.getAssignments(startDate, endDate);

        expect(result).toEqual([]);
      });

      it('should handle malformed date data', async () => {
        const startDate = new Date('2025-01-01');
        const endDate = new Date('2025-01-07');

        const malformedData = [
          {
            id: 'test-1',
            userId: 1,
            date: 'invalid-date',
            type: 'GARDE',
          },
          {
            id: 'test-2',
            userId: 2,
            date: '2025-01-02T08:00:00Z',
            type: 'ASTREINTE',
          },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            attributions: malformedData,
          }),
        });

        const result = await PlanningService.getAssignments(startDate, endDate);

        expect(result).toHaveLength(2);
        expect(result[0].date).toBeInstanceOf(Date);
        expect(result[1].date).toBeInstanceOf(Date);
        // Should handle invalid dates gracefully
        expect(isNaN(result[0].date.getTime())).toBe(true);
        expect(isNaN(result[1].date.getTime())).toBe(false);
      });

      it('should handle API errors during retrieval', async () => {
        const startDate = new Date('2025-01-01');
        const endDate = new Date('2025-01-07');

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: jest.fn().mockResolvedValue({
            error: 'Données non trouvées',
          }),
        });

        await expect(
          PlanningService.getAssignments(startDate, endDate)
        ).rejects.toThrow('Données non trouvées');
      });
    });
  });

  describe('Medical Scenarios Integration', () => {
    it('should handle complete medical workflow', async () => {
      const team = createMedicalTeam(3);
      const rooms = createOperatingBlock();
      
      // 1. Créer des affectations pour une équipe médicale
      const assignments = [
        createTestAssignment({
          userId: team[0].id, // Chef MAR
          operatingRoomId: rooms[0].id,
          type: 'GARDE',
          shiftType: 'JOUR',
        }),
        createTestAssignment({
          userId: team[1].id, // Chef IADE
          operatingRoomId: rooms[1].id,
          type: 'GARDE',
          shiftType: 'JOUR',
        }),
      ];

      // 2. Valider d'abord
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ violations: [] }),
      });

      const violations = await PlanningService.validateAssignments(assignments);
      expect(violations).toEqual([]);

      // 3. Sauvegarder ensuite
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      });

      const saved = await PlanningService.saveAssignments(assignments);
      expect(saved).toBe(true);

      // 4. Récupérer pour vérifier
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          attributions: assignments.map(a => ({
            ...a,
            date: a.date.toISOString(),
          })),
        }),
      });

      const retrieved = await PlanningService.getAssignments(
        new Date('2025-01-15'),
        new Date('2025-01-15')
      );

      expect(retrieved).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should handle emergency reassignment scenario', async () => {
      // Scénario : réassignation d'urgence suite à un congé maladie
      const originalAssignment = createTestAssignment({
        userId: 1,
        operatingRoomId: 'bloc-cardio-1',
        type: 'GARDE',
        status: 'CONFIRMED',
      });

      const emergencyReplacement = createTestAssignment({
        userId: 2, // Remplaçant
        operatingRoomId: 'bloc-cardio-1',
        type: 'GARDE',
        status: 'PENDING',
        notes: 'Remplacement urgence - congé maladie',
      });

      // Valider le remplacement
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          violations: [
            {
              ruleId: 'OVERTIME_WARNING',
              message: 'Heures supplémentaires pour le remplaçant',
              severity: 'WARNING',
            },
          ],
        }),
      });

      const violations = await PlanningService.validateAssignments([emergencyReplacement]);
      
      expect(violations).toHaveLength(1);
      expect(violations[0].ruleId).toBe('OVERTIME_WARNING');
      expect(violations[0].severity).toBe('WARNING');

      // Accepter le remplacement malgré l'avertissement
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      });

      const saved = await PlanningService.saveAssignments([emergencyReplacement]);
      expect(saved).toBe(true);
    });

    it('should handle night shift constraints', async () => {
      const nightShifts = [
        createTestAssignment({
          userId: 1,
          type: 'GARDE',
          shiftType: 'NUIT',
          startTime: '20:00',
          endTime: '08:00',
          date: new Date('2025-01-15'),
        }),
        createTestAssignment({
          userId: 1,
          type: 'GARDE',
          shiftType: 'NUIT',
          startTime: '20:00',
          endTime: '08:00',
          date: new Date('2025-01-16'), // Nuit consécutive
        }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          violations: [
            {
              ruleId: 'CONSECUTIVE_NIGHT_SHIFTS',
              message: 'Gardes de nuit consécutives interdites',
              severity: 'ERROR',
              maxConsecutive: 1,
              actual: 2,
            },
          ],
        }),
      });

      const violations = await PlanningService.validateAssignments(nightShifts);
      
      expect(violations).toHaveLength(1);
      expect(violations[0].ruleId).toBe('CONSECUTIVE_NIGHT_SHIFTS');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle concurrent API calls', async () => {
      const assignments1 = [createTestAssignment({ userId: 1 })];
      const assignments2 = [createTestAssignment({ userId: 2 })];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ success: true }),
        });

      const promises = [
        PlanningService.saveAssignments(assignments1),
        PlanningService.saveAssignments(assignments2),
      ];

      const results = await Promise.all(promises);

      expect(results).toEqual([true, true]);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle timeout scenarios', async () => {
      const assignment = createTestAssignment();

      mockFetch.mockImplementationOnce(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      const result = await PlanningService.saveAssignments([assignment]);

      expect(result).toBe(false);
    });

    it('should handle malformed server responses', async () => {
      const assignment = createTestAssignment();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      });

      const result = await PlanningService.saveAssignments([assignment]);

      expect(result).toBe(false);
    });

    it('should handle large dataset efficiently', async () => {
      const performanceData = createPerformanceTestData('large');
      const largeAssignmentSet = performanceData.assignments;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      });

      const startTime = Date.now();
      const result = await PlanningService.saveAssignments(largeAssignmentSet);
      const duration = Date.now() - startTime;

      expect(result).toBe(true);
      expect(duration).toBeLessThan(2000); // Should handle large datasets efficiently
      expect(largeAssignmentSet.length).toBeGreaterThan(100);
    });
  });

  describe('Data Integrity and Validation', () => {
    it('should preserve assignment data integrity', async () => {
      const originalAssignment = createTestAssignment({
        id: 'integrity-test',
        userId: 123,
        operatingRoomId: 'room-xyz',
        date: new Date('2025-01-15T10:30:00Z'),
        type: 'GARDE',
        status: 'CONFIRMED',
        specialite: 'Anesthésie Cardiaque',
        notes: 'Test d\'intégrité des données',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      });

      await PlanningService.saveAssignments([originalAssignment]);

      // Vérifier que les données ont été envoyées correctement
      const sentData = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(sentData.attributions[0]).toEqual(originalAssignment);
    });

    it('should handle special characters in data', async () => {
      const specialAssignment = createTestAssignment({
        notes: 'Médecin avec caractères spéciaux: é, à, ç, ñ, ü',
        specialite: 'Anesthésie & Réanimation',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      });

      const result = await PlanningService.saveAssignments([specialAssignment]);

      expect(result).toBe(true);
      // Vérifier que l'encodage UTF-8 est préservé
      const sentData = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(sentData.attributions[0].notes).toContain('é, à, ç, ñ, ü');
    });

    it('should validate assignment ID uniqueness', async () => {
      const duplicateAssignments = [
        createTestAssignment({ id: 'duplicate-id', userId: 1 }),
        createTestAssignment({ id: 'duplicate-id', userId: 2 }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          violations: [
            {
              ruleId: 'DUPLICATE_ASSIGNMENT_ID',
              message: 'ID d\'affectation dupliqué détecté',
              severity: 'ERROR',
              duplicateId: 'duplicate-id',
            },
          ],
        }),
      });

      const violations = await PlanningService.validateAssignments(duplicateAssignments);
      
      expect(violations).toHaveLength(1);
      expect(violations[0].ruleId).toBe('DUPLICATE_ASSIGNMENT_ID');
    });
  });
});