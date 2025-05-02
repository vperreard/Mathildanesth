import { LeavePermissionService, LeavePermission, LeaveRole } from '../LeavePermissionService';
import { getSession } from 'next-auth/react';
import { User } from '@/types/user';
import { auditService } from '../../services/AuditService';
import { eventBus, IntegrationEventType } from '../../../integration/services/EventBusService';

// Mock des dépendances
jest.mock('next-auth/react');
jest.mock('../../services/AuditService', () => ({
    auditService: {
        logPermissionChange: jest.fn().mockResolvedValue(undefined),
        logUserRoleChange: jest.fn().mockResolvedValue(undefined)
    }
}));
jest.mock('../../../integration/services/EventBusService', () => {
    const actual = jest.requireActual('../../../integration/services/EventBusService');
    return {
        ...actual,
        eventBus: {
            subscribe: jest.fn().mockReturnValue(jest.fn()),
            publish: jest.fn()
        }
    };
});

describe('LeavePermissionService (Tests avancés)', () => {
    let permissionService: LeavePermissionService;

    // Utilisateurs de test
    const mockEmployee: User = {
        id: 'employee-123',
        prenom: 'Jean',
        nom: 'Dupont',
        email: 'jean.dupont@example.com',
        role: 'UTILISATEUR',
        specialties: [],
        experienceLevel: 'SENIOR',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const mockManager: User = {
        id: 'manager-456',
        prenom: 'Marie',
        nom: 'Martin',
        email: 'marie.martin@example.com',
        role: 'MANAGER',
        specialties: [],
        experienceLevel: 'SENIOR',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const mockHrAdmin: User = {
        id: 'hr-admin-789',
        prenom: 'Pierre',
        nom: 'Durand',
        email: 'pierre.durand@example.com',
        role: 'ADMIN_PARTIEL',
        specialties: [],
        experienceLevel: 'SENIOR',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    // Configuration pour les tests
    beforeEach(() => {
        jest.clearAllMocks();

        // Réinitialiser l'instance singleton pour chaque test
        const permissionServiceAny = LeavePermissionService as any;
        permissionServiceAny.instance = undefined;

        // Obtenir une nouvelle instance
        permissionService = LeavePermissionService.getInstance();

        // Mock des méthodes internes
        jest.spyOn(permissionService as any, 'loadCustomPermissions')
            .mockImplementation(() => {
                // Simuler des permissions personnalisées chargées
                const customPermissionsMap = new Map();

                // Permissions personnalisées pour un utilisateur customisé
                customPermissionsMap.set('custom-user-123', {
                    userId: 'custom-user-123',
                    grantedPermissions: [LeavePermission.VIEW_REPORTS],
                    deniedPermissions: [LeavePermission.APPROVE_TEAM_LEAVES]
                });

                // Ajouter d'autres permissions personnalisées pour les tests
                customPermissionsMap.set('employee-with-special-perms', {
                    userId: 'employee-with-special-perms',
                    grantedPermissions: [
                        LeavePermission.VIEW_REPORTS,
                        LeavePermission.EXPORT_REPORTS
                    ],
                    deniedPermissions: []
                });

                customPermissionsMap.set('restricted-manager', {
                    userId: 'restricted-manager',
                    grantedPermissions: [],
                    deniedPermissions: [
                        LeavePermission.APPROVE_TEAM_LEAVES,
                        LeavePermission.VIEW_TEAM_LEAVES
                    ]
                });

                (permissionService as any).customPermissions = customPermissionsMap;
                (permissionService as any).permissionsLoaded = true;

                return Promise.resolve();
            });

        // Mock de getSession
        (getSession as jest.Mock).mockResolvedValue({
            user: mockEmployee
        });

        // Mock des méthodes de vérification relatives
        jest.spyOn(permissionService as any, 'isUserInTeam')
            .mockImplementation((userId: string, managerId: string) => {
                // L'employé est dans l'équipe du manager
                return Promise.resolve(
                    userId === 'employee-123' && managerId === 'manager-456'
                );
            });

        jest.spyOn(permissionService as any, 'isUserInSameDepartment')
            .mockImplementation((userId1: string, userId2: string) => {
                // Tous les utilisateurs de test sont dans le même département
                return Promise.resolve(true);
            });
    });

    describe('Cache de permissions', () => {
        it('devrait mettre en cache les résultats des vérifications de permission', async () => {
            // Act
            // Appeler hasPermission plusieurs fois avec les mêmes paramètres
            await permissionService.hasPermission(LeavePermission.REQUEST_LEAVE, mockEmployee);
            await permissionService.hasPermission(LeavePermission.REQUEST_LEAVE, mockEmployee);
            await permissionService.hasPermission(LeavePermission.REQUEST_LEAVE, mockEmployee);

            // Assert
            const stats = permissionService.getCacheStats();
            expect(stats.hits).toBeGreaterThan(0);
            expect(stats.enabled).toBe(true);
        });

        it('devrait désactiver le cache quand configuré', async () => {
            // Act
            permissionService.setCacheEnabled(false);

            // Vérifier une permission
            await permissionService.hasPermission(LeavePermission.REQUEST_LEAVE, mockEmployee);
            await permissionService.hasPermission(LeavePermission.REQUEST_LEAVE, mockEmployee);

            // Assert
            const stats = permissionService.getCacheStats();
            expect(stats.enabled).toBe(false);
            expect(stats.hits).toBe(0); // Pas de hits de cache car désactivé
        });

        it('devrait vider le cache lors de l\'appel à clearCache', async () => {
            // Arrange
            // Pré-remplir le cache
            await permissionService.hasPermission(LeavePermission.REQUEST_LEAVE, mockEmployee);
            await permissionService.hasPermission(LeavePermission.CANCEL_OWN_LEAVE, mockEmployee);

            // Act
            permissionService.clearCache();

            // Assert
            const stats = permissionService.getCacheStats();
            expect(stats.size).toBe(0);
        });

        it('devrait invalider le cache pour un utilisateur spécifique', async () => {
            // Arrange
            // Pré-remplir le cache avec des permissions pour différents utilisateurs
            await permissionService.hasPermission(LeavePermission.REQUEST_LEAVE, mockEmployee);
            await permissionService.hasPermission(LeavePermission.APPROVE_TEAM_LEAVES, mockManager);

            // Vérifier que le cache contient des entrées
            const statsBefore = permissionService.getCacheStats();
            expect(statsBefore.size).toBeGreaterThan(0);

            // Act
            permissionService.invalidateUserCache(mockEmployee.id);

            // Assert
            // Les permissions du manager devraient toujours être en cache
            await permissionService.hasPermission(LeavePermission.APPROVE_TEAM_LEAVES, mockManager);
            const statsAfter = permissionService.getCacheStats();
            expect(statsAfter.hits).toBeGreaterThan(0);

            // Mais celles de l'employé devraient être rechargées (miss de cache)
            const spyCheckRelativePermission = jest.spyOn(permissionService as any, 'checkRelativePermission');
            await permissionService.hasPermission(LeavePermission.REQUEST_LEAVE, mockEmployee);
            expect(spyCheckRelativePermission).toHaveBeenCalled();
        });

        it('devrait configurer le cache avec les options fournies', async () => {
            // Act
            permissionService.configureCache({
                ttlMs: 10000,
                maxSize: 500
            });

            // Assert
            // Vérifier que la configuration a été appliquée
            // (Comme les propriétés de cacheConfig sont privées, nous ne pouvons pas les tester directement)
            // On peut tester indirectement en vérifiant que le cache fonctionne après configuration
            await permissionService.hasPermission(LeavePermission.REQUEST_LEAVE, mockEmployee);
            await permissionService.hasPermission(LeavePermission.REQUEST_LEAVE, mockEmployee);

            const stats = permissionService.getCacheStats();
            expect(stats.hits).toBeGreaterThan(0);
        });
    });

    describe('Permissions relatives', () => {
        it('devrait correctement gérer les permissions d\'équipe', async () => {
            // Test pour le manager qui a accès à son équipe
            await expect(permissionService.hasPermission(
                LeavePermission.APPROVE_TEAM_LEAVES,
                mockManager,
                'employee-123' // employé dans l'équipe du manager
            )).resolves.toBe(true);

            // Test pour le manager qui n'a pas accès à un employé hors de son équipe
            await expect(permissionService.hasPermission(
                LeavePermission.APPROVE_TEAM_LEAVES,
                mockManager,
                'employee-999' // employé qui n'est pas dans l'équipe
            )).resolves.toBe(false);
        });

        it('devrait correctement gérer les permissions de département', async () => {
            // Créer un manager de département pour les tests
            const departmentManager: User = {
                ...mockManager,
                id: 'dept-manager-789',
                role: 'DEPARTMENT_MANAGER'
            };

            // Mock pour simuler que l'employé est dans le même département
            jest.spyOn(permissionService as any, 'isUserInSameDepartment')
                .mockImplementation((userId1: string, userId2: string) => {
                    return Promise.resolve(userId1 === 'employee-123' && userId2 === 'dept-manager-789');
                });

            // Test pour le manager de département qui a accès à son département
            await expect(permissionService.hasPermission(
                LeavePermission.APPROVE_DEPARTMENT_LEAVES,
                departmentManager,
                'employee-123' // employé dans le département du manager
            )).resolves.toBe(true);

            // Test pour le manager de département qui n'a pas accès à un employé hors de son département
            await expect(permissionService.hasPermission(
                LeavePermission.APPROVE_DEPARTMENT_LEAVES,
                departmentManager,
                'employee-outside-dept' // employé qui n'est pas dans le département
            )).resolves.toBe(false);
        });

        it('devrait identifier correctement les permissions relatives', () => {
            // Test pour les permissions relatives à l'équipe
            expect((permissionService as any).isRelativePermission(LeavePermission.APPROVE_TEAM_LEAVES)).toBe(true);
            expect((permissionService as any).isRelativePermission(LeavePermission.VIEW_TEAM_LEAVES)).toBe(true);

            // Test pour les permissions relatives au département
            expect((permissionService as any).isRelativePermission(LeavePermission.APPROVE_DEPARTMENT_LEAVES)).toBe(true);
            expect((permissionService as any).isRelativePermission(LeavePermission.VIEW_DEPARTMENT_LEAVES)).toBe(true);

            // Test pour les permissions non relatives
            expect((permissionService as any).isRelativePermission(LeavePermission.VIEW_OWN_LEAVES)).toBe(false);
            expect((permissionService as any).isRelativePermission(LeavePermission.APPROVE_ALL_LEAVES)).toBe(false);
        });
    });

    describe('Permissions personnalisées', () => {
        it('devrait accorder des permissions spéciales à un employé standard', async () => {
            // Arrange
            const employeeWithSpecialPerms: User = {
                ...mockEmployee,
                id: 'employee-with-special-perms'
            };

            // Act & Assert
            // Vérifier les permissions normalement non accordées à un employé
            await expect(permissionService.hasPermission(
                LeavePermission.VIEW_REPORTS,
                employeeWithSpecialPerms
            )).resolves.toBe(true);

            await expect(permissionService.hasPermission(
                LeavePermission.EXPORT_REPORTS,
                employeeWithSpecialPerms
            )).resolves.toBe(true);
        });

        it('devrait refuser des permissions normalement accordées à un rôle', async () => {
            // Arrange
            const restrictedManager: User = {
                ...mockManager,
                id: 'restricted-manager'
            };

            // Act & Assert
            // Vérifier que des permissions normalement accordées au manager sont refusées
            await expect(permissionService.hasPermission(
                LeavePermission.APPROVE_TEAM_LEAVES,
                restrictedManager
            )).resolves.toBe(false);

            await expect(permissionService.hasPermission(
                LeavePermission.VIEW_TEAM_LEAVES,
                restrictedManager
            )).resolves.toBe(false);

            // Mais les autres permissions de manager sont toujours accordées
            await expect(permissionService.hasPermission(
                LeavePermission.VIEW_OWN_LEAVES,
                restrictedManager
            )).resolves.toBe(true);
        });

        it('devrait retourner la liste complète des permissions d\'un utilisateur', async () => {
            // Arrange
            // Mock de la réponse API
            const mockFetch = jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    rolePermissions: [
                        LeavePermission.VIEW_OWN_LEAVES,
                        LeavePermission.REQUEST_LEAVE
                    ],
                    grantedPermissions: [LeavePermission.VIEW_REPORTS],
                    deniedPermissions: []
                })
            });
            global.fetch = mockFetch;

            // Act
            const permissions = await permissionService.getUserPermissions('employee-with-special-perms');

            // Assert
            expect(permissions).toContain(LeavePermission.VIEW_OWN_LEAVES);
            expect(permissions).toContain(LeavePermission.REQUEST_LEAVE);
            expect(permissions).toContain(LeavePermission.VIEW_REPORTS);
        });
    });

    describe('Gestion des événements et du bus d\'événements', () => {
        it('devrait s\'abonner aux événements d\'audit pour la gestion du cache', () => {
            // Lorsqu'une nouvelle instance est créée, elle s'abonne aux événements
            expect(eventBus.subscribe).toHaveBeenCalled();
        });

        it('devrait invalider le cache lors d\'un changement de permission', async () => {
            // Arrange
            // Spy sur la méthode d'invalidation du cache
            const invalidateCacheSpy = jest.spyOn(permissionService, 'invalidateUserCache');

            // Récupérer le gestionnaire d'événements abonné
            const subscribeCallArgs = (eventBus.subscribe as jest.Mock).mock.calls;
            const eventHandler = subscribeCallArgs[0][1]; // Supposons que le premier appel est celui qui nous intéresse

            // Act
            // Simuler la réception d'un événement de modification de permission
            const permissionEvent = {
                type: IntegrationEventType.AUDIT_ACTION,
                payload: {
                    actionType: 'PERMISSION_GRANTED',
                    targetId: 'user-123'
                },
                source: 'permission-service'
            };

            // Appeler directement le gestionnaire d'événements
            await eventHandler(permissionEvent);

            // Assert
            expect(invalidateCacheSpy).toHaveBeenCalledWith('user-123');
        });
    });

    describe('Méthodes de gestion de permissions', () => {
        beforeEach(() => {
            // Mock de la réponse API
            const mockFetch = jest.fn()
                .mockImplementation((url, options) => {
                    if (url.includes('/grant')) {
                        return Promise.resolve({
                            ok: true,
                            json: () => Promise.resolve({ success: true })
                        });
                    } else if (url.includes('/revoke')) {
                        return Promise.resolve({
                            ok: true,
                            json: () => Promise.resolve({ success: true })
                        });
                    } else if (url.includes('/reset')) {
                        return Promise.resolve({
                            ok: true,
                            json: () => Promise.resolve({ success: true })
                        });
                    }
                    return Promise.resolve({
                        ok: false,
                        status: 404,
                        statusText: 'Not Found'
                    });
                });

            global.fetch = mockFetch;
        });

        it('devrait accorder une permission et journaliser l\'action', async () => {
            // Act
            const result = await permissionService.grantPermission(
                'user-123',
                LeavePermission.VIEW_REPORTS
            );

            // Assert
            expect(result).toBe(true);
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/leaves/permissions/user-123/grant',
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining(LeavePermission.VIEW_REPORTS)
                })
            );
            expect(auditService.logPermissionChange).toHaveBeenCalledWith(
                expect.any(String),
                'user-123',
                LeavePermission.VIEW_REPORTS,
                true // granted = true
            );
        });

        it('devrait révoquer une permission et journaliser l\'action', async () => {
            // Act
            const result = await permissionService.revokePermission(
                'user-123',
                LeavePermission.VIEW_REPORTS
            );

            // Assert
            expect(result).toBe(true);
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/leaves/permissions/user-123/revoke',
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining(LeavePermission.VIEW_REPORTS)
                })
            );
            expect(auditService.logPermissionChange).toHaveBeenCalledWith(
                expect.any(String),
                'user-123',
                LeavePermission.VIEW_REPORTS,
                false // granted = false
            );
        });

        it('devrait réinitialiser les permissions personnalisées d\'un utilisateur', async () => {
            // Act
            const result = await permissionService.resetUserPermissions('user-123');

            // Assert
            expect(result).toBe(true);
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/leaves/permissions/user-123/reset',
                expect.objectContaining({
                    method: 'POST'
                })
            );
        });

        it('devrait gérer les erreurs lors de l\'octroi/révocation de permissions', async () => {
            // Arrange
            const mockFetchError = jest.fn().mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            });
            global.fetch = mockFetchError;

            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            // Act & Assert
            // Test pour l'octroi
            await expect(permissionService.grantPermission(
                'user-123',
                LeavePermission.VIEW_REPORTS
            )).resolves.toBe(false);

            // Test pour la révocation
            await expect(permissionService.revokePermission(
                'user-123',
                LeavePermission.VIEW_REPORTS
            )).resolves.toBe(false);

            // Test pour la réinitialisation
            await expect(permissionService.resetUserPermissions(
                'user-123'
            )).resolves.toBe(false);

            expect(consoleErrorSpy).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });
    });
}); 