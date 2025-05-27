import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, SecurityChecks } from '@/middleware/authorization';
import { logger } from '@/lib/logger';
import bcrypt from 'bcrypt';

/**
 * GET /api/users/[userId]
 * Récupérer les informations d'un utilisateur
 */
export const GET = withAuth({
    requireAuth: true,
    customCheck: async (context, req) => {
        const userId = parseInt(req.nextUrl.pathname.split('/').pop() || '0');
        // Un utilisateur peut voir ses propres informations
        // Les admins peuvent voir tous les utilisateurs
        return context.userId === userId || SecurityChecks.isAdmin(context);
    }
})(async (req: NextRequest, context: { params: { userId: string } }) => {
    try {
        const userId = parseInt(context.params.userId);
        
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                nom: true,
                prenom: true,
                login: true,
                email: true,
                role: true,
                professionalRole: true,
                actif: true,
                siteIds: true,
                dateEntree: true,
                // Ne pas inclure le mot de passe
                password: false
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(user);
    } catch (error) {
        logger.error('Error fetching user', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
});

/**
 * PUT /api/users/[userId]
 * Mettre à jour un utilisateur
 */
export const PUT = withAuth({
    requireAuth: true,
    resourceType: 'user',
    action: 'update',
    customCheck: async (context, req) => {
        const userId = parseInt(req.nextUrl.pathname.split('/').pop() || '0');
        const data = await req.clone().json();
        
        // Un utilisateur peut modifier certaines de ses propres informations
        if (context.userId === userId) {
            // Vérifier qu'il ne modifie que les champs autorisés
            const allowedFields = ['email', 'phoneNumber', 'password'];
            const fields = Object.keys(data);
            return fields.every(field => allowedFields.includes(field));
        }
        
        // Les admins peuvent tout modifier
        return SecurityChecks.isAdmin(context);
    }
})(async (req: NextRequest, context: { params: { userId: string } }) => {
    try {
        const userId = parseInt(context.params.userId);
        const currentUserId = parseInt(req.headers.get('x-user-id') || '0');
        const isAdmin = ['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(
            req.headers.get('x-user-role') || ''
        );
        
        const data = await req.json();
        
        // Validation des données
        const updateData: any = {};
        
        // Champs modifiables par l'utilisateur lui-même
        if (data.email) {
            // Valider le format email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                return NextResponse.json(
                    { error: 'Invalid email format' },
                    { status: 400 }
                );
            }
            updateData.email = data.email;
        }
        
        if (data.phoneNumber !== undefined) {
            updateData.phoneNumber = data.phoneNumber;
        }
        
        if (data.password) {
            // Validation du mot de passe
            if (data.password.length < 8) {
                return NextResponse.json(
                    { error: 'Password must be at least 8 characters' },
                    { status: 400 }
                );
            }
            updateData.password = await bcrypt.hash(data.password, 10);
        }
        
        // Champs modifiables uniquement par les admins
        if (isAdmin) {
            if (data.nom) updateData.nom = data.nom;
            if (data.prenom) updateData.prenom = data.prenom;
            if (data.role) updateData.role = data.role;
            if (data.professionalRole) updateData.professionalRole = data.professionalRole;
            if (data.actif !== undefined) updateData.actif = data.actif;
            if (data.siteIds) updateData.siteIds = data.siteIds;
            if (data.permissions) updateData.permissions = data.permissions;
        }
        
        // Mettre à jour l'utilisateur
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                nom: true,
                prenom: true,
                login: true,
                email: true,
                role: true,
                professionalRole: true,
                actif: true,
                siteIds: true
            }
        });
        
        logger.info('User updated', {
            userId,
            updatedBy: currentUserId,
            fields: Object.keys(updateData)
        });
        
        return NextResponse.json(updatedUser);
        
    } catch (error) {
        logger.error('Error updating user', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
});

/**
 * DELETE /api/users/[userId]
 * Désactiver un utilisateur (soft delete) - ADMIN TOTAL uniquement
 */
export const DELETE = withAuth({
    requireAuth: true,
    allowedRoles: ['ADMIN_TOTAL'],
    resourceType: 'user',
    action: 'delete'
})(async (req: NextRequest, context: { params: { userId: string } }) => {
    try {
        const userId = parseInt(context.params.userId);
        const currentUserId = parseInt(req.headers.get('x-user-id') || '0');
        
        // Empêcher la suppression de son propre compte
        if (userId === currentUserId) {
            return NextResponse.json(
                { error: 'Cannot delete your own account' },
                { status: 400 }
            );
        }
        
        // Désactiver l'utilisateur au lieu de le supprimer
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                actif: false,
                // Anonymiser les données sensibles
                email: `deleted_${userId}@deleted.local`,
                login: `deleted_${userId}`,
                password: await bcrypt.hash(Math.random().toString(36), 10)
            }
        });
        
        logger.warn('User deactivated', {
            userId,
            deactivatedBy: currentUserId
        });
        
        return NextResponse.json({
            success: true,
            message: 'User deactivated successfully'
        });
        
    } catch (error) {
        logger.error('Error deactivating user', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
});