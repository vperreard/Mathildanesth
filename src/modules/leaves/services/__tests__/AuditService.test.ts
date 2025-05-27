import { AuditService, AuditActionType, AuditSeverity, AuditEntry, AuditSearchOptions } from '../AuditService';
import { eventBus, IntegrationEventType } from '../../../integration/services/EventBusService';
import axios from 'axios';

// Mock des dépendances externes
jest.mock('axios');
jest.mock('../../../integration/services/EventBusService', () => {
    // Conserver la référence aux types réels
    const actual = jest.requireActual('../../../integration/services/EventBusService');

    return {
        ...actual,
        eventBus: {
            subscribe: jest.fn().mockReturnValue(jest.fn()),
            publish: jest.fn()
        }
    };
});

describe('AuditService', () => {
    let auditService: AuditService;

    beforeEach(() => {
        jest.clearAllMocks();

        // Réinitialiser l'instance singleton pour chaque test
        const AuditServiceAny = AuditService as any;
        AuditServiceAny.instance = undefined;

        // Restaurer les mocks d'axios
        (axios.post as jest.Mock).mockResolvedValue({ data: { id: 'audit-1' } });
        (axios.get as jest.Mock).mockResolvedValue({ data: [] });

        // Obtenir une nouvelle instance
        auditService = AuditService.getInstance();
    });

    describe('getInstance', () => {
        it('devrait retourner une instance singleton', () => {
            // Act
            const instance1 = AuditService.getInstance();
            const instance2 = AuditService.getInstance();

            // Assert
            expect(instance1).toBe(instance2);
        });
    });

    describe('initEventSubscriptions', () => {
        it('devrait s\'abonner aux événements du bus d\'événements', () => {
            // Le constructeur appelle déjà initEventSubscriptions

            // Assert
            expect(eventBus.subscribe).toHaveBeenCalledWith(
                IntegrationEventType.LEAVE_CREATED,
                expect.any(Function)
            );
            expect(eventBus.subscribe).toHaveBeenCalledWith(
                IntegrationEventType.LEAVE_UPDATED,
                expect.any(Function)
            );
            expect(eventBus.subscribe).toHaveBeenCalledWith(
                IntegrationEventType.LEAVE_APPROVED,
                expect.any(Function)
            );
            expect(eventBus.subscribe).toHaveBeenCalledWith(
                IntegrationEventType.QUOTA_UPDATED,
                expect.any(Function)
            );
            expect(eventBus.subscribe).toHaveBeenCalledWith(
                IntegrationEventType.QUOTA_TRANSFERRED,
                expect.any(Function)
            );
            expect(eventBus.subscribe).toHaveBeenCalledWith(
                IntegrationEventType.QUOTA_CARRIED_OVER,
                expect.any(Function)
            );
            expect(eventBus.subscribe).toHaveBeenCalledWith(
                IntegrationEventType.AUDIT_ACTION,
                expect.any(Function)
            );
        });
    });

    describe('createAuditEntry', () => {
        it('devrait créer une entrée d\'audit via l\'API', async () => {
            // Arrange
            const auditEntry: Omit<AuditEntry, 'id' | 'timestamp'> = {
                actionType: AuditActionType.LEAVE_CREATED,
                userId: 'user-123',
                targetId: 'leave-456',
                targetType: 'leave',
                description: 'Création d\'un congé',
                severity: AuditSeverity.INFO,
                metadata: { leaveType: 'ANNUAL' }
            };

            // Act
            const result = await auditService.createAuditEntry(auditEntry);

            // Assert
            expect(axios.post).toHaveBeenCalledWith(
                '/api/audit/entries',
                expect.objectContaining({
                    actionType: AuditActionType.LEAVE_CREATED,
                    userId: 'user-123',
                    targetId: 'leave-456',
                    userAgent: expect.any(String)
                }),
                expect.any(Object)
            );
            expect(result).toHaveProperty('id', 'audit-1');
        });

        it('devrait gérer les erreurs lors de la création', async () => {
            // Arrange
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            const mockError = new Error('Erreur API');
            (axios.post as jest.Mock).mockRejectedValue(mockError);

            const auditEntry = {
                actionType: AuditActionType.LEAVE_CREATED,
                userId: 'user-123',
                description: 'Test',
                severity: AuditSeverity.INFO
            };

            // Act & Assert
            await expect(auditService.createAuditEntry(auditEntry)).rejects.toThrow();
            expect(consoleErrorSpy).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });
    });

    describe('handleLeaveEvent', () => {
        it('devrait créer une entrée d\'audit pour un événement de congé', async () => {
            // Arrange
            const createAuditEntrySpy = jest.spyOn(auditService, 'createAuditEntry').mockResolvedValue({} as AuditEntry);

            const leaveEvent = {
                type: IntegrationEventType.LEAVE_CREATED,
                payload: {
                    id: 'leave-123',
                    userId: 'user-456',
                    type: 'ANNUAL',
                    status: 'APPROVED',
                    startDate: '2023-07-10',
                    endDate: '2023-07-15'
                },
                userId: 'user-456',
                timestamp: Date.now(),
                source: 'leave-module'
            };

            // Act - Simuler la réception d'un événement en appelant directement le gestionnaire
            await (auditService as any).handleLeaveEvent(leaveEvent);

            // Assert
            expect(createAuditEntrySpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    actionType: AuditActionType.LEAVE_CREATED,
                    userId: 'user-456',
                    targetId: 'leave-123',
                    targetType: 'leave'
                })
            );
        });

        it('devrait créer des entrées d\'audit avec la bonne sévérité selon le type d\'événement', async () => {
            // Arrange
            const createAuditEntrySpy = jest.spyOn(auditService, 'createAuditEntry').mockResolvedValue({} as AuditEntry);

            // Tester chaque type d'événement de congé
            const eventTypes = [
                { type: IntegrationEventType.LEAVE_CREATED, expectedSeverity: AuditSeverity.INFO },
                { type: IntegrationEventType.LEAVE_UPDATED, expectedSeverity: AuditSeverity.LOW },
                { type: IntegrationEventType.LEAVE_APPROVED, expectedSeverity: AuditSeverity.LOW },
                { type: IntegrationEventType.LEAVE_REJECTED, expectedSeverity: AuditSeverity.LOW },
                { type: IntegrationEventType.LEAVE_CANCELLED, expectedSeverity: AuditSeverity.LOW },
                { type: IntegrationEventType.LEAVE_DELETED, expectedSeverity: AuditSeverity.MEDIUM }
            ];

            for (const { type, expectedSeverity } of eventTypes) {
                createAuditEntrySpy.mockClear();

                const event = {
                    type,
                    payload: {
                        id: 'leave-123',
                        userId: 'user-456',
                        type: 'ANNUAL',
                        status: 'PENDING',
                        startDate: '2023-07-10',
                        endDate: '2023-07-15'
                    },
                    userId: 'user-456',
                    timestamp: Date.now(),
                    source: 'leave-module'
                };

                // Act
                await (auditService as any).handleLeaveEvent(event);

                // Assert
                expect(createAuditEntrySpy).toHaveBeenCalledWith(
                    expect.objectContaining({
                        severity: expectedSeverity,
                        targetType: 'leave'
                    })
                );
            }
        });

        it('devrait gérer les erreurs lors du traitement d\'un événement de congé', async () => {
            // Arrange
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            const createAuditEntrySpy = jest.spyOn(auditService, 'createAuditEntry').mockRejectedValue(new Error('Test error'));

            const leaveEvent = {
                type: IntegrationEventType.LEAVE_CREATED,
                payload: {
                    id: 'leave-123',
                    type: 'ANNUAL',
                    status: 'APPROVED'
                },
                timestamp: Date.now(),
                source: 'leave-module'
            };

            // Act - L'erreur devrait être capturée
            await (auditService as any).handleLeaveEvent(leaveEvent);

            // Assert
            expect(createAuditEntrySpy).toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });
    });

    describe('handleQuotaEvent', () => {
        it('devrait créer une entrée d\'audit pour un événement de quota', async () => {
            // Arrange
            const createAuditEntrySpy = jest.spyOn(auditService, 'createAuditEntry').mockResolvedValue({} as AuditEntry);

            const quotaEvent = {
                type: IntegrationEventType.QUOTA_TRANSFERRED,
                payload: {
                    userId: 'user-123',
                    leaveType: 'ANNUAL',
                    amount: 5,
                    reason: 'Transfert de quotas'
                },
                userId: 'admin-789', // L'administrateur qui a effectué le transfert
                timestamp: Date.now(),
                source: 'quota-module'
            };

            // Act
            await (auditService as any).handleQuotaEvent(quotaEvent);

            // Assert
            expect(createAuditEntrySpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    actionType: AuditActionType.QUOTA_TRANSFERRED,
                    userId: 'admin-789',
                    targetId: 'user-123',
                    targetType: 'quota'
                })
            );
        });

        it('devrait générer des descriptions spécifiques pour chaque type d\'événement de quota', async () => {
            // Arrange
            const createAuditEntrySpy = jest.spyOn(auditService, 'createAuditEntry').mockResolvedValue({} as AuditEntry);

            // Tester les descriptions générées pour chaque type d'événement de quota
            const testCases = [
                {
                    type: IntegrationEventType.QUOTA_UPDATED,
                    payload: {
                        userId: 'user-123',
                        leaveType: 'ANNUAL',
                        amount: 10
                    },
                    expectedDescription: expect.stringContaining('Quota mis à jour')
                },
                {
                    type: IntegrationEventType.QUOTA_TRANSFERRED,
                    payload: {
                        userId: 'user-123',
                        fromLeaveType: 'ANNUAL',
                        toLeaveType: 'SICK',
                        amount: 3
                    },
                    expectedDescription: expect.stringContaining('Transfert de quota')
                },
                {
                    type: IntegrationEventType.QUOTA_CARRIED_OVER,
                    payload: {
                        userId: 'user-123',
                        leaveType: 'ANNUAL',
                        fromYear: 2022,
                        toYear: 2023,
                        amount: 5
                    },
                    expectedDescription: expect.stringContaining('Report de quota')
                }
            ];

            for (const { type, payload, expectedDescription } of testCases) {
                createAuditEntrySpy.mockClear();

                const event = {
                    type,
                    payload,
                    userId: 'admin-456',
                    timestamp: Date.now(),
                    source: 'quota-module'
                };

                // Act
                await (auditService as any).handleQuotaEvent(event);

                // Assert
                expect(createAuditEntrySpy).toHaveBeenCalledWith(
                    expect.objectContaining({
                        description: expectedDescription
                    })
                );
            }
        });
    });

    describe('handleGenericAuditEvent', () => {
        it('devrait traiter correctement les événements d\'audit génériques', async () => {
            // Arrange
            const createAuditEntrySpy = jest.spyOn(auditService, 'createAuditEntry').mockResolvedValue({} as AuditEntry);

            const auditEvent = {
                type: IntegrationEventType.AUDIT_ACTION,
                payload: {
                    actionType: AuditActionType.SYSTEM_ACCESS,
                    userId: 'user-123',
                    description: 'Accès au système de congés',
                    severity: AuditSeverity.INFO,
                    metadata: { module: 'leaves', action: 'view' }
                },
                timestamp: Date.now(),
                source: 'security-module'
            };

            // Act
            await (auditService as any).handleGenericAuditEvent(auditEvent);

            // Assert
            expect(createAuditEntrySpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    actionType: AuditActionType.SYSTEM_ACCESS,
                    userId: 'user-123',
                    description: 'Accès au système de congés'
                })
            );
        });

        it('devrait gérer les erreurs lors du traitement d\'un événement d\'audit générique', async () => {
            // Arrange
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            const createAuditEntrySpy = jest.spyOn(auditService, 'createAuditEntry').mockRejectedValue(new Error('Test error'));

            const auditEvent = {
                type: IntegrationEventType.AUDIT_ACTION,
                payload: {
                    actionType: AuditActionType.SYSTEM_ACCESS,
                    userId: 'user-123',
                    description: 'Test',
                    severity: AuditSeverity.INFO
                },
                timestamp: Date.now(),
                source: 'test'
            };

            // Act - L'erreur devrait être capturée
            await (auditService as any).handleGenericAuditEvent(auditEvent);

            // Assert
            expect(createAuditEntrySpy).toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });
    });

    describe('mapIntegrationEventToAuditType', () => {
        it('devrait mapper correctement les types d\'événements d\'intégration vers les types d\'audit', () => {
            // Test pour tous les types d'événements mappés
            const mappings = [
                { from: IntegrationEventType.LEAVE_CREATED, to: AuditActionType.LEAVE_CREATED },
                { from: IntegrationEventType.LEAVE_UPDATED, to: AuditActionType.LEAVE_UPDATED },
                { from: IntegrationEventType.LEAVE_APPROVED, to: AuditActionType.LEAVE_APPROVED },
                { from: IntegrationEventType.LEAVE_REJECTED, to: AuditActionType.LEAVE_REJECTED },
                { from: IntegrationEventType.LEAVE_CANCELLED, to: AuditActionType.LEAVE_CANCELLED },
                { from: IntegrationEventType.LEAVE_DELETED, to: AuditActionType.LEAVE_DELETED },
                { from: IntegrationEventType.QUOTA_UPDATED, to: AuditActionType.QUOTA_UPDATED },
                { from: IntegrationEventType.QUOTA_TRANSFERRED, to: AuditActionType.QUOTA_TRANSFERRED },
                { from: IntegrationEventType.QUOTA_CARRIED_OVER, to: AuditActionType.QUOTA_CARRIED_OVER },
                { from: IntegrationEventType.AUDIT_ACTION, to: AuditActionType.SYSTEM_ACCESS }
            ];

            for (const { from, to } of mappings) {
                // Act
                const result = (auditService as any).mapIntegrationEventToAuditType(from);

                // Assert
                expect(result).toBe(to);
            }
        });

        it('devrait retourner null pour les types d\'événements non mappés', () => {
            // Act
            const result = (auditService as any).mapIntegrationEventToAuditType(
                IntegrationEventType.PLANNING_EVENT_CREATED
            );

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('searchAuditEntries', () => {
        it('devrait rechercher des entrées d\'audit avec les filtres spécifiés', async () => {
            // Arrange
            const mockEntries = [
                { id: 'audit-1', actionType: AuditActionType.LEAVE_CREATED, timestamp: new Date() },
                { id: 'audit-2', actionType: AuditActionType.LEAVE_APPROVED, timestamp: new Date() }
            ];
            (axios.get as jest.Mock).mockResolvedValue({
                data: {
                    entries: mockEntries,
                    totalCount: 2,
                    hasMore: false
                }
            });

            const searchOptions: AuditSearchOptions = {
                startDate: new Date('2023-01-01'),
                endDate: new Date('2023-12-31'),
                actionTypes: [AuditActionType.LEAVE_CREATED, AuditActionType.LEAVE_APPROVED],
                userIds: ['user-123'],
                limit: 10,
                offset: 0
            };

            // Act
            const result = await auditService.searchAuditEntries(searchOptions);

            // Assert
            expect(axios.get).toHaveBeenCalledWith(
                '/api/audit/entries',
                expect.objectContaining({
                    params: expect.objectContaining({
                        startDate: expect.any(Date),
                        endDate: expect.any(Date),
                        actionTypes: expect.any(Array),
                        userIds: expect.any(Array),
                        limit: 10,
                        offset: 0
                    })
                })
            );
            expect(result.entries).toEqual(mockEntries);
            expect(result.totalCount).toBe(2);
            expect(result.hasMore).toBe(false);
        });

        it('devrait gérer les options de tri dans la recherche', async () => {
            // Arrange
            const mockEntries = [
                { id: 'audit-1', actionType: AuditActionType.LEAVE_CREATED, timestamp: new Date() }
            ];
            (axios.get as jest.Mock).mockResolvedValue({
                data: {
                    entries: mockEntries,
                    totalCount: 1,
                    hasMore: false
                }
            });

            const searchOptions: AuditSearchOptions = {
                sortBy: 'timestamp',
                sortOrder: 'desc'
            };

            // Act
            await auditService.searchAuditEntries(searchOptions);

            // Assert
            expect(axios.get).toHaveBeenCalledWith(
                '/api/audit/entries',
                expect.objectContaining({
                    params: expect.objectContaining({
                        sortBy: 'timestamp',
                        sortOrder: 'desc'
                    })
                })
            );
        });

        it('devrait gérer les erreurs lors de la recherche', async () => {
            // Arrange
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            (axios.get as jest.Mock).mockRejectedValue(new Error('Erreur de recherche'));

            // Act & Assert
            await expect(auditService.searchAuditEntries()).rejects.toThrow('Erreur de recherche');
            expect(consoleErrorSpy).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });
    });

    describe('getAuditEntry', () => {
        it('devrait récupérer une entrée d\'audit par ID', async () => {
            // Arrange
            const mockEntry = {
                id: 'audit-123',
                actionType: AuditActionType.LEAVE_CREATED,
                userId: 'user-456',
                description: 'Création de congé',
                timestamp: new Date(),
                severity: AuditSeverity.INFO
            };
            (axios.get as jest.Mock).mockResolvedValue({ data: mockEntry });

            // Act
            const result = await auditService.getAuditEntry('audit-123');

            // Assert
            expect(axios.get).toHaveBeenCalledWith(
                '/api/audit/entries/audit-123',
                expect.any(Object)
            );
            expect(result).toEqual(mockEntry);
        });

        it('devrait gérer les erreurs lors de la récupération d\'une entrée d\'audit', async () => {
            // Arrange
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            (axios.get as jest.Mock).mockRejectedValue(new Error('Entrée non trouvée'));

            // Act & Assert
            await expect(auditService.getAuditEntry('invalid-id')).rejects.toThrow('Entrée non trouvée');
            expect(consoleErrorSpy).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });
    });

    describe('méthodes de journalisation spécifiques', () => {
        beforeEach(() => {
    jest.clearAllMocks();
            jest.spyOn(auditService, 'createAuditEntry').mockResolvedValue({} as AuditEntry);
        });

        it('devrait journaliser l\'accès au système', async () => {
            // Act
            await auditService.logSystemAccess('user-123', 'leaves', 'view', { browser: 'Chrome' });

            // Assert
            expect(auditService.createAuditEntry).toHaveBeenCalledWith(
                expect.objectContaining({
                    actionType: AuditActionType.SYSTEM_ACCESS,
                    userId: 'user-123',
                    description: expect.stringContaining('leaves'),
                    severity: AuditSeverity.INFO,
                    metadata: expect.objectContaining({
                        browser: 'Chrome'
                    })
                })
            );
        });

        it('devrait journaliser les changements de rôle utilisateur', async () => {
            // Act
            await auditService.logUserRoleChange('admin-123', 'user-456', 'USER', 'MANAGER');

            // Assert
            expect(auditService.createAuditEntry).toHaveBeenCalledWith(
                expect.objectContaining({
                    actionType: AuditActionType.USER_ROLE_CHANGED,
                    userId: 'admin-123',
                    targetId: 'user-456',
                    targetType: 'user',
                    severity: AuditSeverity.HIGH,
                    metadata: expect.objectContaining({
                        oldRole: 'USER',
                        newRole: 'MANAGER'
                    })
                })
            );
        });

        it('devrait journaliser les changements de permission', async () => {
            // Test pour l'octroi de permission
            await auditService.logPermissionChange('admin-123', 'user-456', 'leaves.approve.team', true);

            expect(auditService.createAuditEntry).toHaveBeenCalledWith(
                expect.objectContaining({
                    actionType: AuditActionType.PERMISSION_GRANTED,
                    userId: 'admin-123',
                    targetId: 'user-456',
                    targetType: 'permission',
                    description: expect.stringContaining('accordée'),
                    severity: AuditSeverity.HIGH,
                    metadata: expect.objectContaining({
                        permission: 'leaves.approve.team',
                        granted: true
                    })
                })
            );

            // Test pour la révocation de permission
            jest.clearAllMocks();
            await auditService.logPermissionChange('admin-123', 'user-456', 'leaves.approve.team', false);

            expect(auditService.createAuditEntry).toHaveBeenCalledWith(
                expect.objectContaining({
                    actionType: AuditActionType.PERMISSION_REVOKED,
                    description: expect.stringContaining('retirée'),
                    metadata: expect.objectContaining({
                        granted: false
                    })
                })
            );
        });

        it('devrait journaliser l\'exportation de données', async () => {
            // Act
            await auditService.logDataExport('user-123', 'leaves', 'CSV', { startDate: '2023-01-01' });

            // Assert
            expect(auditService.createAuditEntry).toHaveBeenCalledWith(
                expect.objectContaining({
                    actionType: AuditActionType.EXPORT_DATA,
                    userId: 'user-123',
                    targetType: 'leaves',
                    description: expect.stringContaining('CSV'),
                    severity: AuditSeverity.MEDIUM,
                    metadata: expect.objectContaining({
                        dataType: 'leaves',
                        exportFormat: 'CSV',
                        filters: expect.objectContaining({
                            startDate: '2023-01-01'
                        })
                    })
                })
            );
        });

        it('devrait journaliser les changements de configuration', async () => {
            // Act
            await auditService.logConfigurationChange('admin-123', 'leaveTypes', ['ANNUAL'], ['ANNUAL', 'SICK']);

            // Assert
            expect(auditService.createAuditEntry).toHaveBeenCalledWith(
                expect.objectContaining({
                    actionType: AuditActionType.CONFIGURATION_CHANGED,
                    userId: 'admin-123',
                    targetType: 'configuration',
                    targetId: 'leaveTypes',
                    description: expect.stringContaining('leaveTypes'),
                    severity: AuditSeverity.HIGH,
                    metadata: expect.objectContaining({
                        configKey: 'leaveTypes',
                        oldValue: ['ANNUAL'],
                        newValue: ['ANNUAL', 'SICK']
                    })
                })
            );
        });
    });
}); 