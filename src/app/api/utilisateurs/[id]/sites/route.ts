import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { checkUserRole } from '@/lib/auth-server-utils';

// GET - Récupérer les sites d'un utilisateur
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const userId = parseInt(id);

        const authCheck = await checkUserRole(['ADMIN_TOTAL', 'ADMIN_PARTIEL', 'USER']);
        if (!authCheck.hasRequiredRole) {
            return NextResponse.json({ message: 'Non autorisé' }, { status: 403 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                sites: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        colorCode: true,
                        isActive: true
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ message: 'Utilisateur non trouvé' }, { status: 404 });
        }

        return NextResponse.json({ sites: user.sites });
    } catch (error: unknown) {
        logger.error('Erreur GET /api/utilisateurs/[id]/sites:', error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}

// PUT - Mettre à jour les sites d'un utilisateur (remplace tous les sites)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const userId = parseInt(id);
        const { siteIds } = await request.json();

        const authCheck = await checkUserRole(['ADMIN_TOTAL', 'ADMIN_PARTIEL']);
        if (!authCheck.hasRequiredRole) {
            return NextResponse.json({ message: 'Non autorisé' }, { status: 403 });
        }

        // Vérifier que l'utilisateur existe
        const userExists = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!userExists) {
            return NextResponse.json({ message: 'Utilisateur non trouvé' }, { status: 404 });
        }

        // Mettre à jour les sites (déconnecter tous puis reconnecter les nouveaux)
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                sites: {
                    set: [], // Déconnecter tous les sites existants
                    connect: siteIds.map((siteId: string) => ({ id: siteId })) // Connecter les nouveaux
                }
            },
            include: {
                sites: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        colorCode: true,
                        isActive: true
                    }
                }
            }
        });

        return NextResponse.json({ 
            message: 'Sites mis à jour avec succès',
            user: updatedUser 
        });
    } catch (error: unknown) {
        logger.error('Erreur PUT /api/utilisateurs/[id]/sites:', error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}

// POST - Ajouter des sites à un utilisateur (sans supprimer les existants)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const userId = parseInt(id);
        const { siteIds } = await request.json();

        const authCheck = await checkUserRole(['ADMIN_TOTAL', 'ADMIN_PARTIEL']);
        if (!authCheck.hasRequiredRole) {
            return NextResponse.json({ message: 'Non autorisé' }, { status: 403 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                sites: {
                    connect: siteIds.map((siteId: string) => ({ id: siteId }))
                }
            },
            include: {
                sites: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        colorCode: true,
                        isActive: true
                    }
                }
            }
        });

        return NextResponse.json({ 
            message: 'Sites ajoutés avec succès',
            user: updatedUser 
        });
    } catch (error: unknown) {
        logger.error('Erreur POST /api/utilisateurs/[id]/sites:', error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}