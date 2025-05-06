import { LeavePermissionService, LeavePermission, LeaveRole } from '../LeavePermissionService';
import { getSession } from 'next-auth/react';
import { User, Role, ExperienceLevel } from '@/types/user';
import { auditService } from '../../services/AuditService';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import AuditService from '@/services/AuditService';

// Mock des dépendances
jest.mock('next-auth/react');
jest.mock('../../services/AuditService', () => ({
    auditService: {
        logPermissionChange: jest.fn().mockResolvedValue(undefined)
    }
}));

// Mock des dépendances externes
jest.mock('@/services/AuditService');

describe('LeavePermissionService', () => {
    let permissionService: LeavePermissionService;
    let mockFetch: jest.Mock;

    // Utilisateurs de test
    const mockEmployeeUser: User = {
        id: 'employee-123',
        prenom: 'Jean',
        nom: 'Dupont',
        email: 'jean.dupont@example.com',
        role: 'UTILISATEUR',
        specialties: [],
        experienceLevel: ExperienceLevel.SENIOR,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const mockManagerUser: User = {
        id: 'manager-456',
        prenom: 'Marie',
        nom: 'Martin',
        email: 'marie.martin@example.com',
        role: 'MANAGER',
        specialties: [],
        experienceLevel: ExperienceLevel.SENIOR,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const mockHrAdminUser: User = {
        id: 'admin-789',
        prenom: 'Pierre',
        nom: 'Petit',
        email: 'pierre.petit@example.com',
        role: 'ADMIN_PARTIEL',
        specialties: [],
        experienceLevel: ExperienceLevel.SENIOR,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const mockSystemAdminUser: User = {
        id: 'admin-total-012',
        prenom: 'Sophie',
        nom: 'Durand',
        email: 'sophie.durand@example.com',
        role: 'ADMIN_TOTAL',
        specialties: [],
        experienceLevel: ExperienceLevel.SENIOR,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    // Mock du service d'audit
    const mockAuditServiceInstance = { logPermissionChange: jest.fn() };
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

        // Mock fetch
        mockFetch = jest.fn();
        global.fetch = mockFetch;
    });

    afterEach(() => {
        jest.resetAllMocks();
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
            const userId = 'user-123';
            const permission = LeavePermission.APPROVE_ALL_LEAVES;
            mockFetch.mockResolvedValueOnce({ // Config spécifique pour ce test
                ok: true,
                json: async () => ({ success: true })
            });

            // Act
            const result = await permissionService.grantPermission(userId, permission);

            // Assert
            expect(result).toBe(true);
            expect(mockFetch).toHaveBeenCalledWith(
                `/api/leaves/permissions/${userId}/grant`,
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ permission })
                })
            );
        });

        it("devrait retourner false si l'API échoue", async () => {
            // Arrange
            const userId = 'user-123';
            const permission = LeavePermission.APPROVE_ALL_LEAVES;
            mockFetch.mockResolvedValueOnce({ // Config spécifique pour l'échec
                ok: false,
                status: 500,
                json: async () => ({ message: 'Server Error' })
            });

            // Act
            const result = await permissionService.grantPermission(userId, permission);

            // Assert
            expect(result).toBe(false);
        });
    });

    describe('revokePermission', () => {
        it('devrait révoquer une permission d\'un utilisateur', async () => {
            // Arrange
            const userId = 'user-123';
            const permission = LeavePermission.APPROVE_ALL_LEAVES;
            mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

            // Act
            const result = await permissionService.revokePermission(userId, permission);

            // Assert
            expect(result).toBe(true);
            expect(mockFetch).toHaveBeenCalledWith(
                `/api/leaves/permissions/${userId}/revoke`,
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ permission })
                })
            );
        });

        it('devrait retourner false si l\'API échoue', async () => {
            // Arrange
            const userId = 'user-123';
            const permission = LeavePermission.APPROVE_ALL_LEAVES;
            mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

            // Act
            const result = await permissionService.revokePermission(userId, permission);

            // Assert
            expect(result).toBe(false);
        });
    });

    describe('getUserPermissions', () => {
        it('devrait retourner toutes les permissions d\'un utilisateur', async () => {
            // Arrange
            const userId = 'user-123';
            const expectedPermissions = [
                LeavePermission.VIEW_OWN_LEAVES,
                LeavePermission.REQUEST_LEAVE,
                LeavePermission.VIEW_TEAM_LEAVES,
                LeavePermission.VIEW_REPORTS // Permission accordée spécifiquement
            ];
            mockFetch.mockResolvedValueOnce({ // Config spécifique
                ok: true,
                json: async () => ({ permissions: expectedPermissions })
            });

            // Act
            const permissions = await permissionService.getUserPermissions(userId);

            // Assert
            expect(mockFetch).toHaveBeenCalledWith(`/api/leaves/permissions/${userId}`);
            expect(permissions).toEqual(expectedPermissions);
        });

        it('devrait retourner un tableau vide si l\'API échoue', async () => {
            // Arrange
            const userId = 'user-123';
            mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

            // Act
            const permissions = await permissionService.getUserPermissions(userId);

            // Assert
            expect(permissions).toEqual([]);
        });
    });

    describe('resetUserPermissions', () => {
        it('devrait réinitialiser les permissions personnalisées d\'un utilisateur', async () => {
            // Arrange
            const userId = 'user-123';
            mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

            // Act
            const result = await permissionService.resetUserPermissions(userId);

            // Assert
            expect(result).toBe(true);
            expect(mockFetch).toHaveBeenCalledWith(
                `/api/leaves/permissions/${userId}/reset`,
                expect.objectContaining({ method: 'POST' })
            );
        });

        it('devrait retourner false si l\'API échoue', async () => {
            // Arrange
            const userId = 'user-123';
            mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

            // Act
            const result = await permissionService.resetUserPermissions(userId);

            // Assert
            expect(result).toBe(false);
        });
    });
}); 