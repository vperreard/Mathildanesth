import { NextRequest } from 'next/server';
import { getServerSession, Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Role } from '@prisma/client';

// Utiliser directement l'enum Role de Prisma
export type UserRole = Role;

export interface AuthorizedSession extends Session {
    user: {
        id: number;
        login: string;
        role: UserRole;
        email?: string;
        name?: string;
        accessToken?: string;
    };
}

// Erreurs d'autorisation
export class AuthorizationError extends Error {
    constructor(message: string, public statusCode: number = 403) {
        super(message);
        this.name = 'AuthorizationError';
    }
}

export class AuthenticationError extends Error {
    constructor(message: string = 'Authentication required') {
        super(message);
        this.name = 'AuthenticationError';
    }
}

/**
 * Récupère et vérifie la session utilisateur
 */
export async function getAuthorizedSession(): Promise<AuthorizedSession> {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        throw new AuthenticationError();
    }

    return session as AuthorizedSession;
}

/**
 * Middleware pour vérifier les rôles requis
 */
export function requireRole(roles: UserRole[]) {
    return async (): Promise<AuthorizedSession> => {
        const session = await getAuthorizedSession();

        if (!roles.includes(session.user.role)) {
            throw new AuthorizationError(
                `Rôle insuffisant. Rôles requis: ${roles.join(', ')}`
            );
        }

        return session;
    };
}

/**
 * Vérifie que l'utilisateur est admin (total ou partiel)
 */
export async function requireAdmin(): Promise<AuthorizedSession> {
    return requireRole(['ADMIN_TOTAL', 'ADMIN_PARTIEL'])();
}

/**
 * Vérifie que l'utilisateur est admin total
 */
export async function requireAdminTotal(): Promise<AuthorizedSession> {
    return requireRole(['ADMIN_TOTAL'])();
}

/**
 * Vérifie que l'utilisateur est le propriétaire de la ressource ou admin
 */
export async function requireOwnerOrAdmin(
    resourceUserId: string | number
): Promise<AuthorizedSession> {
    const session = await getAuthorizedSession();

    const resourceUserIdNum = typeof resourceUserId === 'string'
        ? parseInt(resourceUserId, 10)
        : resourceUserId;

    if (!['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(session.user.role) &&
        session.user.id !== resourceUserIdNum) {
        throw new AuthorizationError(
            'Accès refusé. Vous ne pouvez accéder qu\'à vos propres ressources.'
        );
    }

    return session;
}

/**
 * Vérifie les permissions pour les congés
 */
export async function requireLeavePermission(
    action: 'create' | 'read' | 'update' | 'delete' | 'approve',
    targetUserId?: string | number
): Promise<AuthorizedSession> {
    const session = await getAuthorizedSession();

    switch (action) {
        case 'create':
        case 'read':
            // L'utilisateur peut créer/lire ses propres congés
            if (targetUserId) {
                return requireOwnerOrAdmin(targetUserId);
            }
            return session;

        case 'update':
            // L'utilisateur peut modifier ses congés PENDING
            if (targetUserId) {
                return requireOwnerOrAdmin(targetUserId);
            }
            return session;

        case 'delete':
            // Seul l'admin total peut supprimer des congés
            return requireAdminTotal();

        case 'approve':
            // Seuls les admins peuvent approuver
            return requireAdmin();

        default:
            throw new AuthorizationError('Action non reconnue');
    }
}

/**
 * Vérifie les permissions pour les tableaux de service et gardes/vacations
 */
export async function requirePlanningPermission(
    action: 'create' | 'read' | 'update' | 'delete'
): Promise<AuthorizedSession> {
    const session = await getAuthorizedSession();

    switch (action) {
        case 'read':
            // Tous les utilisateurs authentifiés peuvent lire
            return session;

        case 'create':
        case 'update':
        case 'delete':
            // Seuls les admins peuvent modifier les plannings
            return requireAdmin();

        default:
            throw new AuthorizationError('Action non reconnue');
    }
}

/**
 * Vérifie les permissions pour les simulations
 */
export async function requireSimulationPermission(
    action: 'create' | 'read' | 'update' | 'delete' | 'run',
    simulationOwnerId?: string | number
): Promise<AuthorizedSession> {
    const session = await getAuthorizedSession();

    switch (action) {
        case 'create':
        case 'read':
            // Tous les utilisateurs authentifiés peuvent créer/lire les simulations
            return session;

        case 'update':
        case 'delete':
        case 'run':
            // L'utilisateur peut modifier ses propres simulations ou admin
            if (simulationOwnerId) {
                return requireOwnerOrAdmin(simulationOwnerId);
            }
            return session;

        default:
            throw new AuthorizationError('Action non reconnue');
    }
}

/**
 * Vérifie les permissions pour les messages contextuels
 */
export async function requireMessagePermission(
    action: 'create' | 'read' | 'update' | 'delete'
): Promise<AuthorizedSession> {
    const session = await getAuthorizedSession();

    switch (action) {
        case 'create':
        case 'read':
            // Tous les utilisateurs authentifiés peuvent créer/lire
            return session;

        case 'update':
        case 'delete':
            // Seuls les admins peuvent modifier/supprimer
            return requireAdmin();

        default:
            throw new AuthorizationError('Action non reconnue');
    }
}

/**
 * Wrapper pour les handlers d'API avec gestion d'erreurs
 */
export function withAuthorization<T extends any[]>(
    authFunction: (...args: T) => Promise<AuthorizedSession>,
    handler: (session: AuthorizedSession, ...args: any[]) => Promise<Response>
) {
    return async (...args: any[]): Promise<Response> => {
        try {
            const session = await authFunction(...(args as T));
            return await handler(session, ...args);
        } catch (error) {
            if (error instanceof AuthenticationError) {
                return new Response(
                    JSON.stringify({ error: 'Authentication required' }),
                    { status: 401, headers: { 'Content-Type': 'application/json' } }
                );
            }

            if (error instanceof AuthorizationError) {
                return new Response(
                    JSON.stringify({ error: error.message }),
                    { status: error.statusCode, headers: { 'Content-Type': 'application/json' } }
                );
            }

            console.error('Authorization error:', error);
            return new Response(
                JSON.stringify({ error: 'Internal server error' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }
    };
}

/**
 * Logger pour les actions sensibles
 */
export function logSecurityAction(
    userId: number | string,
    action: string,
    resource: string,
    details?: any
) {
    console.log(`[SECURITY] User ${userId} performed ${action} on ${resource}`, {
        timestamp: new Date().toISOString(),
        userId,
        action,
        resource,
        details: details ? JSON.stringify(details) : undefined
    });
} 