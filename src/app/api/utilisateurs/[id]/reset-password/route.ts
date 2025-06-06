import { NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { headers } from 'next/headers';

// Helper pour vérifier les rôles autorisés (utilisation de chaînes)
const hasRequiredRole = (allowedRoles: string[]): boolean => {
    const headersList = headers();
    const userRoleString = headersList.get('x-user-role');
    if (!userRoleString) {
        return false;
    }
    // Comparaison directe des chaînes
    return allowedRoles.includes(userRoleString);
};

// --- Fonction PUT pour réinitialiser le mot de passe ---
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const requestHeaders = headers();
    const requesterRoleString = requestHeaders.get('x-user-role');
    const { id: targetUserIdString } = await params;

    // 1. Vérifier le rôle du demandeur
    if (!requesterRoleString || !['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(requesterRoleString)) {
        logger.info(`Accès refusé pour réinitialisation par rôle: ${requesterRoleString}`);
        return new NextResponse(JSON.stringify({ message: 'Accès non autorisé (rôle insuffisant pour cette action)' }), { status: 403 });
    }

    // 2. Valider l'ID cible
    const targetUserId = parseInt(targetUserIdString, 10);
    if (isNaN(targetUserId)) {
        return new NextResponse(JSON.stringify({ message: 'ID utilisateur cible invalide' }), { status: 400 });
    }

    try {
        // 3. Récupérer l'utilisateur cible (login et rôle comme chaîne)
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: {
                login: true,
                role: true // Le rôle sera une chaîne ici (ex: 'ADMIN_TOTAL')
            }
        });

        if (!targetUser) {
            return new NextResponse(JSON.stringify({ message: 'Utilisateur cible non trouvé' }), { status: 404 });
        }

        // 4. Appliquer la règle d'autorisation spécifique (comparaison de chaînes)
        if (requesterRoleString === 'ADMIN_PARTIEL' && targetUser.role === 'ADMIN_TOTAL') {
            logger.info(`Tentative de réinitialisation refusée: ADMIN_PARTIEL (${requesterRoleString}) vs ADMIN_TOTAL (${targetUser.role})`);
            return new NextResponse(JSON.stringify({ message: 'Un administrateur partiel ne peut pas réinitialiser le mot de passe d\'un administrateur total.' }), { status: 403 });
        }

        // 5. Autorisation OK, procéder à la réinitialisation
        logger.info(`Autorisation accordée pour réinitialisation: ${requesterRoleString} sur utilisateur ${targetUserId} (rôle ${targetUser.role})`);
        const newPassword = targetUser.login;
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        await prisma.user.update({
            where: { id: targetUserId },
            data: {
                password: hashedPassword,
                mustChangePassword: true // Forcer le changement au prochain login
            },
        });

        return new NextResponse(JSON.stringify({ message: `Mot de passe pour l'utilisateur ${targetUserId} réinitialisé avec succès.` }), { status: 200 });

    } catch (error: unknown) {
        logger.error(`Erreur interne PUT /api/utilisateurs/${targetUserIdString}/reset-password:`, { error: error });
        return new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur lors de la réinitialisation.' }), { status: 500 });
    }
} 