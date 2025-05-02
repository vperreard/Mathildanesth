import { LeavePermissionService, LeavePermission, LeaveRole } from '../LeavePermissionService';
import { getSession } from 'next-auth/react';
import { User } from '@/types/user';
import { auditService } from '../../services/AuditService';

// Mock des dépendances
jest.mock('next-auth/react');
jest.mock('../../services/AuditService', () => ({
    auditService: {
        logPermissionChange: jest.fn().mockResolvedValue(undefined)
    }
}));

describe('LeavePermissionService', () => {
    let permissionService: LeavePermissionService;

    // Utilisateurs de test
    const mockEmployeeUser: User = {
        id: 'employee-123',
        prenom: 'Jean',
        nom: 'Dupont',
        email: 'jean.dupont@example.com',
        role: 'UTILISATEUR', // Rôle équivalent à EMPLOYEE
        specialties: [],
        experienceLevel: 'SENIOR',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const mockManagerUser: User = {
        id: 'manager-456',
        prenom: 'Marie',
        nom: 'Martin',
        email: 'marie.martin@example.com',
        role: 'MANAGER', // Rôle équivalent à TEAM_MANAGER
        specialties: [],
        experienceLevel: 'SENIOR',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const mockHrAdminUser: User = {
        id: 'admin-789',
        prenom: 'Pierre',
        nom: 'Petit',
        email: 'pierre.petit@example.com',
        role: 'ADMIN_PARTIEL', // Rôle équivalent à HR_ADMIN
        specialties: [],
        experienceLevel: 'SENIOR',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const mockSystemAdminUser: User = {
        id: 'admin-total-012',
        prenom: 'Sophie',
        nom: 'Durand',
        email: 'sophie.durand@example.com',
        role: 'ADMIN_TOTAL', // Rôle équivalent à SYSTEM_ADMIN
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

        // Simuler le chargement des permissions personnalisées
        const loadCustomPermissionsSpy = jest.spyOn(permissionService as any, 'loadCustomPermissions')
            .mockImplementation(() => {
                // Simuler des permissions personnalisées chargées
                const customPermissionsMap = new Map();

                // Ajouter des permissions personnalisées pour un utilisateur spécifique
                customPermissionsMap.set('custom-user-123', {
                    userId: 'custom-user-123',
                    grantedPermissions: [LeavePermission.VIEW_REPORTS],
                    deniedPermissions: [LeavePermission.APPROVE_TEAM_LEAVES]
                });

                (permissionService as any).customPermissions = customPermissionsMap;
                (permissionService as any).permissionsLoaded = true;

                return Promise.resolve();
            });

        // Simuler l'obtention de l'utilisateur actuel
        const getCurrentUserSpy = jest.spyOn(permissionService as any, 'getCurrentUser')
            .mockImplementation(() => {
                return Promise.resolve(mockEmployeeUser);
            });

        // Mock de getSession
        (getSession as jest.Mock).mockResolvedValue({
            user: mockEmployeeUser
        });
    });

    describe('getInstance', () => {
        it('devrait retourner une instance singleton', () => {
            // Act
            const instance1 = LeavePermissionService.getInstance();
            const instance2 = LeavePermissionService.getInstance();

            // Assert
            expect(instance1).toBe(instance2);
        });
    });

    describe('hasPermission', () => {
        it('devrait accorder les permissions de base à un employé standard', async () => {
            // Act & Assert
            await expect(permissionService.hasPermission(
                LeavePermission.VIEW_OWN_LEAVES,
                mockEmployeeUser
            )).resolves.toBe(true);

            await expect(permissionService.hasPermission(
                LeavePermission.REQUEST_LEAVE,
                mockEmployeeUser
            )).resolves.toBe(true);

            await expect(permissionService.hasPermission(
                LeavePermission.CANCEL_OWN_LEAVE,
                mockEmployeeUser
            )).resolves.toBe(true);
        });

        it('devrait refuser les permissions administratives à un employé standard', async () => {
            // Act & Assert
            await expect(permissionService.hasPermission(
                LeavePermission.APPROVE_ALL_LEAVES,
                mockEmployeeUser
            )).resolves.toBe(false);

            await expect(permissionService.hasPermission(
                LeavePermission.MANAGE_QUOTAS,
                mockEmployeeUser
            )).resolves.toBe(false);
        });

        it('devrait accorder des permissions de management à un manager', async () => {
            // Act & Assert
            await expect(permissionService.hasPermission(
                LeavePermission.VIEW_TEAM_LEAVES,
                mockManagerUser
            )).resolves.toBe(true);

            await expect(permissionService.hasPermission(
                LeavePermission.APPROVE_TEAM_LEAVES,
                mockManagerUser
            )).resolves.toBe(true);
        });

        it('devrait accorder toutes les permissions à un administrateur système', async () => {
            // Act & Assert - tester quelques permissions de base et avancées
            await expect(permissionService.hasPermission(
                LeavePermission.VIEW_OWN_LEAVES,
                mockSystemAdminUser
            )).resolves.toBe(true);

            await expect(permissionService.hasPermission(
                LeavePermission.APPROVE_ALL_LEAVES,
                mockSystemAdminUser
            )).resolves.toBe(true);

            await expect(permissionService.hasPermission(
                LeavePermission.MANAGE_LEAVE_TYPES,
                mockSystemAdminUser
            )).resolves.toBe(true);

            await expect(permissionService.hasPermission(
                LeavePermission.VIEW_AUDIT_LOGS,
                mockSystemAdminUser
            )).resolves.toBe(true);
        });

        it('devrait prendre en compte les permissions personnalisées accordées', async () => {
            // Arrange - Utilisateur avec permissions personnalisées
            const customUser = { ...mockEmployeeUser, id: 'custom-user-123' };

            // Act & Assert
            // Cette permission est accordée spécifiquement (non incluse dans le rôle EMPLOYEE)
            await expect(permissionService.hasPermission(
                LeavePermission.VIEW_REPORTS,
                customUser
            )).resolves.toBe(true);
        });

        it('devrait prendre en compte les permissions personnalisées refusées', async () => {
            // Arrange - Utilisateur avec des permissions personnalisées
            const customUser = { ...mockManagerUser, id: 'custom-user-123' };

            // Act & Assert
            // Cette permission est refusée spécifiquement (normalement incluse dans le rôle MANAGER)
            await expect(permissionService.hasPermission(
                LeavePermission.APPROVE_TEAM_LEAVES,
                customUser
            )).resolves.toBe(false);
        });

        it('devrait vérifier les permissions relatives à l\'équipe correctement', async () => {
            // Arrange
            jest.spyOn(permissionService as any, 'isUserInTeam')
                .mockImplementation((userId: string, managerId: string) => {
                    // Simuler que l'utilisateur 'employee-123' est dans l'équipe du manager 'manager-456'
                    return Promise.resolve(userId === 'employee-123' && managerId === 'manager-456');
                });

            // Act & Assert
            // Le manager devrait avoir le droit d'approuver les congés d'un membre de son équipe
            await expect(permissionService.hasPermission(
                LeavePermission.APPROVE_TEAM_LEAVES,
                mockManagerUser,
                'employee-123'
            )).resolves.toBe(true);

            // Le manager ne devrait pas avoir le droit d'approuver les congés d'un utilisateur 
            // qui n'est pas dans son équipe
            await expect(permissionService.hasPermission(
                LeavePermission.APPROVE_TEAM_LEAVES,
                mockManagerUser,
                'employee-999' // Utilisateur qui n'est pas dans l'équipe
            )).resolves.toBe(false);
        });
    });

    describe('hasPermissions', () => {
        it('devrait vérifier que l\'utilisateur a toutes les permissions (requireAll=true)', async () => {
            // Act & Assert
            // Ces permissions sont toutes accordées à un employé
            await expect(permissionService.hasPermissions(
                [
                    LeavePermission.VIEW_OWN_LEAVES,
                    LeavePermission.REQUEST_LEAVE,
                    LeavePermission.CANCEL_OWN_LEAVE
                ],
                true, // requireAll = true
                mockEmployeeUser
            )).resolves.toBe(true);

            // Ce groupe contient des permissions non accordées à un employé
            await expect(permissionService.hasPermissions(
                [
                    LeavePermission.VIEW_OWN_LEAVES,
                    LeavePermission.APPROVE_TEAM_LEAVES // Non accordée à un employé
                ],
                true, // requireAll = true
                mockEmployeeUser
            )).resolves.toBe(false);
        });

        it('devrait vérifier que l\'utilisateur a au moins une permission (requireAll=false)', async () => {
            // Act & Assert
            // L'employé a VIEW_OWN_LEAVES mais pas APPROVE_TEAM_LEAVES
            await expect(permissionService.hasPermissions(
                [
                    LeavePermission.VIEW_OWN_LEAVES,
                    LeavePermission.APPROVE_TEAM_LEAVES
                ],
                false, // requireAll = false (OR logique)
                mockEmployeeUser
            )).resolves.toBe(true);

            // L'employé n'a aucune de ces permissions
            await expect(permissionService.hasPermissions(
                [
                    LeavePermission.APPROVE_TEAM_LEAVES,
                    LeavePermission.MANAGE_QUOTAS
                ],
                false, // requireAll = false
                mockEmployeeUser
            )).resolves.toBe(false);
        });
    });

    describe('grantPermission', () => {
        it('devrait accorder une permission à un utilisateur', async () => {
            // Arrange
            const mockFetch = jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ success: true })
            });
            global.fetch = mockFetch;

            // Act
            const result = await permissionService.grantPermission(
                'user-123',
                LeavePermission.VIEW_REPORTS
            );

            // Assert
            expect(result).toBe(true);
            expect(mockFetch).toHaveBeenCalledWith(
                '/api/leaves/permissions/user-123/grant',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.any(Object),
                    body: expect.stringContaining(LeavePermission.VIEW_REPORTS)
                })
            );
            expect(auditService.logPermissionChange).toHaveBeenCalledWith(
                expect.any(String), // userId du demandeur
                'user-123', // userId cible
                LeavePermission.VIEW_REPORTS,
                true // granted = true
            );
        });

        it('devrait gérer les erreurs lors de l\'attribution d\'une permission', async () => {
            // Arrange
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            const mockFetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            });
            global.fetch = mockFetch;

            // Act
            const result = await permissionService.grantPermission(
                'user-123',
                LeavePermission.VIEW_REPORTS
            );

            // Assert
            expect(result).toBe(false);
            expect(consoleErrorSpy).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });
    });

    describe('revokePermission', () => {
        it('devrait révoquer une permission d\'un utilisateur', async () => {
            // Arrange
            const mockFetch = jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ success: true })
            });
            global.fetch = mockFetch;

            // Act
            const result = await permissionService.revokePermission(
                'user-123',
                LeavePermission.VIEW_REPORTS
            );

            // Assert
            expect(result).toBe(true);
            expect(mockFetch).toHaveBeenCalledWith(
                '/api/leaves/permissions/user-123/revoke',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.any(Object),
                    body: expect.stringContaining(LeavePermission.VIEW_REPORTS)
                })
            );
            expect(auditService.logPermissionChange).toHaveBeenCalledWith(
                expect.any(String), // userId du demandeur
                'user-123', // userId cible
                LeavePermission.VIEW_REPORTS,
                false // granted = false
            );
        });
    });

    describe('getUserPermissions', () => {
        it('devrait retourner toutes les permissions d\'un utilisateur', async () => {
            // Arrange
            // Utiliser les permissions du rôle MANAGER et les permissions personnalisées
            const mockFetch = jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    rolePermissions: [
                        LeavePermission.VIEW_OWN_LEAVES,
                        LeavePermission.REQUEST_LEAVE,
                        LeavePermission.VIEW_TEAM_LEAVES
                    ],
                    grantedPermissions: [LeavePermission.VIEW_REPORTS],
                    deniedPermissions: [LeavePermission.APPROVE_TEAM_LEAVES]
                })
            });
            global.fetch = mockFetch;

            // Act
            const permissions = await permissionService.getUserPermissions('user-123');

            // Assert
            expect(permissions).toContain(LeavePermission.VIEW_OWN_LEAVES);
            expect(permissions).toContain(LeavePermission.REQUEST_LEAVE);
            expect(permissions).toContain(LeavePermission.VIEW_TEAM_LEAVES);
            expect(permissions).toContain(LeavePermission.VIEW_REPORTS); // Permission accordée spécifiquement
            expect(permissions).not.toContain(LeavePermission.APPROVE_TEAM_LEAVES); // Permission révoquée spécifiquement
        });
    });

    describe('resetUserPermissions', () => {
        it('devrait réinitialiser les permissions personnalisées d\'un utilisateur', async () => {
            // Arrange
            const mockFetch = jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ success: true })
            });
            global.fetch = mockFetch;

            // Act
            const result = await permissionService.resetUserPermissions('user-123');

            // Assert
            expect(result).toBe(true);
            expect(mockFetch).toHaveBeenCalledWith(
                '/api/leaves/permissions/user-123/reset',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.any(Object)
                })
            );
        });
    });
}); 