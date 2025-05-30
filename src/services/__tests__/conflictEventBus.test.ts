/**
 * @jest-environment node
 */
import { 
  conflictEventBus, 
  ConflictEventType, 
  ConflictDetectedEvent, 
  ConflictResolvedEvent,
  ConflictCheckRequestedEvent,
  ConflictCheckCompletedEvent
} from '../conflictDetection/eventBus';
import { ConflictType, ConflictSeverity } from '@/modules/leaves/types/conflict';

describe('ConflictEventBus - Working Tests', () => {
  let testEnv: any;
  
  beforeAll(() => {
    testEnv = setupTestEnvironment();
  });
  
  afterAll(() => {
    cleanupTestEnvironment();
    testEnv.restoreConsole?.();
  });

  beforeEach(() => {
    conflictEventBus.clearHistory();
    // Clear all handlers by creating a new instance if needed
    // Since it's a singleton, we'll work with the existing instance
  });

  afterEach(() => {
    conflictEventBus.clearHistory();
  });

  describe('Service Instance', () => {
    it('should export conflictEventBus instance', () => {
      expect(conflictEventBus).toBeDefined();
      expect(typeof conflictEventBus.subscribe).toBe('function');
      expect(typeof conflictEventBus.emit).toBe('function');
      expect(typeof conflictEventBus.getHistory).toBe('function');
      expect(typeof conflictEventBus.clearHistory).toBe('function');
    });
  });

  describe('Basic Subscription and Emission', () => {
    it('should subscribe to and receive events', () => {
      const handler = jest.fn();
      
      const unsubscribe = conflictEventBus.subscribe(
        ConflictEventType.CONFLICT_DETECTED,
        handler
      );
      
      expect(typeof unsubscribe).toBe('function');
      
      const mockEvent: ConflictDetectedEvent = {
        type: ConflictEventType.CONFLICT_DETECTED,
        timestamp: new Date(),
        source: 'test',
        conflict: {
          id: 'conflict-1',
          type: ConflictType.OVERLAP,
          severity: ConflictSeverity.HIGH,
          message: 'Test conflict',
          affectedRequests: [],
          detectedAt: new Date()
        },
        userId: 'user-1',
        conflictType: ConflictType.OVERLAP,
        severity: ConflictSeverity.HIGH
      };
      
      conflictEventBus.emit(mockEvent);
      
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(mockEvent);
    });

    it('should handle multiple subscribers for same event type', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      conflictEventBus.subscribe(ConflictEventType.CONFLICT_DETECTED, handler1);
      conflictEventBus.subscribe(ConflictEventType.CONFLICT_DETECTED, handler2);
      
      const mockEvent: ConflictDetectedEvent = {
        type: ConflictEventType.CONFLICT_DETECTED,
        timestamp: new Date(),
        source: 'test',
        conflict: {
          id: 'conflict-1',
          type: ConflictType.OVERLAP,
          severity: ConflictSeverity.MEDIUM,
          message: 'Test conflict',
          affectedRequests: [],
          detectedAt: new Date()
        },
        userId: 'user-1',
        conflictType: ConflictType.OVERLAP,
        severity: ConflictSeverity.MEDIUM
      };
      
      conflictEventBus.emit(mockEvent);
      
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler1).toHaveBeenCalledWith(mockEvent);
      expect(handler2).toHaveBeenCalledWith(mockEvent);
    });

    it('should unsubscribe correctly', () => {
      const handler = jest.fn();
      
      const unsubscribe = conflictEventBus.subscribe(
        ConflictEventType.CONFLICT_RESOLVED,
        handler
      );
      
      const mockEvent: ConflictResolvedEvent = {
        type: ConflictEventType.CONFLICT_RESOLVED,
        timestamp: new Date(),
        source: 'test',
        conflictId: 'conflict-1',
        userId: 'user-1',
        resolvedBy: 'admin-1',
        resolution: 'APPROVED'
      };
      
      // Should receive event before unsubscribing
      conflictEventBus.emit(mockEvent);
      expect(handler).toHaveBeenCalledTimes(1);
      
      // Unsubscribe
      unsubscribe();
      
      // Should not receive event after unsubscribing
      conflictEventBus.emit(mockEvent);
      expect(handler).toHaveBeenCalledTimes(1); // Still 1, not 2
    });
  });

  describe('Different Event Types', () => {
    it('should handle CONFLICT_DETECTED events', () => {
      const handler = jest.fn();
      conflictEventBus.subscribe(ConflictEventType.CONFLICT_DETECTED, handler);
      
      const event: ConflictDetectedEvent = {
        type: ConflictEventType.CONFLICT_DETECTED,
        timestamp: new Date(),
        source: 'leave-validator',
        conflict: {
          id: 'conflict-detected-1',
          type: ConflictType.OVERLAP,
          severity: ConflictSeverity.HIGH,
          message: 'Leave overlap detected',
          affectedRequests: ['req-1', 'req-2'],
          detectedAt: new Date()
        },
        userId: 'user-123',
        conflictType: ConflictType.OVERLAP,
        severity: ConflictSeverity.HIGH,
        metadata: { source: 'unit-test' }
      };
      
      conflictEventBus.emit(event);
      
      expect(handler).toHaveBeenCalledWith(event);
    });

    it('should handle CONFLICT_RESOLVED events', () => {
      const handler = jest.fn();
      conflictEventBus.subscribe(ConflictEventType.CONFLICT_RESOLVED, handler);
      
      const event: ConflictResolvedEvent = {
        type: ConflictEventType.CONFLICT_RESOLVED,
        timestamp: new Date(),
        source: 'admin-panel',
        conflictId: 'conflict-resolved-1',
        userId: 'user-456',
        resolvedBy: 'admin-789',
        resolution: 'APPROVED',
        comment: 'Approved after review',
        metadata: { reviewTime: 30 }
      };
      
      conflictEventBus.emit(event);
      
      expect(handler).toHaveBeenCalledWith(event);
    });

    it('should handle CONFLICT_CHECK_REQUESTED events', () => {
      const handler = jest.fn();
      conflictEventBus.subscribe(ConflictEventType.CONFLICT_CHECK_REQUESTED, handler);
      
      const event: ConflictCheckRequestedEvent = {
        type: ConflictEventType.CONFLICT_CHECK_REQUESTED,
        timestamp: new Date(),
        source: 'api-endpoint',
        userId: 'user-check-1',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-15'),
        requestedBy: 'system',
        context: { triggerType: 'manual' }
      };
      
      conflictEventBus.emit(event);
      
      expect(handler).toHaveBeenCalledWith(event);
    });

    it('should handle CONFLICT_CHECK_COMPLETED events', () => {
      const handler = jest.fn();
      conflictEventBus.subscribe(ConflictEventType.CONFLICT_CHECK_COMPLETED, handler);
      
      const event: ConflictCheckCompletedEvent = {
        type: ConflictEventType.CONFLICT_CHECK_COMPLETED,
        timestamp: new Date(),
        source: 'conflict-service',
        userId: 'user-check-2',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-02-28'),
        hasConflicts: true,
        conflictCount: 3,
        hasBlockers: false,
        executionTimeMs: 150,
        sources: ['leave-service', 'planning-service']
      };
      
      conflictEventBus.emit(event);
      
      expect(handler).toHaveBeenCalledWith(event);
    });
  });

  describe('Subscribe to All Events', () => {
    it('should receive all event types when subscribed to all', () => {
      const handler = jest.fn();
      
      const unsubscribe = conflictEventBus.subscribeToAll(handler);
      
      // Emit different types of events
      const detectedEvent: ConflictDetectedEvent = {
        type: ConflictEventType.CONFLICT_DETECTED,
        timestamp: new Date(),
        source: 'test',
        conflict: {
          id: 'conflict-all-1',
          type: ConflictType.OVERLAP,
          severity: ConflictSeverity.LOW,
          message: 'Test conflict',
          affectedRequests: [],
          detectedAt: new Date()
        },
        userId: 'user-all-1',
        conflictType: ConflictType.OVERLAP,
        severity: ConflictSeverity.LOW
      };
      
      const resolvedEvent: ConflictResolvedEvent = {
        type: ConflictEventType.CONFLICT_RESOLVED,
        timestamp: new Date(),
        source: 'test',
        conflictId: 'conflict-all-1',
        userId: 'user-all-1',
        resolvedBy: 'admin-all',
        resolution: 'REJECTED'
      };
      
      conflictEventBus.emit(detectedEvent);
      conflictEventBus.emit(resolvedEvent);
      
      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenNthCalledWith(1, detectedEvent);
      expect(handler).toHaveBeenNthCalledWith(2, resolvedEvent);
      
      // Test unsubscribe
      unsubscribe();
      
      conflictEventBus.emit(detectedEvent);
      expect(handler).toHaveBeenCalledTimes(2); // Should still be 2
    });
  });

  describe('Event History', () => {
    it('should maintain event history', () => {
      const event1: ConflictDetectedEvent = {
        type: ConflictEventType.CONFLICT_DETECTED,
        timestamp: new Date(),
        source: 'history-test-1',
        conflict: {
          id: 'history-conflict-1',
          type: ConflictType.OVERLAP,
          severity: ConflictSeverity.MEDIUM,
          message: 'History test conflict',
          affectedRequests: [],
          detectedAt: new Date()
        },
        userId: 'history-user-1',
        conflictType: ConflictType.OVERLAP,
        severity: ConflictSeverity.MEDIUM
      };
      
      const event2: ConflictResolvedEvent = {
        type: ConflictEventType.CONFLICT_RESOLVED,
        timestamp: new Date(),
        source: 'history-test-2',
        conflictId: 'history-conflict-1',
        userId: 'history-user-1',
        resolvedBy: 'history-admin',
        resolution: 'MODIFIED'
      };
      
      conflictEventBus.emit(event1);
      conflictEventBus.emit(event2);
      
      const history = conflictEventBus.getHistory();
      
      expect(history).toHaveLength(2);
      expect(history[0]).toEqual(event1);
      expect(history[1]).toEqual(event2);
    });

    it('should filter history by event type', () => {
      const detectedEvent: ConflictDetectedEvent = {
        type: ConflictEventType.CONFLICT_DETECTED,
        timestamp: new Date(),
        source: 'filter-test',
        conflict: {
          id: 'filter-conflict-1',
          type: ConflictType.OVERLAP,
          severity: ConflictSeverity.HIGH,
          message: 'Filter test conflict',
          affectedRequests: [],
          detectedAt: new Date()
        },
        userId: 'filter-user-1',
        conflictType: ConflictType.OVERLAP,
        severity: ConflictSeverity.HIGH
      };
      
      const resolvedEvent: ConflictResolvedEvent = {
        type: ConflictEventType.CONFLICT_RESOLVED,
        timestamp: new Date(),
        source: 'filter-test',
        conflictId: 'filter-conflict-1',
        userId: 'filter-user-1',
        resolvedBy: 'filter-admin',
        resolution: 'APPROVED'
      };
      
      conflictEventBus.emit(detectedEvent);
      conflictEventBus.emit(resolvedEvent);
      
      const detectedHistory = conflictEventBus.getHistory(ConflictEventType.CONFLICT_DETECTED);
      const resolvedHistory = conflictEventBus.getHistory(ConflictEventType.CONFLICT_RESOLVED);
      
      expect(detectedHistory).toHaveLength(1);
      expect(resolvedHistory).toHaveLength(1);
      expect(detectedHistory[0].type).toBe(ConflictEventType.CONFLICT_DETECTED);
      expect(resolvedHistory[0].type).toBe(ConflictEventType.CONFLICT_RESOLVED);
    });

    it('should limit history results', () => {
      // Emit multiple events
      for (let i = 0; i < 5; i++) {
        const event: ConflictDetectedEvent = {
          type: ConflictEventType.CONFLICT_DETECTED,
          timestamp: new Date(),
          source: `limit-test-${i}`,
          conflict: {
            id: `limit-conflict-${i}`,
            type: ConflictType.OVERLAP,
            severity: ConflictSeverity.LOW,
            message: `Limit test conflict ${i}`,
            affectedRequests: [],
            detectedAt: new Date()
          },
          userId: `limit-user-${i}`,
          conflictType: ConflictType.OVERLAP,
          severity: ConflictSeverity.LOW
        };
        
        conflictEventBus.emit(event);
      }
      
      const limitedHistory = conflictEventBus.getHistory(undefined, 3);
      
      expect(limitedHistory).toHaveLength(3);
      // Should get the last 3 events
      expect(limitedHistory[0].source).toBe('limit-test-2');
      expect(limitedHistory[1].source).toBe('limit-test-3');
      expect(limitedHistory[2].source).toBe('limit-test-4');
    });

    it('should clear history', () => {
      const event: ConflictDetectedEvent = {
        type: ConflictEventType.CONFLICT_DETECTED,
        timestamp: new Date(),
        source: 'clear-test',
        conflict: {
          id: 'clear-conflict-1',
          type: ConflictType.OVERLAP,
          severity: ConflictSeverity.MEDIUM,
          message: 'Clear test conflict',
          affectedRequests: [],
          detectedAt: new Date()
        },
        userId: 'clear-user-1',
        conflictType: ConflictType.OVERLAP,
        severity: ConflictSeverity.MEDIUM
      };
      
      conflictEventBus.emit(event);
      
      expect(conflictEventBus.getHistory()).toHaveLength(1);
      
      conflictEventBus.clearHistory();
      
      expect(conflictEventBus.getHistory()).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in event handlers gracefully', () => {
      const errorHandler = jest.fn(() => {
        throw new Error('Handler error');
      });
      const normalHandler = jest.fn();
      
      // Mock console.error to avoid output during tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      conflictEventBus.subscribe(ConflictEventType.CONFLICT_DETECTED, errorHandler);
      conflictEventBus.subscribe(ConflictEventType.CONFLICT_DETECTED, normalHandler);
      
      const event: ConflictDetectedEvent = {
        type: ConflictEventType.CONFLICT_DETECTED,
        timestamp: new Date(),
        source: 'error-test',
        conflict: {
          id: 'error-conflict-1',
          type: ConflictType.OVERLAP,
          severity: ConflictSeverity.HIGH,
          message: 'Error test conflict',
          affectedRequests: [],
          detectedAt: new Date()
        },
        userId: 'error-user-1',
        conflictType: ConflictType.OVERLAP,
        severity: ConflictSeverity.HIGH
      };
      
      expect(() => {
        conflictEventBus.emit(event);
      }).not.toThrow();
      
      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(normalHandler).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Erreur dans le gestionnaire d\'événement pour conflict_detected'),
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle events without timestamp', () => {
      const handler = jest.fn();
      conflictEventBus.subscribe(ConflictEventType.CONFLICT_DETECTED, handler);
      
      const eventWithoutTimestamp = {
        type: ConflictEventType.CONFLICT_DETECTED,
        source: 'timestamp-test',
        conflict: {
          id: 'timestamp-conflict-1',
          type: ConflictType.OVERLAP,
          severity: ConflictSeverity.LOW,
          message: 'Timestamp test conflict',
          affectedRequests: [],
          detectedAt: new Date()
        },
        userId: 'timestamp-user-1',
        conflictType: ConflictType.OVERLAP,
        severity: ConflictSeverity.LOW
      } as ConflictDetectedEvent;
      
      conflictEventBus.emit(eventWithoutTimestamp);
      
      expect(handler).toHaveBeenCalledTimes(1);
      const receivedEvent = handler.mock.calls[0][0];
      expect(receivedEvent.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Performance', () => {
    it('should handle many subscribers efficiently', () => {
      const handlers: jest.Mock[] = [];
      
      // Create many handlers
      for (let i = 0; i < 100; i++) {
        const handler = jest.fn();
        handlers.push(handler);
        conflictEventBus.subscribe(ConflictEventType.CONFLICT_DETECTED, handler);
      }
      
      const event: ConflictDetectedEvent = {
        type: ConflictEventType.CONFLICT_DETECTED,
        timestamp: new Date(),
        source: 'performance-test',
        conflict: {
          id: 'performance-conflict-1',
          type: ConflictType.OVERLAP,
          severity: ConflictSeverity.MEDIUM,
          message: 'Performance test conflict',
          affectedRequests: [],
          detectedAt: new Date()
        },
        userId: 'performance-user-1',
        conflictType: ConflictType.OVERLAP,
        severity: ConflictSeverity.MEDIUM
      };
      
      const startTime = Date.now();
      conflictEventBus.emit(event);
      const endTime = Date.now();
      
      // All handlers should be called
      handlers.forEach(handler => {
        expect(handler).toHaveBeenCalledTimes(1);
      });
      
      // Should complete quickly
      expect(endTime - startTime).toBeLessThan(50);
    });

    it('should handle rapid successive events', () => {
      const handler = jest.fn();
      conflictEventBus.subscribe(ConflictEventType.CONFLICT_DETECTED, handler);
      
      const startTime = Date.now();
      
      // Emit many events rapidly
      for (let i = 0; i < 1000; i++) {
        const event: ConflictDetectedEvent = {
          type: ConflictEventType.CONFLICT_DETECTED,
          timestamp: new Date(),
          source: `rapid-test-${i}`,
          conflict: {
            id: `rapid-conflict-${i}`,
            type: ConflictType.OVERLAP,
            severity: ConflictSeverity.LOW,
            message: `Rapid test conflict ${i}`,
            affectedRequests: [],
            detectedAt: new Date()
          },
          userId: `rapid-user-${i}`,
          conflictType: ConflictType.OVERLAP,
          severity: ConflictSeverity.LOW
        };
        
        conflictEventBus.emit(event);
      }
      
      const endTime = Date.now();
      
      expect(handler).toHaveBeenCalledTimes(1000);
      expect(endTime - startTime).toBeLessThan(500);
    });
  });
});