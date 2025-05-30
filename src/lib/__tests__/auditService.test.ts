import { auditService, AuditService, AuditLogParams, AuditAction } from '../auditService';
import { prisma } from '../prisma';

// Mock Prisma
jest.mock('../prisma', () => ({
    prisma: {
        auditLog: {
            create: jest.fn(),
            findMany: jest.fn()
        }
    }
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// Mock console methods
const consoleSpy = {
    log: jest.spyOn(console, 'log').mockImplementation(),
    error: jest.spyOn(console, 'error').mockImplementation()
};

describe('AuditService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Object.values(consoleSpy).forEach(spy => spy.mockClear());
    });

    describe('Singleton pattern', () => {
        it('should return the same instance when called multiple times', () => {
            const instance1 = AuditService.getInstance();
            const instance2 = AuditService.getInstance();
            
            expect(instance1).toBe(instance2);
            expect(instance1).toBeInstanceOf(AuditService);
        });

        it('should export the singleton instance as auditService', () => {
            const instance = AuditService.getInstance();
            expect(auditService).toBe(instance);
        });
    });

    describe('logAction', () => {
        const mockAuditParams: AuditLogParams = {
            action: 'TEST_ACTION',
            entityId: 'entity123',
            entityType: 'TestEntity',
            userId: 1,
            details: { key: 'value', number: 42 }
        };

        it('should create an audit log entry successfully', async () => {
            const mockCreatedLog = {
                id: 'audit-123',
                action: 'TEST_ACTION',
                entityId: 'entity123',
                entityType: 'TestEntity',
                userId: 1,
                details: '{"key":"value","number":42}',
                timestamp: new Date()
            };

            mockPrisma.auditLog.create.mockResolvedValue(mockCreatedLog);

            await auditService.logAction(mockAuditParams);

            expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
                data: {
                    action: 'TEST_ACTION',
                    entityId: 'entity123',
                    entityType: 'TestEntity',
                    userId: 1,
                    details: '{"key":"value","number":42}',
                    timestamp: expect.any(Date)
                }
            });

            expect(consoleSpy.log).toHaveBeenCalledWith(
                'Audit: TEST_ACTION sur TestEntity entity123',
                { key: 'value', number: 42 }
            );
        });

        it('should handle numeric entityId', async () => {
            const params: AuditLogParams = {
                action: 'TEST_ACTION',
                entityId: 123,
                entityType: 'TestEntity',
                userId: 1
            };

            await auditService.logAction(params);

            expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
                data: {
                    action: 'TEST_ACTION',
                    entityId: '123',
                    entityType: 'TestEntity',
                    userId: 1,
                    details: null,
                    timestamp: expect.any(Date)
                }
            });
        });

        it('should handle missing optional parameters', async () => {
            const params: AuditLogParams = {
                action: 'MINIMAL_ACTION',
                entityId: 'entity456',
                entityType: 'MinimalEntity'
            };

            await auditService.logAction(params);

            expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
                data: {
                    action: 'MINIMAL_ACTION',
                    entityId: 'entity456',
                    entityType: 'MinimalEntity',
                    userId: undefined,
                    details: null,
                    timestamp: expect.any(Date)
                }
            });

            expect(consoleSpy.log).toHaveBeenCalledWith(
                'Audit: MINIMAL_ACTION sur MinimalEntity entity456',
                undefined
            );
        });

        it('should handle null details', async () => {
            const params: AuditLogParams = {
                action: 'NULL_DETAILS_ACTION',
                entityId: 'entity789',
                entityType: 'TestEntity',
                details: null
            };

            await auditService.logAction(params);

            expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
                data: {
                    action: 'NULL_DETAILS_ACTION',
                    entityId: 'entity789',
                    entityType: 'TestEntity',
                    userId: undefined,
                    details: null,
                    timestamp: expect.any(Date)
                }
            });
        });

        it('should handle empty details object', async () => {
            const params: AuditLogParams = {
                action: 'EMPTY_DETAILS_ACTION',
                entityId: 'entity101',
                entityType: 'TestEntity',
                details: {}
            };

            await auditService.logAction(params);

            expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
                data: {
                    action: 'EMPTY_DETAILS_ACTION',
                    entityId: 'entity101',
                    entityType: 'TestEntity',
                    userId: undefined,
                    details: '{}',
                    timestamp: expect.any(Date)
                }
            });
        });

        it('should handle complex details object', async () => {
            const complexDetails = {
                user: { id: 1, name: 'John' },
                changes: ['field1', 'field2'],
                metadata: {
                    timestamp: '2024-01-01',
                    source: 'web'
                },
                numbers: [1, 2, 3],
                nested: {
                    deep: {
                        value: 'test'
                    }
                }
            };

            const params: AuditLogParams = {
                action: 'COMPLEX_ACTION',
                entityId: 'complex123',
                entityType: 'ComplexEntity',
                details: complexDetails
            };

            await auditService.logAction(params);

            expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
                data: {
                    action: 'COMPLEX_ACTION',
                    entityId: 'complex123',
                    entityType: 'ComplexEntity',
                    userId: undefined,
                    details: JSON.stringify(complexDetails),
                    timestamp: expect.any(Date)
                }
            });
        });

        it('should handle database errors gracefully', async () => {
            const error = new Error('Database connection failed');
            mockPrisma.auditLog.create.mockRejectedValue(error);

            // Should not throw an error
            await expect(auditService.logAction(mockAuditParams)).resolves.toBeUndefined();

            expect(consoleSpy.error).toHaveBeenCalledWith(
                'Erreur lors de l\'enregistrement de l\'audit:',
                error
            );
        });

        it('should use current timestamp for audit logs', async () => {
            const beforeTime = new Date();
            await auditService.logAction(mockAuditParams);
            const afterTime = new Date();

            const callArgs = mockPrisma.auditLog.create.mock.calls[0][0];
            const timestamp = callArgs.data.timestamp;

            expect(timestamp).toBeInstanceOf(Date);
            expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
            expect(timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
        });
    });

    describe('getLatestActions', () => {
        const mockAuditLogs = [
            {
                id: 'audit-1',
                action: 'USER_LOGIN',
                entityId: 'user123',
                entityType: 'User',
                userId: 1,
                details: null,
                timestamp: new Date('2024-01-02'),
                user: { id: 1, nom: 'Doe', prenom: 'John' }
            },
            {
                id: 'audit-2',
                action: 'LEAVE_REQUESTED',
                entityId: 'leave456',
                entityType: 'Leave',
                userId: 2,
                details: '{"days": 5}',
                timestamp: new Date('2024-01-01'),
                user: { id: 2, nom: 'Smith', prenom: 'Jane' }
            }
        ];

        it('should return latest audit actions with default limit', async () => {
            mockPrisma.auditLog.findMany.mockResolvedValue(mockAuditLogs);

            const result = await auditService.getLatestActions();

            expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
                orderBy: {
                    timestamp: 'desc'
                },
                take: 100,
                include: {
                    user: {
                        select: {
                            id: true,
                            nom: true,
                            prenom: true
                        }
                    }
                }
            });

            expect(result).toEqual(mockAuditLogs);
        });

        it('should accept custom limit', async () => {
            mockPrisma.auditLog.findMany.mockResolvedValue(mockAuditLogs.slice(0, 1));

            const result = await auditService.getLatestActions(1);

            expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    take: 1
                })
            );

            expect(result).toHaveLength(1);
        });

        it('should handle database errors gracefully', async () => {
            const error = new Error('Database query failed');
            mockPrisma.auditLog.findMany.mockRejectedValue(error);

            const result = await auditService.getLatestActions();

            expect(result).toEqual([]);
            expect(consoleSpy.error).toHaveBeenCalledWith(
                'Erreur lors de la récupération des audits:',
                error
            );
        });

        it('should return empty array when no logs exist', async () => {
            mockPrisma.auditLog.findMany.mockResolvedValue([]);

            const result = await auditService.getLatestActions();

            expect(result).toEqual([]);
        });
    });

    describe('getActionsForEntity', () => {
        const mockEntityLogs = [
            {
                id: 'audit-entity-1',
                action: 'USER_UPDATED',
                entityId: 'user123',
                entityType: 'User',
                userId: 1,
                details: '{"field": "email"}',
                timestamp: new Date('2024-01-02'),
                user: { id: 1, nom: 'Admin', prenom: 'Super' }
            },
            {
                id: 'audit-entity-2',
                action: 'USER_CREATED',
                entityId: 'user123',
                entityType: 'User',
                userId: 1,
                details: null,
                timestamp: new Date('2024-01-01'),
                user: { id: 1, nom: 'Admin', prenom: 'Super' }
            }
        ];

        it('should return actions for specific entity with string ID', async () => {
            mockPrisma.auditLog.findMany.mockResolvedValue(mockEntityLogs);

            const result = await auditService.getActionsForEntity('User', 'user123');

            expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
                where: {
                    entityType: 'User',
                    entityId: 'user123'
                },
                orderBy: {
                    timestamp: 'desc'
                },
                take: 50,
                include: {
                    user: {
                        select: {
                            id: true,
                            nom: true,
                            prenom: true
                        }
                    }
                }
            });

            expect(result).toEqual(mockEntityLogs);
        });

        it('should return actions for specific entity with numeric ID', async () => {
            mockPrisma.auditLog.findMany.mockResolvedValue(mockEntityLogs);

            await auditService.getActionsForEntity('User', 123);

            expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        entityType: 'User',
                        entityId: '123'
                    }
                })
            );
        });

        it('should accept custom limit', async () => {
            mockPrisma.auditLog.findMany.mockResolvedValue(mockEntityLogs.slice(0, 1));

            const result = await auditService.getActionsForEntity('User', 'user123', 1);

            expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    take: 1
                })
            );

            expect(result).toHaveLength(1);
        });

        it('should handle database errors gracefully', async () => {
            const error = new Error('Entity query failed');
            mockPrisma.auditLog.findMany.mockRejectedValue(error);

            const result = await auditService.getActionsForEntity('User', 'user123');

            expect(result).toEqual([]);
            expect(consoleSpy.error).toHaveBeenCalledWith(
                'Erreur lors de la récupération des audits d\'entité:',
                error
            );
        });

        it('should return empty array when no entity logs exist', async () => {
            mockPrisma.auditLog.findMany.mockResolvedValue([]);

            const result = await auditService.getActionsForEntity('NonExistent', 'id');

            expect(result).toEqual([]);
        });
    });

    describe('AuditAction enum', () => {
        it('should have all expected user actions', () => {
            expect(AuditAction.USER_LOGIN).toBe('USER_LOGIN');
            expect(AuditAction.USER_LOGOUT).toBe('USER_LOGOUT');
            expect(AuditAction.USER_CREATED).toBe('USER_CREATED');
            expect(AuditAction.USER_UPDATED).toBe('USER_UPDATED');
            expect(AuditAction.USER_DELETED).toBe('USER_DELETED');
        });

        it('should have all expected leave actions', () => {
            expect(AuditAction.LEAVE_REQUESTED).toBe('LEAVE_REQUESTED');
            expect(AuditAction.LEAVE_APPROVED).toBe('LEAVE_APPROVED');
            expect(AuditAction.LEAVE_REJECTED).toBe('LEAVE_REJECTED');
            expect(AuditAction.LEAVE_CANCELLED).toBe('LEAVE_CANCELLED');
            expect(AuditAction.LEAVE_MODIFIED).toBe('LEAVE_MODIFIED');
        });

        it('should have all expected quota actions', () => {
            expect(AuditAction.QUOTA_UPDATED).toBe('QUOTA_UPDATED');
            expect(AuditAction.QUOTA_TRANSFER).toBe('QUOTA_TRANSFER');
            expect(AuditAction.QUOTA_CARRY_OVER).toBe('QUOTA_CARRY_OVER');
        });

        it('should have all expected planning actions', () => {
            expect(AuditAction.PLANNING_CREATED).toBe('PLANNING_CREATED');
            expect(AuditAction.PLANNING_UPDATED).toBe('PLANNING_UPDATED');
            expect(AuditAction.PLANNING_DELETED).toBe('PLANNING_DELETED');
        });

        it('should have all expected admin actions', () => {
            expect(AuditAction.SETTINGS_UPDATED).toBe('SETTINGS_UPDATED');
            expect(AuditAction.PERMISSION_CHANGED).toBe('PERMISSION_CHANGED');
            expect(AuditAction.DATA_EXPORTED).toBe('DATA_EXPORTED');
            expect(AuditAction.DATA_IMPORTED).toBe('DATA_IMPORTED');
        });

        it('should have unique action values', () => {
            const actions = Object.values(AuditAction);
            const uniqueActions = new Set(actions);
            expect(actions.length).toBe(uniqueActions.size);
        });

        it('should have 18 total actions', () => {
            const actions = Object.values(AuditAction);
            expect(actions).toHaveLength(18);
        });
    });

    describe('Integration scenarios', () => {
        it('should handle concurrent audit logging', async () => {
            const params1: AuditLogParams = {
                action: AuditAction.USER_LOGIN,
                entityId: 'user1',
                entityType: 'User'
            };

            const params2: AuditLogParams = {
                action: AuditAction.LEAVE_REQUESTED,
                entityId: 'leave1',
                entityType: 'Leave'
            };

            // Execute concurrent logging
            await Promise.all([
                auditService.logAction(params1),
                auditService.logAction(params2)
            ]);

            expect(mockPrisma.auditLog.create).toHaveBeenCalledTimes(2);
        });

        it('should work with standard audit actions', async () => {
            const standardActions = [
                AuditAction.USER_CREATED,
                AuditAction.LEAVE_APPROVED,
                AuditAction.PLANNING_UPDATED
            ];

            for (const action of standardActions) {
                await auditService.logAction({
                    action,
                    entityId: 'test',
                    entityType: 'Test'
                });
            }

            expect(mockPrisma.auditLog.create).toHaveBeenCalledTimes(3);
        });

        it('should maintain audit trail consistency', async () => {
            const entityId = 'consistent-entity';
            const entityType = 'ConsistentEntity';

            // Log multiple actions for the same entity
            await auditService.logAction({
                action: AuditAction.USER_CREATED,
                entityId,
                entityType,
                userId: 1
            });

            await auditService.logAction({
                action: AuditAction.USER_UPDATED,
                entityId,
                entityType,
                userId: 2
            });

            // Retrieve actions for the entity
            mockPrisma.auditLog.findMany.mockResolvedValue([
                {
                    id: 'audit-1',
                    action: AuditAction.USER_UPDATED,
                    entityId,
                    entityType,
                    userId: 2,
                    details: null,
                    timestamp: new Date(),
                    user: { id: 2, nom: 'User2', prenom: 'Test' }
                },
                {
                    id: 'audit-2',
                    action: AuditAction.USER_CREATED,
                    entityId,
                    entityType,
                    userId: 1,
                    details: null,
                    timestamp: new Date(),
                    user: { id: 1, nom: 'User1', prenom: 'Test' }
                }
            ]);

            const entityActions = await auditService.getActionsForEntity(entityType, entityId);

            expect(entityActions).toHaveLength(2);
            expect(entityActions[0].action).toBe(AuditAction.USER_UPDATED);
            expect(entityActions[1].action).toBe(AuditAction.USER_CREATED);
        });
    });
});