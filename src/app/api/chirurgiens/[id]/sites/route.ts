import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

// Helper pour vérifier les rôles autorisés
const hasRequiredRole = async (): Promise<boolean> => {
    const headersList = await headers();
    const userRoleString = headersList.get('x-user-role');
    return !!userRoleString && ['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(userRoleString);
};

// GET - Récupérer les sites d'un chirurgien
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const surgeonId = parseInt(id);

        if (!await hasRequiredRole()) {
            return NextResponse.json({ message: 'Non autorisé' }, { status: 403 });
        }

        const surgeon = await prisma.surgeon.findUnique({
            where: { id: surgeonId },
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

        if (!surgeon) {
            return NextResponse.json({ message: 'Chirurgien non trouvé' }, { status: 404 });
        }

        return NextResponse.json({ sites: surgeon.sites });
    } catch (error: unknown) {
        logger.error('Erreur GET /api/chirurgiens/[id]/sites:', { error: error });
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}

// PUT - Mettre à jour les sites d'un chirurgien (remplace tous les sites)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const surgeonId = parseInt(id);
        const { siteIds } = await request.json();

        if (!await hasRequiredRole()) {
            return NextResponse.json({ message: 'Non autorisé' }, { status: 403 });
        }

        // Vérifier que le chirurgien existe
        const surgeonExists = await prisma.surgeon.findUnique({
            where: { id: surgeonId }
        });

        if (!surgeonExists) {
            return NextResponse.json({ message: 'Chirurgien non trouvé' }, { status: 404 });
        }

        // Mettre à jour les sites (déconnecter tous puis reconnecter les nouveaux)
        const updatedSurgeon = await prisma.surgeon.update({
            where: { id: surgeonId },
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
            surgeon: updatedSurgeon 
        });
    } catch (error: unknown) {
        logger.error('Erreur PUT /api/chirurgiens/[id]/sites:', { error: error });
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}

// POST - Ajouter des sites à un chirurgien (sans supprimer les existants)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const surgeonId = parseInt(id);
        const { siteIds } = await request.json();

        if (!await hasRequiredRole()) {
            return NextResponse.json({ message: 'Non autorisé' }, { status: 403 });
        }

        const updatedSurgeon = await prisma.surgeon.update({
            where: { id: surgeonId },
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
            surgeon: updatedSurgeon 
        });
    } catch (error: unknown) {
        logger.error('Erreur POST /api/chirurgiens/[id]/sites:', { error: error });
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}

// DELETE - Retirer des sites d'un chirurgien
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const surgeonId = parseInt(id);
        const { siteIds } = await request.json();

        if (!await hasRequiredRole()) {
            return NextResponse.json({ message: 'Non autorisé' }, { status: 403 });
        }

        const updatedSurgeon = await prisma.surgeon.update({
            where: { id: surgeonId },
            data: {
                sites: {
                    disconnect: siteIds.map((siteId: string) => ({ id: siteId }))
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
            message: 'Sites retirés avec succès',
            surgeon: updatedSurgeon 
        });
    } catch (error: unknown) {
        logger.error('Erreur DELETE /api/chirurgiens/[id]/sites:', { error: error });
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}