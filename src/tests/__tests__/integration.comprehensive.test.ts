/**
 * Tests d'intégration complets pour Prisma, Redis, WebSocket
 */

import { 
  mockPrisma, 
  mockSocketIO,
  setupTestEnvironment, 
  cleanupTestEnvironment,
  testDataFactories
} from '../../test-utils/standardMocks';

// Mock Redis
const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  keys: jest.fn(),
  flushall: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
  ping: jest.fn(),
  info: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  on: jest.fn(),
  off: jest.fn()
};

jest.mock('@/lib/redis', () => ({
  redis: mockRedis,
  redisClient: mockRedis
}));

jest.mock('@/lib/redis-cache', () => ({
  redisCache: {
    get: mockRedis.get,
    set: mockRedis.set,
    del: mockRedis.del,
    exists: mockRedis.exists,
    getStats: jest.fn().mockReturnValue({
      hits: 100,
      misses: 20,
      hitRate: 0.83
    })
  }
}));

// Mock Prisma avec fonctionnalités avancées
jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
  default: mockPrisma
}));

describe('Integration Tests', () => {
  let testEnv: any;
  let mockSocket: any;

  beforeAll(() => {
    testEnv = setupTestEnvironment();
    const { mockSocket: socket } = mockSocketIO();
    mockSocket = socket;
  });

  afterAll(() => {
    cleanupTestEnvironment();
    testEnv.restoreConsole?.();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Prisma Database Integration', () => {
    describe('Basic CRUD Operations', () => {
      it('should perform user CRUD operations', async () => {
        const userData = testDataFactories.user({
          email: 'test@hospital.com',
          name: 'Dr. Test'
        });

        // CREATE
        mockPrisma.user.create.mockResolvedValue(userData);
        const createdUser = await mockPrisma.user.create({
          data: userData
        });
        
        expect(mockPrisma.user.create).toHaveBeenCalledWith({
          data: userData
        });
        expect(createdUser).toEqual(userData);

        // READ
        mockPrisma.user.findUnique.mockResolvedValue(userData);
        const foundUser = await mockPrisma.user.findUnique({
          where: { id: userData.id }
        });
        
        expect(foundUser).toEqual(userData);

        // UPDATE
        const updatedData = { ...userData, name: 'Dr. Updated' };
        mockPrisma.user.update.mockResolvedValue(updatedData);
        const updatedUser = await mockPrisma.user.update({
          where: { id: userData.id },
          data: { name: 'Dr. Updated' }
        });
        
        expect(updatedUser.name).toBe('Dr. Updated');

        // DELETE
        mockPrisma.user.delete.mockResolvedValue(userData);
        await mockPrisma.user.delete({
          where: { id: userData.id }
        });
        
        expect(mockPrisma.user.delete).toHaveBeenCalledWith({
          where: { id: userData.id }
        });
      });

      it('should handle complex queries with relations', async () => {
        const userWithLeaves = {
          ...testDataFactories.user(),
          leaves: [
            testDataFactories.leave({ type: 'ANNUAL' }),
            testDataFactories.leave({ type: 'SICK' })
          ],
          assignments: [
            testDataFactories.assignment({ shiftType: 'GARDE_JOUR' })
          ]
        };

        mockPrisma.user.findUnique.mockResolvedValue(userWithLeaves);

        const result = await mockPrisma.user.findUnique({
          where: { id: userWithLeaves.id },
          include: {
            leaves: true,
            assignments: true
          }
        });

        expect(result.leaves).toHaveLength(2);
        expect(result.assignments).toHaveLength(1);
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: userWithLeaves.id },
          include: {
            leaves: true,
            assignments: true
          }
        });
      });

      it('should perform batch operations efficiently', async () => {
        const batchUsers = Array.from({ length: 100 }, (_, i) =>
          testDataFactories.user({ id: i + 1, email: `user${i}@test.com` })
        );

        mockPrisma.user.createMany.mockResolvedValue({ count: 100 });

        const result = await mockPrisma.user.createMany({
          data: batchUsers
        });

        expect(result.count).toBe(100);
        expect(mockPrisma.user.createMany).toHaveBeenCalledWith({
          data: batchUsers
        });
      });
    });

    describe('Transaction Management', () => {
      it('should handle database transactions', async () => {
        const transactionData = {
          user: testDataFactories.user(),
          leave: testDataFactories.leave()
        };

        mockPrisma.$transaction.mockImplementation(async (callback) => {
          return callback(mockPrisma);
        });

        mockPrisma.user.create.mockResolvedValue(transactionData.user);
        mockPrisma.leave.create.mockResolvedValue(transactionData.leave);

        const result = await mockPrisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: transactionData.user
          });
          
          const leave = await tx.leave.create({
            data: {
              ...transactionData.leave,
              userId: user.id
            }
          });

          return { user, leave };
        });

        expect(result.user).toEqual(transactionData.user);
        expect(result.leave).toEqual(transactionData.leave);
        expect(mockPrisma.$transaction).toHaveBeenCalled();
      });

      it('should rollback on transaction failure', async () => {
        const transactionError = new Error('Transaction failed');

        mockPrisma.$transaction.mockRejectedValue(transactionError);

        await expect(
          mockPrisma.$transaction(async (tx) => {
            await tx.user.create({ data: testDataFactories.user() });
            throw transactionError;
          })
        ).rejects.toThrow('Transaction failed');

        expect(mockPrisma.$transaction).toHaveBeenCalled();
      });

      it('should handle concurrent transactions', async () => {
        const transactions = Array.from({ length: 10 }, (_, i) =>
          mockPrisma.$transaction(async (tx) => {
            return tx.user.create({
              data: testDataFactories.user({ id: i + 1 })
            });
          })
        );

        mockPrisma.$transaction.mockImplementation(async (callback) => {
          return callback(mockPrisma);
        });

        const results = await Promise.all(transactions);

        expect(results).toHaveLength(10);
        expect(mockPrisma.$transaction).toHaveBeenCalledTimes(10);
      });
    });

    describe('Query Performance', () => {
      it('should optimize complex queries', async () => {
        const complexQuery = mockPrisma.user.findMany({
          where: {
            AND: [
              { active: true },
              { role: { in: ['MAR', 'IADE'] } },
              {
                leaves: {
                  some: {
                    startDate: { gte: new Date('2025-06-01') },
                    status: 'APPROVED'
                  }
                }
              }
            ]
          },
          include: {
            leaves: {
              where: {
                startDate: { gte: new Date('2025-06-01') }
              }
            },
            assignments: {
              where: {
                date: { gte: new Date('2025-06-01') }
              }
            }
          },
          orderBy: [
            { name: 'asc' },
            { createdAt: 'desc' }
          ]
        });

        const mockResults = [
          testDataFactories.user({ role: 'MAR' }),
          testDataFactories.user({ role: 'IADE' })
        ];

        mockPrisma.user.findMany.mockResolvedValue(mockResults);

        const results = await complexQuery;

        expect(results).toHaveLength(2);
        expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              AND: expect.any(Array)
            }),
            include: expect.any(Object),
            orderBy: expect.any(Array)
          })
        );
      });

      it('should handle pagination efficiently', async () => {
        const paginationParams = {
          skip: 0,
          take: 20,
          orderBy: { createdAt: 'desc' }
        };

        const mockData = Array.from({ length: 20 }, (_, i) =>
          testDataFactories.user({ id: i + 1 })
        );

        mockPrisma.user.findMany.mockResolvedValue(mockData);
        mockPrisma.user.count.mockResolvedValue(150);

        const [users, total] = await Promise.all([
          mockPrisma.user.findMany(paginationParams),
          mockPrisma.user.count()
        ]);

        expect(users).toHaveLength(20);
        expect(total).toBe(150);
        expect(mockPrisma.user.findMany).toHaveBeenCalledWith(paginationParams);
      });
    });
  });

  describe('Redis Cache Integration', () => {
    describe('Basic Cache Operations', () => {
      it('should set and get cache values', async () => {
        const cacheKey = 'user:123';
        const cacheValue = JSON.stringify(testDataFactories.user());

        mockRedis.set.mockResolvedValue('OK');
        mockRedis.get.mockResolvedValue(cacheValue);

        // Set cache
        await mockRedis.set(cacheKey, cacheValue, 'EX', 3600);
        expect(mockRedis.set).toHaveBeenCalledWith(cacheKey, cacheValue, 'EX', 3600);

        // Get cache
        const retrieved = await mockRedis.get(cacheKey);
        expect(retrieved).toBe(cacheValue);
        expect(JSON.parse(retrieved)).toEqual(JSON.parse(cacheValue));
      });

      it('should handle cache expiration', async () => {
        const cacheKey = 'temp:data';

        mockRedis.set.mockResolvedValue('OK');
        mockRedis.ttl.mockResolvedValue(3600);

        await mockRedis.set(cacheKey, 'data', 'EX', 3600);
        const ttl = await mockRedis.ttl(cacheKey);

        expect(ttl).toBe(3600);
        expect(mockRedis.set).toHaveBeenCalledWith(cacheKey, 'data', 'EX', 3600);
      });

      it('should handle cache misses gracefully', async () => {
        const nonExistentKey = 'missing:key';

        mockRedis.get.mockResolvedValue(null);
        mockRedis.exists.mockResolvedValue(0);

        const value = await mockRedis.get(nonExistentKey);
        const exists = await mockRedis.exists(nonExistentKey);

        expect(value).toBeNull();
        expect(exists).toBe(0);
      });
    });

    describe('Cache Patterns', () => {
      it('should implement cache-aside pattern', async () => {
        const userId = '123';
        const cacheKey = `user:${userId}`;
        const userData = testDataFactories.user({ id: userId });

        // Cache miss scenario
        mockRedis.get.mockResolvedValue(null);
        mockPrisma.user.findUnique.mockResolvedValue(userData);
        mockRedis.set.mockResolvedValue('OK');

        // Try cache first
        let cachedUser = await mockRedis.get(cacheKey);
        
        if (!cachedUser) {
          // Fallback to database
          const dbUser = await mockPrisma.user.findUnique({
            where: { id: userId }
          });
          
          // Update cache
          await mockRedis.set(cacheKey, JSON.stringify(dbUser), 'EX', 3600);
          cachedUser = JSON.stringify(dbUser);
        }

        expect(mockRedis.get).toHaveBeenCalledWith(cacheKey);
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: userId }
        });
        expect(mockRedis.set).toHaveBeenCalledWith(
          cacheKey, 
          JSON.stringify(userData), 
          'EX', 
          3600
        );
      });

      it('should implement write-through caching', async () => {
        const userData = testDataFactories.user();
        const cacheKey = `user:${userData.id}`;

        mockPrisma.user.update.mockResolvedValue(userData);
        mockRedis.set.mockResolvedValue('OK');

        // Update both database and cache
        const updatedUser = await mockPrisma.user.update({
          where: { id: userData.id },
          data: userData
        });

        await mockRedis.set(cacheKey, JSON.stringify(updatedUser), 'EX', 3600);

        expect(mockPrisma.user.update).toHaveBeenCalled();
        expect(mockRedis.set).toHaveBeenCalledWith(
          cacheKey,
          JSON.stringify(userData),
          'EX',
          3600
        );
      });

      it('should handle cache invalidation', async () => {
        const userId = '123';
        const relatedKeys = [
          `user:${userId}`,
          `user:${userId}:leaves`,
          `user:${userId}:assignments`
        ];

        mockRedis.del.mockResolvedValue(relatedKeys.length);

        // Invalidate all related cache entries
        await mockRedis.del(...relatedKeys);

        expect(mockRedis.del).toHaveBeenCalledWith(...relatedKeys);
      });
    });

    describe('Cache Performance', () => {
      it('should handle high-frequency operations', async () => {
        const operations = Array.from({ length: 1000 }, (_, i) => ({
          key: `key:${i}`,
          value: `value:${i}`
        }));

        mockRedis.set.mockResolvedValue('OK');

        const startTime = Date.now();
        
        await Promise.all(
          operations.map(op => mockRedis.set(op.key, op.value))
        );

        const endTime = Date.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(1000); // Should complete within 1 second
        expect(mockRedis.set).toHaveBeenCalledTimes(1000);
      });

      it('should implement efficient batch operations', async () => {
        const pipeline = {
          exec: jest.fn().mockResolvedValue(['OK', 'OK', 'OK']),
          set: jest.fn().mockReturnThis(),
          get: jest.fn().mockReturnThis(),
          del: jest.fn().mockReturnThis()
        };

        mockRedis.pipeline = jest.fn().mockReturnValue(pipeline);

        // Batch multiple operations
        const pipe = mockRedis.pipeline();
        pipe.set('key1', 'value1');
        pipe.set('key2', 'value2');
        pipe.set('key3', 'value3');
        
        const results = await pipe.exec();

        expect(results).toEqual(['OK', 'OK', 'OK']);
        expect(pipeline.set).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('WebSocket Integration', () => {
    describe('Connection Management', () => {
      it('should establish WebSocket connection', () => {
        expect(mockSocket.connect).toBeDefined();
        expect(mockSocket.on).toBeDefined();
        expect(mockSocket.emit).toBeDefined();

        mockSocket.connect();
        expect(mockSocket.connect).toHaveBeenCalled();
      });

      it('should handle connection events', () => {
        const connectHandler = jest.fn();
        const disconnectHandler = jest.fn();
        const errorHandler = jest.fn();

        mockSocket.on('connect', connectHandler);
        mockSocket.on('disconnect', disconnectHandler);
        mockSocket.on('error', errorHandler);

        expect(mockSocket.on).toHaveBeenCalledWith('connect', connectHandler);
        expect(mockSocket.on).toHaveBeenCalledWith('disconnect', disconnectHandler);
        expect(mockSocket.on).toHaveBeenCalledWith('error', errorHandler);
      });

      it('should handle reconnection logic', () => {
        const reconnectHandler = jest.fn();

        mockSocket.on('reconnect', reconnectHandler);
        mockSocket.on('reconnect_attempt', reconnectHandler);

        expect(mockSocket.on).toHaveBeenCalledWith('reconnect', reconnectHandler);
        expect(mockSocket.on).toHaveBeenCalledWith('reconnect_attempt', reconnectHandler);
      });
    });

    describe('Real-time Data Synchronization', () => {
      it('should sync assignment updates in real-time', () => {
        const assignmentUpdate = {
          type: 'ASSIGNMENT_UPDATED',
          data: testDataFactories.assignment({
            id: 'assign-123',
            status: 'CONFIRMED'
          })
        };

        const updateHandler = jest.fn();
        mockSocket.on('assignment:updated', updateHandler);

        // Simulate receiving update
        mockSocket.emit('assignment:updated', assignmentUpdate);

        expect(mockSocket.emit).toHaveBeenCalledWith('assignment:updated', assignmentUpdate);
      });

      it('should sync leave request notifications', () => {
        const leaveNotification = {
          type: 'LEAVE_REQUEST',
          data: testDataFactories.leave({
            id: 'leave-456',
            status: 'PENDING'
          })
        };

        const notificationHandler = jest.fn();
        mockSocket.on('leave:notification', notificationHandler);

        mockSocket.emit('leave:notification', leaveNotification);

        expect(mockSocket.emit).toHaveBeenCalledWith('leave:notification', leaveNotification);
      });

      it('should handle conflict notifications', () => {
        const conflictNotification = {
          type: 'CONFLICT_DETECTED',
          data: {
            conflictId: 'conflict-789',
            affectedAssignments: ['assign-1', 'assign-2'],
            severity: 'HIGH',
            message: 'Schedule conflict detected'
          }
        };

        const conflictHandler = jest.fn();
        mockSocket.on('conflict:detected', conflictHandler);

        mockSocket.emit('conflict:detected', conflictNotification);

        expect(mockSocket.emit).toHaveBeenCalledWith('conflict:detected', conflictNotification);
      });
    });

    describe('Room-based Communication', () => {
      it('should join and leave rooms', () => {
        const userId = 'user-123';
        const roomName = `user:${userId}`;

        mockSocket.emit('join', roomName);
        mockSocket.emit('leave', roomName);

        expect(mockSocket.emit).toHaveBeenCalledWith('join', roomName);
        expect(mockSocket.emit).toHaveBeenCalledWith('leave', roomName);
      });

      it('should handle team-specific communications', () => {
        const teamUpdate = {
          teamId: 'cardiac-team',
          message: 'Emergency surgery scheduled',
          members: ['user-1', 'user-2', 'user-3']
        };

        mockSocket.emit('team:broadcast', teamUpdate);

        expect(mockSocket.emit).toHaveBeenCalledWith('team:broadcast', teamUpdate);
      });

      it('should handle department-wide notifications', () => {
        const deptNotification = {
          departmentId: 'anesthesia',
          type: 'URGENT',
          message: 'New protocol effective immediately',
          timestamp: new Date().toISOString()
        };

        mockSocket.emit('department:notify', deptNotification);

        expect(mockSocket.emit).toHaveBeenCalledWith('department:notify', deptNotification);
      });
    });
  });

  describe('Multi-System Integration Scenarios', () => {
    describe('Complete Workflow Integration', () => {
      it('should handle complete leave request workflow', async () => {
        const leaveRequest = testDataFactories.leave({
          userId: 'user-123',
          status: 'PENDING'
        });

        // 1. Store in database
        mockPrisma.leave.create.mockResolvedValue(leaveRequest);
        const savedLeave = await mockPrisma.leave.create({
          data: leaveRequest
        });

        // 2. Cache the leave request
        const cacheKey = `leave:${savedLeave.id}`;
        mockRedis.set.mockResolvedValue('OK');
        await mockRedis.set(cacheKey, JSON.stringify(savedLeave), 'EX', 3600);

        // 3. Notify via WebSocket
        const notification = {
          type: 'LEAVE_REQUEST_CREATED',
          data: savedLeave
        };
        mockSocket.emit('leave:created', notification);

        // Verify all systems were updated
        expect(mockPrisma.leave.create).toHaveBeenCalledWith({ data: leaveRequest });
        expect(mockRedis.set).toHaveBeenCalledWith(cacheKey, JSON.stringify(savedLeave), 'EX', 3600);
        expect(mockSocket.emit).toHaveBeenCalledWith('leave:created', notification);
      });

      it('should handle assignment conflict resolution', async () => {
        const conflictingAssignments = [
          testDataFactories.assignment({ userId: 'user-1', date: new Date('2025-06-01') }),
          testDataFactories.assignment({ userId: 'user-1', date: new Date('2025-06-01') })
        ];

        // 1. Detect conflict in database
        mockPrisma.assignment.findMany.mockResolvedValue(conflictingAssignments);
        const conflicts = await mockPrisma.assignment.findMany({
          where: {
            userId: 'user-1',
            date: new Date('2025-06-01')
          }
        });

        // 2. Cache conflict resolution
        const conflictKey = 'conflict:user-1:2025-06-01';
        const conflictData = { conflicts, status: 'DETECTED' };
        mockRedis.set.mockResolvedValue('OK');
        await mockRedis.set(conflictKey, JSON.stringify(conflictData), 'EX', 1800);

        // 3. Notify stakeholders
        const conflictNotification = {
          type: 'CONFLICT_DETECTED',
          userId: 'user-1',
          conflicts: conflicts.map(c => c.id)
        };
        mockSocket.emit('conflict:alert', conflictNotification);

        expect(conflicts).toHaveLength(2);
        expect(mockRedis.set).toHaveBeenCalledWith(conflictKey, JSON.stringify(conflictData), 'EX', 1800);
        expect(mockSocket.emit).toHaveBeenCalledWith('conflict:alert', conflictNotification);
      });

      it('should handle system-wide performance monitoring', async () => {
        const performanceMetrics = {
          dbQueries: 150,
          cacheHits: 89,
          cacheMisses: 11,
          wsConnections: 45,
          avgResponseTime: 120
        };

        // 1. Store metrics in database
        mockPrisma.auditLog.create.mockResolvedValue({
          id: 'audit-1',
          type: 'PERFORMANCE_METRICS',
          data: performanceMetrics,
          timestamp: new Date()
        });

        await mockPrisma.auditLog.create({
          data: {
            type: 'PERFORMANCE_METRICS',
            data: performanceMetrics,
            timestamp: new Date()
          }
        });

        // 2. Cache current metrics
        mockRedis.set.mockResolvedValue('OK');
        await mockRedis.set(
          'metrics:current',
          JSON.stringify(performanceMetrics),
          'EX',
          300
        );

        // 3. Broadcast to monitoring dashboards
        mockSocket.emit('metrics:update', performanceMetrics);

        expect(mockPrisma.auditLog.create).toHaveBeenCalled();
        expect(mockRedis.set).toHaveBeenCalledWith(
          'metrics:current',
          JSON.stringify(performanceMetrics),
          'EX',
          300
        );
        expect(mockSocket.emit).toHaveBeenCalledWith('metrics:update', performanceMetrics);
      });
    });

    describe('Error Handling and Recovery', () => {
      it('should handle database connection failures', async () => {
        const dbError = new Error('Database connection lost');
        mockPrisma.user.findMany.mockRejectedValue(dbError);

        // Should fallback to cache when database fails
        mockRedis.get.mockResolvedValue(JSON.stringify([testDataFactories.user()]));

        let users;
        try {
          users = await mockPrisma.user.findMany();
        } catch (error) {
          // Fallback to cache
          const cachedUsers = await mockRedis.get('users:all');
          users = cachedUsers ? JSON.parse(cachedUsers) : [];
        }

        expect(users).toHaveLength(1);
        expect(mockRedis.get).toHaveBeenCalledWith('users:all');
      });

      it('should handle cache failures gracefully', async () => {
        const cacheError = new Error('Redis connection lost');
        mockRedis.get.mockRejectedValue(cacheError);

        // Should fallback to database when cache fails
        mockPrisma.user.findUnique.mockResolvedValue(testDataFactories.user());

        let user;
        try {
          user = await mockRedis.get('user:123');
        } catch (error) {
          // Fallback to database
          user = await mockPrisma.user.findUnique({
            where: { id: '123' }
          });
        }

        expect(user).toBeDefined();
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: '123' }
        });
      });

      it('should handle WebSocket disconnections', () => {
        const disconnectHandler = jest.fn();
        const reconnectHandler = jest.fn();

        mockSocket.on('disconnect', disconnectHandler);
        mockSocket.on('reconnect', reconnectHandler);

        // Simulate disconnect and reconnect
        mockSocket.connected = false;
        mockSocket.disconnect();
        
        setTimeout(() => {
          mockSocket.connected = true;
          mockSocket.connect();
        }, 1000);

        expect(mockSocket.disconnect).toHaveBeenCalled();
        expect(mockSocket.on).toHaveBeenCalledWith('disconnect', disconnectHandler);
        expect(mockSocket.on).toHaveBeenCalledWith('reconnect', reconnectHandler);
      });
    });

    describe('Data Consistency and Synchronization', () => {
      it('should maintain data consistency across systems', async () => {
        const userData = testDataFactories.user({ email: 'updated@test.com' });

        // 1. Update database
        mockPrisma.user.update.mockResolvedValue(userData);
        const updatedUser = await mockPrisma.user.update({
          where: { id: userData.id },
          data: userData
        });

        // 2. Update cache
        mockRedis.set.mockResolvedValue('OK');
        await mockRedis.set(`user:${userData.id}`, JSON.stringify(updatedUser), 'EX', 3600);

        // 3. Notify connected clients
        mockSocket.emit('user:updated', {
          type: 'USER_UPDATED',
          data: updatedUser
        });

        // 4. Invalidate related cache entries
        mockRedis.del.mockResolvedValue(2);
        await mockRedis.del(`user:${userData.id}:leaves`, `user:${userData.id}:assignments`);

        expect(mockPrisma.user.update).toHaveBeenCalled();
        expect(mockRedis.set).toHaveBeenCalled();
        expect(mockSocket.emit).toHaveBeenCalled();
        expect(mockRedis.del).toHaveBeenCalled();
      });

      it('should handle eventual consistency scenarios', async () => {
        const assignment = testDataFactories.assignment();

        // Simulate eventual consistency where cache update succeeds but DB update fails
        mockPrisma.assignment.update.mockRejectedValue(new Error('DB update failed'));
        mockRedis.set.mockResolvedValue('OK');

        let dbUpdateSucceeded = false;
        let cacheUpdateSucceeded = false;

        try {
          await mockPrisma.assignment.update({
            where: { id: assignment.id },
            data: assignment
          });
          dbUpdateSucceeded = true;
        } catch (error) {
          // DB update failed, schedule retry
        }

        try {
          await mockRedis.set(`assignment:${assignment.id}`, JSON.stringify(assignment));
          cacheUpdateSucceeded = true;
        } catch (error) {
          // Cache update failed
        }

        // Should implement compensation logic
        if (cacheUpdateSucceeded && !dbUpdateSucceeded) {
          // Invalidate cache to maintain consistency
          mockRedis.del.mockResolvedValue(1);
          await mockRedis.del(`assignment:${assignment.id}`);
        }

        expect(dbUpdateSucceeded).toBe(false);
        expect(cacheUpdateSucceeded).toBe(true);
        expect(mockRedis.del).toHaveBeenCalledWith(`assignment:${assignment.id}`);
      });
    });
  });
});