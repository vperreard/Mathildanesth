import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// import { getToken } from 'next-auth/jwt'; // Mis en commentaire temporairement
import jwt from 'jsonwebtoken'; // AJOUT
import { ActivityType, Prisma } from '@prisma/client';

// Helper pour vérifier l'authentification et les permissions (simplifié)
async function authorizeRequest(req: NextRequest) {
    const authorizationHeader = req.headers.get('authorization');

    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        return { error: 'Authentification requise (Bearer token manquant).', status: 401, userId: null };
    }

    const tokenString = authorizationHeader.split(' ')[1];

    if (!process.env.JWT_SECRET) {
        console.error('[API ActivityType Auth] JWT_SECRET is not defined in environment variables.'); // Garder celui-ci car critique
        return { error: 'Configuration du serveur incorrecte (secret manquant).', status: 500, userId: null };
    }

    try {
        const decoded = jwt.verify(tokenString, process.env.JWT_SECRET) as { sub?: string, userId?: string | number, [key: string]: any };
        const userId = decoded.sub || decoded.userId;
        if (!userId) {
            return { error: 'Token invalide (ID utilisateur manquant).', status: 401, userId: null };
        }
        // Ici, vous pourriez ajouter une vérification de rôle si nécessaire
        // if (decoded.role !== 'ADMIN_TOTAL' && decoded.role !== 'ADMIN_SITE') {
        //     return { error: 'Permissions insuffisantes.', status: 403, userId: null };
        // }
        return { userId: String(userId), error: null, status: 0 };

    } catch (err: any) {
        // Il peut être utile de garder un log discret ici en production pour les erreurs inattendues
        console.error(`[API ActivityType Auth] jwt.verify failed: ${err.name} - ${err.message}`);
        if (err.name === 'JsonWebTokenError') {
            return { error: 'Token invalide (signature incorrecte ou malformé).', status: 401, userId: null };
        } else if (err.name === 'TokenExpiredError') {
            return { error: 'Token expiré.', status: 401, userId: null };
        }
        return { error: 'Erreur d\'authentification inconnue.', status: 401, userId: null };
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    const authResult = await authorizeRequest(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = params;
    if (!id) {
        return NextResponse.json({ error: 'ID du type d\'activité manquant.' }, { status: 400 });
    }

    let body;
    try {
        body = await request.json();
    } catch (e) {
        console.error(`[API ActivityType PUT /api/activity-types/${id}] Invalid JSON body:`, e); // Garder ce log
        return NextResponse.json({ error: 'Corps de la requête JSON invalide.' }, { status: 400 });
    }

    const { name, code, description, category, color, icon, isActive, defaultDurationHours, defaultPeriod, siteIDs } = body;

    // Validation de base (à étendre selon les besoins)
    if (!name || !code || !category) {
        return NextResponse.json({ error: 'Les champs nom, code et catégorie sont requis.' }, { status: 400 });
    }

    try {
        const updatedActivityType = await prisma.activityType.update({
            where: { id },
            data: {
                name,
                code,
                description: description ?? null,
                category,
                color: color ?? null,
                icon: icon ?? null,
                isActive: isActive === undefined ? true : isActive,
                defaultDurationHours: defaultDurationHours ? parseFloat(String(defaultDurationHours)) : null,
                defaultPeriod: defaultPeriod ?? null,
                // La gestion des siteIDs nécessiterait une logique de connexion/déconnexion
                // sites: siteIDs ? { set: siteIDs.map((siteId: string) => ({ id: siteId })) } : undefined,
            },
        });
        return NextResponse.json(updatedActivityType, { status: 200 });
    } catch (error) {
        console.error(`[API ActivityType PUT /api/activity-types/${id}] Error updating activity type:`, error); // Garder ce log
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return NextResponse.json({ error: 'Type d\'activité non trouvé.' }, { status: 404 });
            }
        }
        return NextResponse.json({ error: 'Erreur interne du serveur lors de la mise à jour du type d\'activité.' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const authResult = await authorizeRequest(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = params;
    if (!id) {
        return NextResponse.json({ error: 'ID du type d\'activité manquant.' }, { status: 400 });
    }

    try {
        await prisma.activityType.delete({
            where: { id },
        });
        return NextResponse.json({ message: 'Type d\'activité supprimé avec succès.' }, { status: 200 }); // Ou 204 No Content
    } catch (error) {
        console.error(`[API ActivityType DELETE /api/activity-types/${id}] Error deleting activity type:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                // Record to delete does not exist.
                return NextResponse.json({ error: 'Type d\'activité non trouvé.' }, { status: 404 });
            }
            // Gérer d\'autres erreurs Prisma spécifiques si nécessaire
        }
        return NextResponse.json({ error: 'Erreur interne du serveur lors de la suppression du type d\'activité.' }, { status: 500 });
    }
}

// TODO: Ajouter les handlers GET (pour un ID) ici 