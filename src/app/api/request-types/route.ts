import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuthToken, getAuthToken } from '@/lib/auth-utils';

jest.mock('@/lib/prisma');


const prisma = prisma;

// Récupérer tous les types de requêtes
export async function GET(req: NextRequest) {
    try {
        const token = await getAuthToken();
        if (!token) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        const authResult = await verifyAuthToken(token);
        if (!authResult.authenticated || !authResult.user) {
            return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
        }

        // Inclure les inactifs uniquement pour les admins
        const isAdmin = authResult.user.role === 'ADMIN';
        const includeInactive = isAdmin && req.nextUrl.searchParams.get('includeInactive') === 'true';

        const requestTypes = await prisma.requestType.findMany({
            where: includeInactive ? {} : { isActive: true },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(requestTypes);
    } catch (error) {
        console.error('Erreur lors de la récupération des types de requêtes:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

// Créer un nouveau type de requête (réservé aux admins)
export async function POST(req: NextRequest) {
    try {
        const token = await getAuthToken();
        if (!token) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        const authResult = await verifyAuthToken(token);
        if (!authResult.authenticated || !authResult.user) {
            return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
        }

        // Vérification du rôle admin
        if (authResult.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Accès refusé. Réservé aux administrateurs' }, { status: 403 });
        }

        const { name, description, requiresAdminApproval, isActive } = await req.json();

        if (!name) {
            return NextResponse.json({ error: 'Le nom du type de requête est requis' }, { status: 400 });
        }

        const existingType = await prisma.requestType.findUnique({
            where: { name }
        });

        if (existingType) {
            return NextResponse.json({ error: 'Un type de requête avec ce nom existe déjà' }, { status: 409 });
        }

        const requestType = await prisma.requestType.create({
            data: {
                name,
                description,
                requiresAdminApproval: requiresAdminApproval ?? true,
                isActive: isActive ?? true
            }
        });

        return NextResponse.json(requestType, { status: 201 });
    } catch (error) {
        console.error('Erreur lors de la création du type de requête:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

// Mettre à jour un type de requête (réservé aux admins)
export async function PATCH(req: NextRequest) {
    try {
        const token = await getAuthToken();
        if (!token) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        const authResult = await verifyAuthToken(token);
        if (!authResult.authenticated || !authResult.user) {
            return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
        }

        // Vérification du rôle admin
        if (authResult.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Accès refusé. Réservé aux administrateurs' }, { status: 403 });
        }

        const { id, name, description, requiresAdminApproval, isActive } = await req.json();

        if (!id) {
            return NextResponse.json({ error: 'L\'ID du type de requête est requis' }, { status: 400 });
        }

        const existingType = await prisma.requestType.findUnique({
            where: { id }
        });

        if (!existingType) {
            return NextResponse.json({ error: 'Type de requête non trouvé' }, { status: 404 });
        }

        // Vérifier si le nouveau nom existe déjà (et que ce n'est pas le même type)
        if (name && name !== existingType.name) {
            const typeWithSameName = await prisma.requestType.findUnique({
                where: { name }
            });

            if (typeWithSameName) {
                return NextResponse.json({ error: 'Un type de requête avec ce nom existe déjà' }, { status: 409 });
            }
        }

        const requestType = await prisma.requestType.update({
            where: { id },
            data: {
                name: name ?? existingType.name,
                description: description !== undefined ? description : existingType.description,
                requiresAdminApproval: requiresAdminApproval !== undefined ? requiresAdminApproval : existingType.requiresAdminApproval,
                isActive: isActive !== undefined ? isActive : existingType.isActive
            }
        });

        return NextResponse.json(requestType);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du type de requête:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

// Suppression (désactivation) d'un type de requête
export async function DELETE(req: NextRequest) {
    try {
        const token = await getAuthToken();
        if (!token) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        const authResult = await verifyAuthToken(token);
        if (!authResult.authenticated || !authResult.user) {
            return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
        }

        // Vérification du rôle admin
        if (authResult.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Accès refusé. Réservé aux administrateurs' }, { status: 403 });
        }

        const url = new URL(req.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'L\'ID du type de requête est requis' }, { status: 400 });
        }

        // Vérifier si le type existe
        const existingType = await prisma.requestType.findUnique({
            where: { id },
            include: { userRequests: { take: 1 } }
        });

        if (!existingType) {
            return NextResponse.json({ error: 'Type de requête non trouvé' }, { status: 404 });
        }

        // Si des requêtes utilisent ce type, ne pas supprimer mais désactiver
        if (existingType.userRequests.length > 0) {
            await prisma.requestType.update({
                where: { id },
                data: { isActive: false }
            });

            return NextResponse.json({
                message: 'Le type de requête a été désactivé car des requêtes utilisateurs y sont associées'
            });
        }

        // Sinon, supprimer complètement
        await prisma.requestType.delete({
            where: { id }
        });

        return NextResponse.json({
            message: 'Type de requête supprimé avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la suppression du type de requête:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
} 