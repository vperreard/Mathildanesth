import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server-utils';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Role } from '@prisma/client';
import { auditService, AuditAction } from '@/services/OptimizedAuditService';

jest.mock('@/lib/prisma');


export interface AuthContext {
    userId: number;
    role: Role;
    user?: any;
}

export interface SecurityConfig {
    requireAuth?: boolean;
    allowedRoles?: Role[];
    customCheck?: (context: AuthContext, req: NextRequest) => Promise<boolean>;
    resourceType?: string;
    action?: string;
}

/**
 * Enregistre une tentative d'accès non autorisé
 */
async function logUnauthorizedAccess(
    userId: number | null,
    path: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string
) {
    logger.warn('Unauthorized access attempt', {
        userId,
        path,
        reason,
        ipAddress,
        timestamp: new Date().toISOString()
    });

    await auditService.logAccessDenied(
        userId || undefined,
        path,
        {
            reason,
            ipAddress,
            userAgent,
            timestamp: new Date().toISOString()
        }
    );
}

/**
 * Middleware d'autorisation unifié
 */
export function withAuth(config: SecurityConfig = {}) {
    return async (
        req: NextRequest,
        context?: { params?: any }
    ): Promise<NextResponse | Response> => {
        const {
            requireAuth = true,
            allowedRoles = [],
            customCheck,
            resourceType,
            action
        } = config;

        // Extraire l'IP pour le logging
        const ipAddress = req.headers.get('x-forwarded-for') || 
                         req.headers.get('x-real-ip') || 
                         'unknown';

        // Si l'authentification n'est pas requise, continuer
        if (!requireAuth) {
            return NextResponse.next();
        }

        // Vérifier le token JWT
        const authHeader = req.headers.get('authorization');
        const token = authHeader?.startsWith('Bearer ') 
            ? authHeader.substring(7) 
            : null;

        if (!token) {
            await logUnauthorizedAccess(
                null, 
                req.url, 
                'Missing token', 
                ipAddress,
                req.headers.get('user-agent') || 'unknown'
            );
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Vérifier la validité du token
        const authResult = await verifyAuthToken(token);
        if (!authResult.authenticated) {
            await logUnauthorizedAccess(
                null, 
                req.url, 
                'Invalid token', 
                ipAddress,
                req.headers.get('user-agent') || 'unknown'
            );
            return NextResponse.json(
                { error: authResult.error || 'Invalid token' },
                { status: 401 }
            );
        }

        // Récupérer les détails de l'utilisateur
        const user = await prisma.user.findUnique({
            where: { id: authResult.userId },
            select: {
                id: true,
                login: true,
                email: true,
                role: true,
                actif: true,
                siteIds: true,
                permissions: true
            }
        });

        if (!user || !user.actif) {
            await logUnauthorizedAccess(
                authResult.userId,
                req.url,
                'User not found or inactive',
                ipAddress,
                req.headers.get('user-agent') || 'unknown'
            );
            return NextResponse.json(
                { error: 'User not found or inactive' },
                { status: 403 }
            );
        }

        const authContext: AuthContext = {
            userId: user.id,
            role: user.role,
            user
        };

        // Vérifier les rôles autorisés
        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
            await logUnauthorizedAccess(
                user.id,
                req.url,
                `Role '${user.role}' not allowed. Required: ${allowedRoles.join(', ')}`,
                ipAddress,
                req.headers.get('user-agent') || 'unknown'
            );
            return NextResponse.json(
                { error: 'Insufficient permissions' },
                { status: 403 }
            );
        }

        // Vérification personnalisée
        if (customCheck) {
            const allowed = await customCheck(authContext, req);
            if (!allowed) {
                await logUnauthorizedAccess(
                    user.id,
                    req.url,
                    'Custom check failed',
                    ipAddress,
                    req.headers.get('user-agent') || 'unknown'
                );
                return NextResponse.json(
                    { error: 'Access denied' },
                    { status: 403 }
                );
            }
        }

        // Logger l'accès autorisé pour les actions sensibles
        if (resourceType && action) {
            // Log d'audit pour les actions sensibles uniquement
            const sensitiveActions = ['create', 'update', 'delete', 'approve', 'reject'];
            if (sensitiveActions.includes(action.toLowerCase())) {
                await auditService.logAction({
                    action: AuditAction.PERMISSION_GRANTED,
                    entityId: req.url,
                    entityType: resourceType,
                    userId: user.id,
                    details: {
                        ipAddress,
                        userAgent: req.headers.get('user-agent') || 'unknown',
                        metadata: {
                            method: req.method,
                            action,
                            params: context?.params,
                            role: user.role
                        }
                    }
                });
            }
        }

        // Ajouter l'utilisateur au contexte de la requête
        const response = NextResponse.next();
        response.headers.set('x-user-id', user.id.toString());
        response.headers.set('x-user-role', user.role);
        
        return response;
    };
}

/**
 * Helpers pour les vérifications courantes
 */
export const SecurityChecks = {
    /**
     * Vérifie que l'utilisateur est admin (total ou partiel)
     */
    isAdmin: (context: AuthContext): boolean => {
        return context.role === 'ADMIN_TOTAL' || context.role === 'ADMIN_PARTIEL';
    },

    /**
     * Vérifie que l'utilisateur est admin total
     */
    isAdminTotal: (context: AuthContext): boolean => {
        return context.role === 'ADMIN_TOTAL';
    },

    /**
     * Vérifie que l'utilisateur peut accéder à sa propre ressource
     */
    isOwner: async (
        context: AuthContext,
        resourceId: number,
        resourceType: string
    ): Promise<boolean> => {
        switch (resourceType) {
            case 'leave':
                const leave = await prisma.leave.findUnique({
                    where: { id: resourceId },
                    select: { userId: true }
                });
                return leave?.userId === context.userId;

            case 'user':
                return resourceId === context.userId;

            default:
                return false;
        }
    },

    /**
     * Vérifie que l'utilisateur a accès à un site
     */
    hasAccessToSite: async (
        context: AuthContext,
        siteId: string
    ): Promise<boolean> => {
        if (SecurityChecks.isAdmin(context)) {
            return true;
        }

        const userSites = context.user?.siteIds || [];
        return userSites.includes(siteId);
    },

    /**
     * Vérifie les permissions spécifiques
     */
    hasPermission: (
        context: AuthContext,
        permission: string
    ): boolean => {
        if (SecurityChecks.isAdminTotal(context)) {
            return true;
        }

        const permissions = context.user?.permissions || [];
        return permissions.includes(permission);
    }
};

/**
 * Middleware pour les routes publiques (pas d'auth requise)
 */
export const publicRoute = withAuth({ requireAuth: false });

/**
 * Middleware pour les routes authentifiées (tous les utilisateurs connectés)
 */
export const authenticatedRoute = withAuth({ requireAuth: true });

/**
 * Middleware pour les routes admin uniquement
 */
export const adminRoute = withAuth({
    requireAuth: true,
    allowedRoles: ['ADMIN_TOTAL', 'ADMIN_PARTIEL']
});

/**
 * Middleware pour les routes admin total uniquement
 */
export const adminTotalRoute = withAuth({
    requireAuth: true,
    allowedRoles: ['ADMIN_TOTAL']
});

/**
 * Créer un middleware avec vérification personnalisée
 */
export function createSecureRoute(
    allowedRoles: Role[],
    customCheck?: (context: AuthContext, req: NextRequest) => Promise<boolean>
) {
    return withAuth({
        requireAuth: true,
        allowedRoles,
        customCheck
    });
}