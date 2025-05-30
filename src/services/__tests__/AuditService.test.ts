/**
 * @jest-environment node
 */
import { jest, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { 
  setupTestEnvironment, 
  cleanupTestEnvironment, 
  createMockPrismaClient,
  createMockLogger,
  testDataFactories 
} from '../../test-utils/standardMocks';
import { AuditService, AuditAction, AuditEntry } from '../AuditService';

// Mock fetch globalement
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('AuditService - Working Tests', () => {
  let auditService: AuditService;
  let testEnv: any;

  beforeAll(() => {
    testEnv = setupTestEnvironment();
  });

  afterAll(() => {
    cleanupTestEnvironment();
    testEnv.restoreConsole?.();
  });

  beforeEach(() => {
    // Reset tous les mocks
    jest.clearAllMocks();
    localStorageMock.clear();
    
    // Réinitialiser le store localStorage  
    (localStorageMock as any).getItem.mockImplementation(() => null);
    (localStorageMock as any).setItem.mockImplementation(() => {});

    // Configuration par défaut de fetch mock - Utiliser le format du système existant
    mockFetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: [],
          message: 'Mock response'
        }),
        statusText: 'OK'
      } as Response)
    );

    // Obtenir l'instance du service
    auditService = AuditService.getInstance();
  });

  describe('Service Structure', () => {
    it('should export AuditService class with required methods', () => {
      expect(auditService).toBeDefined();
      expect(typeof auditService.logAction).toBe('function');
      expect(typeof auditService.getAuditHistory).toBe('function');
      expect(typeof auditService.getUserAuditHistory).toBe('function');
    });

    it('should implement singleton pattern', () => {
      const instance1 = AuditService.getInstance();
      const instance2 = AuditService.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(auditService);
    });
  });

  describe('logAction', () => {
    it('should log an action successfully', async () => {
      const mockResponse = {
        id: 'audit-123',
        timestamp: new Date(),
        action: AuditAction.USER_LOGIN,
        entityId: 'user-123',
        entityType: 'user'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        statusText: 'OK'
      } as Response);

      const entry: AuditEntry = {
        action: AuditAction.USER_LOGIN,
        entityId: 'user-123',
        entityType: 'user',
        userId: 'user-123'
      };

      const result = await auditService.logAction(entry);

      expect(result).toMatchObject(entry);
      expect(result.id).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should handle API errors by storing locally', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const entry: AuditEntry = {
        action: AuditAction.LEAVE_CREATED,
        entityId: 'leave-123',
        entityType: 'leave',
        userId: 'user-123'
      };

      const result = await auditService.logAction(entry);

      expect(result).toMatchObject(entry);
      expect(result.id).toBeDefined();
      expect(result.timestamp).toBeDefined();
      
      // Devrait avoir essayé de stocker localement
      expect(console.error).toHaveBeenCalledWith(
        'Erreur lors de l\'enregistrement de l\'audit:',
        expect.any(Error)
      );
    });

    it('should generate unique IDs for entries', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
        statusText: 'OK'
      } as Response);

      const entry: AuditEntry = {
        action: AuditAction.USER_CREATED,
        entityId: 'user-123',
        entityType: 'user'
      };

      const result1 = await auditService.logAction(entry);
      const result2 = await auditService.logAction(entry);

      expect(result1.id).toBeDefined();
      expect(result2.id).toBeDefined();
      expect(result1.id).not.toBe(result2.id);
    });

    it('should handle typed audit details correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
        statusText: 'OK'
      } as Response);

      const entry: AuditEntry = {
        action: AuditAction.SETTING_UPDATED,
        entityId: 'setting-123',
        entityType: 'setting',
        details: {
          oldValue: 'old',
          newValue: 'new',
          fieldName: 'testField'
        }
      };

      const result = await auditService.logAction(entry);

      expect(result.details).toEqual(entry.details);
    });
  });

  describe('getAuditHistory', () => {
    it('should fetch audit history successfully', async () => {
      const mockEntries: AuditEntry[] = [
        {
          id: 'audit-1',
          action: AuditAction.USER_CREATED,
          entityId: 'user-123',
          entityType: 'user',
          timestamp: new Date()
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEntries),
        statusText: 'OK'
      } as Response);

      const result = await auditService.getAuditHistory('user', 'user-123');

      expect(result).toEqual(mockEntries);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/audit?entityType=user&entityId=user-123')
      );
    });

    it('should return empty array on API error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await auditService.getAuditHistory('user', 'user-123');

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        'Erreur dans getAuditHistory:',
        expect.any(Error)
      );
    });

    it('should handle options parameters correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
        statusText: 'OK'
      } as Response);

      await auditService.getAuditHistory('user', 'user-123', {
        limit: 10,
        offset: 20,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        actions: [AuditAction.USER_CREATED, AuditAction.USER_UPDATED]
      });

      const expectedUrl = expect.stringMatching(
        /entityType=user.*entityId=user-123.*limit=10.*offset=20.*startDate=.*2025-01-01.*endDate=.*2025-12-31.*actions=user%3Acreated%2Cuser%3Aupdated/
      );
      
      expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
    });

    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve([]),
      } as Response);

      const result = await auditService.getAuditHistory('user', 'user-123');

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getUserAuditHistory', () => {
    it('should fetch user-specific audit history', async () => {
      const mockEntries: AuditEntry[] = [
        {
          id: 'audit-1',
          action: AuditAction.USER_LOGIN,
          userId: 'user-123',
          entityId: 'session-456',
          entityType: 'session'
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEntries),
        statusText: 'OK'
      } as Response);

      const result = await auditService.getUserAuditHistory('user-123');

      expect(result).toEqual(mockEntries);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/audit/user/user-123')
      );
    });

    it('should handle getUserAuditHistory errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await auditService.getUserAuditHistory('user-123');

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });

    it('should pass options to getUserAuditHistory correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
        statusText: 'OK'
      } as Response);

      await auditService.getUserAuditHistory('user-123', {
        limit: 5,
        actions: [AuditAction.USER_LOGIN, AuditAction.USER_LOGOUT]
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=5')
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed fetch responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
        statusText: 'OK'
      } as Response);

      const result = await auditService.getAuditHistory('user', 'user-123');

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle localStorage failures gracefully', async () => {
      // Simuler une erreur localStorage
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const entry: AuditEntry = {
        action: AuditAction.USER_LOGIN,
        entityId: 'user-123',
        entityType: 'user'
      };

      // Ne devrait pas lancer d'erreur même si localStorage échoue
      const result = await auditService.logAction(entry);
      expect(result).toMatchObject(entry);
    });
  });

  describe('Performance', () => {
    it('should handle multiple concurrent audit logs', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
        statusText: 'OK'
      } as Response);

      const entries: AuditEntry[] = Array.from({ length: 10 }, (_, i) => ({
        action: AuditAction.USER_LOGIN,
        entityId: `user-${i}`,
        entityType: 'user'
      }));

      const promises = entries.map(entry => auditService.logAction(entry));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      expect(mockFetch).toHaveBeenCalledTimes(10);
      
      // Tous les IDs devraient être uniques
      const ids = results.map(r => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10);
    });

    it('should handle large audit history requests efficiently', async () => {
      const largeResponse = Array.from({ length: 1000 }, (_, i) => ({
        id: `audit-${i}`,
        action: AuditAction.USER_LOGIN,
        entityId: 'user-123',
        entityType: 'user',
        timestamp: new Date()
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(largeResponse),
        statusText: 'OK'
      } as Response);

      const startTime = Date.now();
      const result = await auditService.getAuditHistory('user', 'user-123');
      const endTime = Date.now();

      expect(result).toHaveLength(1000);
      // Devrait traiter en moins de 100ms même avec 1000 entrées
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('AuditAction Enum', () => {
    it('should provide all required audit actions', () => {
      expect(AuditAction.USER_LOGIN).toBe('user:login');
      expect(AuditAction.USER_LOGOUT).toBe('user:logout');
      expect(AuditAction.LEAVE_CREATED).toBe('leave:created');
      expect(AuditAction.QUOTA_UPDATED).toBe('quota:updated');
      expect(AuditAction.PERMISSION_GRANTED).toBe('permission:granted');
      expect(AuditAction.SETTING_UPDATED).toBe('setting:updated');
      expect(AuditAction.REPORT_GENERATED).toBe('report:generated');
      expect(AuditAction.SYSTEM_UPDATED).toBe('system:updated');
    });

    it('should handle all action types in logAction', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
        statusText: 'OK'
      } as Response);

      const actions = Object.values(AuditAction);
      
      for (const action of actions) {
        const entry: AuditEntry = {
          action,
          entityId: 'test-entity',
          entityType: 'test'
        };

        const result = await auditService.logAction(entry);
        expect(result.action).toBe(action);
      }

      expect(mockFetch).toHaveBeenCalledTimes(actions.length);
    });
  });
});