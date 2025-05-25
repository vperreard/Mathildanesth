import { AuditService, AuditAction, AuditEntry } from '../AuditService';

// Mock de fetch pour les tests
global.fetch = jest.fn();

// Mock de localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

describe('AuditService', () => {
    let auditService: AuditService;
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.getItem.mockReturnValue('[]');
        auditService = AuditService.getInstance();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('Singleton Pattern', () => {
        it('should always return the same instance', () => {
            const instance1 = AuditService.getInstance();
            const instance2 = AuditService.getInstance();
            expect(instance1).toBe(instance2);
        });
    });

    describe('logAction', () => {
        it('should log an action successfully', async () => {
            // Mock successful API response
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 'audit-123' }),
            } as Response);

            const entry: AuditEntry = {
                action: AuditAction.USER_LOGIN,
                userId: 'user-123',
                entityId: 'entity-456',
                entityType: 'user',
                details: { previousRole: 'USER', newRole: 'ADMIN' }
            };

            const result = await auditService.logAction(entry);

            expect(result).toMatchObject(entry);
            expect(result.id).toBeDefined();
            expect(result.timestamp).toBeDefined();
            expect(mockFetch).toHaveBeenCalledWith('/api/audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: expect.stringContaining(entry.action)
            });
        });

        it('should store locally when API fails', async () => {
            // Mock failed API response
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const entry: AuditEntry = {
                action: AuditAction.LEAVE_CREATED,
                userId: 'user-123',
                entityId: 'leave-456',
                entityType: 'leave'
            };

            const result = await auditService.logAction(entry);

            expect(result).toMatchObject(entry);
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'pendingAuditEntries',
                expect.stringContaining(entry.action)
            );
        });

        it('should handle typed audit details correctly', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 'audit-123' }),
            } as Response);

            const entry: AuditEntry = {
                action: AuditAction.LEAVE_APPROVED,
                userId: 'user-123',
                entityId: 'leave-456',
                entityType: 'leave',
                details: {
                    leaveType: 'CONGE_ANNUEL',
                    startDate: '2025-06-01',
                    endDate: '2025-06-15',
                    previousStatus: 'EN_ATTENTE',
                    newStatus: 'APPROUVE'
                }
            };

            const result = await auditService.logAction(entry);

            expect(result.details).toEqual(entry.details);
        });
    });

    describe('getAuditHistory', () => {
        it('should fetch audit history successfully', async () => {
            const mockEntries = [
                {
                    id: 'audit-1',
                    action: AuditAction.USER_CREATED,
                    entityId: 'user-123',
                    entityType: 'user',
                    timestamp: new Date().toISOString()
                }
            ];

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockEntries,
            } as Response);

            const result = await auditService.getAuditHistory('user', 'user-123', {
                limit: 10,
                actions: [AuditAction.USER_CREATED, AuditAction.USER_UPDATED]
            });

            expect(result).toEqual(mockEntries);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/audit?entityType=user&entityId=user-123&limit=10&actions=user%3Acreated%2Cuser%3Aupdated')
            );
        });

        it('should return empty array on API error', async () => {
            mockFetch.mockRejectedValueOnce(new Error('API Error'));

            const result = await auditService.getAuditHistory('user', 'user-123');

            expect(result).toEqual([]);
        });

        it('should handle date filters correctly', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [],
            } as Response);

            const startDate = new Date('2025-01-01');
            const endDate = new Date('2025-12-31');

            await auditService.getAuditHistory('leave', 'leave-123', {
                startDate,
                endDate,
                offset: 20
            });

            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringMatching(/startDate=.*2025-01-01.*&endDate=.*2025-12-31.*&offset=20/)
            );
        });
    });

    describe('getUserAuditHistory', () => {
        it('should fetch user-specific audit history', async () => {
            const mockEntries = [
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
                json: async () => mockEntries,
            } as Response);

            const result = await auditService.getUserAuditHistory('user-123', {
                limit: 5
            });

            expect(result).toEqual(mockEntries);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/audit/user?userId=user-123&limit=5')
            );
        });
    });

    describe('syncPendingEntries', () => {
        it('should sync pending entries successfully', async () => {
            const pendingEntries = [
                {
                    action: AuditAction.LEAVE_CREATED,
                    entityId: 'leave-1',
                    entityType: 'leave',
                    timestamp: new Date()
                },
                {
                    action: AuditAction.LEAVE_UPDATED,
                    entityId: 'leave-2',
                    entityType: 'leave',
                    timestamp: new Date()
                }
            ];

            localStorageMock.getItem.mockReturnValue(JSON.stringify(pendingEntries));
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ success: true }),
            } as Response);

            const syncedCount = await auditService.syncPendingEntries();

            expect(syncedCount).toBe(2);
            expect(mockFetch).toHaveBeenCalledWith('/api/audit/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: expect.stringContaining(AuditAction.LEAVE_CREATED)
            });
            expect(localStorageMock.setItem).toHaveBeenCalledWith('pendingAuditEntries', '[]');
        });

        it('should handle sync failures gracefully', async () => {
            const pendingEntries = [
                {
                    action: AuditAction.USER_DELETED,
                    entityId: 'user-1',
                    entityType: 'user'
                }
            ];

            localStorageMock.getItem.mockReturnValue(JSON.stringify(pendingEntries));
            mockFetch.mockRejectedValue(new Error('Sync failed'));

            const syncedCount = await auditService.syncPendingEntries();

            expect(syncedCount).toBe(0);
        });

        it('should process large batches correctly', async () => {
            // Create 50 pending entries to test batch processing
            const pendingEntries = Array.from({ length: 50 }, (_, i) => ({
                action: AuditAction.QUOTA_UPDATED,
                entityId: `quota-${i}`,
                entityType: 'quota'
            }));

            localStorageMock.getItem.mockReturnValue(JSON.stringify(pendingEntries));
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ success: true }),
            } as Response);

            const syncedCount = await auditService.syncPendingEntries();

            expect(syncedCount).toBe(50);
            // Should be called in batches of 20
            expect(mockFetch).toHaveBeenCalledTimes(3); // 20 + 20 + 10
        });
    });

    describe('debug mode', () => {
        it('should enable/disable debug mode', () => {
            auditService.setDebugMode(true);
            // Debug mode behavior is mostly console.debug which we can't easily test
            // But we can verify the method doesn't throw
            expect(() => auditService.setDebugMode(false)).not.toThrow();
        });
    });

    describe('local storage management', () => {
        it('should limit pending entries to 100', async () => {
            // Create 150 entries to test trimming
            const manyEntries = Array.from({ length: 150 }, (_, i) => ({
                action: AuditAction.SYSTEM_UPDATED,
                entityId: `system-${i}`,
                entityType: 'system'
            }));

            localStorageMock.getItem.mockReturnValue(JSON.stringify(manyEntries.slice(0, 120)));
            mockFetch.mockRejectedValueOnce(new Error('API Error'));

            await auditService.logAction({
                action: AuditAction.SYSTEM_UPDATED,
                entityId: 'system-new',
                entityType: 'system'
            });

            // Should trim to 100 entries
            const setItemCall = localStorageMock.setItem.mock.calls.find(call => call[0] === 'pendingAuditEntries');
            const storedEntries = JSON.parse(setItemCall[1]);
            expect(storedEntries.length).toBe(100);
        });

        it('should handle localStorage errors gracefully', async () => {
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('localStorage full');
            });
            mockFetch.mockRejectedValueOnce(new Error('API Error'));

            // Should not throw even if localStorage fails
            await expect(auditService.logAction({
                action: AuditAction.PERMISSION_GRANTED,
                entityId: 'permission-123',
                entityType: 'permission'
            })).resolves.toBeDefined();
        });
    });
}); 