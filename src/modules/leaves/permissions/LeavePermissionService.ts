/**
 * Service de gestion des permissions pour le module de congés
 * Permet un contrôle d'accès granulaire aux fonctionnalités du module
 */

import { User } from '@/types/user';
import { eventBus, IntegrationEventType } from '../../integration/services/EventBusService';
import { auditService, AuditActionType, AuditSeverity } from '../services/AuditService';
import { getSession } from 'next-auth/react';
import { PermissionCacheService } from '../../../modules/conges/permissions/PermissionCacheService';

/**
 * Permissions disponibles pour le module de congés
 */
export enum LeavePermission {
    // Permissions de base
    VIEW_OWN_LEAVES = 'leaves.view.own',           // Voir ses propres congés
    REQUEST_LEAVE = 'leaves.request',              // Demander un congé
    CANCEL_OWN_LEAVE = 'leaves.cancel.own',        // Annuler ses propres congés

    // Permissions de gestion d'équipe
    VIEW_TEAM_LEAVES = 'leaves.view.team',         // Voir les congés de son équipe
    APPROVE_TEAM_LEAVES = 'leaves.approve.team',   // Approuver les congés de son équipe

    // Permissions de département
    VIEW_DEPARTMENT_LEAVES = 'leaves.view.department', // Voir les congés du département
    APPROVE_DEPARTMENT_LEAVES = 'leaves.approve.department', // Approuver les congés du département

    // Permissions administratives
    VIEW_ALL_LEAVES = 'leaves.view.all',           // Voir tous les congés
    APPROVE_ALL_LEAVES = 'leaves.approve.all',     // Approuver tous les congés
    CANCEL_ANY_LEAVE = 'leaves.cancel.any',        // Annuler n'importe quel congé
    DELETE_LEAVE = 'leaves.delete',                // Supprimer des congés
    MANAGE_QUOTAS = 'leaves.quotas.manage',        // Gérer les quotas de congés
    TRANSFER_QUOTAS = 'leaves.quotas.transfer',    // Transférer des quotas
    CARRY_OVER_QUOTAS = 'leaves.quotas.carryover', // Reporter des quotas

    // Permissions de configuration
    MANAGE_LEAVE_TYPES = 'leaves.types.manage',    // Gérer les types de congés
    MANAGE_LEAVE_RULES = 'leaves.rules.manage',    // Gérer les règles de congés

    // Permissions de rapports
    VIEW_REPORTS = 'leaves.reports.view',          // Voir les rapports
    EXPORT_REPORTS = 'leaves.reports.export',      // Exporter les rapports

    // Permissions d'audit
    VIEW_AUDIT_LOGS = 'leaves.audit.view'          // Voir les journaux d'audit
}

/**
 * Rôles prédéfinis pour le module de congés
 */
export enum LeaveRole {
    EMPLOYEE = 'EMPLOYEE',               // Employé standard
    TEAM_MANAGER = 'TEAM_MANAGER',       // Manager d'équipe
    DEPARTMENT_MANAGER = 'DEPARTMENT_MANAGER', // Manager de département
    HR_STAFF = 'HR_STAFF',               // Personnel RH
    HR_ADMIN = 'HR_ADMIN',               // Administrateur RH
    SYSTEM_ADMIN = 'SYSTEM_ADMIN'        // Administrateur système
}

// Définir d'abord des permissions par rôle individuellement
const EMPLOYEE_PERMISSIONS: LeavePermission[] = [
    LeavePermission.VIEW_OWN_LEAVES,
    LeavePermission.REQUEST_LEAVE,
    LeavePermission.CANCEL_OWN_LEAVE
];

const TEAM_MANAGER_PERMISSIONS: LeavePermission[] = [
    ...EMPLOYEE_PERMISSIONS,
    LeavePermission.VIEW_TEAM_LEAVES,
    LeavePermission.APPROVE_TEAM_LEAVES
];

const DEPARTMENT_MANAGER_PERMISSIONS: LeavePermission[] = [
    ...TEAM_MANAGER_PERMISSIONS,
    LeavePermission.VIEW_DEPARTMENT_LEAVES,
    LeavePermission.APPROVE_DEPARTMENT_LEAVES
];

const HR_STAFF_PERMISSIONS: LeavePermission[] = [
    ...EMPLOYEE_PERMISSIONS,
    LeavePermission.VIEW_ALL_LEAVES,
    LeavePermission.VIEW_REPORTS,
    LeavePermission.EXPORT_REPORTS
];

const HR_ADMIN_PERMISSIONS: LeavePermission[] = [
    ...EMPLOYEE_PERMISSIONS,
    LeavePermission.VIEW_ALL_LEAVES,
    LeavePermission.APPROVE_ALL_LEAVES,
    LeavePermission.CANCEL_ANY_LEAVE,
    LeavePermission.MANAGE_QUOTAS,
    LeavePermission.TRANSFER_QUOTAS,
    LeavePermission.CARRY_OVER_QUOTAS,
    LeavePermission.VIEW_REPORTS,
    LeavePermission.EXPORT_REPORTS,
    LeavePermission.VIEW_AUDIT_LOGS
];

const SYSTEM_ADMIN_PERMISSIONS: LeavePermission[] = [
    ...HR_ADMIN_PERMISSIONS,
    LeavePermission.DELETE_LEAVE,
    LeavePermission.MANAGE_LEAVE_TYPES,
    LeavePermission.MANAGE_LEAVE_RULES
];

/**
 * Mappage des rôles aux permissions
 */
const ROLE_PERMISSIONS: Record<LeaveRole | string, LeavePermission[]> = {
    [LeaveRole.EMPLOYEE]: EMPLOYEE_PERMISSIONS,
    [LeaveRole.TEAM_MANAGER]: TEAM_MANAGER_PERMISSIONS,
    [LeaveRole.DEPARTMENT_MANAGER]: DEPARTMENT_MANAGER_PERMISSIONS,
    [LeaveRole.HR_STAFF]: HR_STAFF_PERMISSIONS,
    [LeaveRole.HR_ADMIN]: HR_ADMIN_PERMISSIONS,
    [LeaveRole.SYSTEM_ADMIN]: SYSTEM_ADMIN_PERMISSIONS,

    // Rôles existants dans le système
    'ADMIN_TOTAL': SYSTEM_ADMIN_PERMISSIONS,
    'ADMIN_PARTIEL': HR_ADMIN_PERMISSIONS,
    'MANAGER': TEAM_MANAGER_PERMISSIONS,
    'UTILISATEUR': EMPLOYEE_PERMISSIONS
};

/**
 * Structure de cache pour les vérifications de permission
 */
interface PermissionCacheEntry {
    result: boolean;
    timestamp: number;
}

/**
 * Configuration du cache
 */
interface PermissionCacheConfig {
    enabled: boolean;
    ttlMs: number;  // Durée de vie des entrées en millisecondes
    maxSize: number; // Taille maximale du cache
}

/**
 * Clé de cache pour les vérifications de permission
 */
type PermissionCacheKey = string;

/**
 * Permissions personnalisées par utilisateur
 */
interface UserCustomPermissions {
    userId: string;
    grantedPermissions: LeavePermission[];
    deniedPermissions: LeavePermission[];
}

/**
 * Service principal de gestion des permissions pour les congés
 */
export class LeavePermissionService {
    private static instance: LeavePermissionService;
    private customPermissions: Map<string, UserCustomPermissions> = new Map();
    private permissionsLoaded: boolean = false;
    private readonly debug: boolean = process.env.NODE_ENV === 'development';

    // Nouveau service de cache à deux niveaux
    private permissionCache = PermissionCacheService.getInstance();

    // Statistiques de cache legacy à maintenir pour compatibilité
    private cacheStats = {
        hits: 0,
        misses: 0,
        evictions: 0
    };

    /**
     * Configuration du service de cache de permissions
     */
    private cacheConfig = {
        local: {
            enabled: true,
            ttlMs: 300000, // 5 minutes
            maxSize: 1000,
            preloadingEnabled: true
        },
        distributed: {
            enabled: true,
            keyPrefix: 'leave-permissions:',
            ttlMs: 600000, // 10 minutes
            storageKey: 'leave-permissions-cache',
            compressionEnabled: true,
            syncInterval: 60000 // 1 minute
        }
    };

    /**
     * Obtenir l'instance du service (Singleton)
     */
    public static getInstance(): LeavePermissionService {
        if (!LeavePermissionService.instance) {
            LeavePermissionService.instance = new LeavePermissionService();
        }
        return LeavePermissionService.instance;
    }

    /**
     * Constructeur privé
     */
    private constructor() {
        // Configurer le cache
        this.permissionCache.configure({
            localCache: {
                enabled: true,
                ttlMs: 5 * 60 * 1000,
                maxSize: 2000,
                preloadingEnabled: true
            },
            distributedCache: {
                enabled: true,
                ttlMs: 30 * 60 * 1000,
                keyPrefix: 'perm:',
                storageKey: 'permissionCache',
                compressionEnabled: true,
                compressionThreshold: 10240,
                synchronizationInterval: 60 * 1000,
            },
            prefetchedPermissions: [
                // Les permissions les plus couramment utilisées
                LeavePermission.VIEW_OWN_LEAVES,
                LeavePermission.REQUEST_LEAVE,
                LeavePermission.CANCEL_OWN_LEAVE,
                LeavePermission.VIEW_TEAM_LEAVES
            ]
        });

        // Charger les permissions personnalisées
        this.loadCustomPermissions();

        // S'abonner aux événements qui pourraient invalider le cache
        this.subscribeToEvents();
    }

    /**
     * S'abonner aux événements qui pourraient invalider le cache
     */
    private subscribeToEvents(): void {
        // S'abonner aux événements de modification de permissions
        eventBus.subscribe(IntegrationEventType.AUDIT_ACTION, (event) => {
            const { payload } = event;
            if (
                payload.actionType === AuditActionType.PERMISSION_GRANTED ||
                payload.actionType === AuditActionType.PERMISSION_REVOKED ||
                payload.actionType === AuditActionType.USER_ROLE_CHANGED
            ) {
                // Invalider le cache pour l'utilisateur concerné
                this.invalidateUserCache(payload.targetId);

                if (this.debug) {
                    console.debug(`[LeavePermissionService] Cache invalidated for user ${payload.targetId} due to permission change`);
                }
            }
        });
    }

    /**
     * Configurer le cache
     */
    public configureCache(config: Partial<PermissionCacheConfig>): void {
        // PermissionCacheConfig ne semble concerner que le cache local.
        // Le cache distribué est configuré dans le constructeur du service.
        this.permissionCache.configure({
            localCache: {
                enabled: config.enabled ?? this.cacheConfig.local?.enabled ?? true,
                ttlMs: config.ttlMs ?? this.cacheConfig.local?.ttlMs ?? 5 * 60 * 1000,
                maxSize: config.maxSize ?? this.cacheConfig.local?.maxSize ?? 1000,
                // preloadingEnabled n'est pas dans PermissionCacheConfig, mais dans this.cacheConfig.local
                // donc on l'utilise depuis this.cacheConfig.local ou une valeur par défaut pour le service PermissionCache.
                preloadingEnabled: this.cacheConfig.local?.preloadingEnabled ?? true
            },
            // Ne pas tenter de configurer le cache distribué ici si PermissionCacheConfig ne le couvre pas.
            // Si le service de cache le permet, on pourrait passer config.distributedCache directement :
            // distributedCache: config.distributedCache ?? { ... valeurs par défaut ... }
            // Mais config n'a pas de propriété distributedCache.
        });

        if (this.debug) {
            console.debug('[LeavePermissionService] Cache configuration updated');
        }
    }

    /**
     * Activer ou désactiver le cache
     */
    public setCacheEnabled(enabled: boolean): void {
        this.permissionCache.configure({
            localCache: {
                enabled,
                ttlMs: this.cacheConfig.local.ttlMs,
                maxSize: this.cacheConfig.local.maxSize,
                preloadingEnabled: this.cacheConfig.local.preloadingEnabled
            },
            distributedCache: {
                enabled,
                keyPrefix: this.cacheConfig.distributed.keyPrefix,
                ttlMs: this.cacheConfig.distributed.ttlMs,
                storageKey: this.cacheConfig.distributed.storageKey,
                compressionEnabled: this.cacheConfig.distributed.compressionEnabled,
                compressionThreshold: 10240,
                synchronizationInterval: this.cacheConfig.distributed.syncInterval
            }
        });
        if (!enabled) {
            this.clearCache();
        }
        if (this.debug) {
            console.debug(`[LeavePermissionService] Cache ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    /**
     * Vider le cache
     */
    public clearCache(): void {
        this.permissionCache.clear();

        if (this.debug) {
            console.debug(`[LeavePermissionService] Cache cleared`);
        }
    }

    /**
     * Invalider le cache pour un utilisateur spécifique
     */
    public invalidateUserCache(userId: string): void {
        const count = this.permissionCache.invalidateByPrefix(`userId=${userId}`);

        if (this.debug && count > 0) {
            console.debug(`[LeavePermissionService] Invalidated ${count} cache entries for user ${userId}`);
        }
    }

    /**
     * Obtenir les statistiques du cache
     */
    public getCacheStats(): {
        size: number,
        hits: number,
        misses: number,
        evictions: number,
        hitRate: number,
        enabled: boolean
    } {
        const newStats = this.permissionCache.getStats();

        // Mise à jour des statistiques legacy pour compatibilité
        this.cacheStats.hits = newStats.localHits + newStats.distributedHits;
        this.cacheStats.misses = newStats.misses;
        this.cacheStats.evictions = newStats.localEvictions;

        const totalRequests = this.cacheStats.hits + this.cacheStats.misses;
        const hitRate = totalRequests > 0 ? this.cacheStats.hits / totalRequests : 0;

        return {
            size: newStats.localCacheSize,
            hits: this.cacheStats.hits,
            misses: this.cacheStats.misses,
            evictions: this.cacheStats.evictions,
            hitRate,
            enabled: this.isPermissionCacheEnabled()
        };
    }

    /**
     * Vérifie si le cache de permissions est activé
     */
    private isPermissionCacheEnabled(): boolean {
        // Vérifier si au moins un niveau de cache est activé
        const stats = this.permissionCache.getStats();
        return stats.hitRate > 0; // Un raccourci pour vérifier si le cache est actif
    }

    /**
     * Générer une clé de cache pour une vérification de permission
     */
    private generateCacheKey(
        permission: LeavePermission,
        userId: string,
        targetUserId?: string,
        targetDepartmentId?: string
    ): PermissionCacheKey {
        return `permission=${permission}|userId=${userId}|targetUser=${targetUserId || ''}|targetDept=${targetDepartmentId || ''}`;
    }

    /**
     * Nettoyer le cache si nécessaire (méthode de compatibilité)
     */
    private checkAndCleanCache(): void {
        // Cette méthode n'est plus nécessaire, le nouveau service s'en charge
        // Mais on la garde pour compatibilité
    }

    /**
     * Vérifier si une permission est dans le cache
     */
    private checkPermissionCache(
        permission: LeavePermission,
        userId: string,
        targetUserId?: string,
        targetDepartmentId?: string
    ): { found: boolean, result: boolean } {
        if (!this.isPermissionCacheEnabled()) {
            return { found: false, result: false };
        }

        const cacheKey = this.generateCacheKey(permission, userId, targetUserId, targetDepartmentId);
        const cacheResult = this.permissionCache.get<boolean>(cacheKey);

        if (cacheResult.value !== null) {
            return { found: true, result: cacheResult.value };
        }

        return { found: false, result: false };
    }

    /**
     * Mettre en cache le résultat d'une vérification de permission
     */
    private cachePermissionResult(
        permission: LeavePermission,
        userId: string,
        result: boolean,
        targetUserId?: string,
        targetDepartmentId?: string
    ): void {
        if (!this.isPermissionCacheEnabled()) {
            return;
        }

        const cacheKey = this.generateCacheKey(permission, userId, targetUserId, targetDepartmentId);
        this.permissionCache.set(cacheKey, result);
    }

    /**
     * Charger les permissions personnalisées depuis l'API
     */
    private async loadCustomPermissions(): Promise<void> {
        if (this.permissionsLoaded) return;

        try {
            const response = await fetch('http://localhost:3000/api/conges/permissions');
            if (!response.ok) {
                throw new Error(`Erreur lors du chargement des permissions: ${response.statusText}`);
            }

            const data = await response.json();

            // Initialiser la map des permissions personnalisées
            this.customPermissions.clear();

            // Ajouter chaque ensemble de permissions personnalisées
            data.forEach((userPerms: UserCustomPermissions) => {
                this.customPermissions.set(userPerms.userId, userPerms);
            });

            this.permissionsLoaded = true;

            // Vider le cache après le chargement de nouvelles permissions
            this.clearCache();

            if (this.debug) {
                console.debug('[LeavePermissionService] Custom permissions loaded', this.customPermissions.size);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des permissions personnalisées:', error);
        }
    }

    /**
     * Obtenir l'utilisateur actuel via next-auth
     */
    private async getCurrentUser(): Promise<User | null> {
        try {
            const session = await getSession();
            if (!session?.user) {
                return null;
            }

            const sessionUser = session.user as any; // Pour un accès flexible aux propriétés optionnelles
            const userName = sessionUser.name || '';
            const nameParts = userName.split(' ');
            const prenom = nameParts[0] || '';
            const nom = nameParts.slice(1).join(' ') || '';

            const userObject: User = {
                id: String(sessionUser.id), // Assurer string
                email: String(sessionUser.email || ''), // Assurer string, valeur par défaut
                nom: nom,
                prenom: prenom,
                role: sessionUser.role as User['role'], // Adapter au type Role de User
                createdAt: sessionUser.createdAt ? new Date(sessionUser.createdAt) : new Date(),
                updatedAt: sessionUser.updatedAt ? new Date(sessionUser.updatedAt) : new Date(),
                isActive: typeof sessionUser.isActive === 'boolean' ? sessionUser.isActive : true,
                departmentId: sessionUser.departmentId || null,
            };

            return userObject;
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'utilisateur actuel:', error);
            return null;
        }
    }

    /**
     * Vérifier si un utilisateur a une permission spécifique
     * @param permission Permission à vérifier
     * @param user Utilisateur (optionnel, utilisera l'utilisateur actuel si non fourni)
     * @param targetUserId ID de l'utilisateur cible pour les permissions relatives (optionnel)
     * @param targetDepartmentId ID du département cible pour les permissions relatives (optionnel)
     */
    public async hasPermission(
        permission: LeavePermission,
        user?: User,
        targetUserId?: string,
        targetDepartmentId?: string
    ): Promise<boolean> {
        try {
            // Générer une clé de cache unique pour cette vérification de permission
            const cacheKey = this.generateCacheKey(permission, user?.id || '', targetUserId, targetDepartmentId);

            // Vérifier si le résultat est déjà en cache
            const cachedResult = await this.permissionCache.get(cacheKey);

            // Si nous avons un résultat en cache valide, l'utiliser
            if (cachedResult && cachedResult.value !== null) {
                return cachedResult.value as boolean; // Cast en boolean
            }

            // Utiliser l'utilisateur fourni ou récupérer l'utilisateur actuel
            const currentUser = user || await this.getCurrentUser();

            // Si aucun utilisateur n'est disponible, refuser l'accès
            if (!currentUser) {
                return false;
            }

            // Vérifier si les permissions personnalisées sont chargées
            if (!this.permissionsLoaded) {
                await this.loadCustomPermissions();
            }

            // Vérifier les permissions personnalisées
            const customUserPerms = this.customPermissions.get(currentUser.id);

            // Vérifier si la permission est explicitement refusée pour cet utilisateur
            if (customUserPerms?.deniedPermissions.includes(permission)) {
                // Mettre en cache le résultat négatif
                this.cachePermissionResult(permission, currentUser.id, false, targetUserId, targetDepartmentId);
                return false;
            }

            // Vérifier si la permission est explicitement accordée pour cet utilisateur
            if (customUserPerms?.grantedPermissions.includes(permission)) {
                // Mettre en cache le résultat positif
                this.cachePermissionResult(permission, currentUser.id, true, targetUserId, targetDepartmentId);
                return true;
            }

            // Vérifier les permissions basées sur le rôle
            const rolePermissions = ROLE_PERMISSIONS[currentUser.role] || [];
            if (rolePermissions.includes(permission)) {
                // Pour les permissions relatives, vérifier des conditions supplémentaires
                if (this.isRelativePermission(permission)) {
                    const result = await this.checkRelativePermission(permission, currentUser, targetUserId, targetDepartmentId);

                    // Mettre en cache le résultat
                    this.cachePermissionResult(permission, currentUser.id, result, targetUserId, targetDepartmentId);

                    return result;
                }

                // Mettre en cache le résultat positif
                this.cachePermissionResult(permission, currentUser.id, true, targetUserId, targetDepartmentId);
                return true;
            }

            // Mettre en cache le résultat négatif
            this.cachePermissionResult(permission, currentUser.id, false, targetUserId, targetDepartmentId);
            return false;
        } catch (error) {
            console.error(`Erreur lors de la vérification de la permission ${permission}:`, error);
            return false;
        }
    }

    /**
     * Vérifier si une permission est relative (dépend d'un utilisateur ou département cible)
     */
    private isRelativePermission(permission: LeavePermission): boolean {
        return [
            LeavePermission.VIEW_TEAM_LEAVES,
            LeavePermission.APPROVE_TEAM_LEAVES,
            LeavePermission.VIEW_DEPARTMENT_LEAVES,
            LeavePermission.APPROVE_DEPARTMENT_LEAVES
        ].includes(permission);
    }

    /**
     * Vérifier une permission relative
     */
    private async checkRelativePermission(
        permission: LeavePermission,
        user: User,
        targetUserId?: string,
        targetDepartmentId?: string
    ): Promise<boolean> {
        switch (permission) {
            case LeavePermission.VIEW_TEAM_LEAVES:
            case LeavePermission.APPROVE_TEAM_LEAVES:
                // Vérifier si l'utilisateur cible est dans l'équipe de l'utilisateur actuel
                if (targetUserId) {
                    return this.isUserInTeam(targetUserId, user.id);
                }
                return true;

            case LeavePermission.VIEW_DEPARTMENT_LEAVES:
            case LeavePermission.APPROVE_DEPARTMENT_LEAVES:
                // Vérifier si l'utilisateur cible est dans le département de l'utilisateur actuel
                if (targetDepartmentId) {
                    // Correction: utiliser 'departmentId'
                    return user.departmentId === targetDepartmentId;
                } else if (targetUserId) {
                    return this.isUserInSameDepartment(targetUserId, user.id);
                }
                return true;

            default:
                return false;
        }
    }

    /**
     * Vérifier si un utilisateur est dans l'équipe d'un manager
     */
    private async isUserInTeam(userId: string, managerId: string): Promise<boolean> {
        try {
            const response = await fetch(`http://localhost:3000/api/utilisateurs/${userId}/manager`);
            if (!response.ok) {
                return false;
            }

            const data = await response.json();
            return data.managerId === managerId;
        } catch (error) {
            console.error('Erreur lors de la vérification d\'appartenance à l\'équipe:', error);
            return false;
        }
    }

    /**
     * Vérifier si deux utilisateurs sont dans le même département
     */
    private async isUserInSameDepartment(userId1: string, userId2: string): Promise<boolean> {
        try {
            const response1 = await fetch(`http://localhost:3000/api/utilisateurs/${userId1}`);
            const response2 = await fetch(`http://localhost:3000/api/utilisateurs/${userId2}`);

            if (!response1.ok || !response2.ok) {
                return false;
            }

            const user1 = await response1.json();
            const user2 = await response2.json();

            return user1.departmentId === user2.departmentId;
        } catch (error) {
            console.error('Erreur lors de la vérification d\'appartenance au département:', error);
            return false;
        }
    }

    /**
     * Vérifier plusieurs permissions à la fois
     * @param permissions Liste des permissions à vérifier
     * @param requireAll Si toutes les permissions sont requises (AND) ou juste une (OR)
     * @param user Utilisateur (optionnel, utilisera l'utilisateur actuel si non fourni)
     */
    public async hasPermissions(
        permissions: LeavePermission[],
        requireAll: boolean = true,
        user?: User
    ): Promise<boolean> {
        const currentUser = user || await this.getCurrentUser();
        if (!currentUser) {
            return false;
        }
        const permissionsKey = permissions.join(',');
        const cacheKey = `permissions=${permissionsKey}|requireAll=${requireAll}|userId=${currentUser.id}`;
        const cacheEntry = this.permissionCache.get<boolean>(cacheKey);
        if (cacheEntry && cacheEntry.value != null) {
            this.cacheStats.hits++;
            return cacheEntry.value as boolean;
        }
        // Miss de cache
        this.cacheStats.misses++;

        // Vérifier chaque permission
        let result: boolean;
        for (const permission of permissions) {
            const hasPermission = await this.hasPermission(permission, currentUser);

            // Si requireAll est true (AND), retourner false dès qu'une permission manque
            // Si requireAll est false (OR), retourner true dès qu'une permission est présente
            if (requireAll && !hasPermission) {
                // Mettre en cache le résultat négatif
                if (this.isPermissionCacheEnabled()) {
                    const permissionsKey = permissions.join(',');
                    const cacheKey = `permissions=${permissionsKey}|requireAll=${requireAll}|userId=${currentUser.id}`;
                    this.permissionCache.set(cacheKey, false);
                }
                return false;
            } else if (!requireAll && hasPermission) {
                // Mettre en cache le résultat positif
                if (this.isPermissionCacheEnabled()) {
                    const permissionsKey = permissions.join(',');
                    const cacheKey = `permissions=${permissionsKey}|requireAll=${requireAll}|userId=${currentUser.id}`;
                    this.permissionCache.set(cacheKey, true);
                }
                return true;
            }
        }

        // Si on arrive ici et requireAll est true, toutes les permissions sont présentes
        // Si on arrive ici et requireAll est false, aucune permission n'est présente
        result = requireAll;

        // Mettre en cache le résultat final
        if (this.isPermissionCacheEnabled()) {
            const permissionsKey = permissions.join(',');
            const cacheKey = `permissions=${permissionsKey}|requireAll=${requireAll}|userId=${currentUser.id}`;
            this.permissionCache.set(cacheKey, result);
        }

        return result;
    }

    /**
     * Accorder une permission spécifique à un utilisateur
     */
    public async grantPermission(userId: string, permission: LeavePermission): Promise<boolean> {
        console.log(`[DEBUG] grantPermission called for user: ${userId}, permission: ${permission}`);
        const currentUser = await this.getCurrentUser();
        if (!currentUser) {
            console.error("[DEBUG] grantPermission: Current user not found");
            return false;
        }
        console.log(`[DEBUG] grantPermission: Current user performing action: id=${currentUser.id}, role=${currentUser.role}`);

        const hasAuth = await this.hasPermission(LeavePermission.MANAGE_LEAVE_RULES, currentUser);
        console.log(`[DEBUG] grantPermission: hasAuth (MANAGE_LEAVE_RULES) for ${currentUser.id}: ${hasAuth}`);
        if (!hasAuth) {
            console.error(`[DEBUG] grantPermission: User ${currentUser.id} does not have permission to MANAGE_LEAVE_RULES.`);
            return false;
        }

        // Récupérer ou initialiser les permissions personnalisées de l'utilisateur
        const userPerms = this.customPermissions.get(userId) || {
            userId,
            grantedPermissions: [], // Utiliser un tableau
            deniedPermissions: []   // Utiliser un tableau
        };

        let permissionChanged = false;
        // Ajouter la permission si elle n'est pas déjà accordée
        if (!userPerms.grantedPermissions.includes(permission)) {
            userPerms.grantedPermissions.push(permission);
            permissionChanged = true;
        }
        // Retirer de la liste des permissions refusées si nécessaire
        const initialDeniedLength = userPerms.deniedPermissions.length;
        userPerms.deniedPermissions = userPerms.deniedPermissions.filter(p => p !== permission);
        if (userPerms.deniedPermissions.length < initialDeniedLength) {
            permissionChanged = true;
        }

        if (permissionChanged) {
            this.customPermissions.set(userId, userPerms);
            const success = await this.saveCustomPermissions(userId, userPerms);
            console.log(`[DEBUG] grantPermission: saveCustomPermissions result for ${userId}: ${success}`);

            if (success) {
                await auditService.logPermissionChange(currentUser.id, userId, permission, true);
                this.invalidateUserCache(userId);
                eventBus.publish({
                    type: IntegrationEventType.AUDIT_ACTION,
                    payload: { actionType: AuditActionType.PERMISSION_GRANTED, targetId: userId, permission, userIdAdmin: currentUser.id },
                    source: 'LeavePermissionService'
                });
            }
            return success;
        }
        console.log(`[DEBUG] grantPermission: No actual change for ${userId}, permission ${permission}. Returning false.`);
        return false; // Aucune modification réelle n'a été apportée ou la sauvegarde a échoué
    }

    /**
     * Révoquer une permission spécifique d'un utilisateur
     */
    public async revokePermission(userId: string, permission: LeavePermission): Promise<boolean> {
        console.log(`[DEBUG] revokePermission called for user: ${userId}, permission: ${permission}`);
        const currentUser = await this.getCurrentUser();
        if (!currentUser) {
            console.error("Current user not found in revokePermission");
            return false;
        }

        const hasAuth = await this.hasPermission(LeavePermission.MANAGE_LEAVE_RULES, currentUser);
        if (!hasAuth) {
            console.error(`User ${currentUser.id} does not have permission to MANAGE_LEAVE_RULES.`);
            return false;
        }

        const userPerms = this.customPermissions.get(userId) || {
            userId,
            grantedPermissions: [], // Utiliser un tableau
            deniedPermissions: []   // Utiliser un tableau
        };

        let permissionChanged = false;
        // Ajouter à la liste des permissions refusées si nécessaire
        if (!userPerms.deniedPermissions.includes(permission)) {
            userPerms.deniedPermissions.push(permission);
            permissionChanged = true;
        }
        // Retirer de la liste des permissions accordées si nécessaire
        const initialGrantedLength = userPerms.grantedPermissions.length;
        userPerms.grantedPermissions = userPerms.grantedPermissions.filter(p => p !== permission);
        if (userPerms.grantedPermissions.length < initialGrantedLength) {
            permissionChanged = true;
        }

        if (permissionChanged) {
            this.customPermissions.set(userId, userPerms);
            const success = await this.saveCustomPermissions(userId, userPerms);
            console.log(`[DEBUG] revokePermission: saveCustomPermissions result for ${userId}: ${success}`);

            if (success) {
                await auditService.logPermissionChange(currentUser.id, userId, permission, false);
                this.invalidateUserCache(userId);
                eventBus.publish({
                    type: IntegrationEventType.AUDIT_ACTION,
                    payload: { actionType: AuditActionType.PERMISSION_REVOKED, targetId: userId, permission, userIdAdmin: currentUser.id },
                    source: 'LeavePermissionService'
                });
            }
            return success;
        }
        console.log(`[DEBUG] revokePermission: No actual change for ${userId}, permission ${permission}. Returning false.`);
        return false; // Aucune modification réelle n'a été apportée ou la sauvegarde a échoué
    }

    /**
     * Enregistrer les permissions personnalisées d'un utilisateur
     */
    private async saveCustomPermissions(userId: string, permissions: UserCustomPermissions): Promise<boolean> {
        console.log(`[DEBUG] saveCustomPermissions called for user: ${userId}, permissions:`, JSON.stringify(permissions));
        if (!this.permissionsLoaded) {
            console.warn("Tentative de sauvegarde des permissions personnalisées avant leur chargement complet.");
        }
        try {
            const response = await fetch(`http://localhost:3000/api/conges/permissions/${userId}/custom`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    grantedPermissions: permissions.grantedPermissions, // Doit être un tableau
                    deniedPermissions: permissions.deniedPermissions,   // Doit être un tableau
                }),
            });
            console.log(`[DEBUG] saveCustomPermissions fetch response for ${userId}: status=${response.status}, ok=${response.ok}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Erreur API lors de la sauvegarde des permissions pour ${userId}: ${response.status} ${response.statusText}`, errorText);
                console.error(`API error saving custom permissions for ${userId}: ${response.statusText}`, { userId, error: errorText });
                return false;
            }

            const data = await response.json();
            console.log(`[DEBUG] saveCustomPermissions fetch response data for ${userId}:`, JSON.stringify(data));
            return data.success === true;
        } catch (error) {
            console.error(`Erreur réseau ou autre lors de la sauvegarde des permissions pour ${userId}:`, error);
            console.error(`Network or other error saving custom permissions for ${userId}`, { userId, error });
            return false;
        }
    }

    /**
     * Obtenir toutes les permissions d'un utilisateur
     */
    public async getUserPermissions(userId: string): Promise<LeavePermission[]> {
        try {
            if (this.isPermissionCacheEnabled()) {
                const cacheKey = `userPermissions=${userId}`;
                const cacheEntry = this.permissionCache.get<LeavePermission[]>(cacheKey);
                if (cacheEntry && cacheEntry.value != null) {
                    this.cacheStats.hits++;
                    return cacheEntry.value;
                }
                // Miss de cache
                this.cacheStats.misses++;
            }

            // Récupérer l'utilisateur
            const response = await fetch(`http://localhost:3000/api/utilisateurs/${userId}`);
            if (!response.ok) {
                throw new Error(`Erreur lors de la récupération de l'utilisateur: ${response.statusText}`);
            }

            const user = await response.json();

            // Obtenir les permissions basées sur le rôle
            const rolePermissions = ROLE_PERMISSIONS[user.role] || [];

            // Obtenir les permissions personnalisées
            const customUserPerms = this.customPermissions.get(userId);

            // Combiner les permissions en retirant les permissions refusées
            const allPermissions = [
                ...rolePermissions,
                ...(customUserPerms?.grantedPermissions || [])
            ];

            // Retirer les permissions refusées
            const deniedPermissions = customUserPerms?.deniedPermissions || [];

            // Dédupliquer et filtrer
            const result = [...new Set(allPermissions)].filter(p => !deniedPermissions.includes(p));

            // Mettre en cache le résultat
            if (this.isPermissionCacheEnabled()) {
                const cacheKey = `userPermissions=${userId}`;
                this.permissionCache.set(cacheKey, result);
            }

            return result;
        } catch (error) {
            console.error(`Erreur lors de la récupération des permissions pour l'utilisateur ${userId}:`, error);
            return [];
        }
    }

    /**
     * Réinitialiser les permissions personnalisées d'un utilisateur
     */
    public async resetUserPermissions(userId: string): Promise<boolean> {
        try {
            // Récupérer l'utilisateur actuel
            const currentUser = await this.getCurrentUser();
            if (!currentUser) {
                throw new Error('Utilisateur non authentifié');
            }

            // Vérifier si l'utilisateur actuel a le droit de gérer les permissions
            const canManagePermissions = await this.hasPermission(LeavePermission.MANAGE_LEAVE_RULES, currentUser);
            if (!canManagePermissions) {
                throw new Error('Vous n\'avez pas le droit de gérer les permissions');
            }

            // Supprimer les permissions personnalisées
            this.customPermissions.delete(userId);

            // Persister les changements
            const response = await fetch(`http://localhost:3000/api/conges/permissions/${userId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                // Journaliser l'échec de la réinitialisation
                await auditService.createAuditEntry({
                    actionType: AuditActionType.PERMISSION_REVOKED,
                    userId: currentUser.id,
                    targetId: userId,
                    targetType: 'user',
                    description: `Échec de la réinitialisation des permissions personnalisées pour l'utilisateur ${userId}. Statut API: ${response.status}`,
                    severity: AuditSeverity.CRITICAL,
                    metadata: { resetPermissionsFailed: true, status: response.status }
                });
                throw new Error(`Erreur lors de la réinitialisation des permissions: ${response.statusText}`);
            }

            // Invalider le cache pour cet utilisateur
            this.invalidateUserCache(userId);

            // Journaliser l'action de succès
            await auditService.createAuditEntry({
                actionType: AuditActionType.PERMISSION_REVOKED,
                userId: currentUser.id,
                targetId: userId,
                targetType: 'user',
                description: `Permissions personnalisées réinitialisées pour l'utilisateur ${userId}`,
                severity: AuditSeverity.HIGH,
                metadata: { resetPermissionsSuccess: true }
            });

            return true;
        } catch (error) {
            console.error(`Erreur lors de la réinitialisation des permissions pour l'utilisateur ${userId}:`, error);
            // S'assurer que l'erreur est également journalisée si elle n'a pas été interceptée avant
            const currentUser = await this.getCurrentUser(); // Peut être null si l'erreur est précoce
            if (currentUser && !(error instanceof Error && error.message.includes('réinitialisation des permissions'))) {
                await auditService.createAuditEntry({
                    actionType: AuditActionType.PERMISSION_REVOKED,
                    userId: currentUser.id,
                    targetId: userId,
                    targetType: 'user',
                    description: `Erreur technique lors de la tentative de réinitialisation des permissions pour ${userId}: ${error instanceof Error ? error.message : String(error)}`,
                    severity: AuditSeverity.CRITICAL,
                    metadata: { resetPermissionsError: true, error: String(error) }
                });
            }
            return false;
        }
    }

    /**
     * Précharge les permissions fréquemment utilisées pour un utilisateur
     */
    public preloadPermissionsForUser(userId: string): void {
        if (!userId || !this.isPermissionCacheEnabled()) {
            return;
        }

        this.permissionCache.preloadFrequentPermissions(userId);

        if (this.debug) {
            console.debug(`[LeavePermissionService] Preloaded frequent permissions for user ${userId}`);
        }
    }

    /**
     * Analyser les métriques de cache et optimiser si nécessaire
     */
    private analyzeMetrics(): void {
        // Méthode dépréciée : analyseMetrics n'est plus supportée par PermissionCacheService
    }
}

// Exporter l'instance singleton
export const leavePermissionService = LeavePermissionService.getInstance(); 