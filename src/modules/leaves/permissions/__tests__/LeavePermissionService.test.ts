import { LeavePermissionService, LeavePermission, LeaveRole } from '../LeavePermissionService';
import { getSession, GetSessionParams } from 'next-auth/react';
import { User, Role, ExperienceLevel } from '@/types/user';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Session } from "next-auth";
import { AuditActionType as RealAuditActionType, AuditSeverity as RealAuditSeverity, AuditEntry as RealAuditEntry, AuditService as RealAuditServiceType } from '../../services/AuditService';

// Définir le type pour l'argument de createAuditEntry
type CreateAuditEntryArg = Omit<RealAuditEntry, 'id' | 'timestamp'>;

// Mock des dépendances
jest.mock('../../services/AuditService', () => {
    const originalModule = jest.requireActual('../../services/AuditService') as typeof import('../../services/AuditService');
    return {
        __esModule: true,
        // Exporter les types/enums réels
        AuditActionType: originalModule.AuditActionType,
        AuditSeverity: originalModule.AuditSeverity,
        // Mocker seulement l'instance du service auditService
        auditService: {
            logPermissionChange: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
            // Typer explicitement jest.fn pour createAuditEntry
            createAuditEntry: jest.fn<(entry: CreateAuditEntryArg) => Promise<RealAuditEntry>>()
                .mockImplementation((entry) => { // entry est maintenant correctement typé comme CreateAuditEntryArg
                    return Promise.resolve({
                        id: 'mock-audit-id',
                        timestamp: new Date(),
                        ...entry,
                    });
                }),
        }
    };
});

// Mock des dépendances externes
// jest.mock('@/services/AuditService'); // Ce mock est plus général et pourrait interférer. Celui ci-dessus est plus spécifique.
// Si @/services/AuditService est le même que ../../services/AuditService, alors un seul mock est nécessaire.
// Je vais commenter celui-ci pour l'instant car le chemin relatif est plus précis pour le test actuel.

describe('LeavePermissionService', () => {
    let permissionService: LeavePermissionService;
    let mockFetch: jest.Mock<typeof global.fetch>;

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

        // Préparer l'utilisateur pour la session avec le type Role correct
        const sessionUser = {
            ...mockEmployeeUser,
            id: mockEmployeeUser.id,
            role: 'USER' as Role
        };

        // getSession est notre mock manuel (un jest.fn()), il faut le caster pour utiliser mockImplementation
        (getSession as jest.Mock).mockImplementation(() => Promise.resolve({
            user: sessionUser,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            accessToken: 'mock-access-token'
        } as Session | null));

        // Mock fetch
        mockFetch = jest.fn() as jest.Mock<typeof global.fetch>;
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
                .mockImplementation(async (userId: unknown, managerId: unknown) => {
                    // Simuler que l'utilisateur 'employee-123' est dans l'équipe du manager 'manager-456'
                    return userId === 'employee-123' && managerId === 'manager-456';
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
            const userId = 'test-user';
            const permissionToGrant = LeavePermission.VIEW_REPORTS;
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true })
            } as Response);

            // Act
            const result = await permissionService.grantPermission(userId, permissionToGrant);

            // Assert
            expect(result).toBe(true);
            expect(mockFetch).toHaveBeenCalledWith(
                `/api/conges/permissions/${userId}/grant`,
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ permission: permissionToGrant })
                })
            );
        });

        it('devrait retourner false si l\'API échoue', async () => {
            // Arrange
            const userId = 'test-user';
            const permissionToGrant = LeavePermission.VIEW_REPORTS;
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: () => Promise.resolve({ message: 'API Error' })
            } as Response);

            const getCurrentUserSpy = jest.spyOn(permissionService as any, 'getCurrentUser').mockResolvedValue(mockManagerUser);

            const hasPermissionSpy = jest.spyOn(permissionService, 'hasPermission')
                .mockImplementation(async (permission: LeavePermission, user?: User) => {
                    if (user?.id === mockManagerUser.id && permission === LeavePermission.MANAGE_LEAVE_RULES) {
                        return true; // Permettre de passer la garde pour ce test
                    }
                    // Pour tous les autres appels à hasPermission durant ce test spécifique, retourner false.
                    // Cela isole la logique que nous testons (l'échec de fetch).
                    return false;
                });

            // Act
            const result = await permissionService.grantPermission(userId, permissionToGrant);

            // Assert
            expect(result).toBe(false);
            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(mockAuditServiceInstance.logPermissionChange).toHaveBeenCalledWith(
                expect.anything(), // AuditActionType.PERMISSION_GRANT_FAILED - utiliser expect.anything() pour l'instant
                expect.stringContaining('Échoué (API: 500)'),
                expect.anything(), // AuditSeverity.ERROR - utiliser expect.anything() pour l'instant
                expect.objectContaining({ userId, permission: permissionToGrant, granterId: mockManagerUser.id })
            );

            // Restaurer les spies
            getCurrentUserSpy.mockRestore();
            hasPermissionSpy.mockRestore();
        });
    });

    describe('revokePermission', () => {
        it('devrait révoquer une permission d\'un utilisateur', async () => {
            // Arrange
            const userId = 'test-user';
            const permissionToRevoke = LeavePermission.VIEW_REPORTS;
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true })
            } as Response);

            // Act
            const result = await permissionService.revokePermission(userId, permissionToRevoke);

            // Assert
            expect(result).toBe(true);
            expect(mockFetch).toHaveBeenCalledWith(
                `/api/conges/permissions/${userId}/revoke`,
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ permission: permissionToRevoke })
                })
            );
        });

        it('devrait retourner false si l\'API échoue', async () => {
            // Arrange
            const userId = 'test-user';
            const permissionToRevoke = LeavePermission.VIEW_REPORTS;
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: () => Promise.resolve({ message: 'API Error' })
            } as Response);

            const getCurrentUserSpy = jest.spyOn(permissionService as any, 'getCurrentUser').mockResolvedValue(mockManagerUser);
            const hasPermissionSpy = jest.spyOn(permissionService, 'hasPermission')
                .mockImplementation(async (permission: LeavePermission, user?: User) => {
                    if (user?.id === mockManagerUser.id && permission === LeavePermission.MANAGE_LEAVE_RULES) {
                        return true;
                    }
                    return false;
                });

            // Act
            const result = await permissionService.revokePermission(userId, permissionToRevoke);

            // Assert
            expect(result).toBe(false);
            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(mockAuditServiceInstance.logPermissionChange).toHaveBeenCalledWith(
                expect.anything(),
                expect.stringContaining('Échoué (API: 500)'),
                expect.anything(),
                expect.objectContaining({ userId, permission: permissionToRevoke, granterId: mockManagerUser.id })
            );
            getCurrentUserSpy.mockRestore();
            hasPermissionSpy.mockRestore();
        });
    });

    describe('getUserPermissions', () => {
        it('devrait retourner toutes les permissions d\'un utilisateur', async () => {
            // Arrange
            const userId = 'test-user';
            const mockPermissions = [LeavePermission.VIEW_REPORTS, LeavePermission.REQUEST_LEAVE];
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ permissions: mockPermissions })
            } as Response);

            // Act
            const permissions = await permissionService.getUserPermissions(userId);

            // Assert
            expect(mockFetch).toHaveBeenCalledWith(`/api/utilisateurs/${userId}`);
            expect(permissions).toEqual(mockPermissions);
        });

        it('devrait retourner un tableau vide si l\'API échoue', async () => {
            // Arrange
            const userId = 'test-user';
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: () => Promise.resolve({ message: 'API Error' })
            } as Response);
            // Pas besoin de getCurrentUserSpy ou hasPermissionSpy si la méthode getUserPermissions
            // ne vérifie pas les droits de l'appelant de cette manière.

            // Act
            const permissions = await permissionService.getUserPermissions(userId);

            // Assert
            expect(permissions).toEqual([]);
            // Ajouter une vérification pour log d'audit si getUserPermissions en fait un en cas d'échec.
            // D'après le code du service, il ne semble pas le faire, il logue seulement en cas d'erreur interne.
        });
    });

    describe('resetUserPermissions', () => {
        // Mise en place des mocks nécessaires pour les tests
        let getCurrentUserSpy: jest.SpyInstance;
        let hasPermissionSpy: jest.SpyInstance;

        beforeEach(() => {
    jest.clearAllMocks();
            // Configurer le mock getCurrentUser pour renvoyer l'utilisateur manager
            getCurrentUserSpy = jest.spyOn(permissionService as any, 'getCurrentUser')
                .mockResolvedValue(mockManagerUser);

            // Configurer hasPermission pour autoriser la réinitialisation des permissions
            hasPermissionSpy = jest.spyOn(permissionService, 'hasPermission')
                .mockImplementation(async (permission: LeavePermission, user?: User) => {
                    if (user?.id === mockManagerUser.id && permission === LeavePermission.MANAGE_LEAVE_RULES) {
                        return true;
                    }
                    return false;
                });
        });

        afterEach(() => {
            getCurrentUserSpy.mockRestore();
            hasPermissionSpy.mockRestore();
        });

        it('devrait réinitialiser les permissions personnalisées d\'un utilisateur', async () => {
            // Arrange
            const userId = 'custom-user-123'; // Un utilisateur avec des permissions personnalisées
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true })
            } as Response);

            // Act
            const result = await permissionService.resetUserPermissions(userId);

            // Assert
            expect(result).toBe(true);
            expect(mockFetch).toHaveBeenCalledWith(
                `/api/conges/permissions/${userId}/reset`,
                expect.objectContaining({ method: 'POST' })
            );
        });

        it('devrait retourner false si l\'API échoue', async () => {
            // Arrange
            const userId = 'test-user';
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: () => Promise.resolve({ message: 'API Error' })
            } as Response);

            // Act
            const result = await permissionService.resetUserPermissions(userId);

            // Assert
            expect(result).toBe(false);
            expect(mockAuditServiceInstance.logPermissionChange).toHaveBeenCalledWith(
                expect.anything(), // AuditActionType.PERMISSION_RESET_FAILED
                expect.stringContaining('Échoué (API: 500)'),
                expect.anything(), // AuditSeverity.ERROR
                expect.objectContaining({ userId, granterId: mockManagerUser.id })
            );
        });
    });
}); 