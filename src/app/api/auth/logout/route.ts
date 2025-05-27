import { NextResponse } from 'next/server';
import { removeAuthToken } from '@/lib/auth-utils';
import { withAuthRateLimit } from '@/lib/rateLimit';
import { auditService } from '@/services/OptimizedAuditService';
import { verifyAuthToken } from '@/lib/auth-server-utils';

async function handler(req: any) {
    try {
        console.log("API LOGOUT: Tentative de déconnexion");

        // Vérifier l'utilisateur actuel pour l'audit
        const authHeader = req.headers.get('authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
        let userId: number | undefined;
        
        if (token) {
            const authResult = await verifyAuthToken(token);
            if (authResult.authenticated) {
                userId = authResult.userId;
            }
        }

        // Utiliser la fonction dédiée pour supprimer le cookie d'authentification
        await removeAuthToken();

        // Log de déconnexion
        if (userId) {
            await auditService.logLogout(userId);
        }

        console.log("API LOGOUT: Cookie d'authentification supprimé avec succès");
        return NextResponse.json({ message: 'Déconnexion réussie' });

    } catch (error) {
        console.error("API LOGOUT ERROR:", error);
        return NextResponse.json(
            { message: 'Erreur interne du serveur lors de la déconnexion' },
            { status: 500 }
        );
    }
}

export const POST = withAuthRateLimit(handler); 